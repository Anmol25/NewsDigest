import "./Home.css";
import HomeElements from "../../components/HomeElements/HomeElements";
import { TOPICS_LIST } from "../../constants/TOPICS_LIST";
import FeaturedLoader from "../../components/FeaturedLoader/FeaturedLoader";
function Home(){
    const topicsWithIcons = TOPICS_LIST.filter(topic => !["Home", "For You", "Top Stories"].includes(topic.name));

    return (
        <div className="HomePage">
            <FeaturedLoader />
            <div className="MainPageContainer">
                {topicsWithIcons.map((topic, index) => (
                    <HomeElements key={index} icon={topic.icon} name={topic.name} />
                ))}
            </div>
        </div>
    )
}

export default Home;