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
      } font-[system-ui]`}
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
          className="flex-1 min-h-0 justify-end overflow-y-auto scrollbar-thin scrollbar-thumb-textSecondary scrollbar-thumb-rounded-3xl px-30 gap-3"
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
      <div className="w-full px-30">
        <MessageBar sessionId={sessionId} chatList={chatList} setChatList={setChatList} newSession={newSession} setNewSession={setNewSession} sessionList={sessionList} setSessionList={setSessionList} />
      </div>
    </div>
  );
}

export default ChatMessages;
