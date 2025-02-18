import { useState } from "react";
import "../styles/sidemenu.css";

function SideMenu({changeTopic}){
    const [activeTopic, setActiveTopic] = useState("Top Stories");

    const handleTopicClick = (topic) => {
        setActiveTopic(topic);
        changeTopic(topic);
    }

    const topics = ["For You", "Top Stories", "Latest", "India", "World", "Economy",
         "Science", "Tech", "Sports", "Entertainment"];

    return (
        <div className="SideMenu">
            <ul>
                {topics.map((topic, index) => {
                    return <li className={`topic-li ${activeTopic === topic ? "active" : ""}`} key={index} onClick={() => handleTopicClick(topic)}>{topic}</li>
                })}
            </ul>
        </div>
    )
}

export default SideMenu;