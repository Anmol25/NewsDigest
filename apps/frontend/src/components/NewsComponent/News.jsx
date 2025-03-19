import './News.css';
import { useState, useEffect } from 'react';
import handleFallbackImage from '../../services/HandleFallbackImg';
import { useAxios } from '../../services/AxiosConfig';
import heart from '../../assets/heart.svg';
import bookmarked from '../../assets/bookmarked.svg';
import follow from '../../assets/plus.svg';

function News(props) {
  const { image, source, title, link, published_date, id } = props;
  const axiosInstance = useAxios();
  const [summary, setSummary] = useState(null);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State of Like and Bookmark Button
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
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

  // Like Button
  useEffect(() => {
    console.log(isLiked);
  }, [isLiked]);

  
  // Bookmark Button
  useEffect(() => {
    console.log(isBookmarked);
  }, [isBookmarked]);

  return (
    <div className="NewsBlock">
      {!summary && <img className="NewsImage" src={image || fallbackImage} alt={title} />}
      
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
            <p className="source">{source || "Unknown"}</p>
            {/* <img className="follow-button" src={follow} alt="Follow" /> */}
          </div>
          
          <div>
            <img className={`news-buttons ${isLiked ? "black-filter" : ""}`} src={heart} alt="Like" onClick={() => setIsLiked(!isLiked)}/>
            <img className={`news-buttons ${isBookmarked ? "black-filter" : ""}`} src={bookmarked} alt="Bookmark" onClick={() => setIsBookmarked(!isBookmarked)}/>
          </div>
        </div>
        
        {summary && (
          <div className="NewsSummaryContainer">
            <p className={`NewsSummary ${isTyping ? 'typing' : ''}`}>
              {displayText}
            </p>
          </div>
        )}
      </div>
      
      {!summary && (
        <button 
          className={`SummarizeButton ${isLoading ? 'loading' : ''}`}
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
  );
}

export default News;