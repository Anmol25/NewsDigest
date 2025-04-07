import './HistoryComponent.css';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useAxios } from '../../services/AxiosConfig';
import handleFallbackImage from '../../services/HandleFallbackImg';
import heart from '../../assets/Icons/heart.svg';
import bookmarked from '../../assets/Icons/bookmarked.svg';
import trash from '../../assets/Icons/trash.svg';
import { NavLink } from 'react-router-dom';
import { formatDate, handleTypingEffect, handleSummarize, handleLike, handleBookmark } from '../../utils/articleUtils';

function HistoryComponent(props) {
  const { image, source, title, link, published_date, id, watched_at, handleDelete } = props;
  const axiosInstance = useAxios();
  const [summary, setSummary] = useState(props.summary || false);
  const [displayText, setDisplayText] = useState(props.summary || '');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(props.liked);
  const [isBookmarked, setIsBookmarked] = useState(props.bookmarked);
  
  const fallbackImage = handleFallbackImage(source);

  useEffect(() => {
    if (!summary || props.summary) return;
    return handleTypingEffect(summary, setDisplayText, setIsTyping);
  }, [summary, props.summary]);

  const onSummarize = () => {
    handleSummarize(axiosInstance, id, false, setIsLoading, setDisplayText, setSummary);
  };

  const [dateFormatted, timeFormatted] = formatDate(published_date);
  const [watchdateFormatted, watchedtimeformatted] = formatDate(watched_at);

  const onLike = () => {
    handleLike(axiosInstance, id, setIsLiked);
  };
  
  const onBookmark = () => {
    handleBookmark(axiosInstance, id, setIsBookmarked);
  };

  return (
    <div className="HistoryBlock">
      <img 
        className="HistImage" 
        src={image || fallbackImage} 
        alt={title} 
        onError={(e) => e.target.src = fallbackImage}
      />
      <div className='HistContent'>
        <a className="HistTitle" href={link} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
        <div className="HistInfo">
          <p className="HistMetaData">{dateFormatted}</p>
          <p className="HistMetaData">{timeFormatted}</p>
        </div>
        <div className="HistInfo">
          <div className="source-follow">
            <NavLink className="source" id="histsource" to={`/source/${source.toLowerCase().replace(/\s+/g, '-')}`}>
              {source}
            </NavLink>
          </div>
          <div>
            <img 
              className={`news-buttons ${isLiked ? "black-filter" : ""}`} 
              src={heart} 
              alt="Like" 
              onClick={onLike}
            />
            <img 
              className={`news-buttons ${isBookmarked ? "black-filter" : ""}`} 
              src={bookmarked} 
              alt="Bookmark" 
              onClick={onBookmark}
            />
          </div>
        </div>
        {summary && (
          <div className="HistSummaryContainer">
            <p className={`HistSummary ${isTyping ? 'typing' : ''}`}>
              {displayText}
            </p>
          </div>
        )}
        {!summary && (
          <button 
            className={`HistSummarizeButton ${isLoading ? 'loading' : ''}`}
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
      <div className='HistDelete'>
        <p>Read At</p>
        <div className="watched-time-container">
          <div className="watched-time-value">{watchdateFormatted}</div>
          <div className="watched-time-value">{watchedtimeformatted}</div>
        </div>
        <button className="delete-button" aria-label="Delete history item" onClick={() => handleDelete(id)}>
          <img src={trash} alt="Delete" />
        </button>
      </div>
    </div>
  );
}

HistoryComponent.propTypes = {
  image: PropTypes.string,
  source: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  published_date: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  liked: PropTypes.bool,
  bookmarked: PropTypes.bool,
  summary: PropTypes.string,
  watched_at: PropTypes.string.isRequired,
  handleDelete: PropTypes.func.isRequired
};

export default HistoryComponent;
