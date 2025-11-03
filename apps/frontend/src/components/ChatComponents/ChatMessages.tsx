import { useEffect, useRef, useState, memo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getRandomAssistantMessage } from "./utils/assistantintro";
import MessageBar from "./utils/MessageBar";
import QuerySuggest from "./utils/QuerySuggest";
import MessageComponent from "./utils/MessageComponent";
import { useAxios } from "../../services/AxiosConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type ChatMessagesProps = {
  sessionId: string;
  setSessionList: Dispatch<
    SetStateAction<Array<{ sessionId: string; sessionName: string | null }>>
  >;
  newSession: boolean;
  setNewSession: Dispatch<SetStateAction<boolean>>;
  isMini?: boolean; // compact rendering for mini chat window
  // If provided (only in MiniChat), trigger one-shot analyze flow on mount
  initialAnalyze?: { articleId: number; articleMeta?: any } | null;
};

function ChatMessages(props: ChatMessagesProps) {
  const { sessionId, newSession, setNewSession, setSessionList, isMini = false, initialAnalyze = null } = props;
  const axiosInstance = useAxios();
  const [introMessage, setIntroMessage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  type ChatMessage = { message: string; sender: "user" | "ai"; message_data?: any };
  const [chatList, setChatList] = useState<Array<ChatMessage>>([]);
  // Loading and tool state (for displaying tool stack and default thinking state)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTools, setActiveTools] = useState<
    Array<{ tool_call_id: string; message?: string }>
  >([]);
  const fetchCalled = useRef(false);
  // Paging and infinite scroll state
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [olderObserverActive, setOlderObserverActive] = useState<boolean>(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const lastOpRef = useRef<"idle" | "prepend">("idle");
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  // Suggestion sender: mimic MessageBar behavior
  const fetchAIResponse = async (
    userMessage: string,
    freshSession: boolean,
    sid: string
  ) => {
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

    if (!response.ok || !response.body) {
      console.error("Network or streaming not available", response.status);
      setActiveTools([]);
      setIsLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

  // Ensure AI placeholder to append into
  setChatList((prev) => [...prev, { message: "", sender: "ai", message_data: {} }]);
    if (freshSession) setNewSession(false);

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let data: any;
          try {
            data = JSON.parse(line);
          } catch (err) {
            console.warn("Failed to parse line:", line);
            continue;
          }

          if (data.type == "tool") {
            const status = data.tool_status as string | undefined;
            const id = data.tool_call_id as string | undefined;
            if (!id || !status) continue;
            if (status === "started") {
              setActiveTools((prev) => {
                const existing = prev.find((t) => t.tool_call_id === id);
                if (existing) {
                  return prev.map((t) =>
                    t.tool_call_id === id ? { tool_call_id: id, message: data.message } : t
                  );
                }
                return [...prev, { tool_call_id: id, message: data.message }];
              });
            } else if (status === "ended") {
              setActiveTools((prev) => prev.filter((t) => t.tool_call_id !== id));
            }
          } else if (data.type === "model") {
            setActiveTools([]);
            setIsLoading(false);
            const content = data.message || "";
            setChatList((prevList) => {
              if (prevList.length === 0) return prevList;
              const updatedList = [...prevList];
              const lastMessage = updatedList.at(-1);
              if (lastMessage?.sender === "ai") {
                updatedList[updatedList.length - 1] = {
                  ...lastMessage,
                  message: lastMessage.message + content,
                } as any;
              }
              return updatedList;
            });
          } else if (data.type === "title") {
            const title = data.message?.title ?? "Untitled";
            setSessionList((prevList) =>
              prevList.map((s) => (s.sessionId === sid ? { ...s, sessionName: title } : s))
            );
          } else {
            console.warn("Unknown data type:", data);
          }
        }
      }
    } catch (err) {
      console.error("Stream read error:", err);
      setActiveTools([]);
      setIsLoading(false);
    } finally {
      try {
        reader.cancel();
      } catch {}
    }
  };

  // One-shot: analyze current article via /ai_analyze for new session
  const fetchAnalyzeResponse = async (
    articleId: number,
    freshSession: boolean,
    sid: string
  ) => {
    const response = await fetch("http://localhost:8000/ai_analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ article_id: articleId, sessionId: sid }),
    });

    if (!response.ok || !response.body) {
      console.error("Network or streaming not available", response.status);
      setActiveTools([]);
      setIsLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // Ensure AI placeholder to append into
    setChatList((prev) => [...prev, { message: "", sender: "ai", message_data: {} }]);
    if (freshSession) setNewSession(false);

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let data: any;
          try {
            data = JSON.parse(line);
          } catch (err) {
            console.warn("Failed to parse line:", line);
            continue;
          }

          if (data.type == "tool") {
            const status = data.tool_status as string | undefined;
            const id = data.tool_call_id as string | undefined;
            if (!id || !status) continue;
            if (status === "started") {
              setActiveTools((prev) => {
                const existing = prev.find((t) => t.tool_call_id === id);
                if (existing) {
                  return prev.map((t) =>
                    t.tool_call_id === id ? { tool_call_id: id, message: data.message } : t
                  );
                }
                return [...prev, { tool_call_id: id, message: data.message }];
              });
            } else if (status === "ended") {
              setActiveTools((prev) => prev.filter((t) => t.tool_call_id !== id));
            }
          } else if (data.type === "model") {
            setActiveTools([]);
            setIsLoading(false);
            const content = data.message || "";
            setChatList((prevList) => {
              if (prevList.length === 0) return prevList;
              const updatedList = [...prevList];
              const lastMessage = updatedList.at(-1);
              if (lastMessage?.sender === "ai") {
                updatedList[updatedList.length - 1] = {
                  ...lastMessage,
                  message: lastMessage.message + content,
                } as any;
              }
              return updatedList;
            });
          } else if (data.type === "title") {
            const title = data.message?.title ?? "Untitled";
            setSessionList((prevList) =>
              prevList.map((s) => (s.sessionId === sid ? { ...s, sessionName: title } : s))
            );
          } else {
            console.warn("Unknown data type:", data);
          }
        }
      }
    } catch (err) {
      console.error("Stream read error:", err);
      setActiveTools([]);
      setIsLoading(false);
    } finally {
      try {
        reader.cancel();
      } catch {}
    }
  };

  const sendSuggestion = (q: string) => {
    if (!q.trim()) return;
    // Add user message
    setChatList((prev) => [...prev, { message: q.trim(), sender: "user", message_data: {} }]);
    // loader state
    setIsLoading(true);
    setActiveTools([]);
    // if it's a new session, update list and optionally navigate in full chat
    if (newSession) {
      setSessionList((prevList) => [{ sessionId, sessionName: null }, ...prevList]);
      if (!isMini) {
        navigate(`/chat/${sessionId}`);
      }
    }
    // fetch response
    fetchAIResponse(q.trim(), newSession, sessionId);
  };

  // Extracted so it can be reused elsewhere (e.g., manual refresh, retry handlers)
  const fetchChatMessages = async (id: string, targetPage = 1, limit = 20, mode: "initial" | "prepend" = "initial") => {
    try {
      if (mode === "prepend") setIsFetchingOlder(true);
      else setIsFetching(true);
      const controller = new AbortController();
      const response = await axiosInstance.get(`/chat_messages`, {
        params: { sessionId: id, page: targetPage, limit },
        signal: controller.signal as any,
      });

      // Reverse and normalize the fetched messages
      const reversedMessages = (Array.isArray(response.data) ? response.data : [])
        .reverse()
        .map((m: any) => ({
          message: m.message,
          sender: m.sender,
          // Normalize backend field name: message_metadata -> message_data
          message_data: m.message_data ?? m.message_metadata ?? {},
        } as ChatMessage));

      // Merge based on mode: initial (append to bottom), prepend (older messages at top)
      if (mode === "prepend") {
        const el = scrollContainerRef.current;
        if (el) {
          // Save current scroll metrics to restore position after prepend
          prevScrollHeightRef.current = el.scrollHeight;
          prevScrollTopRef.current = el.scrollTop;
          lastOpRef.current = "prepend";
        }
        setChatList((prevList) => [...reversedMessages, ...prevList]);
      } else {
        setChatList((prevList) => [...prevList, ...reversedMessages]);
      }

      // hasMore: if fewer than limit returned, no more pages
      if (Array.isArray(response.data) && response.data.length < limit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    } finally {
      if (mode === "prepend") setIsFetchingOlder(false);
      else setIsFetching(false);
    }
  };

  // Initial fetch and new session check
  useEffect(() => {
    if (!sessionId) return;
    if (fetchCalled.current) return; // 👈 prevent 2nd call in Strict Mode

    fetchCalled.current = true;

    if (newSession) {
      const message = getRandomAssistantMessage();
      setIntroMessage(message);
      // If an initial analyze payload is provided (MiniChat), auto-trigger it
      if (initialAnalyze && initialAnalyze.articleId) {
        // 1) create the new session entry visually
        setSessionList((prevList) => [{ sessionId, sessionName: null }, ...prevList]);
        // 2) push the user message with article mini card
        setChatList((prev) => [
          ...prev,
          {
            message: "Analyze above Article",
            sender: "user",
            message_data: initialAnalyze.articleMeta
              ? { type: "article_metadata", data: initialAnalyze.articleMeta }
              : {},
          },
        ]);
        // 3) prepare loader and stream analyze
        setIsLoading(true);
        setActiveTools([]);
        fetchAnalyzeResponse(initialAnalyze.articleId, true, sessionId);
      }
    } else {
      // Initial page load (await to avoid immediate top-sentinel trigger)
      const LIMIT = 20;
      const run = async () => {
        loadedPagesRef.current.add(1);
        setPage(1);
        setHasMore(true);
        await fetchChatMessages(sessionId, 1, LIMIT, "initial");
        // Enable top-sentinel only after initial page is loaded
        setOlderObserverActive(true);
      };
      run();
    }
  }, []);

console.log(
  "ChatMessages Component - sessionId:",
  sessionId,
  "new_session:",
  newSession
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
    if (newSession) return; // no messages to load for new session yet
    const rootEl = scrollContainerRef.current;
    const sentinel = topSentinelRef.current;
    if (!rootEl || !sentinel) return;
    if (!olderObserverActive) return; // don't start older loader until initial page loaded

  const LIMIT = 20;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (!entry.isIntersecting) return;
      if (isFetchingOlder || !hasMore) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        const nextPage = page + 1;
        if (loadedPagesRef.current.has(nextPage)) return; // avoid duplicate page fetches
        try {
          await fetchChatMessages(sessionId, nextPage, LIMIT, "prepend");
          loadedPagesRef.current.add(nextPage);
          setPage(nextPage);
        } catch (e) {
          // errors handled in fetchChatMessages
        }
      }, 200);
    };

    const observer = new IntersectionObserver(onIntersect, {
      root: rootEl,
      threshold: 0.1,
    });
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [sessionId, newSession, isFetchingOlder, hasMore, page, olderObserverActive]);

  // Container layout: in mini + newSession, pin MessageBar to bottom
  const containerClasses = (() => {
    if (isMini && newSession) {
      return "h-full min-h-0 flex flex-col justify-between items-stretch gap-4 pb-2.5";
    }
    // original behavior for full page and existing sessions
    return `h-full min-h-0 justify-center items-center flex flex-col ${
      newSession ? "gap-5 " : "gap-0 pt-0 pb-2.5"
    }`;
  })();

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
    prev.isMini === next.isMini
);
