import "./HomeElements.css"
import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import News from "../News/News";
import { useAxios } from "../../services/AxiosConfig";
import PropTypes from 'prop-types';

function HomeElements(props) {
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
            const response = await axiosInstance.get(`/feed/${props.name}`, {
                params: {
                    page: currentPage,
                }
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

    useEffect(() => {
        loadFeed(1);
    }, [props.name]);

    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth;
            const newScrollPosition = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth'
            });

            // Load more content when scrolling right and near the end
            if (direction === 'right' && 
                scrollContainerRef.current.scrollLeft + scrollContainerRef.current.clientWidth >= 
                scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth) {
                loadFeed(page);
            }
        }
    };

    return (
        <div className={`HomeElement`}>
            <div className="HomeHeader">
                <div className="Homediv">
                    <img className="HomeTitleImg" src={props.icon} alt={props.name} />
                    <p className="HomeTitle">{props.name}</p>
                </div>
                <NavLink className="HomeSeeMore" to={`/${props.name.toLowerCase().replace(/\s+/g, "-")}`}>
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
                    {loading && <div className="LoadingIndicator">Loading...</div>}
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