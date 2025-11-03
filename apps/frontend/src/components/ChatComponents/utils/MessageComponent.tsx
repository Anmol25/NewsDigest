import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MiniArticle from "./MiniArticle";

function MessageComponent({
  message,
  sender,
  message_data,
}: {
  message: string;
  sender: "user" | "ai";
  message_data?: any;
}) {
  return (
    <div>
      {sender === "ai" && (
        <div className={`p-2.5 max-w-full break-words prose`}>
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="inline-block max-w-full no-underline align-middle py-0.5 px-1.5 border text-xs border-[#B9B9B9] bg-[#B9B9B9] rounded-3xl break-all hover:bg-[#989797] hover:border-[#989797] transition-colors shadow-md"
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
      {sender === "user" && (
  // Use flex-column with right alignment so children stack vertically
  // and each child (like the message bubble) keeps its intrinsic size
  <div className="flex flex-col items-end gap-1">
          {message_data?.type === 'article_metadata' && (
            <MiniArticle data={message_data.data} />
          )}
          <div className="bg-basePrimary p-2.5 rounded-md shadow-md inline-block  break-words">
            <span className="whitespace-pre-wrap break-words break-all">
              {message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
export default MessageComponent;
