import './Featured.css';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useAxios } from '../../services/AxiosConfig';
import handleFallbackImage from '../../services/HandleFallbackImg';
import heart from '../../assets/Icons/heart.svg';
import bookmarked from '../../assets/Icons/bookmarked.svg';
import { NavLink } from 'react-router-dom';
import { formatDate, handleTypingEffect, handleSummarize, handleLike, handleBookmark } from '../../utils/articleUtils';

function Featured(props) {
  const { image, source, title, link, published_date, id } = props;
  const axiosInstance = useAxios();
  const [summary, setSummary] = useState(null);
  const [displayText, setDisplayText] = useState('');
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
    <div className="featured-container" style={{ backgroundImage: `url(${image || fallbackImage})` }}>
      <div className="featured-overlay">
        <div className={`featured-content ${summary ? 'has-summary' : ''}`}>
          <div className="featured-meta">
            <div className="featured-badge">TOP STORIES</div>
            <div className="featured-source-container">
              <NavLink className="featured-source" to={`/source/${source.toLowerCase().replace(/\s+/g, '-')}`}>
                {source}
              </NavLink>
            </div>
          </div>
          
          <a className="featured-title" href={link} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
          
          <div className="featured-date-actions-row">
            <div className="featured-date-time">
              <span>{dateFormatted}</span>
              <span className="featured-bullet">•</span>
              <span>{timeFormatted}</span>
            </div>
            
            {summary && (
              <div className="featured-buttons">
                <div className={`featured-btn-icon ${isLiked ? "active" : ""}`} onClick={onLike}>
                  <img src={heart} alt="Like" />
                </div>
                <div className={`featured-btn-icon ${isBookmarked ? "active" : ""}`} onClick={onBookmark}>
                  <img src={bookmarked} alt="Bookmark" />
                </div>
              </div>
            )}
          </div>
          
          {!summary && (
            <div className="featured-actions">
              <button 
                className={`featured-summarize-btn ${isLoading ? 'loading' : ''}`}
                onClick={onSummarize}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span>Summarizing</span>
                    <span className="featured-spinner"></span>
                  </>
                ) : (
                  'Summarize Article'
                )}
              </button>
              
              <div className="featured-buttons">
                <div className={`featured-btn-icon ${isLiked ? "active" : ""}`} onClick={onLike}>
                  <img src={heart} alt="Like" />
                </div>
                <div className={`featured-btn-icon ${isBookmarked ? "active" : ""}`} onClick={onBookmark}>
                  <img src={bookmarked} alt="Bookmark" />
                </div>
              </div>
            </div>
          )}
          
          {summary && (
            <div className="featured-summary-container">
              <p className={`featured-summary ${isTyping ? 'typing' : ''}`}>
                {displayText}
              </p>
            </div>
          )}
        </div>
      </div>
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
  liked: PropTypes.bool,
  bookmarked: PropTypes.bool,
  summary: PropTypes.string
};

export default Featured;
