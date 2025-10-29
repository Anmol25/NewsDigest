import { useEffect, useState } from 'react';
import { getRandomAssistantMessage } from './utils/assistantintro';
import MessageBar from './utils/MessageBar';
import QuerySuggest from './utils/QuerySuggest';

function ChatMessages({ sessionId, sessionName }: { sessionId: string | null, sessionName: string | null }) {
    const [new_session, setNewSession] = useState<boolean>(sessionId === null);
    const [introMessage, setIntroMessage] = useState<string | null>(null);
    
    useEffect(() => {
        if (new_session) {
            const message = getRandomAssistantMessage();
            setIntroMessage(message);
        }
    }, [new_session]);

    return (
        <div className="h-full px-20 py-2.5 justify-center items-center flex flex-col gap-10">
            <div className='flex flex-col gap-10 items-center'>
                <div className='text-brandColor text-3xl font-semibold text-shadow-md'>{introMessage}</div>
                <QuerySuggest />
            </div>
            <MessageBar />
        </div>
    );
}

export default ChatMessages;
