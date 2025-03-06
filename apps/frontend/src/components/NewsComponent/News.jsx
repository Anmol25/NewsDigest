import './News.css'
import handleFallbackImage from '../../services/HandleFallbackImg';
import { useAxios } from '../../services/AxiosConfig';
import { useState, useEffect } from 'react';

function News(props){
    const axiosInstance = useAxios();
    const [summary, setSummary] = useState(null);
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    const published_date = (time) => {
        const date = new Date(time);
    
        const formattedDate = date.toLocaleString("en-IN", {
            weekday: "short",  // Thu
            day: "2-digit",    // 20
            month: "short",    // Feb
            year: "numeric",   // 2025
            hour: "2-digit",   // 2
            minute: "2-digit", // 30    
            hour12: true,      // 12-hour format
            timeZone: "Asia/Kolkata" // Ensure IST
        }).replace(",", ""); // Remove unwanted comma
    
        return `${formattedDate} IST`;
    };

    const fallbackImage = handleFallbackImage(props.source);

    useEffect(() => {
        if (summary) {
            setIsTyping(true);
            let index = 0;
            const typingInterval = setInterval(() => {
                if (index < summary.length) {
                    setDisplayText((prev) => prev + summary.charAt(index));
                    index++;
                } else {
                    clearInterval(typingInterval);
                    setIsTyping(false);
                }
            }, 5); // Adjust speed by changing this value (milliseconds)

            return () => clearInterval(typingInterval);
        }
    }, [summary]);

    function handleSummarize(){
        setIsLoading(true);
        setDisplayText('');
        axiosInstance.get('/summarize', {
            params:{
                id : props.id
        }}).then((response) => {
            setSummary(response.data.data);
        }).catch((error) => {
            console.error('Error fetching summary:', error);
        }).finally(() => {
            setIsLoading(false);
        });
    }

    return(
        <div className="NewsBlock">
            {!summary && <img className='NewsImage' src={props.image || fallbackImage} alt="News-Image" />}
            <div className="NewsContent">
                <a className="NewsTitle" href={props.link} target="_blank" rel="noopener noreferrer">{props.title}</a>
                <div className="NewsInfo">
                    {/* Source and time */}
                    <p>{props.source || "Unknown"}</p> 
                    <p>{published_date(props.published_date)}</p>
                </div>
                {summary && <div className='NewsSummaryContainer'>
                    
                    <p className={`NewsSummary ${isTyping ? 'typing' : ''}`}>
                        {displayText}
                    </p>
                </div>}  
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
    )
}

export default News;