import { useCallback } from "react";
import { useParams } from "react-router-dom";
import NewsLoader from "../../components/NewsLoader/NewsLoader";

// Import images
import foryou from "../../assets/navbarbuttons/for-you.png";
import topstories from "../../assets/navbarbuttons/top-stories.png";
import latest from "../../assets/navbarbuttons/latest.png";
import india from "../../assets/navbarbuttons/india.png";
import world from "../../assets/navbarbuttons/world.png";
import economy from "../../assets/navbarbuttons/economy.png";
import science from "../../assets/navbarbuttons/science.png";
import tech from "../../assets/navbarbuttons/tech.png";
import sports from "../../assets/navbarbuttons/sports.png";
import entertainment from "../../assets/navbarbuttons/entertainment.png";

const formatTitle = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const topicImages = {
    'for-you': foryou,
    'top-stories': topstories,
    'latest': latest,
    'india': india,
    'world': world,
    'economy': economy,
    'science': science,
    'tech': tech,
    'sports': sports,
    'entertainment': entertainment
};

function Feed() {
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
                    src={topicImages[topic] || foryou} 
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
