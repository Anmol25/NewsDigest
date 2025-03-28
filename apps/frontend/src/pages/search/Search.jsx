import { useLocation } from 'react-router-dom';
import NewsLoader from '../../components/NewsLoader/NewsLoader';

function Search() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query') || '';

    return (
        <div className="MainPageContainer">
            <div className="MainHeadings">
                <p className='MainHeadingTitle'>Search Results for &quot;{query}&quot;</p>
            </div>
            <div>
                <NewsLoader key={query} url="/search" parameters={{query: query}} />
            </div>
        </div>
    );
}

export default Search;