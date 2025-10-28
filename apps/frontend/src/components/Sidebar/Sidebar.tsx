import ButtonShort from "./button-short";
import { SIDEBAR_TOP_LIST } from "../../constants/SIDEBAR_LIST";
import { useAuth } from '../../contexts/AuthContext';

function SideBar2() {
    const { logout } = useAuth();

    const SIDEBAR_BOTTOM_LIST = [
        {name:'Settings',to:'/profile', image:'ri-settings-4-line', image_fill: 'ri-settings-4-fill'},
        {name:'Log Out',to:'/logout', image:'ri-logout-box-line', image_fill: 'ri-logout-box-fill', onclick: logout}
    ];

    return (<div className="fixed mt-16 flex flex-col justify-between h-[calc(100vh-4rem)] w-22 z-800">
        <div>
            {SIDEBAR_TOP_LIST.map((item, index) => (
                <ButtonShort
                    key={index}
                    image={item.image}
                    name={item.name}
                    to={item.to}
                    image_fill={item.image_fill}
                />
            ))}
        </div>
        <div>
            {SIDEBAR_BOTTOM_LIST.map((item, index) => (
                <ButtonShort
                    key={index}
                    image={item.image}
                    name={item.name}
                    to={item.to}
                    image_fill={item.image_fill}
                    onClick={item.onclick}
                />
            ))}
        </div>
    </div>);
}

export default SideBar2;