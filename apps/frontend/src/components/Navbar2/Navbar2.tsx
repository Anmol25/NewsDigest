import logo from '../../assets/logo.png';
import SearchBar from './searchbar/searchbar';
import { NavLink } from "react-router-dom";

function NavBar2() {
    return (
    <div className="flex flex-row fixed bg-basePrimary items-center justify-between w-full h-16 px-7 py-2.5 z-900">
        <div className="flex flex-row items-center gap-4">
            <div style={{ fontSize: '30px' }}>
                <i className="ri-menu-line"></i>
            </div>
            <img
                className='h-10'
                src={logo}
                alt="News Digest"
                style={{ cursor: 'pointer' }}
            />
        </div>
        <div className='absolute left-1/2 transform -translate-x-1/2'>
            <SearchBar />
        </div>
        <div className='flex flex-row gap-10 px-6'>
            <NavLink className= 'text-textPrimary border border-textPrimary shadow-md px-5 py-2 rounded-3xl hover:animate-hoverShadowEffect'>
                Chat
            </NavLink>
            <NavLink className='flex items-center'>
                Profile
            </NavLink>
        </div>
    </div>);
}

export default NavBar2;