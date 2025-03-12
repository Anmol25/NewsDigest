import "./Feed.css";
import News from "../NewsComponent/News";
import getFeed from "../../services/API";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAxios } from "../../services/AxiosConfig";

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
    const axiosInstance = useAxios();
    
    const [feed, setFeed] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);

    const loadFeed = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        try {
            const { data: newData, hasMore: moreData } = await getFeed(title, currentPage, axiosInstance);
            setFeed(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
        }
    }, [hasMore, title, axiosInstance]);

    useEffect(() => {
        setFeed([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        loadFeed(1);
    }, [topic]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
                loadFeed(page);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadFeed, page]);

    return (
        <div className="Feed">
            <div className="FeedHeader">
                <img 
                    src={topicImages[topic] || foryou} 
                    alt={title}
                    className="FeedIcon"
                />
                <h1 className="FeedTitle">{title}</h1>
            </div>
            <div className="FeedList">
                {feed.map((item) => <News key={item.id} {...item} />)}
                {hasMore ? <p>Loading...</p> : feed.length ? <p>No more news to load</p> : <p>No news found</p>}
            </div>
        </div>
    );
}

export default Feed;
