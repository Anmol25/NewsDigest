import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { getRandomAssistantMessage } from "./utils/assistantintro";
import MessageBar from "./utils/MessageBar";
import QuerySuggest from "./utils/QuerySuggest";
import MessageComponent from "./utils/MessageComponent";
import { useAxios } from "../../services/AxiosConfig";
import { useAuth } from "../../contexts/AuthContext";

const MESSAGES_PAGE_SIZE = 20;

type InitialIntent =
  | { kind: "analyze"; payload: { articleId: number; articleMeta?: any } }
  | { kind: "search_highlights"; payload: { query: string } };

type ChatMessagesProps = {
  sessionId: string;
  setSessionList: Dispatch<
    SetStateAction<Array<{ sessionId: string; sessionName: string | null }>>
  >;
  newSession: boolean;
  setNewSession: Dispatch<SetStateAction<boolean>>;
  isMini?: boolean; // compact rendering for mini chat window
  // If provided (only in MiniChat), trigger one-shot flow on mount
  initialIntent?: InitialIntent | null;
  onConsumedInitialIntent?: () => void;
};

function ChatMessages(props: ChatMessagesProps) {
  const {
    sessionId,
    newSession,
    setNewSession,
    setSessionList,
    isMini = false,
    initialIntent = null,
    onConsumedInitialIntent,
  } = props;

  const axiosInstance = useAxios();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  type ChatMessage = { message: string; sender: "user" | "ai"; message_data?: any };
  type ActiveTool = { tool_call_id: string; message?: string };

  const [introMessage, setIntroMessage] = useState<string | null>(null);
  const [chatList, setChatList] = useState<Array<ChatMessage>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTools, setActiveTools] = useState<Array<ActiveTool>>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState<boolean>(false);
  const [observerReady, setObserverReady] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const lastOpRef = useRef<"idle" | "prepend">("idle");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initGuardRef = useRef<boolean>(false);
  const prevSessionIdRef = useRef<string | null>(null);
  const initialIntentRunRef = useRef<boolean>(false);

  const containerClasses = useMemo(() => {
    if (isMini && newSession) {
      return "h-full min-h-0 flex flex-col justify-between items-stretch gap-4 pb-2.5";
    }
    return `h-full min-h-0 justify-center items-center flex flex-col ${
      newSession ? "gap-5 " : "gap-0 pt-0 pb-2.5"
    }`;
  }, [isMini, newSession]);

  const resetStateForSession = useCallback(() => {
    setIntroMessage(null);
    setChatList([]);
    setIsLoading(false);
    setActiveTools([]);
    setPage(1);
    setHasMore(true);
    setIsFetching(false);
    setIsFetchingOlder(false);
    setObserverReady(false);
    loadedPagesRef.current.clear();
    prevScrollHeightRef.current = 0;
    prevScrollTopRef.current = 0;
    lastOpRef.current = "idle";
    initGuardRef.current = false;
  initialIntentRunRef.current = false;
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    if (prevSessionIdRef.current === sessionId) return;
    prevSessionIdRef.current = sessionId;
    resetStateForSession();
  }, [sessionId, resetStateForSession]);

  const appendAIPlaceholder = useCallback(() => {
    setChatList((prev) => [...prev, { message: "", sender: "ai", message_data: {} }]);
  }, []);

  const handleModelChunk = useCallback((chunk: string) => {
    if (!chunk) return;
    setChatList((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastMessage = updated[updated.length - 1];
      if (lastMessage.sender === "ai") {
        updated[updated.length - 1] = {
          ...lastMessage,
          message: lastMessage.message + chunk,
        };
      }
      return updated;
    });
  }, []);

  const handleStreamResponse = useCallback(
    async (response: Response, sid: string, freshSession: boolean) => {
      if (!response.ok || !response.body) {
        console.error("Network or streaming not available", response.status);
        setActiveTools([]);
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      appendAIPlaceholder();
      if (freshSession) setNewSession(false);

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const segments = buffer.split("\n");
          buffer = segments.pop() ?? "";

          for (const segment of segments) {
            if (!segment.trim()) continue;

            let payload: any;
            try {
              payload = JSON.parse(segment);
            } catch (err) {
              console.warn("Failed to parse line:", segment);
              continue;
            }

            if (payload.type === "tool") {
              const id = payload.tool_call_id as string | undefined;
              const status = payload.tool_status as string | undefined;
              if (!id || !status) continue;
              if (status === "started") {
                setActiveTools((prev) => {
                  const existing = prev.find((tool) => tool.tool_call_id === id);
                  if (existing) {
                    return prev.map((tool) =>
                      tool.tool_call_id === id
                        ? { tool_call_id: id, message: payload.message }
                        : tool
                    );
                  }
                  return [...prev, { tool_call_id: id, message: payload.message }];
                });
              } else if (status === "ended") {
                setActiveTools((prev) => prev.filter((tool) => tool.tool_call_id !== id));
              }
              continue;
            }

            if (payload.type === "error") {
              const errorMessage =
                typeof payload.message === "string"
                  ? payload.message
                  : String(payload.message ?? "An unexpected error occurred.");

              setChatList((prev) => {
                const errorEntry: ChatMessage = {
                  message: errorMessage,
                  sender: "ai",
                  message_data: { type: "error" },
                };

                if (prev.length === 0) {
                  return [errorEntry];
                }

                const updated = [...prev];
                const lastIndex = updated.length - 1;
                const lastMessage = updated[lastIndex];

                if (
                  lastMessage.sender === "ai" &&
                  lastMessage.message === "" &&
                  (!lastMessage.message_data ||
                    Object.keys(lastMessage.message_data).length === 0)
                ) {
                  updated[lastIndex] = {
                    ...lastMessage,
                    message: errorEntry.message,
                    message_data: errorEntry.message_data,
                  };
                  return updated;
                }

                updated.push(errorEntry);
                return updated;
              });

              continue;
            }

            if (payload.type === "model") {
              setActiveTools([]);
              setIsLoading(false);
              handleModelChunk(String(payload.message ?? ""));
              continue;
            }

            if (payload.type === "title") {
              const title = payload.message?.title ?? "Untitled";
              setSessionList((prevList) =>
                prevList.map((session) =>
                  session.sessionId === sid ? { ...session, sessionName: title } : session
                )
              );
              continue;
            }

            console.warn("Unknown data type:", payload);
          }
        }
      } catch (err) {
        console.error("Stream read error:", err);
      } finally {
        setActiveTools([]);
        setIsLoading(false);
        try {
          await reader.cancel();
        } catch (err) {
          // swallow cancellation errors
        }
      }
    },
    [appendAIPlaceholder, handleModelChunk, setNewSession, setSessionList]
  );

  const fetchAIResponse = useCallback(
    async (userMessage: string, freshSession: boolean, sid: string) => {
      try {
        const response = await fetch("http://localhost:8000/agent_test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            user_query: userMessage,
            session_id: sid,
            newSession: freshSession,
          }),
        });

        await handleStreamResponse(response, sid, freshSession);
      } catch (error) {
        console.error("Error fetching AI response:", error);
        setActiveTools([]);
        setIsLoading(false);
      }
    },
    [accessToken, handleStreamResponse]
  );

  const fetchAnalyzeResponse = useCallback(
    async (articleId: number, freshSession: boolean, sid: string) => {
      try {
        const response = await fetch("http://localhost:8000/ai_analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ article_id: articleId, sessionId: sid }),
        });

        await handleStreamResponse(response, sid, freshSession);
      } catch (error) {
        console.error("Error fetching analyze response:", error);
        setActiveTools([]);
        setIsLoading(false);
      }
    },
    [accessToken, handleStreamResponse]
  );

  const fetchHighlightsResponse = useCallback(
    async (query: string, freshSession: boolean, sid: string) => {
      try {
        const response = await fetch("http://localhost:8000/highlights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query, sessionId: sid }),
        });

        await handleStreamResponse(response, sid, freshSession);
      } catch (error) {
        console.error("Error fetching highlights response:", error);
        setActiveTools([]);
        setIsLoading(false);
      }
    },
    [accessToken, handleStreamResponse]
  );

  const fetchChatMessages = useCallback(
    async (id: string, targetPage: number, mode: "initial" | "prepend") => {
      const isPrepend = mode === "prepend";
      try {
        if (isPrepend) setIsFetchingOlder(true);
        else setIsFetching(true);

        const response = await axiosInstance.get(`/chat_messages`, {
          params: { sessionId: id, page: targetPage, limit: MESSAGES_PAGE_SIZE },
        });

        const rawMessages = Array.isArray(response.data) ? response.data : [];
        const normalized: Array<ChatMessage> = rawMessages
          .reverse()
          .map((message: any) => ({
            message: message.message,
            sender: message.sender,
            message_data: message.message_data ?? message.message_metadata ?? {},
          }));

        if (isPrepend) {
          const container = scrollContainerRef.current;
          if (container) {
            prevScrollHeightRef.current = container.scrollHeight;
            prevScrollTopRef.current = container.scrollTop;
            lastOpRef.current = "prepend";
          }
          setChatList((prev) => [...normalized, ...prev]);
        } else {
          setChatList((prev) => (prev.length === 0 ? normalized : [...prev, ...normalized]));
        }

        if (rawMessages.length < MESSAGES_PAGE_SIZE) {
          setHasMore(false);
        }

        return rawMessages.length;
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        return null;
      } finally {
        if (isPrepend) setIsFetchingOlder(false);
        else setIsFetching(false);
      }
    },
    [axiosInstance, MESSAGES_PAGE_SIZE]
  );

  useEffect(() => {
    if (!sessionId) return;
    if (initGuardRef.current) return;
    initGuardRef.current = true;

    if (newSession) {
      setIntroMessage(getRandomAssistantMessage());
      return;
    }

    const loadInitial = async () => {
      loadedPagesRef.current.add(1);
      setPage(1);
      setHasMore(true);
      await fetchChatMessages(sessionId, 1, "initial");
      setObserverReady(true);
    };

    loadInitial();
  }, [sessionId, newSession, fetchChatMessages]);

  useEffect(() => {
    if (!sessionId || !newSession) return;
    if (!initialIntent || initialIntentRunRef.current) return;

    initialIntentRunRef.current = true;

    setSessionList((prevList) => [
      { sessionId, sessionName: null },
      ...prevList.filter((session) => session.sessionId !== sessionId),
    ]);

    setActiveTools([]);

    if (initialIntent.kind === "analyze") {
      setChatList((prev) => [
        ...prev,
        {
          message: "Analyze above Article",
          sender: "user",
          message_data: initialIntent.payload.articleMeta
            ? { type: "article_metadata", data: initialIntent.payload.articleMeta }
            : {},
        },
      ]);

      setIsLoading(true);
      fetchAnalyzeResponse(initialIntent.payload.articleId, true, sessionId);
    } else if (initialIntent.kind === "search_highlights") {
      const query = initialIntent.payload.query;

      setChatList((prev) => [
        ...prev,
        {
          message: `Search Highlights: ${query}`,
          sender: "user",
          message_data: { type: "search_highlights", query },
        },
      ]);

      setIsLoading(true);
      fetchHighlightsResponse(query, true, sessionId);
    }

    onConsumedInitialIntent?.();
  }, [
    sessionId,
    newSession,
    initialIntent,
    fetchAnalyzeResponse,
    fetchHighlightsResponse,
    setSessionList,
    onConsumedInitialIntent,
  ]);

  const sendSuggestion = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      setChatList((prev) => [...prev, { message: trimmed, sender: "user", message_data: {} }]);
      setIsLoading(true);
      setActiveTools([]);

      if (newSession) {
        setSessionList((prevList) => [
          { sessionId, sessionName: null },
          ...prevList.filter((session) => session.sessionId !== sessionId),
        ]);
        if (!isMini) {
          navigate(`/chat/${sessionId}`);
        }
      }

      fetchAIResponse(trimmed, newSession, sessionId);
    },
    [fetchAIResponse, isMini, navigate, newSession, sessionId, setSessionList]
  );

  // Maintain scroll position: scroll to bottom for normal updates, restore position on prepend
  useEffect(() => {
    if (newSession) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (lastOpRef.current === "prepend") {
        const diff = el.scrollHeight - prevScrollHeightRef.current;
        el.scrollTop = prevScrollTopRef.current + diff;
        lastOpRef.current = "idle";
      }
    });
  }, [newSession, chatList]);

  // IntersectionObserver for top sentinel to load older messages
  useEffect(() => {
    if (newSession) return;
    if (!observerReady) return;
    const container = scrollContainerRef.current;
    const sentinel = topSentinelRef.current;
    if (!container || !sentinel) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting) return;
      if (isFetchingOlder || !hasMore || !sessionId) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        const nextPage = page + 1;
        if (loadedPagesRef.current.has(nextPage)) return;
        const count = await fetchChatMessages(sessionId, nextPage, "prepend");
        if (typeof count === "number" && count > 0) {
          loadedPagesRef.current.add(nextPage);
          setPage(nextPage);
        }
      }, 180);
    };

    const observer = new IntersectionObserver(onIntersect, {
      root: container,
      threshold: 0.1,
    });
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    sessionId,
    newSession,
    observerReady,
    isFetchingOlder,
    hasMore,
    page,
    fetchChatMessages,
  ]);

  // Container layout: in mini + newSession, pin MessageBar to bottom
  return (
    <div className={containerClasses}>
      {newSession && (
        isMini ? (
          <div className="flex-1 w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 px-4">
              <div className="text-brandColor text-center font-semibold text-shadow-md text-xl">
                {introMessage}
              </div>
              <QuerySuggest isMini={true} onSelect={sendSuggestion} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10 px-25">
            <div className="text-brandColor text-center font-semibold text-shadow-md text-3xl">
              {introMessage}
            </div>
            <QuerySuggest onSelect={sendSuggestion} />
          </div>
        )
      )}
      {!newSession && (
        <div
          ref={scrollContainerRef}
          className={`flex-1 min-h-0 w-full justify-end overflow-y-auto overflow-x-clip scrollbar-thin scrollbar-thumb-textSecondary scrollbar-thumb-rounded-3xl ${isMini ? "px-3" : "px-40"} gap-3`}
        >
          {/* Top sentinel for infinite scroll */}
          <div ref={topSentinelRef} className="h-1" />
          {isFetchingOlder && (
            <div className="flex items-center gap-2 text-textSecondary py-2 pl-2.5">
              <span className="ai-loader" />
              <span>Loading older messages…</span>
            </div>
          )}
          {chatList.map((chat, index) => (
            <div
              key={index}
              className={`flex mt-5 ${
                chat.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <MessageComponent
                key={index}
                message={chat.message}
                sender={chat.sender}
                message_data={chat.message_data}
              />
            </div>
          ))}
          {isFetching && chatList.length === 0 && (
            <div className="w-full flex justify-center items-center py-6 text-textSecondary">
              <span className="ai-loader mr-2" />
              <span>Loading messages…</span>
            </div>
          )}
        </div>
      )}
      
      {isLoading && (
        <div className={`w-full ${isMini ? "px-3 mb-1" : "px-40 mb-2"}`}>
          <div className="w-full flex flex-col gap-2 rounded-xl border border-[#D5D5D5] bg-[#E0E0E0] px-4 py-3 shadow-md">
            {activeTools.length === 0 ? (
              <div className="flex items-center gap-3 text-brandColor">
                <span className="ai-loader" />
                <span>Thinking...</span>
              </div>
            ) : (
              activeTools.map((tool) => (
                <div key={tool.tool_call_id} className="flex items-center gap-3 text-textSecondary">
                  <span className="ai-loader" />
                  <span>{tool.message ?? "Working..."}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <div className={`w-full ${isMini ? "px-3" : "px-40"}`}>
        <MessageBar
          sessionId={sessionId}
          setChatList={setChatList}
          newSession={newSession}
          setNewSession={setNewSession}
          setSessionList={setSessionList}
          setIsLoading={setIsLoading}
          setActiveTools={setActiveTools}
          isMini={isMini}
        />
      </div>
    </div>
  );
}

// Memoize ChatMessages to avoid re-renders when parent updates unrelated state (e.g., sessionList changes)
export default memo(
  ChatMessages,
  (prev, next) =>
    prev.sessionId === next.sessionId &&
    prev.newSession === next.newSession &&
    prev.isMini === next.isMini &&
  prev.initialIntent === next.initialIntent
);
