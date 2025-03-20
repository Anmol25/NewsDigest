import "./SourcePage.css"
import SourceComponent from "../../components/SourceComponent/SourceComponent";
import { useParams } from "react-router-dom";
import toi from "../../assets/news_source/Icons/Times of India.png";
import ndtv from "../../assets/news_source/NDTV.png";
import firstpost from "../../assets/news_source/Icons/Firstpost.png";
import indiatoday from "../../assets/news_source/Icons/India Today.png";
import hindustantimes from "../../assets/news_source/Icons/Hindustan Times.png";
import indiatv from "../../assets/news_source/India TV.png";
import zeenews from "../../assets/news_source/Icons/Zee News.png";
import dnaindia from "../../assets/news_source/DNA India.png";
import news18 from "../../assets/news_source/News18.png";

function SourcePage(){
    const { source } = useParams();
    const sourcelist = [
        { name: "Times Of India", icon: toi },
        { name: "NDTV", icon: ndtv },
        { name: "Firstpost", icon: firstpost },
        { name: "India Today", icon: indiatoday },
        { name: "Hindustan Times", icon: hindustantimes },
        { name: "India TV", icon: indiatv },
        { name: "Zee News", icon: zeenews },
        { name: "DNA India", icon: dnaindia },
        { name: "News18", icon: news18 }
    ];

    const selectedSource = sourcelist.find(item => item.name.toLowerCase().replace(/\s+/g, '-') === source);
    
    return(
        <div className="SourcePageContainer">
            {selectedSource ? (
                <SourceComponent source={selectedSource.name} image={selectedSource.icon} />
            ) : (
                <p>404 NOT FOUND</p>
            )}
        </div>
    )
}

export default SourcePage;