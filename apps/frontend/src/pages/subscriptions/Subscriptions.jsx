
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
        <div className=" px-5 py-2.5">
            <div>
                <p className="text-3xl font-semibold text-textPrimary pt-1 pb-2.5">Subscriptions</p>
            </div>
                {(UserSubscriptions.length > 0) ? 
                <div>
                <div className="flex overflow-x-auto p-5 rounded-xl shadow-md gap-5 scrollbar-thin">
                    {UserSubscriptions.map((item) => {
                        const source = SOURCE_LIST.find(source => source.name === item);
                        return (
                            <NavLink to={`/source/${item.toLowerCase().replace(/\s+/g, "-")}`} className="flex flex-col items-center min-w-[80px] transition-transform duration-200 no-underline" key={item}>
                                {source && <img src={source.icon} alt={item} className="w-[60px] h-[60px] rounded-full object-cover shadow-md mb-2 border-2 border-[#f0f0f0]" />}
                                <span className="text-sm font-bold text-center text-[#333] max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis">{item}</span>
                            </NavLink>
                        );
                    })}
                </div>
                <div className="mt-8">
                    <p className="text-[22px] font-semibold text-textPrimary mb-5 pl-2 border-l-4 border-brandColor">Latest from Your Subscriptions:</p>
                    <NewsLoader url="/subscribed-articles" />
                </div>
            </div> : <div className="flex justify-center text-[24px] font-bold text-textPrimary p-10 rounded-xl shadow-lg">Subscriptions Not Found</div> }
        </div>
    )
}

export default Subscriptions;