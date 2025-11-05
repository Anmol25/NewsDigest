import React from "react";

type ArticleMeta = {
  id?: number | string;
  title?: string;
  link?: string;
  image?: string;
  source?: string;
  published_date?: string;
};

function MiniArticle({ data }: { data: ArticleMeta }) {
  if (!data) return null;
  const { title, link, image, source, published_date } = data;
  return (
    <div className="w-full max-w-[560px] border border-[#E5E5E5] bg-white rounded-xl overflow-hidden shadow-sm mb-2">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex no-underline text-inherit"
      >
        {image && (
          <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-[#F5F5F5]">
            <img src={image} alt={title || "article"} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 p-2.5 min-w-0">
          <div className="text-xs text-textSecondary truncate">
            {source}
            {published_date ? (
              <>
                <span className="mx-1">•</span>
                <span>
                  {new Date(published_date).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </>
            ) : null}
          </div>
          <div className="text-sm font-medium text-textPrimary line-clamp-2">
            {title}
          </div>
        </div>
      </a>
    </div>
  );
}

export default MiniArticle;
