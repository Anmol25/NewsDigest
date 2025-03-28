import "./SideBar.css"
import { NavLink } from "react-router-dom";
import { useState, useEffect } from 'react';
import { SOURCE_LIST } from "../../constants/SOURCE_LIST";

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

    
    return(
        <div className={`SourceListContainer ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
            <div className="SourceList">
                {/* <div className={`SourceListHeader ${!isSidebarOpen ? 'hidden' : ''}`}>
                    <p className="SourceListTitle">All News Sources</p>
                </div> */}
                
                {SOURCE_LIST.map((item, index) =>
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