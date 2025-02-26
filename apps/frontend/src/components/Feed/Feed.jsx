import "./Feed.css";
import News from "../NewsComponent/News";
import getFeed from "../../services/API";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAxios } from "../../services/AxiosConfig";

function formatTitle(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function Feed() {
    const { topic } = useParams();
    const title = formatTitle(topic);
    const axiosInstance = useAxios();
    
    const [feed, setFeed] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    const loadFeed = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMore) return;

        loadingRef.current = true;
        setLoading(true);

        try {
            const { data: newData, hasMore: moreData } = await getFeed(title, currentPage, axiosInstance);
            setFeed(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hasMore, title, axiosInstance]);

    useEffect(() => {
        setFeed([]);
        setPage(1);
        setHasMore(true);
        setLoading(false);
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
                        {...item}
                        time={item.published_date}
                    />
                ))}
                {renderStatus()}
            </div>
        </div>
    );
}

export default Feed;