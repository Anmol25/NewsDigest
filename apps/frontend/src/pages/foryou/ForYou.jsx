import "./ForYou.css";
import NewsLoader from "../../components/NewsLoader/NewsLoader";
import heart from "../../assets/Icons/heart.svg";
import { useAxios } from '../../services/AxiosConfig';
import { useState, useEffect } from 'react';

function ForYou() {
    const title = "For You";
    const url = "/foryou";
    const axiosInstance = useAxios();
    const [hasHistory, setHasHistory] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkHistory = async () => {
            try {
                const response = await axiosInstance.get("/checkhistory");
                setHasHistory(response.status === 200);
            } catch (error) {
                setHasHistory(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkHistory();
    }, [axiosInstance]);

    return (
        <div className="MainPageContainer">
            <div className="MainHeadings">
                <img src={heart} alt={title} className="MainHeadingIcon filter-black"/>
                <h1 className="MainHeadingTitle">{title}</h1>
            </div>
            {isLoading ? (
                <div className="big-spinner-container">
                    <div className="big-spinner"></div>
                </div>
            ) : hasHistory ? (
                <NewsLoader key={title} url={url} />
            ) : (
                <div className="no-history-container">
                    <div className="no-history-content">
                        <div className="icon-wrapper">
                            <img src={heart} alt="Empty history" className="no-history-icon"/>
                        </div>
                        <h2 className="no-history-title">Discover Your News Feed</h2>
                        <p className="no-history-message">Read articles to get personalized recommendations</p>
                        <div className="decoration-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ForYou;
