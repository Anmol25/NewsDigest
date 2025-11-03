import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAxios } from '../../services/AxiosConfig';
import { formatDate, handleSummarize, handleTypingEffect, handleBookmark } from "../../utils/article";
import placeholderImage from '../../assets/placeholder.jpg';
import SharePopup from "../Share/SharePopup";

function Featured(props) {
  const { image, source, title, link, published_date, id, bookmarked } = props;
  const axiosInstance = useAxios();
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  useEffect(() => {
    if (!summary) return;
    return handleTypingEffect(summary, setDisplayText);
  }, [summary]);

  const onSummarize = () => {
    handleSummarize(axiosInstance, id, true, setSummary, setIsSummarizing);
  };
  
  const onBookmark = () => {
    handleBookmark(axiosInstance, id, setIsBookmarked);
  };

  const [dateFormatted, timeFormatted] = formatDate(published_date);

  const ActionIcons = (
    <div className="flex items-center gap-3 h-8">
      {/* AI Button */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 bg-white/20 hover:bg-white/30">
        <button className="flex items-center font-secondaryFont text-xl cursor-pointer">
          AI
        </button>
      </div>
      {/* Bookmark Button */}
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${isBookmarked ? "bg-white/80" : "bg-white/20 hover:bg-white/30"}`} 
        onClick={onBookmark}
      >
        <div className={`${isBookmarked ? "invert" : ""}`}>
          <i className="ri-bookmark-fill"></i>
        </div>
      </div>
      {/* Share Button */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 bg-white/20 hover:bg-white/30" onClick={() => setIsShareOpen(true)}>
        <i className="ri-share-fill"></i>
      </div>
    </div>
  );

  return (
    <div 
      className="relative w-[90%] md:w-[80%] lg:w-[70%] h-64 md:h-72 lg:h-[300px] my-4 mx-auto rounded-2xl bg-center bg-cover bg-no-repeat overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl"
      style={{ backgroundImage: `url(${image || placeholderImage})` }}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/60 to-black/40 flex flex-col p-5 md:p-6 box-border">
        <div className={`flex flex-col h-full w-full text-white ${summary ? 'gap-1' : 'gap-2'} ${!summary && 'justify-end'}`}>
          
          <div className={`flex justify-between items-center ${summary ? 'mb-1' : 'mb-2'}`}>
            <div className="bg-[#ff4757] text-white font-bold py-1 px-3 rounded text-xs tracking-wider">
              TOP STORIES
            </div>
            <NavLink className="text-[#f1f1f1] font-medium text-sm no-underline transition-colors duration-200 hover:text-white hover:underline" to={`/source/${source.toLowerCase().replace(/\s+/g, '-')}`}>
              {source}
            </NavLink>
          </div>
          
          <a 
            className={`block no-underline text-white font-bold my-1 text-shadow-md transition-colors duration-200 hover:text-gray-200 overflow-hidden text-ellipsis ${summary ? 'text-xl leading-tight line-clamp-2' : 'text-2xl leading-snug line-clamp-3'}`}
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {title}
          </a>
          
          {/* Date, Time, and conditionally shown Action Icons */}
          <div className="flex justify-between items-center w-full mb-1.5">
            <div className="flex items-center text-sm text-gray-300">
              <span>{dateFormatted}</span>
              <span className="featured-bullet">•</span>
              <span>{timeFormatted}</span>
            </div>
            {summary && ActionIcons}
          </div>
          
          {/* STATE 1: Before summarizing */}
          {!summary && (
            <div className="flex justify-between items-center">
              <button 
                className="bg-white/90 text-gray-800 border-none py-2 px-4 rounded-full font-semibold text-sm cursor-pointer flex items-center justify-center transition-all duration-300 shadow-md hover:bg-white hover:-translate-y-0.5 disabled:opacity-80 disabled:cursor-not-allowed"
                onClick={onSummarize}
                disabled={isSummarizing}
              >
                {isSummarizing ? (
                  <>
                    <span>Summarizing</span>
                    <span className="w-3 h-3 border-2 border-gray-800/20 border-t-gray-800 rounded-full ml-2 animate-spin"></span>
                  </>
                ) : (
                  'Summarize Article'
                )}
              </button>
              {ActionIcons}
            </div>
          )}
          
          {/* STATE 2: After summarizing */}
          {summary && (
            <div className="bg-white/95 rounded-lg p-3 text-gray-800 shadow-lg overflow-y-auto animate-fade-in scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30 flex-1 min-h-0">
              <p className="text-sm leading-normal m-0 pr-2">
                {displayText}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Share Modal */}
      <SharePopup
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={link}
        title={title}
      />
    </div>
  );
}

Featured.propTypes = {
  image: PropTypes.string,
  source: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  published_date: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  bookmarked: PropTypes.bool,
};

export default Featured;