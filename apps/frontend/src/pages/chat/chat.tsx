import React, { useEffect } from "react";
import ChatHistory from "../../components/ChatComponents/ChatHistory";
import ChatMessages from "../../components/ChatComponents/ChatMessages";
import { useState } from "react";
import { useParams } from "react-router-dom";

function Chat(){
    const urlSessionId = useParams().sessionId || null;
    const [currSessionId, setcurrSessionId] = useState<string | null>(urlSessionId);
    const [sessionList, setSessionList] = useState<Array<{sessionId: string, sessionName: string}>>([]);

    useEffect(() => {
        setcurrSessionId(urlSessionId);
        console.log("Session ID from URL:", urlSessionId);
    }, [urlSessionId]);

    return (
        <div className="h-full w-full p-5 pt-2.5">
            <div className="flex w-full h-full border-2 rounded-2xl border-[#F0F0F0] p-0 shadow-md bg-[#F0F0F0] overflow-hidden">
                <div className="w-[17.5%] h-full rounded-2xl bg-white shadow-md flex flex-col min-h-0 overflow-hidden">
                    <ChatHistory />
                </div>
                <div className="w-[82.5%] h-full flex flex-col min-h-0 overflow-hidden">
                    <ChatMessages sessionId={currSessionId} sessionName={sessionList.find(chat => chat.sessionId === currSessionId)?.sessionName || null} />
                </div>
            </div>
        </div>
    );
}

export default Chat;