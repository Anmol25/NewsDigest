import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

function MessageBar({
  sessionId,
  sessionList,
  setSessionList,
  newSession,
  setNewSession,
  chatList,
  setChatList,
}: {
  sessionId: string;
  sessionList: Array<{ sessionId: string; sessionName: string | null }>;
  setSessionList: Dispatch<
    SetStateAction<Array<{ sessionId: string; sessionName: string | null }>>
  >;
  newSession: boolean;
  setNewSession: Dispatch<SetStateAction<boolean>>;
  chatList: Array<{ message: string; sender: "user" | "ai" }>;
  setChatList: Dispatch<
    SetStateAction<Array<{ message: string; sender: "user" | "ai" }>>
  >;
}) {
  const [value, setValue] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_ROWS = 10;

  //
  const navigate = useNavigate();

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    // Reset height to auto to accurately measure scrollHeight
    ta.style.height = "auto";
    const computed = window.getComputedStyle(ta);
    const lineHeight = parseFloat(computed.lineHeight || "20");
    const maxHeight = lineHeight * MAX_ROWS;
    const newHeight = Math.min(ta.scrollHeight, maxHeight);
    ta.style.height = `${newHeight}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";

    const approxRows = Math.max(1, Math.round(ta.scrollHeight / lineHeight));
    setIsMultiline(approxRows > 1);
  };

  useEffect(() => {
    adjustHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Enter sends (prevent newline)
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter will naturally insert a newline (no preventDefault)
  };

  const handleSubmit = () => {
    if (value.trim() === "") return;

    // Update chat list with new user message
    setChatList((prevList) => [
      ...prevList,
      { message: value.trim(), sender: "user" },
    ]);

    // Clear input
    setValue("");

    // If it's a new session, update session list
    if (newSession) {
      setSessionList((prevList) => [
        { sessionId: sessionId, sessionName: null },
        ...prevList,
      ]);

      navigate(`/chat/${sessionId}`);
    }
  };

  return (
    <form
      className="flex flex-row items-center w-full min-h-8 rounded-3xl shadow-md px-1 py-1.5 bg-basePrimary"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <textarea
        ref={textareaRef}
        name="chat-input"
        placeholder="Ask Anything..."
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex grow resize-none bg-transparent px-2.5 focus:outline-none focus:ring-0 autofill:bg-transparent autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] overflow-y-hidden"
        aria-label="Message input"
      />
      <button
        className={`flex items-center justify-center text-xl hover:cursor-pointer shrink-0 rounded-full p-1.5 bg-brandColor ${
          isMultiline ? "self-end" : ""
        }`}
        type="submit"
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
          className="size-7"
        >
          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
        </svg>
      </button>
    </form>
  );
}

export default MessageBar;
