import "./SourceList.css"
import { NavLink } from "react-router-dom";
import toi from "../../assets/news_source/Icons/Times of India.png";
import ndtv from "../../assets/news_source/NDTV.png";
import firstpost from "../../assets/news_source/Icons/Firstpost.png";
import indiatoday from "../../assets/news_source/Icons/India Today.png";
import hindustantimes from "../../assets/news_source/Icons/Hindustan Times.png";
import indiatv from "../../assets/news_source/India TV.png";
import zeenews from "../../assets/news_source/Icons/Zee News.png";
import dnaindia from "../../assets/news_source/DNA India.png";
import news18 from "../../assets/news_source/News18.png";

function SourceList(){
    const sourcelist = [
        {name: "Times Of India", icon: toi},
        {name: "NDTV", icon: ndtv},
        {name: "Firstpost", icon: firstpost},
        {name: "India Today", icon: indiatoday},
        {name: "Hindustan Times", icon: hindustantimes},
        {name: "India TV", icon: indiatv},
        {name: "Zee News", icon: zeenews},
        {name: "DNA India", icon: dnaindia},
        {name: "News18", icon: news18}
    ];
    
    return(
        <div className="SourceListContainer">
            <div className="SourceList">
                <div className="SourceListHeader">
                    <p className="SourceListTitle">All News Sources</p>
                </div>
                
                {sourcelist.map((item, index) =>
                <NavLink 
                    key={index}
                    to={`/source/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                    <img className="SourceIcon" src={item.icon} alt={item.name} />
                    <p className="SourceName">{item.name}</p>
                </NavLink>)}
            </div>
        </div>
    )
}

export default SourceList;