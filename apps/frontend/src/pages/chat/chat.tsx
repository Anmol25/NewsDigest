import React, { useEffect } from "react";
import ChatHistory from "../../components/ChatComponents/ChatHistory";
import ChatMessages from "../../components/ChatComponents/ChatMessages";
import { useState } from "react";
import { useParams } from "react-router-dom";

function Chat(){
    const urlSessionId = useParams().sessionId || null;
    const [currSessionId, setcurrSessionId] = useState<string | null>(urlSessionId);
    const [newSession, setNewSession] = useState<boolean>(false);
    const [sessionList, setSessionList] = useState<Array<{sessionId: string, sessionName: string | null}>>([]);

    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }
        // Fallback RFC4122 v4-ish generator
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    useEffect(() => {
        if (!urlSessionId) {
            const newId = generateUUID();
            setcurrSessionId(newId);
            setNewSession(true);
            console.log("Generated new Session ID:", newId);
        } else {
            setcurrSessionId(urlSessionId);
            setNewSession(false);
            console.log("Session ID from URL:", urlSessionId);
        }
    }, [urlSessionId]);

    return (
        <div className="h-full w-full p-5 pt-2.5">
            <div className="flex w-full h-full border-2 rounded-2xl border-[#F0F0F0] p-0 shadow-md bg-[#F0F0F0] overflow-hidden">
                <div className="w-[17.5%] h-full rounded-2xl bg-white shadow-md flex flex-col min-h-0 overflow-hidden">
                    <ChatHistory sessionList={sessionList} setChatList={setSessionList} />
                </div>
                <div className="w-[82.5%] h-full flex flex-col min-h-0 overflow-hidden">
                    {currSessionId && (
                        <ChatMessages
                            key={currSessionId}
                            sessionId={currSessionId}
                            sessionList={sessionList}
                            setSessionList={setSessionList}
                            newSession={newSession}
                            setNewSession={setNewSession}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat;