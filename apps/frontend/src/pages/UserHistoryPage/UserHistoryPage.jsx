import "./UserHistoryPage.css"
import trash from "../../assets/Icons/trash.svg"
import { useAxios } from "../../services/AxiosConfig";

function UserHistoryPage(){
    const axiosInstance = useAxios();

    const clearHistory = async () => {
        const response = await axiosInstance.get("/clearhistory");

        if (response.status === 200){
            console.log("History Cleared Successfully");
        }
    };


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
        </div>
    )
}

export default UserHistoryPage;