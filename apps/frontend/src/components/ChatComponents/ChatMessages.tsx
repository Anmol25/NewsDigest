import { use, useEffect, useRef, useState } from 'react';
import { getRandomAssistantMessage } from './utils/assistantintro';
import MessageBar from './utils/MessageBar';
import QuerySuggest from './utils/QuerySuggest';
import MessageComponent from './utils/MessageComponent';
import { tempChatList } from './utils/messagelist';

function ChatMessages({ sessionId, sessionName }: { sessionId: string | null, sessionName: string | null }) {
    const [new_session, setNewSession] = useState<boolean>(sessionId === null);
    const [introMessage, setIntroMessage] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    console.log("ChatMessages Component - sessionId:", sessionId, "sessionName:", sessionName, "new_session:", new_session);
    // const [chatList, setChatList] = useState<Array<{message: string, sender: 'user' | 'ai'}>>([]);

    const [chatList, setChatList] = useState<Array<{message: string, sender: 'user' | 'ai'}>>(tempChatList);


    useEffect(() => {
        setNewSession(sessionId === null);
    }, [sessionId]);

    useEffect(() => {
        if (new_session) {
            const message = getRandomAssistantMessage();
            setIntroMessage(message);
        }
    }, [new_session]);

    // Always keep the scroll anchored to the bottom for existing sessions.
    useEffect(() => {
        if (new_session) return;
        const el = scrollContainerRef.current;
        if (!el) return;
        // Use rAF to ensure DOM is painted before measuring
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [new_session, chatList]);

    return (
        <div className={`h-full min-h-0 justify-center items-center flex flex-col ${new_session ? "gap-5 " : "gap-0 pt-0 pb-2.5"}`}>
            {new_session && (
                <div className='flex flex-col gap-10 items-center px-25'>
                    <div className='text-brandColor text-center text-3xl font-semibold text-shadow-md'>{introMessage}</div>
                    <QuerySuggest />
                </div>
            )}
            {!new_session && (
                <div
                    ref={scrollContainerRef}
                    className='flex-1 min-h-0 justify-end overflow-y-auto scrollbar-thin scrollbar-thumb-textSecondary scrollbar-thumb-rounded-3xl px-30 gap-3'
                >
                    {chatList.map((chat, index) => (
                        <div
                            key={index}
                            className={`flex mt-5 ${chat.sender === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <MessageComponent key={index} message={chat.message} sender={chat.sender} />
                        </div>
                    ))}
                </div>
            )}
            <div className='w-full px-30'>
                <MessageBar />
            </div>
        </div>
    );
}

export default ChatMessages;
