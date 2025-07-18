import React from "react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAxios } from '../../services/AxiosConfig';
import placeholderImage from '../../assets/placeholder.jpg';
import { getRelativeTime, handleSummarize, handleTypingEffect, handleBookmark } from "../../utils/article";

interface News2Props {
    id: number;
    title: string;
    link: string;
    published_date: string;
    image: string;
    source: string;
    bookmaked?: boolean;
}

function News(props: News2Props) {
    const { id, title, link, published_date, image, source, bookmaked } = props;
    const axiosInstance = useAxios();
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(bookmaked || false);

    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (!summary) return;
        return handleTypingEffect(summary, setDisplayText);
      }, [summary]);

    const onSummarize = () => {
        handleSummarize(axiosInstance, id, true,setSummary, setIsSummarizing);
    };

    const onBookmark = () => {
        handleBookmark(axiosInstance, id, setIsBookmarked);
    };

    return (
        <div className="flex flex-col aspect-square min-h-[315px] min-w-[315px] shadow-md rounded-3xl hover:scale-105 transition duration-300 ease-in-out hover:shadow-lg">
            {!summary && <img src={image || placeholderImage} className="h-[60%] object-cover mask-gradient rounded-t-3xl" />}
            <div className="flex flex-col justify-between flex-1 px-2.5 pt-1.25 pb-2.5">
                <a href={link} className="text-textMedium line-clamp-2  font-semibold hover:text-textSecondary transition duration-300 ease-in-out" target="_blank" rel="noopener noreferrer">
                    {title}
                </a>
                <div className="flex flex-row items-center justify-between">
                    <NavLink to={`/source/${source.toLowerCase().replace(/\s+/g, '-')}`} className="text-textMediumSmall text-textSecondary font-medium border border-borderPrimary 
                        shadow-md rounded-3xl px-1.25 hover:bg-borderPrimary hover:text-basePrimary  transition duration-300 ease-in-out">
                        {source}
                    </NavLink>
                    <div className="text-textMediumSmall text-textSecondary font-medium">
                        {getRelativeTime(published_date)}
                    </div>
                </div>
                {summary &&
                    <div className="flex flex-grow bg-baseSecondary my-1 px-2 py-1 rounded-xl text-textMediumSmall overflow-y-auto h-40 scrollbar scrollbar-track-transparent scrollbar-thumb-borderPrimary">
                        {displayText}
                    </div>}
                <div className={!summary ? "flex flex-row justify-between items-center h-[40px]" : "flex flex-row justify-end gap-5 items-center h-[40px]"}>
                    <button className="flex items-center font-secondaryFont text-2xl cursor-pointer ">
                        AI
                    </button>
                    <div className="text-2xl cursor-pointer" onClick={onBookmark}>
                        <i className={isBookmarked ? "ri-bookmark-fill" : "ri-bookmark-line"}></i>
                    </div>
                    <div className="text-2xl cursor-pointer">
                        <i className="ri-share-line"></i>
                    </div>
                    {!summary &&
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
                                'Summarize'
                            )}
                        </button>}
                </div>
            </div>
        </div>
    );
}

export default News;