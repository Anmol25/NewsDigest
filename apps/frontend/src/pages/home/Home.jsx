import "./Home.css";
import HomeElements from "../../components/HomeElements/HomeElements";
import { TOPICS_LIST } from "../../constants/TOPICS_LIST";

function Home(){
    const topicsWithIcons = TOPICS_LIST.filter(topic => !["Home", "For You"].includes(topic.name));

    return (
        <div className="HomePage">
            {topicsWithIcons.map((topic, index) => (
                <HomeElements key={index} icon={topic.icon} name={topic.name} />
            ))}
        </div>
    )
}

export default Home;