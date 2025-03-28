import { useCallback } from "react";
import { useParams } from "react-router-dom";
import NewsLoader from "../../components/NewsLoader/NewsLoader";
import { TOPICS_LIST } from "../../constants/TOPICS_LIST";

const formatTitle = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function Feed() {
    const topicImages = TOPICS_LIST.filter(topic => !["Home"].includes(topic.name));
    const { topic } = useParams();
    const title = formatTitle(topic);

    const url = useCallback(() => {
        if (topic === "for-you") return "/foryou";
        else return `/feed/${title}`;
    }, [topic, title]);

    return (
        <div className="MainPageContainer">
            <div className="MainHeadings">
                <img 
                    src={topicImages.find(t => t.name === title)?.icon} 
                    alt={title}
                    className="MainHeadingIcon"
                />
                <h1 className="MainHeadingTitle">{title}</h1>
            </div>
            <NewsLoader 
                key={topic} 
                url={url()} 
            />
        </div>
    );
}

export default Feed;
