import "../styles/feed.css";
import News from "./News";


function Feed({topic}){

    const topicfeed = topic;
    
    return (
        <div className="Feed">
            <h1>{topicfeed}</h1>
            <div className="FeedList">
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
                <News image="https://static.toiimg.com/photo/msid-118344813,imgsize-35574.cms" title="BBA student driving Audi crashes into scooty in Delhi; 1 critical"
                link="link" />
            </div>
        </div>
    )
}

export default Feed;