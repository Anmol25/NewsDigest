import "./NavBarBottom.css";
import { NavLink } from "react-router-dom";
import { TOPICS_LIST } from "../../constants/TOPICS_LIST";

function NavBarBottom() {
    return (
        <div className='navbar-bottom'>
            <ul className="navbar-bottom-list">
                {TOPICS_LIST.map((topic, index) => (
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

export default NavBarBottom;