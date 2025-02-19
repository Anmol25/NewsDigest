import "../styles/feed.css";
import News from "./News";
import getFeed from "../services/api";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


function formatTitle(str) {
    return str
        .split('-') // Split by hyphen
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
        .join(' '); // Join words with space
}

function Feed(){
    const { topic } = useParams();
    const title = formatTitle(topic);

    const [feed, setFeed] = useState([]);

    useEffect(() => {
        getFeed(title).then(data => setFeed(data));
    }, [topic]);

    return (
        <div className="Feed">
            <h1 className="FeedTitle">{title}</h1>
            <div className="FeedList">
                {feed.map((item, index) => (
                    <News key={index} image={item.image} title={item.title} source={item.source} time={item.published_date} />
                ))}
                {feed.length === 0 && (
                    <p>No news found</p>
                )}
            </div>
        </div>
    )
}

export default Feed;