import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  HighlightsContent: string;
  query: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  isComplete?: boolean;
};

function Highlights({
  HighlightsContent,
  query,
  isLoading = false,
}: Props) {
  // split into paragraphs (double-newline separated) so we can animate each chunk
  const paragraphs = HighlightsContent
    ? HighlightsContent.split(/\n{2,}/).filter((p) => p.trim() !== "")
    : [];

  // timing config (ms)
  const stagger = 40; // ms between paragraph starts

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Inline micro styles for animations and skeleton shimmer */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* skeleton shimmer */
        .skeleton {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, rgba(230,230,230,1) 0%, rgba(245,245,245,1) 50%, rgba(230,230,230,1) 100%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.2s linear infinite;
        }
        @keyframes skeletonShimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }

        /* subtle card look for skeleton */
        .skeleton-card {
          border-radius: 12px;
          box-shadow: 0 6px 18px rgba(18,24,38,0.06), inset 0 -1px 0 rgba(255,255,255,0.02);
        }
      `}</style>

      <div className="w-full h-full scrollbar-thin overflow-y-auto p-2.5">
        <div className="text-textBig text-textPrimary rounded-t-3xl px-2.5 py-1.25 font-semibold">
          AI Highlights
        </div>

        <div className="px-2.5 py-3">
          {/* Fancier skeleton card while waiting for first chunk */}
          {isLoading && !HighlightsContent ? (
            <div className="space-y-4">
              <div className="skeleton skeleton-card p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-3 rounded-full w-3/4 mb-3 bg-gray-200" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-3 rounded bg-gray-200" />
                      <div className="h-3 rounded bg-gray-200" />
                      <div className="h-3 rounded bg-gray-200" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="skeleton skeleton-card p-3">
                <div className="h-3 rounded w-5/6 mb-3" />
                <div className="h-3 rounded w-4/6 mb-3" />
                <div className="h-3 rounded w-2/6" />
              </div>

              <div className="text-sm text-gray-600">Generating highlights…</div>
            </div>
          ) : (
            <div>
              {paragraphs.length === 0 && !isLoading ? (
                <div className="text-sm text-gray-500">No highlights available.</div>
              ) : (
                <div className="space-y-3">
                  {paragraphs.map((p, idx) => {
                    // for each paragraph: only fadeInUp with a small stagger
                    const startDelay = idx * stagger;
                    const animation = `fadeInUp 220ms ease ${startDelay}ms both`;

                    return (
                      <div
                        key={idx}
                        style={{ animation }}
                        aria-live="off"
                        className="select-text"
                      >
                        <ReactMarkdown
                          components={{
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc ml-5" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol className="list-decimal ml-5" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                              <p className="text-sm leading-6 text-textSecondary" {...props} />
                            ),
                          }}
                          remarkPlugins={[remarkGfm]}
                        >
                          {p}
                        </ReactMarkdown>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Highlights;
