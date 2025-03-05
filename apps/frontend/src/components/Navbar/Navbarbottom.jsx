import "./Navbarbottom.css";
import { NavLink } from "react-router-dom";
import home from "../../assets/navbarbuttons/home.png";
import foryou from "../../assets/navbarbuttons/for-you.png";
import topstories from "../../assets/navbarbuttons/top-stories.png";
import latest from "../../assets/navbarbuttons/latest.png";
import india from "../../assets/navbarbuttons/india.png";
import world from "../../assets/navbarbuttons/world.png";
import economy from "../../assets/navbarbuttons/economy.png";
import science from "../../assets/navbarbuttons/science.png";
import tech from "../../assets/navbarbuttons/tech.png";
import sports from "../../assets/navbarbuttons/sports.png";
import entertainment from "../../assets/navbarbuttons/entertainment.png";

function Navbarbottom() {
    const topicsWithIcons = [
        { name: "Home", icon: home },
        { name: "For You", icon: foryou },
        { name: "Top Stories", icon: topstories },
        { name: "Latest", icon: latest },
        { name: "India", icon: india },
        { name: "World", icon: world },
        { name: "Economy", icon: economy },
        { name: "Science", icon: science },
        { name: "Tech", icon: tech },
        { name: "Sports", icon: sports },
        { name: "Entertainment", icon: entertainment }
    ];

    return (
        <div className='navbar-bottom'>
            <ul className="navbar-bottom-list">
                {topicsWithIcons.map((topic, index) => (
                    <NavLink 
                        className="navbar-bottom-item" 
                        to={`/${topic.name.replace(/\s+/g, '-').toLowerCase()}`} 
                        key={index}
                    >
                        <img src={topic.icon} alt={topic.name} className="nav-icon" />
                        <span className="nav-text">{topic.name}</span>
                    </NavLink>
                ))}
            </ul>
        </div>
    )
}

export default Navbarbottom;