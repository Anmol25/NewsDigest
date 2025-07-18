import "./UserHistory.css"
import trash from "../../assets/Icons/trash.svg"
import { useAxios } from "../../services/AxiosConfig";
import { useEffect, useState, useRef, useCallback } from "react";
import HistoryComponent from "../../components/HistoryComponent/HistoryComponent"


function UserHistory(){
    const axiosInstance = useAxios();

    const [history, setHistory] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);


    const clearHistory = async () => {
        const response = await axiosInstance.get("/clearhistory");

        if (response.status === 200){
            setHistory([]);
        }
    };

    const handleDelete = async (articleid) => {
        const response = await axiosInstance.get("/delete-history-item", {
            params: { id: articleid }
        });

        if (response.status === 200){
            setHistory((history) => history.filter(item => item.id !== articleid));
        }
    }

    const loadHistory = useCallback(async (currentPage) => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get('/user-history', {
                params: {
                    page: currentPage
                }
            });
            const newData = response.data || [];
            const moreData = newData.length === 20;
            setHistory(prev => currentPage === 1 ? newData : [...prev, ...newData]);
            setHasMore(moreData);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('Error loading History:', error);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
        }
    }, [hasMore, axiosInstance]);

    useEffect(() => {
        setHistory([]);
        setPage(1);
        setHasMore(true);
        loadingRef.current = false;
        loadHistory(1);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
                loadHistory(page);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadHistory, page]);


    return(
        <div className="UserHistoryPageContainer">
            <div className="HistoryHeader">
                <div className="HeadingWrapper">
                    <h1 className="PageTitle" id="HistoryTitle">History</h1>
                </div>
                <button className="HistoryClearButton" onClick={clearHistory}>
                    <img src={trash} alt="clear" />Clear History
                </button>
            </div>
            <div className="HistoryList">
                {history.map((item) => <HistoryComponent key={item.id} {...item} handleDelete={handleDelete} />)}
                {hasMore ? (
                    <div className="big-spinner-container">
                        <div className="big-spinner"></div>
                    </div>
                ) : history.length ? "" : <p>History Not found</p>}
            </div>
        </div>
    )
}

export default UserHistory;