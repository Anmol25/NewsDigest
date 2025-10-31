import { useEffect, useRef, useState, memo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getRandomAssistantMessage } from "./utils/assistantintro";
import MessageBar from "./utils/MessageBar";
import QuerySuggest from "./utils/QuerySuggest";
import MessageComponent from "./utils/MessageComponent";
import { useAxios } from "../../services/AxiosConfig";

type ChatMessagesProps = {
  sessionId: string;
  setSessionList: Dispatch<
    SetStateAction<Array<{ sessionId: string; sessionName: string | null }>>
  >;
  newSession: boolean;
  setNewSession: Dispatch<SetStateAction<boolean>>;
};

function ChatMessages(props: ChatMessagesProps) {
  const { sessionId, newSession, setNewSession, setSessionList } = props;
  const axiosInstance = useAxios();
  const [introMessage, setIntroMessage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [chatList, setChatList] = useState<
    Array<{ message: string; sender: "user" | "ai" }>
  >([]);
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

      // Reverse the fetched messages
      const reversedMessages = response.data.reverse();

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
      } else {
        // Default behavior: anchor to bottom
        el.scrollTop = el.scrollHeight;
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

  return (
    <div
      className={`h-full min-h-0 justify-center items-center flex flex-col ${
        newSession ? "gap-5 " : "gap-0 pt-0 pb-2.5"
      } `}
    >
      {newSession && (
        <div className="flex flex-col gap-10 items-center px-25">
          <div className="text-brandColor text-center text-3xl font-semibold text-shadow-md">
            {introMessage}
          </div>
          <QuerySuggest />
        </div>
      )}
      {!newSession && (
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 w-full justify-end overflow-y-auto overflow-x-clip scrollbar-thin scrollbar-thumb-textSecondary scrollbar-thumb-rounded-3xl px-40 gap-3"
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
        <div className="w-full px-40 mb-2">
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
      <div className="w-full px-40">
        <MessageBar
          sessionId={sessionId}
          setChatList={setChatList}
          newSession={newSession}
          setNewSession={setNewSession}
          setSessionList={setSessionList}
          setIsLoading={setIsLoading}
          setActiveTools={setActiveTools}
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
    prev.newSession === next.newSession
);
