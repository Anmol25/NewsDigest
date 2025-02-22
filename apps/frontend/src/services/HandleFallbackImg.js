import toi from '../assets/news_source/Times of India.png'
import ndtv from '../assets/news_source/NDTV.png'
import firstpost from '../assets/news_source/Firstpost.png'
import hindustan from '../assets/news_source/Hindustan Times.png'
import indiatoday from '../assets/news_source/India Today.png'
import indiatv from '../assets/news_source/India TV.png'
import zee from '../assets/news_source/Zee News.png'

function handleFallbackImage(source){
    switch (source){
        case "Times of India":
            return toi;
            break;
        case "NDTV":
            return ndtv;
            break;
        case "Firstpost":
            return firstpost;
            break;
        case "Hindustan Times":
            return hindustan;
            break;
        case "India Today":
            return indiatoday;
            break;
        case "India TV":
            return indiatv;
        case "Zee News":
            return zee;
            break;
        default:
            return toi;
    }
}

export default handleFallbackImage;