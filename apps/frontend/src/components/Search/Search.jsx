import './Search.css';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import News from '../NewsComponent/News';
import { useAxios } from '../../services/AxiosConfig';

function Search() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query') || '';

    // States
    const [searchResults, setSearchResults] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const axiosInstance = useAxios();

    // Load search results
    const loadSearchResults = useCallback(async () => {
        if (loading || !hasMore || !query) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/search', {
                params: {
                    "query": query,
                    "page": page
                }
            });
            
            const newData = response.data || [];
            const moreData = newData.length === 10; // If we got 10 items, assume there's more
            
            if (!newData.length) {
                setHasMore(false);
            } else {
                setSearchResults(prev => [...prev, ...newData]);
                setPage(prev => prev + 1);
                setHasMore(moreData);
            }
        } catch (error) {
            console.error('Error loading search results:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, page, query, axiosInstance]);

    // Reset states when query changes
    useEffect(() => {
        setSearchResults([]);
        setPage(1);
        setHasMore(true);
        setLoading(false);
        loadSearchResults();
    }, [query]);

    // Handle infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const threshold = 100;
            const isNearBottom = 
                window.innerHeight + window.scrollY >= 
                document.documentElement.scrollHeight - threshold;

            if (isNearBottom) loadSearchResults();
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadSearchResults]);

    // Render loading states
    const renderStatus = () => {
        if (loading) return <p>Loading...</p>;
        if (!hasMore && searchResults.length > 0) return <p>No more results</p>;
        if (searchResults.length === 0 && !loading) return <p>No results found</p>;
        return null;
    };

    return (
        <div className="search-container">
            <h1>Search Results for "{query}"</h1>
            <div className="search-results">
                {searchResults.map((item, index) => (
                    <News 
                        key={`${item.id || index}`}
                        image={item.image}
                        title={item.title}
                        link={item.link}
                        source={item.source}
                        time={item.published_date}
                    />
                ))}
                {renderStatus()}
            </div>
        </div>
    );
}

export default Search;