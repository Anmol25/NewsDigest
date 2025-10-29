import React from "react";
import ChatHistory from "../../components/ChatComponents/ChatHistory";
import ChatMessages from "../../components/ChatComponents/ChatMessages";
import { useState } from "react";

function Chat(){
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionName, setSessionName] = useState<string | null>(null);

    return (
        <div className="h-full w-full p-5 pt-2.5">
            <div className="flex w-full h-full border-2 rounded-2xl border-[#F0F0F0] p-0 shadow-md bg-[#F0F0F0] overflow-hidden">
                <div className="w-[17.5%] h-full rounded-2xl bg-white shadow-md flex flex-col min-h-0 overflow-hidden">
                    <ChatHistory />
                </div>
                <div className="w-[82.5%] h-full flex flex-col min-h-0 overflow-hidden">
                    <ChatMessages sessionId={sessionId} sessionName={sessionName} />
                </div>
            </div>
        </div>
    );
}

export default Chat;