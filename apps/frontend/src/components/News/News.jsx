import './News.css';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useAxios } from '../../services/AxiosConfig';
import handleFallbackImage from '../../services/HandleFallbackImg';
import heart from '../../assets/Icons/heart.svg';
import bookmarked from '../../assets/Icons/bookmarked.svg';
import { NavLink } from 'react-router-dom';
import { formatDate, handleTypingEffect, handleSummarize, handleLike, handleBookmark } from '../../utils/articleUtils';

function News(props) {
  const { image, source, title, link, published_date, id } = props;
  const axiosInstance = useAxios();
  const [summary, setSummary] = useState(null);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(props.liked);
  const [isBookmarked, setIsBookmarked] = useState(props.bookmarked);
  const [showSummary, setShowSummary] = useState(false);
  const [imageHiding, setImageHiding] = useState(false);
  const [buttonHiding, setButtonHiding] = useState(false);
  
  const fallbackImage = handleFallbackImage(source);

  useEffect(() => {
    if (!summary || props.summary) return;
    return handleTypingEffect(summary, setDisplayText, setIsTyping);
  }, [summary, props.summary]);

  // Handle the transition sequence when summary is generated
  useEffect(() => {
    if (summary && !showSummary) {
      // Start hiding image and button
      setImageHiding(true);
      setButtonHiding(true);
      
      // Show summary container after a delay to allow image/button to fade
      const timer = setTimeout(() => {
        setShowSummary(true);
      }, 300); // Half of the transition duration
      
      return () => clearTimeout(timer);
    }
  }, [summary, showSummary]);

  const onSummarize = () => {
    handleSummarize(axiosInstance, id, true, setIsLoading, setDisplayText, setSummary);
  };

  const [dateFormatted, timeFormatted] = formatDate(published_date);

  const onLike = () => {
    handleLike(axiosInstance, id, setIsLiked);
  };
  
  const onBookmark = () => {
    handleBookmark(axiosInstance, id, setIsBookmarked);
  };

  return (
    <div className="NewsBlock">
      {!showSummary && (
        <img 
          className={`NewsImage ${imageHiding ? 'hide' : ''}`}
          src={image || fallbackImage} 
          alt={title} 
          onError={(e) => e.target.src = fallbackImage}
        />
      )}
      
      <div className="NewsContent">
        <a className="NewsTitle" href={link} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
        
        <div className="NewsInfo">
          <p className="NewsMetaData">{dateFormatted}</p>
          <p className="NewsMetaData">{timeFormatted}</p>
        </div>
        
        <div className="NewsInfo">
          <div className="source-follow">
            <NavLink className="source" to={`/source/${source.toLowerCase().replace(/\s+/g, '-')}`}>
              {source}
            </NavLink>
          </div>
          
          <div>
            <img className={`news-buttons ${isLiked ? "black-filter" : ""}`} src={heart} alt="Like" onClick={onLike}/>
            <img className={`news-buttons ${isBookmarked ? "black-filter" : ""}`} src={bookmarked} alt="Bookmark" onClick={onBookmark}/>
          </div>
        </div>
        
        {showSummary && (
          <div className="NewsSummaryContainer">
            <p className={`NewsSummary ${isTyping ? 'typing' : ''}`}>
              {displayText}
            </p>
          </div>
        )}
      </div>
      
      {!showSummary && (
        <button 
          className={`SummarizeButton ${isLoading ? 'loading' : ''} ${buttonHiding ? 'hide' : ''}`}
          onClick={onSummarize}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              Summarizing
              <span className="spinner" />
            </>
          ) : (
            'Summarize'
          )}
        </button>
      )}
    </div>
  );
}

News.propTypes = {
  image: PropTypes.string,
  source: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  published_date: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  liked: PropTypes.bool,
  bookmarked: PropTypes.bool,
  summary: PropTypes.string
};

export default News;