import React, { useState } from "react";
import SideMenu from "./sidemenu"
import Feed from "./feed"
import "../styles/mainbox.css"

function MainBox(){
    const [topic, setTopic] = useState("Top Stories");

    return (
       <div className="MainBox">
        <SideMenu changeTopic={setTopic}/>
        <Feed topic={topic}/>
       </div>
    )
}

export default MainBox;