import heart from '../../assets/Icons/heart.svg';
import NewsLoader from "../../components/NewsLoader/NewsLoader";

function Likes(){
    return (
        <div className="MainPageContainer">
            <div className="MainHeadings">
                <img 
                    src={heart} 
                    alt='Likes'
                    className="MainHeadingIcon filter-black"
                />
                <h1 className="MainHeadingTitle">Liked Articles</h1>
            </div>
            <div>
                <NewsLoader url="/articles" requestBody={{type: "liked"}} />
            </div>
        </div>
    )
}

export default Likes;