import "./Subscriptions.css"
import pageactive from "../../assets/Icons/page_active.svg"
import { useState, useRef, useCallback } from "react";
import { useEffect } from "react";
import { useAxios } from "../../services/AxiosConfig";
import toi from "../../assets/news_source/Icons/Times of India.png";
import ndtv from "../../assets/news_source/NDTV.png";
import firstpost from "../../assets/news_source/Icons/Firstpost.png";
import indiatoday from "../../assets/news_source/Icons/India Today.png";
import hindustantimes from "../../assets/news_source/Icons/Hindustan Times.png";
import indiatv from "../../assets/news_source/India TV.png";
import zeenews from "../../assets/news_source/Icons/Zee News.png";
import dnaindia from "../../assets/news_source/DNA India.png";
import news18 from "../../assets/news_source/News18.png";
import { NavLink } from "react-router-dom";
import News from "../../components/News/News";

function Subscriptions(){
    const sourcelist = [
        {name: "Times of India", icon: toi},
        {name: "NDTV", icon: ndtv},
        {name: "Firstpost", icon: firstpost},
        {name: "India Today", icon: indiatoday},
        {name: "Hindustan Times", icon: hindustantimes},
        {name: "India TV", icon: indiatv},
        {name: "Zee News", icon: zeenews},
        {name: "DNA India", icon: dnaindia},
        {name: "News18", icon: news18}
    ];


    const [UserSubscriptions, setUserSubscriptions] = useState([]);
    const axiosInstance = useAxios();

    const [feed, setFeed] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);

    const fetchSubscriptions = async () => {
        const response = await axiosInstance("/getSubscriptions");

        if (response.status === 200) {
            setUserSubscriptions(response.data);
          }
    };

    useEffect(()=>{
        fetchSubscriptions();
    }, [])

    const loadFeed = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get('/subscribed-articles', {
                params: {
                    page: currentPage
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
            loadingRef.current = false;
        }
    }, [hasMore, axiosInstance]);

    useEffect(() => {
        setFeed([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        loadFeed(1);
    }, [UserSubscriptions]);

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
        <div className="SubscriptionsContainer">
            <div className="MainHeadings">
                <img className="MainHeadingIcon" src={pageactive} alt="" />
                <p className="MainHeadingTitle">Subscriptions</p>
            </div>
                {(UserSubscriptions.length > 0) ? 
                <div>
                <div className="UserSubscriptions">
                    {UserSubscriptions.map((item) => {
                        const source = sourcelist.find(source => source.name === item);
                        return (
                            <NavLink to={`/source/${item.toLowerCase().replace(/\s+/g, "-")}`} className="SubscriptionItem" key={item}>
                                {source && <img src={source.icon} alt={item} className="SubscriptionIcon" />}
                                <span>{item}</span>
                            </NavLink>
                        );
                    })}
                </div>
                <div className="SubsciptionFeed">
                    <p className="SubscriptionFeedTitle">Latest from Your Subscriptions:</p>
                    <div className="FeedList">
                        {feed.map((item) => <News key={item.id} {...item} />)}
                        {hasMore ? <p>Loading...</p> : feed.length ? <p></p> : <p>No news found</p>}
                    </div>
                </div>
            </div> : <div className="NotFoundClass">No User Subscriptions Found</div> }
        </div>
    )
}

export default Subscriptions;