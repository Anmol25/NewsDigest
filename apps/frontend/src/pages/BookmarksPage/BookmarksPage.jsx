import "./BookmarksPage.css";
import bookmark from '../../assets/bookmarked.svg';
import { useAxios } from "../../services/AxiosConfig";
import { useEffect, useState, useRef, useCallback } from "react";
import News from "../../components/NewsComponent/News";


function BookmarksPage(){
    const axiosInstance = useAxios();

    const [bookmarked, setBookmarked] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);

    const loadBookmarked = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get('/bookmarked-articles', {
                params: {
                    page: currentPage
                }
            });

            const newData = response.data || [];
            const moreData = newData.length === 20;
            setBookmarked(prev => currentPage === 1 ? newData : [...prev, ...newData]);
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
        setBookmarked([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        loadBookmarked(1);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
                loadBookmarked(page);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadBookmarked, page]);

    return (
        <div className="BookmarksPage">
            <div className="MainHeadings">
                <img 
                    src={bookmark} 
                    alt='Booksmark'
                    className="MainHeadingIcon"
                    id="BookmarkPageIcon"
                />
                <h1 className="MainHeadingTitle">Bookmarked Articles</h1>
            </div>
            <div className="FeedList">
                {bookmarked.map((item) => <News key={item.id} {...item} />)}
                {hasMore ? <p>Loading...</p> : bookmarked.length ? "" : <p>No Bookmarked Article found</p>}
            </div>
        </div>
    )
}

export default BookmarksPage;