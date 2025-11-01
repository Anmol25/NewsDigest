import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MessageComponent({ message, sender }: { message: string, sender: 'user' | 'ai' }) {
    return (
        <div>
            {sender === 'ai' && (
                <div className={`p-2.5 max-w-full break-words`}>
                    <ReactMarkdown
                        components={{
                            ul: ({ node, ...props }) => (
                                <ul className="list-disc ml-5" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol className="list-decimal ml-5" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                                <p className="whitespace-pre-wrap break-words leading-relaxed" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                                <a
                                    {...props}
                                    className="inline-block max-w-full align-middle py-0.5 px-1.5 border text-xs border-[#B9B9B9] bg-[#B9B9B9] rounded-3xl break-all hover:bg-[#989797] hover:border-[#989797] transition-colors shadow-md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                />
                            ),
                        }}
                        remarkPlugins={[remarkGfm]}
                    >
                        {message}
                    </ReactMarkdown>
                </div>
            )}
            {sender === 'user' && (
                <div className="bg-basePrimary p-2.5 rounded-md ml-40 shadow-md inline-block max-w-full break-words">
                    <span className="whitespace-pre-wrap break-words">{message}</span>
                </div>
            )}
        </div>
    );
}
export default MessageComponent;

