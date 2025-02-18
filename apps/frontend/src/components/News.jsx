import '../styles/News.css'

function News(props){
    return(
        <div className="NewsBlock">
            <img  src={props.image} alt="News-Image" />
            <p>Title: {props.title}</p>
            <div>
                <p>Source: {props.link}</p>
                <p>Time: {props.time}</p>
            </div>
            <button>Summarize</button>
        </div>
    )
}

export default News;