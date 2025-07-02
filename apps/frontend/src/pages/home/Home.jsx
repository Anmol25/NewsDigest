import HomeElements from "../../components/HomeElements/HomeElements";
import { TOPICS_LIST } from "../../constants/NEWS_TOPICS";
import FeaturedLoader from "../../components/FeaturedLoader/FeaturedLoader";
function Home(){
    const topicsWithIcons = TOPICS_LIST.filter(topic => !["Top Stories"].includes(topic.name));

    return (
        <div>
            <FeaturedLoader />
            <div>
                {topicsWithIcons.map((topic, index) => (
                    <HomeElements key={index} icon={topic.icon} name={topic.name} />
                ))}
            </div>
        </div>
    )
}

export default Home;