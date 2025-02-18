import '../styles/News.css'

function News(props){
    return(
        <div className="NewsBlock">
            <img className='NewsImage' src={props.image} alt="News-Image" />
            <p className="NewsTitle">{props.title}</p>
            <div className="NewsInfo">
                <p>Source: {props.source}</p>
                <p>Time: {props.time}</p>
            </div>
            <button className="SummarizeButton">Summarize</button>
        </div>
    )
}

export default News;