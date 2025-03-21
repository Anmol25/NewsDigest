import "./SubscriptionsPage.css"
import pageactive from "../../assets/page_active.svg"

function SubscriptionsPage(){

    return (
        <div className="SubscriptionsContainer">
            <div className="MainHeadings">
                <img className="MainHeadingIcon" src={pageactive} alt="" />
                <p className="MainHeadingTitle">Subscriptions</p>
            </div>
        </div>
    )
}

export default SubscriptionsPage;