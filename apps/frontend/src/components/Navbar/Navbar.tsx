import logo from '../../assets/logo.png';
import SearchBar from './searchbar/searchbar';
import { NavLink } from "react-router-dom";

function NavBar2() {
    return (
        <div className="flex flex-row fixed bg-basePrimary items-center justify-between w-full h-16 pl-7 py-2.5 z-900">
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
                <NavLink
                    className={({ isActive }) =>
                        `text-basePrimary  font-semibold bg-gradient-to-r from-indigo-800 via-violet-600 to-pink-800 px-5 py-2 rounded-3xl ${isActive ? 'shadow-chatActive' : ' hover:animate-hoverShadowEffect'
                        }`
                    }
                    to='/chat'>
                    Chat
                </NavLink>
            </div>
        </div>);
}

export default NavBar2;