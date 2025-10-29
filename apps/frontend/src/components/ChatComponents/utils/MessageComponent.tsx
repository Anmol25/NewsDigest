import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MessageComponent({ message, sender }: { message: string, sender: 'user' | 'ai' }) {

    return (
        <div>
            {sender === 'ai' && (
                <div className={`p-2.5`}>
                    <ReactMarkdown
                        components={{
                            ul: ({ node, ...props }) => (
                                <ul className="list-disc ml-5" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol className="list-decimal ml-5" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                                <p className="" {...props} />
                            ),
                        }}
                        remarkPlugins={[remarkGfm]}
                    >
                        {message}
                    </ReactMarkdown>
                </div>
            )}
            {sender === 'user' && (
                <div className="bg-basePrimary p-2.5 rounded-md ml-40 shadow-md inline-block">
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
}
export default MessageComponent;

