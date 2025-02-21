import "./SideMenu.css";
import { NavLink } from "react-router-dom";

function SideMenu(){
    const topics = ["For You", "Top Stories", "Latest", "India", "World", "Economy",
         "Science", "Tech", "Sports", "Entertainment"];

    return (
        <div className="SideMenu">
            <ul className="SideMenu-ul">
                {topics.map((topic, index) => {
                    return <NavLink className="topic-li" to={`/${topic.replace(/\s+/g, '-').toLowerCase()}`} key={index}>{topic}</NavLink>
                })}
            </ul>
        </div>
    )
}

export default SideMenu;