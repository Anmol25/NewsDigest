// NewsLoader.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import News from '../News/News';
import PropTypes from 'prop-types';
import { useAxios } from '../../services/AxiosConfig';
import { debounce } from 'lodash';

// UI/behavior constants
const PAGE_SIZE = 20;            // Expected page size from API
const SCROLL_THRESHOLD = 100;    // px from bottom to trigger next load
const SCROLL_DEBOUNCE_MS = 200;  // debounce delay for scroll handler

function NewsLoader({ url, parameters, requestBody, setHasArticles }){
    const axiosInstance = useAxios();

    // Data/infinite-scroll state
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const containerRef = useRef(null);
    const scrollParentRef = useRef(null);
    const loadingRef = useRef(false);
    const pageRef = useRef(page);
    const hasMoreRef = useRef(hasMore);

    // Keep refs in sync with state to avoid stale closures in event listeners
    useEffect(() => { pageRef.current = page }, [page]);
    useEffect(() => { hasMoreRef.current = hasMore }, [hasMore]);

    // Determine the closest scrollable ancestor; fallback to window
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

    // Fetch a page using GET or POST based on presence of requestBody
    const fetchPage = useCallback(async (currentPage) => {
        const commonParams = { params: { page: currentPage, ...(parameters || {}) } };
        if (requestBody) {
            return axiosInstance.post(url, { ...requestBody }, commonParams);
        }
        return axiosInstance.get(url, commonParams);
    }, [axiosInstance, url, parameters, requestBody]);

    // Load and append items for a given page index
    const loadItems = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMoreRef.current) return;
        loadingRef.current = true;

        try {
            const response = await fetchPage(currentPage);
            const newData = response.data || [];

            // Inform parent that we have at least one article
            if (setHasArticles && newData.length > 0) {
                setHasArticles(true);
            }

            const moreData = newData.length === PAGE_SIZE; // respect page-size heuristic
            setItems(prev => (currentPage === 1 ? newData : [...prev, ...newData]));
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading feed:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
        }
    }, [fetchPage, setHasArticles]);

    // Initial load and reset when key props change
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

    // Detect scroll parent after mount
    useEffect(() => {
        const sp = getScrollParent(containerRef.current);
        scrollParentRef.current = sp;
    }, []);

    // Attach debounced scroll listener to the detected scroll parent (or window)
    useEffect(() => {
        const scrollParent = scrollParentRef.current || window;
        if (!scrollParent) return;

        const onScroll = debounce(() => {
            // compute whether we've scrolled near the bottom
            let reachedBottom = false;
            if (scrollParent === window) {
                const scrollY = window.scrollY || window.pageYOffset;
                reachedBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - SCROLL_THRESHOLD;
            } else {
                const el = scrollParent;
                reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD;
            }

            if (reachedBottom && hasMoreRef.current && !loadingRef.current) {
                loadItems(pageRef.current);
            }
        }, SCROLL_DEBOUNCE_MS);

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
                    <div aria-label="Loading more articles" className="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
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
