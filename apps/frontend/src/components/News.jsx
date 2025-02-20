import '../styles/News.css'
import handleFallbackImage from '../services/handlefallback_img';

function News(props){

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


    return(
        <div className="NewsBlock">
            <img className='NewsImage' src={props.image || fallbackImage} alt="News-Image" />
            <p className="NewsTitle">{props.title}</p>
            <div className="NewsInfo">
                {/* Source and time */}
                <p>{props.source || "Unknown"}</p> 
                <p>{published_date(props.time)}</p>
            </div>
            <button className="SummarizeButton">Summarize</button>
        </div>
    )
}

export default News;