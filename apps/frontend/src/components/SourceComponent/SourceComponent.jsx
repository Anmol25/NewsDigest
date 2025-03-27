import "./SourceComponent.css"
import { useAxios } from "../../services/AxiosConfig";
import { useEffect, useState, useCallback } from "react";
import News from "../../components/NewsComponent/News";
import { useLocation } from "react-router-dom";
import plus from "../../assets/plus.svg"
import cross from "../../assets/cross.svg"

function formatTitle(slug) {
    return slug
      .split('-') // Split by hyphen
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(' '); // Join words with space
}


function SourceComponent(props) {
    const location = useLocation();
    const axiosInstance = useAxios();
    const formattedTitle = formatTitle(props.source);

    const [sourceArticles, setSourceArticles] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubscribed, setSubscribed] = useState(false);

    const checkSubscribed = async (title) =>{
        const response = await axiosInstance.post("/isSubscribed", {
            source : title
        });
        
        if (response.status === 200) {
            if (response.data == true){
                console.log("subscribed");
                return true;
            }else{
                console.log("Not subscribed");
                return false;
            }
        }
        return false;
    }

    const loadSourceArticles = useCallback(async (currentPage) => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        try {
            console.log(`Fetching page ${currentPage} for source: ${formattedTitle}`);
            const response = await axiosInstance.get('/source/', {
                params: {
                    source: formattedTitle,
                    page: currentPage  // Add page parameter if your API supports it
                }
            });

            const newData = response.data || [];
            console.log(`Received ${newData.length} articles for ${formattedTitle}`);
            
            const moreData = newData.length === 20;
            setSourceArticles(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error(`Error loading articles for ${formattedTitle}:`, error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [formattedTitle, hasMore, isLoading, axiosInstance]);

    // Reset and load when source changes
    useEffect(() => {
        console.log(`Source changed to: ${props.source} (${formattedTitle})`);
        setSourceArticles([]);
        setPage(1);
        setHasMore(true);
        setIsLoading(false);
        loadSourceArticles(1);
    }, [location]);

    // Infinite scroll handler
    useEffect(() => {
        const handleScroll = () => {
            if (
                !isLoading && 
                hasMore && 
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100
            ) {
                loadSourceArticles(page);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadSourceArticles, page, isLoading, hasMore]);

    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            const subscribed = await checkSubscribed(formattedTitle);
            setSubscribed(subscribed);
        };
        checkSubscriptionStatus();
    }, [formattedTitle]);

    const Subscribe = async () => {
        const response = await axiosInstance.post("/subscribe", {
            source : formattedTitle
        });
        
        if (response.status === 200) {
            console.log(response.data.data);
            if (response.data.data == "subscribed"){
                setSubscribed(true);
            }else if(response.data.data == "unsubscribed"){
                setSubscribed(false);
            }
        }
    }

    return (
        <div className="SourceComponentContainer">
            <div className="SourceInfo">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img className="SourceImage" src={props.image} alt={formattedTitle} />
                    <p className="SourceTitle">{formattedTitle}</p>
                </div>
                <button className="SubscribeButton" onClick={Subscribe}>
                    {isSubscribed ? <div>Unsubscribe<img src={cross} alt="Unsubscribe" /></div> : <div>Subscribe<img src={plus} alt="Subscribe" /></div>}
                </button>
            </div>
            <p className="SourceNewsHeading">{`Latest News from ${formattedTitle}:`}</p>
            <div className="FeedList">
                {sourceArticles.length > 0 ? (
                    sourceArticles.map((item) => <News key={item.id} {...item} />)
                ) : !isLoading ? (
                    <p>No news found</p>
                ) : null}
                {isLoading && <p>Loading...</p>}
                {!hasMore && sourceArticles.length > 0 && <p>No more news to load</p>}
            </div>
        </div>
    );
}

export default SourceComponent;