import "../styles/sidemenu.css";

function SideMenu({changeTopic}){
    const topics = ["For You", "Top Stories", "Latest", "India", "World", "Economy", "Science", "Tech", "Sports", "Entertainment"];

    return (
        <div className="SideMenu">
            <ul>
                {topics.map((topic, index) => {
                    return <li key={index} onClick={() => changeTopic(topic)}>{topic}</li>
                })}
            </ul>
        </div>
    )
}

export default SideMenu;