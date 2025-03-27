import "./Home.css"
import HomeElements from "../../components/HomeElements/HomeElements";
import topstories from "../../assets/navbarbuttons/top-stories.png";
import latest from "../../assets/navbarbuttons/latest.png";
import india from "../../assets/navbarbuttons/india.png";
import world from "../../assets/navbarbuttons/world.png";
import economy from "../../assets/navbarbuttons/economy.png";
import science from "../../assets/navbarbuttons/science.png";
import tech from "../../assets/navbarbuttons/tech.png";
import sports from "../../assets/navbarbuttons/sports.png";
import entertainment from "../../assets/navbarbuttons/entertainment.png";

function HomePage(){
    const topicsWithIcons = [
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
        <div className="HomePage">
            {topicsWithIcons.map((topic, index) => (
                <HomeElements key={index} icon={topic.icon} name={topic.name} />
            ))}
        </div>
    )
}

export default HomePage;