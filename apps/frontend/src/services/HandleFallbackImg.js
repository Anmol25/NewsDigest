import toi from '../assets/news_source/Times of India.png'
import ndtv from '../assets/news_source/NDTV.png'
import firstpost from '../assets/news_source/Firstpost.png'
import hindustan from '../assets/news_source/Hindustan Times.png'
import indiatoday from '../assets/news_source/India Today.png'
import indiatv from '../assets/news_source/India TV.png'
import zee from '../assets/news_source/Zee News.png'
import dna from '../assets/news_source/DNA India.png'
import news18 from '../assets/news_source/News18.png'

function handleFallbackImage(source){
    switch (source){
        case "Times of India":
            return toi;
        case "NDTV":
            return ndtv;
        case "Firstpost":
            return firstpost;
        case "Hindustan Times":
            return hindustan;
        case "India Today":
            return indiatoday;
        case "India TV":
            return indiatv;
        case "Zee News":
            return zee;
        case "DNA India":
            return dna;
        case "News18":
            return news18;
        default:
            return toi;
    }
}

export default handleFallbackImage;