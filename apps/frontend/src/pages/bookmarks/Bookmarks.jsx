import NewsLoader from "../../components/NewsLoader/NewsLoader";

function Bookmarks(){
    return (
        <div className="MainPageContainer">
            <div className="text-3xl font-semibold text-textPrimary pt-1 pb-2.5">
                Saved Articles
            </div>
            <div>
                <NewsLoader url="/articles" requestBody={{type: "bookmarked"}} />
            </div>
        </div>
    )
}

export default Bookmarks;