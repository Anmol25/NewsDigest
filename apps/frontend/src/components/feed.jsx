import React, { useState } from "react";
import "../styles/feed.css";

function Feed({topic}){

    const topicfeed = topic;
    
    return (
        <div className="Feed">
            <h1>{topicfeed}</h1>
        </div>
    )
}

export default Feed;