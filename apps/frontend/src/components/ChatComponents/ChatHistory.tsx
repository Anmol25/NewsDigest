import { NavLink } from "react-router-dom";
import ChatHistoryItem from "./utils/ChatHistoryItem";
import { useEffect } from "react";
import { useAxios } from '../../services/AxiosConfig';

function ChatHistory({ sessionList, setChatList }: { sessionList: Array<{ sessionId: string, sessionName: string | null}>, setChatList: Function }) {
    const axiosInstance = useAxios();

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
                <button className="text-textMediumSmall text-textSecondary cursor-pointer hover:underline">Clear All</button>
            </div>
            <div className="flex-1 gap-0 flex flex-col overflow-y-auto  scrollbar-thin scrollbar-thumb-textSecondary scrollbar-thumb-rounded-3xl">
                {sessionList.map((session) => (
                    <ChatHistoryItem key={session.sessionId} sessionId={session.sessionId} sessionName={session.sessionName} />
                ))}

            </div>
        </div>
    );
}

export default ChatHistory;