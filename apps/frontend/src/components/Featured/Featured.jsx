import './Featured.css';
import { useState, useEffect } from 'react';
import handleFallbackImage from '../../services/HandleFallbackImg';
import { useAxios } from '../../services/AxiosConfig';
import heart from '../../assets/Icons/heart.svg';
import bookmarked from '../../assets/Icons/bookmarked.svg';
import { NavLink } from 'react-router-dom';

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
    if (!summary) return;

    setIsTyping(true);
    let index = 0;
    const typingSpeed = 5;
    
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
  }, [summary]);

  const handleSummarize = () => {
    setIsLoading(true);
    setDisplayText('');
    
    axiosInstance.get('/summarize', {
      params: { id }
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
                <div className={`featured-btn-icon ${isLiked ? "active" : ""}`} onClick={handleLike}>
                  <img src={heart} alt="Like" />
                </div>
                <div className={`featured-btn-icon ${isBookmarked ? "active" : ""}`} onClick={handleBookmark}>
                  <img src={bookmarked} alt="Bookmark" />
                </div>
              </div>
            )}
          </div>
          
          {!summary && (
            <div className="featured-actions">
              <button 
                className={`featured-summarize-btn ${isLoading ? 'loading' : ''}`}
                onClick={handleSummarize}
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
                <div className={`featured-btn-icon ${isLiked ? "active" : ""}`} onClick={handleLike}>
                  <img src={heart} alt="Like" />
                </div>
                <div className={`featured-btn-icon ${isBookmarked ? "active" : ""}`} onClick={handleBookmark}>
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

export default Featured;
