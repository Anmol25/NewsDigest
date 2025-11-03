import React, { useState } from "react";
import ButtonShort from "./button-short";
import { SIDEBAR_TOP_LIST } from "../../constants/SIDEBAR_LIST";
import { useAuth } from '../../contexts/AuthContext';
import LogoutConfirm from './LogoutConfirm';

function SideBar2() {
    const { logout } = useAuth();
    const [isLogoutOpen, setLogoutOpen] = useState(false);

    const SIDEBAR_BOTTOM_LIST = [
        {name:'Settings',to:'/profile', image:'ri-settings-4-line', image_fill: 'ri-settings-4-fill'},
        // keep the route for accessibility/structure but open modal instead of directly logging out
        {name:'Log Out',to:'/logout', image:'ri-logout-box-line', image_fill: 'ri-logout-box-fill'}
    ];

    const handleConfirmLogout = async () => {
        // call logout from context (it's async and will navigate to login on success)
        await logout();
        setLogoutOpen(false);
    };

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
                    onClick={item.name === 'Log Out' ? () => setLogoutOpen(true) : (item as any).onclick}
                />
            ))}
        </div>

        <LogoutConfirm
            isOpen={isLogoutOpen}
            onClose={() => setLogoutOpen(false)}
            onConfirm={handleConfirmLogout}
        />
    </div>);
}

export default SideBar2;