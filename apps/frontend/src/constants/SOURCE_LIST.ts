import toi from "../assets/news_source/Icons/Times of India.png";
import ndtv from "../assets/news_source/NDTV.png";
import firstpost from "../assets/news_source/Icons/Firstpost.png";
import indiatoday from "../assets/news_source/Icons/India Today.png";
import hindustantimes from "../assets/news_source/Icons/Hindustan Times.png";
import indiatv from "../assets/news_source/India TV.png";
import zeenews from "../assets/news_source/Icons/Zee News.png";
import dnaindia from "../assets/news_source/DNA India.png";
import news18 from "../assets/news_source/News18.png";
import cnbctv18 from "../assets/news_source/Icons/CNBCTV18.png";

interface SourceItem {
    name: string;
    icon: string;
}

export const SOURCE_LIST: SourceItem[] = [
    { name: "Times of India", icon: toi },
    { name: "NDTV", icon: ndtv },
    { name: "Firstpost", icon: firstpost },
    { name: "India Today", icon: indiatoday },
    { name: "Hindustan Times", icon: hindustantimes },
    { name: "India TV", icon: indiatv },
    { name: "Zee News", icon: zeenews },
    { name: "DNA India", icon: dnaindia },
    { name: "News18", icon: news18 },
    { name: "CNBCTV18", icon: cnbctv18 }
];
