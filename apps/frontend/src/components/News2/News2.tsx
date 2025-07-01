import React from "react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

function News2() {
    const [summary,setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

    const handleSummarize = () => {
        setIsSummarizing(true);
        // Simulate an API call to get the summary
        setTimeout(() => {
            const simulatedSummary = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam lacinia erat eget fringilla volutpat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed ut porttitor orci, ac posuere nunc. Integer ultrices, massa sed eleifend auctor, ante risus lobortis quam, sit amet posuere lacus elit molestie mi. Vivamus laoreet sem quis eleifend accumsan. Fusce non ipsum convallis, ullamcorper nibh eget, interdum enim. Nunc sit amet ullamcorper risus. Vivamus fermentum diam sem, eget sodales ante lacinia quis. Ut egestas orci urna, vel pretium turpis ornare ut. Donec ut consequat erat. Integer eros velit, suscipit a imperdiet non."
            setSummary(simulatedSummary);
        }, 2000);
    };


  return (
    <div className="p-5">
        <div className="flex flex-col w-[300px] h-[300px] shadow-md rounded-3xl">
            {!summary && <img src="https://images.pexels.com/photos/3476860/pexels-photo-3476860.jpeg" className="w-[300px] h-[170px] object-cover mask-gradient rounded-t-3xl"/>}
            <div className="flex flex-col flex-grow justify-between px-2.5 pt-1.25 pb-2.5">
                <div className="text-textMedium line-clamp-2 font-semibold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing.
                </div>
                <div className="flex flex-row items-center justify-between">
                    <NavLink to="/channels" className="text-textMediumSmall text-textSecondary font-semibold border border-borderPrimary shadow-md rounded-3xl px-1.25 hover:bg-borderPrimary hover:text-basePrimary  transition duration-300 ease-in-out">
                        Source
                    </NavLink>
                    <div className="text-textMediumSmall text-textSecondary font-semibold">
                        10 days ago
                    </div>
                </div>
                {summary && 
                <div className="flex flex-grow bg-baseSecondary my-1 px-2 py-1 rounded-xl text-textMediumSmall overflow-y-auto h-40">
                    {summary}
                </div>}
                <div className={!summary ? "flex flex-row justify-between items-center h-[40px]" : "flex flex-row justify-end gap-5 items-center h-[40px]"}>
                    <button className="flex items-center font-secondaryFont text-2xl cursor-pointer ">
                        AI
                    </button>
                    <div className="text-2xl cursor-pointer">
                        <i className="ri-bookmark-line"></i>
                    </div>
                    <div className="text-2xl cursor-pointer">
                        <i className="ri-share-line"></i>
                    </div>
                    {!summary && 
                    <button
                    onClick={handleSummarize}
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
    </div>
  );
}

export default News2;