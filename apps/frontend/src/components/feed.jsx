import "../styles/feed.css";
import News from "./News";
import getFeed from "../services/api";
import { useEffect, useState } from "react";

function Feed({topic}){

    const [feed, setFeed] = useState([]);

    useEffect(() => {
        getFeed(topic).then(data => setFeed(data));
    }, [topic]);

    
    
    return (
        <div className="Feed">
            <h1 className="FeedTitle">{topic}</h1>
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