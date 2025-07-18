import "./SourceComponent.css"
import { useAxios } from "../../services/AxiosConfig";
import { useEffect, useState } from "react";
import plus from "../../assets/Icons/plus.svg"
import cross from "../../assets/Icons/cross.svg"
import NewsLoader from "../NewsLoader/NewsLoader";
import PropTypes from 'prop-types';

function formatTitle(slug) {
    return slug
      .split('-') 
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) 
      .join(' '); 
}


function SourceComponent(props) {
    const axiosInstance = useAxios();
    const formattedTitle = formatTitle(props.source);
    const [isSubscribed, setSubscribed] = useState(false);

    const checkSubscribed = async (title) =>{
        const response = await axiosInstance.get("/isSubscribed", {
            params: {source : title}
        });
        
        if (response.status === 200) {
            if (response.data.isSubscribed == true){
                return true;
            }else{
                return false;
            }
        }
        return false;
    }

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
            <p className="text-[22px] font-semibold text-textPrimary mb-5 pl-2 border-l-4 border-brandColor">{`Latest News from ${formattedTitle}:`}</p>
            <NewsLoader key={props.source} url={`/articles`} requestBody= {{type:"source", source:formattedTitle}} />
        </div>
    );
}

SourceComponent.propTypes = {
    source: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired
};

export default SourceComponent;