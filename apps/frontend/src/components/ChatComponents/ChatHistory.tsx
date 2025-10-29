import { NavLink } from "react-router-dom";
import ChatHistoryItem from "./utils/ChatHistoryItem";

function ChatHistory() {
    return (
        <div className="flex h-full min-h-0 flex-col p-2.5 gap-2.5">
            <NavLink className="flex w-full items-center justify-center text-center p-2.5 rounded-4xl bg-brandColor text-basePrimary font-semibold shadow-md gap-1 text-textMedium" to="/chat">
                <i className="ri-add-line"></i>New Chat
            </NavLink>
            <div className="flex flex-row justify-between">
                <p className="text-textBig font-semibold">Chats</p>
                <button className="text-textMediumSmall text-textSecondary cursor-pointer hover:underline">Clear All</button>
            </div>
            <div className="flex-1 gap-0 flex flex-col overflow-y-auto">
                {/* Example Chat History Items */}
                <ChatHistoryItem sessionId="1" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="2" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="3" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="4" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="5" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="6" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="7" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="8" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="9" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="10" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="11" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="12" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="13" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="14" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="15" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="16" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="17" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="18" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="19" sessionName="Lorem Ipsum dolor sit amet" />
                <ChatHistoryItem sessionId="20" sessionName="Lorem Ipsum dolor sit amet" />

            </div>
        </div>
    );
}

export default ChatHistory;