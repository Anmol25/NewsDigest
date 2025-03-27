import "./Subscriptions.css"
import pageactive from "../../assets/Icons/page_active.svg"
import { useState, useEffect } from "react";
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
import NewsLoader from "../../components/NewsLoader/NewsLoader";


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

    const fetchSubscriptions = async () => {
        const response = await axiosInstance("/getSubscriptions");

        if (response.status === 200) {
            setUserSubscriptions(response.data);
          }
    };

    useEffect(()=>{
        fetchSubscriptions();
    }, [])


    return (
        <div className="MainPageContainer">
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
                    <p className="SubHeading">Latest from Your Subscriptions:</p>
                    <NewsLoader url="/subscribed-articles" />
                </div>
            </div> : <div className="NotFoundClass">No User Subscriptions Found</div> }
        </div>
    )
}

export default Subscriptions;