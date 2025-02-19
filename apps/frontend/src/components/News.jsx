import '../styles/News.css'

function News(props){

    const published_date = (time) => {
        const date = new Date(time);

        const formattedTime = date.toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata" // Ensure it's in IST
        });


        return formattedTime;
    }


    return(
        <div className="NewsBlock">
            <img className='NewsImage' src={props.image} alt="News-Image" />
            <p className="NewsTitle">{props.title}</p>
            <div className="NewsInfo">
                {/* Source and time */}
                <p>{props.source}</p> 
                <p>{published_date(props.time)}</p>
            </div>
            <button className="SummarizeButton">Summarize</button>
        </div>
    )
}

export default News;