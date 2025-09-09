import React from "react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAxios } from "../../services/AxiosConfig";
import placeholderImage from "../../assets/placeholder.jpg";
import {
  getRelativeTime,
  handleSummarize,
  handleTypingEffect,
  handleBookmark,
} from "../../utils/article";

interface News2Props {
  id: number;
  title: string;
  link: string;
  published_date: string;
  image: string;
  source: string;
  summary: string;
  watched_at: string;
  bookmarked?: boolean;
  handleDelete: (id: number) => void;
}

function HistoryComponent(props: News2Props) {
  const {
    image,
    source,
    title,
    link,
    published_date,
    id,
    summary,
    watched_at,
    bookmarked,
    handleDelete,
  } = props;
  const axiosInstance = useAxios();
  const [article_summary, setSummary] = useState<string | null>(summary);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    bookmarked || false
  );

  const onSummarize = () => {
    handleSummarize(axiosInstance, id, true, setSummary, setIsSummarizing);
  };

  const onBookmark = () => {
    handleBookmark(axiosInstance, id, setIsBookmarked);
  };

  return (
    <div className="grid grid-cols-[2.5fr_7.5fr] h-50 rounded-3xl shadow-md overflow-hidden">
      <div className="h-full">
        <img
          className=" h-full object-cover"
          src={image || placeholderImage}
          alt={title}
        />
      </div>

      <div className="flex flex-col px-2.5 py-1.25 gap-1 h-50">
        <a
          href={link}
          className="text-textMedium line-clamp-2  font-semibold hover:text-textSecondary transition duration-300 ease-in-out"
          target="_blank"
          rel="noopener noreferrer"
        >
          {title}
        </a>
        <div className="flex flex-row items-center justify-between">
          <NavLink
            to={`/source/${source.toLowerCase().replace(/\s+/g, "-")}`}
            className="text-textMediumSmall text-textSecondary font-medium border border-borderPrimary 
                        shadow-md rounded-3xl px-1.25 hover:bg-borderPrimary hover:text-basePrimary  transition duration-300 ease-in-out"
          >
            {source}
          </NavLink>
          <div className="text-textMediumSmall text-textSecondary font-medium">
            {getRelativeTime(published_date)}
          </div>
        </div>
        <div
          className={`flex-grow bg-baseSecondary my-1 px-2 py-1 rounded-xl text-textMediumSmall overflow-y-auto scrollbar scrollbar-track-transparent scrollbar-thumb-borderPrimary min-h-0`}
        >
          {article_summary
            ? article_summary
            : "Summary not available. Generate using the button below."}
        </div>

        <div className="flex flex-row justify-between items-center">
          <div className="text-textMediumSmall font-medium text-textSecondary">
            {getRelativeTime(watched_at)}
          </div>
          <div
            className={"flex flex-row justify-end gap-5 items-center h-[40px]"}
          >
            {/*Delete Button*/}
            <button
              className="group text-2xl cursor-pointer transition duration-300 ease-in-out relative inline-block"
              onClick={() => handleDelete(id)}
            >
              {/* Outline icon (default) */}
              <i className="ri-delete-bin-line transition-opacity duration-300 ease-in-out group-hover:opacity-0"></i>

              {/* Filled icon (on hover) */}
              <i className="ri-delete-bin-fill absolute top-0 left-0 transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100"></i>
            </button>

            <button className="flex items-center font-secondaryFont text-2xl cursor-pointer ">
              AI
            </button>
            <div className="text-2xl cursor-pointer" onClick={onBookmark}>
              <i
                className={
                  isBookmarked ? "ri-bookmark-fill" : "ri-bookmark-line"
                }
              ></i>
            </div>
            <div className="text-2xl cursor-pointer">
              <i className="ri-share-line"></i>
            </div>
            {!article_summary && (
              <button
                onClick={onSummarize}
                className="flex items-center justify-center cursor-pointer text-basePrimary bg-brandColor text-textMedium font-semibold w-[160px] h-[40px] rounded-3xl shadow-md transition duration-300 ease-in-out hover:bg-[#3C3C3C]"
              >
                {isSummarizing ? (
                  <span className="flex flex-row items-center space-x-2">
                    <span>Summarizing</span>
                    <span className="text-2xl animate-spin">
                      <i className="ri-loader-4-line"></i>
                    </span>
                  </span>
                ) : (
                  "Summarize"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryComponent;
