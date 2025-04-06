import './HistoryComponent.css';
import { useState, useEffect } from 'react';
import handleFallbackImage from '../../services/HandleFallbackImg';
import { useAxios } from '../../services/AxiosConfig';
import heart from '../../assets/Icons/heart.svg';
import bookmarked from '../../assets/Icons/bookmarked.svg';
import trash from '../../assets/Icons/trash.svg'
import { NavLink } from 'react-router-dom';

function HistoryComponent(props) {
  const { image, source, title, link, published_date, id, watched_at, handleDelete } = props;
  const axiosInstance = useAxios();
  const [summary, setSummary] = useState(props.summary || false);
  const [displayText, setDisplayText] = useState(props.summary || '');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State of Like and Bookmark Button
  const [isLiked, setIsLiked] = useState(props.liked);
  const [isBookmarked, setIsBookmarked] = useState(props.bookmarked);
  
  const fallbackImage = handleFallbackImage(source);

  const formatDate = (time) => {
    const date = new Date(time);

    const formattedDate = date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = date.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }).replace(",", "");

    return [formattedDate, `${formattedTime} IST`];
  };

  useEffect(() => {
    if (!summary || props.summary) return; // Skip typing animation if summary is from props

    setIsTyping(true);
    let index = 0;
    const typingSpeed = 5; // milliseconds
    
    const typingInterval = setInterval(() => {
      if (index < summary.length) {
        setDisplayText((prev) => prev + summary.charAt(index));
        index++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [summary, props.summary]);

  const handleSummarize = () => {
    setIsLoading(true);
    setDisplayText('');
    
    axiosInstance.get('/summarize', {
      params: { id , "update_history" : false}
    })
      .then((response) => {
        setSummary(response.data.data);
      })
      .catch((error) => {
        console.error('Error fetching summary:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const [dateFormatted, timeFormatted] = formatDate(published_date);
  const [watchdateFormatted, watchedtimeformatted] = formatDate(watched_at);

  const handleLike = async () => {
    const response = await axiosInstance.post('/like', {
      article_id: props.id
    });

    if (response.status === 200) {
      setIsLiked(!isLiked);
    }
  };
  
  const handleBookmark = async () => {
    const response = await axiosInstance.post('/bookmark', {
      article_id: props.id
    });

    if (response.status === 200) {
      setIsBookmarked(!isBookmarked);
    }
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
              onClick={handleLike}
            />
            <img 
              className={`news-buttons ${isBookmarked ? "black-filter" : ""}`} 
              src={bookmarked} 
              alt="Bookmark" 
              onClick={handleBookmark}
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
            onClick={handleSummarize}
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

export default HistoryComponent;
