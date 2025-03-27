import "./Likes.css";
import heart from '../../assets/Icons/heart.svg';
import { useAxios } from "../../services/AxiosConfig";
import { useEffect, useState, useRef, useCallback } from "react";
import News from "../../components/News/News";


function Likes(){
    const axiosInstance = useAxios();

    const [liked, setLiked] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);

    const loadLiked = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get('/liked-articles', {
                params: {
                    page: currentPage
                }
            });

            const newData = response.data || [];
            const moreData = newData.length === 20;
            setLiked(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
        }
    }, [hasMore, axiosInstance]);

    useEffect(() => {
        setLiked([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        loadLiked(1);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
                loadLiked(page);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadLiked, page]);

    return (
        <div className="LikesPage">
            <div className="MainHeadings">
                <img 
                    src={heart} 
                    alt='Likes'
                    className="MainHeadingIcon"
                    id="LikeIcon"
                />
                <h1 className="MainHeadingTitle">Liked Articles</h1>
            </div>
            <div className="GridContainer">
                {liked.map((item) => <News key={item.id} {...item} />)}
                {hasMore ? <p>Loading...</p> : liked.length ? "" : <p>No Likes Articles found</p>}
            </div>
        </div>
    )
}

export default Likes;