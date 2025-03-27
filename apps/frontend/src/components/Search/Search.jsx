import './Search.css';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import News from '../News/News';
import { useAxios } from '../../services/AxiosConfig';

function Search() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query') || '';
    
    const [searchResults, setSearchResults] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);
    
    const axiosInstance = useAxios();

    const loadSearchResults = useCallback(async (currentPage) => {
        // Skip hasMore check for the first page
        if (loadingRef.current || (currentPage !== 1 && !hasMore) || !query) return;
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get('/search', {
                params: {
                    query: query,
                    page: currentPage
                }
            });
            
            const newData = response.data || [];
            const moreData = newData.length === 20;

            setSearchResults(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading search results:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
        }
    }, [hasMore, query, axiosInstance]);

    // Reset and load when query changes
    useEffect(() => {
        setSearchResults([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        
        if (query) {
            loadSearchResults(1);
        }
    }, [query]);

    // Set up infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
                loadSearchResults(page);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadSearchResults, page]);

    // Render loading and status messages
    const renderStatus = () => {
        if (loadingRef.current) return <p>Loading...</p>;
        if (!hasMore && searchResults.length > 0) return <p>No more results</p>;
        if (searchResults.length === 0 && !loadingRef.current) return <p>No results found</p>;
        return null;
    };

    return (
        <div className="search-container">
            <p className='searchTitle'>Search Results for "{query}"</p>
            <div className="search-results">
                {searchResults.map((item, index) => (
                    <News 
                        key={`${item.id || index}`}
                        id={item.id}
                        image={item.image}
                        title={item.title}
                        link={item.link}
                        source={item.source}
                        published_date={item.published_date}
                        liked={item.liked}
                        bookmarked={item.bookmarked}
                    />
                ))}
                {renderStatus()}
            </div>
        </div>
    );
}

export default Search;