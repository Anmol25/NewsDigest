import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

function MessageBar({
  sessionId,
  setSessionList,
  newSession,
  setChatList,
  setIsLoading,
  setActiveTools,
  isMini,
}: {
  sessionId: string;
  setSessionList: Dispatch<
    SetStateAction<Array<{ sessionId: string; sessionName: string | null }>>
  >;
  newSession: boolean;
  setNewSession: Dispatch<SetStateAction<boolean>>;
  setChatList: Dispatch<
    SetStateAction<Array<{ message: string; sender: "user" | "ai" }>>
  >;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setActiveTools: Dispatch<
    SetStateAction<Array<{ tool_call_id: string; message?: string }>>
  >;
  isMini?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_ROWS = 10;
  const navigate = useNavigate();
  const { accessToken } = useAuth();

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

  const fetchAIResponse = async (
    userMessage: string,
    newSession: boolean,
    sessionId: string
  ) => {
    
    const response = await fetch("http://localhost:8000/agent_test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        user_query: userMessage,
        session_id: sessionId,
        newSession: newSession,
      }),
    });

     // 2. Basic response checks
    if (!response.ok || !response.body) {
      console.error("Network or streaming not available", response.status);
      setActiveTools([]);
      setIsLoading(false);
      return;
    }

    // 3. Prepare reader + decoder
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    // 4. Buffer for partial lines
    let buffer = "";

    // 5. Ensure there's an AI placeholder to append into
    setChatList(prev => [...prev, { message: "", sender: "ai" }]);
    if (newSession) setNewSession(false);

    try {
      while (true) {
        const { value, done } = await reader.read(); // A
        if (done) break;                              // B

        buffer += decoder.decode(value, { stream: true }); // C

        // Split into lines; last element may be incomplete
        const lines = buffer.split("\n");                // D
        buffer = lines.pop() ?? "";                      // E

        for (const line of lines) {
          if (!line.trim()) continue; // skip empty lines

          // parse JSON safely
          let data;
          try {
            data = JSON.parse(line);                      // F
          } catch (err) {
            console.warn("Failed to parse line:", line);
            continue;
          }

          if (data.type == "tool"){
            // Maintain tool stack: add/update on started, remove on ended
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
          }else if (data.type === "model") {
            // Model content started, clear tools and hide loader
            setActiveTools([]);
            setIsLoading(false);


            // const content = data.message || "";
            // // Append content to the last AI message
            // setChatList((prevList) => {
            //   const updatedList = [...prevList];
            //   const lastIndex = updatedList.length - 1;
            //   if (updatedList[lastIndex].sender === "ai") {
            //     updatedList[lastIndex].message += content;
            //   }
            //   return updatedList;
            // });

            const content = data.message || "";
  setChatList((prevList) => {
    if (prevList.length === 0) return prevList; // prevent error if empty
    
    const updatedList = [...prevList];
    const lastMessage = updatedList.at(-1);
    
    if (lastMessage?.sender === "ai") {
      updatedList[updatedList.length - 1] = {
        ...lastMessage,
        message: lastMessage.message + content,
      };
    }
    return updatedList;
  });


            
        }else if (data.type === "title") {
            const title = data.message?.title ?? "Untitled";
            // handle title updates
            setSessionList((prevList) => {
              return prevList.map((session) =>
                session.sessionId === sessionId
                  ? { ...session, sessionName: title }
                  : session
              );
            });
        }else{
            console.warn("Unknown data type:", data);
        }
        }
      }
    } catch (err) {
      console.error("Stream read error:", err);
      setActiveTools([]);
      setIsLoading(false);
    } finally {
      // optionally close/cancel reader
      try { reader.cancel(); } catch {}
    }
  };

  const handleSubmit = () => {
    if (value.trim() === "") return;

    // Update chat list with new user message
    setChatList((prevList) => [
      ...prevList,
      { message: value.trim(), sender: "user" },
    ]);
    setValue("");

    // Prepare loader state
    setIsLoading(true);
    setActiveTools([]);

    // If it's a new session, update session list
    if (newSession) {
      setSessionList((prevList) => [
        { sessionId: sessionId, sessionName: null },
        ...prevList,
      ]);
      // In mini chat, do not navigate away to full chat on first message
      if (!isMini) {
        navigate(`/chat/${sessionId}`);
      }
    }
    // Fetch AI response
    fetchAIResponse(value.trim(), newSession, sessionId);
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
