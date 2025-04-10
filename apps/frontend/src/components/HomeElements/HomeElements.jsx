import "./HomeElements.css"
import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import News from "../News/News";
import { useAxios } from "../../services/AxiosConfig";
import PropTypes from 'prop-types';
import { debounce } from 'lodash';

function HomeElements({ name, icon }) {
    const [feed, setFeed] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const scrollContainerRef = useRef(null);
    const axiosInstance = useAxios();

    const loadFeed = async (currentPage) => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const response = await axiosInstance.post('/articles', {
                type: "topic",
                topic: name
            }, {
                params: { page: currentPage }
            });
            const newData = response.data || [];
            const moreData = newData.length === 20;
            setFeed(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    const checkAndLoadMore = useCallback(
        debounce(() => {
            if (!scrollContainerRef.current) return;
            
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            const scrolledToEnd = scrollLeft + clientWidth >= scrollWidth - 100;

            if (scrolledToEnd && !loading && hasMore) {
                loadFeed(page);
            }
        }, 200),
        [page, loading, hasMore]
    );

    const handleScroll = useCallback((direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth;
            scrollContainerRef.current.scrollTo({
                left: scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount),
                behavior: 'smooth'
            });
        }
    }, []);

    useEffect(() => {
        setFeed([]);
        setPage(1);
        setHasMore(true);
        loadFeed(1);
    }, [name]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkAndLoadMore);
            return () => container.removeEventListener('scroll', checkAndLoadMore);
        }
    }, [checkAndLoadMore]);

    return (
        <div className="HomeElement">
            <div className="HomeHeader">
                <div className="Homediv">
                    <img className="HomeTitleImg" src={icon} alt={name} />
                    <p className="HomeTitle">{name}</p>
                </div>
                <NavLink className="HomeSeeMore" to={`/${name.toLowerCase().replace(/\s+/g, "-")}`}>
                    See more &gt;
                </NavLink>
            </div>
            <div className="ScrollContainer">
                <button 
                    className="ScrollButton ScrollButtonLeft" 
                    onClick={() => handleScroll('left')}
                    aria-label="Scroll left"
                >
                    &#8249;
                </button>
                <div className="NewsScrollContainer" ref={scrollContainerRef}>
                    {feed.map((item) => (
                        <div key={item.id} className="NewsItemContainer">
                            <News {...item} />
                        </div>
                    ))}
                    {loading && (
                        <div className="big-spinner-container">
                            <div className="big-spinner"></div>
                        </div>
                    )}
                </div>
                <button 
                    className="ScrollButton ScrollButtonRight" 
                    onClick={() => handleScroll('right')}
                    aria-label="Scroll right"
                >
                    &#8250;
                </button>
            </div>
        </div>
    );
}

HomeElements.propTypes = {
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
};

export default HomeElements;