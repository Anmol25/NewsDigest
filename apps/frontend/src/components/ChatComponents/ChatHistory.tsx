import { NavLink, useLocation, useNavigate } from "react-router-dom";
import ChatHistoryItem from "./utils/ChatHistoryItem";
import { useEffect, useState, useCallback } from "react";
import { useAxios } from '../../services/AxiosConfig';
import DeletePopup from "./utils/DeletePopup";

function ChatHistory({ sessionList, setChatList }: { sessionList: Array<{ sessionId: string, sessionName: string | null}>, setChatList: Function }) {
    const axiosInstance = useAxios();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteMode, setDeleteMode] = useState<'all' | 'single'>('all');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch chat sessions from backend
        async function fetchChatSessions() {
            try {
                const response = await axiosInstance.get('/chat_history');
                // Assuming response.data is an array of sessions
                console.log("Fetched chat sessions:", response.data);
                // Handle both single object or array from backend
                const sessions = Array.isArray(response.data)
                    ? response.data
                    : [response.data];

                // Map backend keys to frontend state shape
                const formattedSessions = sessions.map((item) => ({
                    sessionId: item.id,
                    sessionName: item.session_name,
                }));
                setChatList(formattedSessions);
            } catch (error) {
                console.error("Error fetching chat sessions:", error);
            }
        }
        fetchChatSessions();
    }, [setChatList]);

    return (
        <div className="flex h-full min-h-0 flex-col p-2.5 gap-2.5">
            <NavLink className="flex w-full items-center justify-center text-center p-2.5 rounded-4xl bg-brandColor text-basePrimary font-semibold shadow-md gap-1 text-textMedium" to="/chat" onClick={(e) => {
                // Prevent re-navigation if already on the same page
                if (window.location.pathname === `/chat`) {
                    e.preventDefault();
                }
            }}>
                <i className="ri-add-line"></i>New Chat
            </NavLink>
            <div className="flex flex-row justify-between">
                <p className="text-textBig font-semibold">Chats</p>
                <button
                    className="text-textMediumSmall text-textSecondary cursor-pointer hover:underline"
                    onClick={() => {
                        setDeleteMode('all');
                        setSelectedSessionId(null);
                        setShowDeletePopup(true);
                    }}
                >
                    Clear All
                </button>
            </div>
            <div className="flex-1 gap-0 flex flex-col overflow-y-auto  scrollbar-thin scrollbar-thumb-textSecondary scrollbar-thumb-rounded-3xl">
                {sessionList.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-textSecondary text-md">
                        No Chat History
                    </div>
                ) : (
                    sessionList.map((session) => (
                        <ChatHistoryItem
                            key={session.sessionId}
                            sessionId={session.sessionId}
                            sessionName={session.sessionName}
                            onDeleteClick={(sid: string) => {
                                setDeleteMode('single');
                                setSelectedSessionId(sid);
                                setShowDeletePopup(true);
                            }}
                        />
                    ))
                )}
            </div>
            <DeletePopup
                isOpen={showDeletePopup}
                mode={deleteMode}
                sessionId={selectedSessionId}
                onClose={() => setShowDeletePopup(false)}
                onSuccess={useCallback((mode, sid) => {
                    const match = location.pathname.match(/^\/chat\/([^/]+)$/);
                    const activeSessionId = match ? match[1] : null;

                    if (mode === 'all') {
                        setChatList([]);
                        // If currently viewing a specific chat, navigate back to /chat
                        if (activeSessionId) {
                            navigate('/chat', { replace: true });
                        }
                    } else if (mode === 'single' && sid) {
                        setChatList((prev: Array<{ sessionId: string, sessionName: string | null}>) =>
                            prev.filter((s) => s.sessionId !== sid)
                        );
                        // If the deleted session is the one currently open, navigate back to /chat
                        if (activeSessionId === sid) {
                            navigate('/chat', { replace: true });
                        }
                    }
                }, [location.pathname, navigate, setChatList])}
            />
        </div>
    );
}

export default ChatHistory;