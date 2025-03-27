import bookmark from '../../assets/Icons/bookmarked.svg';
import NewsLoader from "../../components/NewsLoader/NewsLoader";

function Bookmarks(){
    return (
        <div className="MainPageContainer">
            <div className="MainHeadings">
                <img 
                    src={bookmark} 
                    alt='Booksmark'
                    className="MainHeadingIcon filter-black"
                />
                <h1 className="MainHeadingTitle">Bookmarked Articles</h1>
            </div>
            <div>
                <NewsLoader url="/bookmarked-articles" />
            </div>
        </div>
    )
}

export default Bookmarks;