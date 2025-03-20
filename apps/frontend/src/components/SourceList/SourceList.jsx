import "./SourceList.css"
import { NavLink } from "react-router-dom";

function SourceList(){
    const sourcelist = ["The Times Of India", "NDTV", "Firstpost", "India Today",
        "Hindustan Times", "India TV", "Zee News","DNA India","News18"];

    return(
        <div className="SourceListContainer">
            <div className="SourceList">
                {sourcelist.map((item, index) =>
                <NavLink key={index}>
                    <p className="SourceName">{item}</p>
                </NavLink>)}
            </div>
        </div>
    )
}

export default SourceList;