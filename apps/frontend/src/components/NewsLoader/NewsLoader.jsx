import { useState, useRef, useEffect, useCallback } from 'react';
import News from '../News/News';
import PropTypes from 'prop-types';
import { useAxios } from '../../services/AxiosConfig';

function NewsLoader(props){
    const axiosInstance = useAxios();
    const {url, parameters} = props;
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);

    const loadItems = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get(url, {
                params: {
                    page: currentPage,
                    ...parameters
                }
            });
            const newData = response.data || [];
            const moreData = newData.length === 20;
            setItems(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
        }
    }, [hasMore, axiosInstance]);

    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        loadItems(1);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
                loadItems(page);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadItems, page]);

    return(
        <div className="GridContainer">
                {items.map((item) => <News key={item.id} {...item} />)}
                {hasMore ? <p>Loading...</p> : items.length ? "" : <p>No Article found</p>}
        </div>
    )
}   

NewsLoader.propTypes = {
    url: PropTypes.string.isRequired,
    parameters: PropTypes.object
};

export default NewsLoader;