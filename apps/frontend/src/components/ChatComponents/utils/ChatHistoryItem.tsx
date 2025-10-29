import { NavLink } from "react-router-dom";
import { useState } from "react";

function ChatHistoryItem({ sessionId, sessionName }: { sessionId: string, sessionName: string }) {
    const [hovered, setHovered] = useState(false);

    return (
        <NavLink
            to={`/chat/${sessionId}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={({ isActive }) =>
                isActive
                    ? "flex justify-between px-2.5 py-2 rounded-4xl text-[15px] bg-[#E4E4E4]"
                    : "flex justify-between px-2.5 py-2 rounded-4xl text-[15px] hover:bg-[#FAF8F8]"
            }
        >
            {({ isActive }) => (
                <>
                    <span className="line-clamp-1 break-all text-textSecondary">{sessionName || "New Chat"}</span>
                    {(hovered || isActive) && <i className="ri-close-large-line"></i>}
                </>
            )}
        </NavLink>
    );
}

export default ChatHistoryItem;