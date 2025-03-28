import "./Subscriptions.css"
import pageactive from "../../assets/Icons/page_active.svg"
import { useState, useEffect } from "react";
import { useAxios } from "../../services/AxiosConfig";
import { NavLink } from "react-router-dom";
import NewsLoader from "../../components/NewsLoader/NewsLoader";
import { SOURCE_LIST } from "../../constants/SOURCE_LIST";


function Subscriptions(){
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
                        const source = SOURCE_LIST.find(source => source.name === item);
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