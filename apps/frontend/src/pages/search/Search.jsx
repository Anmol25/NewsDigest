import "./Search.css";
import { useLocation } from 'react-router-dom';
import NewsLoader from '../../components/NewsLoader/NewsLoader';

function Search() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query') || '';
    const context = searchParams.get('context') === 'true';

    return (
        <div className="SearchContainer">
            <div className="SearchHeading">
                <h1 className="SearchHeadingTitle">
                    <span className="SearchIcon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </span>
                    Search Results for &quot;{query}&quot;
                    {context && <span className="ContextualBadge">Contextual Search</span>}
                </h1>
            </div>
            <NewsLoader 
                key={`${query}-${context}`} 
                url="/search" 
                parameters={{
                    query: query, 
                    context: context
                }} 
            />
        </div>
    );
}

export default Search;
