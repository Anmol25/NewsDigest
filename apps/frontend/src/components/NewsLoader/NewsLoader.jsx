// NewsLoader.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import News from '../News/News';
import PropTypes from 'prop-types';
import { useAxios } from '../../services/AxiosConfig';
import { debounce } from 'lodash';

function NewsLoader(props){
    const axiosInstance = useAxios();
    const {url, parameters, requestBody, setHasArticles} = props;
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const containerRef = useRef(null);
    const scrollParentRef = useRef(null);
    const loadingRef = useRef(false);
    const pageRef = useRef(page);
    const hasMoreRef = useRef(hasMore);

    // keep refs in sync with state to avoid stale closures in event listeners
    useEffect(() => { pageRef.current = page }, [page]);
    useEffect(() => { hasMoreRef.current = hasMore }, [hasMore]);

    const getScrollParent = (node) => {
        if (!node) return window;
        let el = node;
        while (el && el !== document.documentElement && el !== document.body) {
            const style = window.getComputedStyle(el);
            const overflowY = style.getPropertyValue('overflow-y');
            const overflow = style.getPropertyValue('overflow');
            if (/(auto|scroll)/.test(overflowY) || /(auto|scroll)/.test(overflow)) {
                return el;
            }
            el = el.parentElement;
        }
        return window;
    };

    const loadItems = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMoreRef.current) return;
        loadingRef.current = true;

        try {
            let response;
            if (requestBody) {
                response = await axiosInstance.post(url, {...requestBody}, {
                    params: {
                        page: currentPage,
                        ...parameters
                    }
                });
            } else {
                response = await axiosInstance.get(url, {
                    params: {
                        page: currentPage,
                        ...parameters
                    }
                });
            }
            const newData = response.data || [];
            if (setHasArticles && newData.length > 0){
                setHasArticles(true);
            }
            const moreData = newData.length === 20; // page-size assumption kept
            setItems(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
        }
    }, [axiosInstance, url, parameters, requestBody, setHasArticles]);

    // initial load and reset when key props change
    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        pageRef.current = 1;
        hasMoreRef.current = true;
        loadItems(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, JSON.stringify(parameters || {}), JSON.stringify(requestBody || {})]);

    // detect scroll parent after mount
    useEffect(() => {
        const sp = getScrollParent(containerRef.current);
        scrollParentRef.current = sp;
    }, []);

    // attach debounced scroll listener to the detected scroll parent (or window)
    useEffect(() => {
        const scrollParent = scrollParentRef.current || window;
        if (!scrollParent) return;

        const threshold = 100; // pixels from bottom to trigger load
        const onScroll = debounce(() => {
            // compute whether we've scrolled near the bottom
            let reachedBottom = false;
            if (scrollParent === window) {
                const scrollY = window.scrollY || window.pageYOffset;
                reachedBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - threshold;
            } else {
                const el = scrollParent;
                reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
            }

            if (reachedBottom && hasMoreRef.current && !loadingRef.current) {
                loadItems(pageRef.current);
            }
        }, 200);

        // add listener (use passive when possible)
        try {
            scrollParent.addEventListener('scroll', onScroll, { passive: true });
        } catch (e) {
            // fallback for window or older browsers
            scrollParent.addEventListener('scroll', onScroll);
        }

        // also check once in case content is short and initial load didn't fill
        onScroll();

        return () => {
            try {
                scrollParent.removeEventListener('scroll', onScroll, { passive: true });
            } catch (e) {
                scrollParent.removeEventListener('scroll', onScroll);
            }
            onScroll.cancel && onScroll.cancel();
        };
    }, [loadItems]);

    return(
        <div ref={containerRef} className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {items.map((item) => (
                <div key={item.id} className="aspect-square">
                    <News {...item} />
                </div>
            ))}
            {hasMore ? (
                <div className="flex items-center justify-center h-16 col-span-full">
                    <div className="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : items.length ? "" : (
                <div className="col-span-full flex items-center justify-center h-24">
                    <p className="text-gray-500 text-lg">No Articles found</p>
                </div>
            )}
        </div>
    )
}

NewsLoader.propTypes = {
    url: PropTypes.string.isRequired,
    parameters: PropTypes.object,
    requestBody: PropTypes.object,
    setHasArticles: PropTypes.func
};

export default NewsLoader;
