import "./SideBar.css"
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
import React, { useState, useEffect } from 'react';

const SideBar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setIsSidebarOpen(event.detail.isOpen);
        };

        document.addEventListener('sidebarToggle', handleSidebarToggle);
        
        return () => {
            document.removeEventListener('sidebarToggle', handleSidebarToggle);
        };
    }, []);

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
        <div className={`SourceListContainer ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
            <div className="SourceList">
                {/* <div className={`SourceListHeader ${!isSidebarOpen ? 'hidden' : ''}`}>
                    <p className="SourceListTitle">All News Sources</p>
                </div> */}
                
                {sourcelist.map((item, index) =>
                <NavLink 
                    key={index}
                    to={`/source/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={({ isActive }) => 
                        `source-link ${isActive ? 'active' : ''} ${!isSidebarOpen ? 'icon-only' : ''}`
                    }
                >
                    <img className="SourceIcon" src={item.icon} alt={item.name} />
                    <p className={`SourceName ${!isSidebarOpen ? 'hidden' : ''}`}>{item.name}</p>
                </NavLink>)}
            </div>
        </div>
    )
}

export default SideBar;