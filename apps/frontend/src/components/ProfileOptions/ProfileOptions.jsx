import "./ProfileOptions.css"
import { NavLink } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import history from "../../assets/history.svg"
import user from "../../assets/user.svg"
import exit from "../../assets/exit.svg"


function ProfileOptions(){
    const { logout } = useAuth();

    return(
        <div className="ProfileOptionsContainer">
            <div className="ProfileOptionsList">
                <NavLink to={"/profile/details"}>
                    <img src={user} alt="User" />
                    <span>Profile</span>
                </NavLink>
                <NavLink to={"/profile/history"}>
                    <img src={history} alt="History" />
                    <span>History</span>
                </NavLink>
                <button onClick={logout}>
                    <img src={exit} alt="Logout" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}

export default ProfileOptions;