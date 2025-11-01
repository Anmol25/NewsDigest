import { NavLink } from "react-router-dom";
import { useState, MouseEvent } from "react";

type Props = {
    sessionId: string;
    sessionName: string | null;
    onDeleteClick?: (sessionId: string) => void;
    miniMode?: boolean;
    onSelect?: (sessionId: string) => void; // used in miniMode
    isActive?: boolean; // active styling for miniMode
};

function ChatHistoryItem({ sessionId, sessionName, onDeleteClick, miniMode = false, onSelect, isActive = false }: Props) {
    const [hovered, setHovered] = useState(false);

    if (miniMode) {
        return (
            <button
                type="button"
                onClick={() => onSelect?.(sessionId)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`flex justify-between px-2.5 py-2 rounded-4xl text-[15px] text-left ${
                    isActive ? "bg-[#E4E4E4]" : "hover:bg-[#FAF8F8]"
                }`}
            >
                <span className="line-clamp-1 break-all text-textSecondary">{sessionName || "New Chat"}</span>
                {hovered && (
                    <span
                        className="text-textSecondary hover:text-gray-900"
                        onClick={(e: MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteClick?.(sessionId);
                        }}
                        aria-label="Delete chat session"
                        title="Delete chat"
                    >
                        <i className="ri-close-large-line"></i>
                    </span>
                )}
            </button>
        );
    }

    return (
        <NavLink
            to={`/chat/${sessionId}`}
            onClick={(e) => {
                // Prevent re-navigation if already on the same page
                if (window.location.pathname === `/chat/${sessionId}`) {
                    e.preventDefault();
                }
            }}
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
                    {(hovered || isActive) && (
                        <button
                            type="button"
                            className="text-textSecondary hover:text-gray-900"
                            onClick={(e: MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteClick?.(sessionId);
                            }}
                            aria-label="Delete chat session"
                            title="Delete chat"
                        >
                            <i className="ri-close-large-line"></i>
                        </button>
                    )}
                </>
            )}
        </NavLink>
    );
}

export default ChatHistoryItem;