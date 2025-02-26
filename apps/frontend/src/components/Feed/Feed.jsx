import "./Feed.css";
import News from "../NewsComponent/News";
import getFeed from "../../services/API";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAxios } from "../../services/AxiosConfig";

function formatTitle(str) {
    return str
        .split('-') // Split by hyphen
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
        .join(' '); // Join words with space
}

function Feed() {
    const { topic } = useParams();
    const title = formatTitle(topic);
    const axiosInstance = useAxios();
    // States
    const [feed, setFeed] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // Load feed data
    const loadFeed = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const { data: newData, hasMore: moreData } = await getFeed(title, page, axiosInstance);
            
            if (!newData.length) {
                setHasMore(false);
            } else {
                setFeed(prev => [...prev, ...newData]);
                setPage(prev => prev + 1);
                setHasMore(moreData);
            }
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, title, axiosInstance]);

    // Combined effect for topic changes and initial load
    useEffect(() => {
        setFeed([]);
        setPage(1);
        setHasMore(true);
        setLoading(false);
        
        // Use setTimeout to ensure state updates are processed
        const timeoutId = setTimeout(() => {
            loadFeed();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [topic]); // Remove loadFeed from dependencies to prevent double fetching

    // Handle infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const threshold = 100;
            const isNearBottom = 
                window.innerHeight + window.scrollY >= 
                document.documentElement.scrollHeight - threshold;

            if (isNearBottom) loadFeed();
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadFeed]);

    // Render loading states
    const renderStatus = () => {
        if (loading) return <p>Loading...</p>;
        if (!hasMore && feed.length > 0) return <p>No more news to load</p>;
        if (feed.length === 0 && !loading) return <p>No news found</p>;
        return null;
    };

    return (
        <div className="Feed">
            <h1 className="FeedTitle">{title}</h1>
            <div className="FeedList">
                {feed.map((item, index) => (
                    <News 
                        key={`${item.id || index}`}
                        image={item.image}
                        title={item.title}
                        link={item.link}
                        source={item.source}
                        time={item.published_date}
                    />
                ))}
                {renderStatus()}
            </div>
        </div>
    );
}

export default Feed;