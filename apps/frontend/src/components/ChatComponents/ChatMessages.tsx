import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getRandomAssistantMessage } from "./utils/assistantintro";
import MessageBar from "./utils/MessageBar";
import QuerySuggest from "./utils/QuerySuggest";
import MessageComponent from "./utils/MessageComponent";
import { useAxios } from "../../services/AxiosConfig";

type ChatMessagesProps = {
  sessionId: string;
  sessionList: Array<{ sessionId: string; sessionName: string | null }>;
  setSessionList: Dispatch<
    SetStateAction<Array<{ sessionId: string; sessionName: string | null }>>
  >;
  newSession: boolean;
  setNewSession: Dispatch<SetStateAction<boolean>>;
};

function ChatMessages(props: ChatMessagesProps) {
  const { sessionId, newSession, setNewSession, sessionList, setSessionList } = props;
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

  // Extracted so it can be reused elsewhere (e.g., manual refresh, retry handlers)
  const fetchChatMessages = async (id: string) => {
    try {
      const response = await axiosInstance.get(`/chat_messages`, {
        params: { sessionId: id },
      });

      // Reverse the fetched messages
      const reversedMessages = response.data.reverse();

      // Append them to the existing chatList (keeps the original behavior)
      setChatList((prevList) => [...prevList, ...reversedMessages]);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
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
    fetchChatMessages(sessionId); // 👈 only fetch if not a new session
  }
}, []);

console.log(
  "ChatMessages Component - sessionId:",
  sessionId,
  "new_session:",
  newSession
);

  // Always keep the scroll anchored to the bottom for existing sessions.
  useEffect(() => {
    if (newSession) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    // Use rAF to ensure DOM is painted before measuring
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [newSession, chatList]);

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

export default ChatMessages;
