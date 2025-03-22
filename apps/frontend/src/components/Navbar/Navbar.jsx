import logo from '../../assets/logo.png';
import profile from '../../assets/profile.svg';
import profileactive from '../../assets/profile_active.svg';
import search from '../../assets/search.svg';
import heart from '../../assets/heart.svg';
import bookmarked from '../../assets/bookmarked.svg';
import page from '../../assets/page.svg';
import pageactive from '../../assets/page_active.svg';
import './Navbar.css';
import { useNavigate, NavLink, useMatch } from 'react-router-dom';
import { useState, useEffect, useRef} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbarbottom from './Navbarbottom';

function Navbar(){
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef(null);
    const [isProfileHovered, setIsProfileHovered] = useState(false);
    const [isProfileClicked, setProfileClicked] = useState(false);
    const [isPageHovered, setIsPageHovered] = useState(false);
    const searchInputRef = useRef(null);
    const matchSearch = useMatch('/search/*');

    const matchSource = useMatch('/source/*');
    const matchSubscriptions = useMatch('/subscriptions/*');
    const isSubscriptionsActive = matchSource || matchSubscriptions;
    const isProfileActive = useMatch('/profile/*');
    const isBookmarksActive = useMatch('/bookmarks');
    const isLikesActive = useMatch('/likes');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
                setProfileClicked(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!matchSearch && searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    }, [matchSearch]);

    const handleSearch = (e) => {
        e.preventDefault();
        const searchQuery = e.target.search.value;
        navigate(`/search?query=${searchQuery}`);
    }

    const handleProfileClick = () => {
        setProfileClicked(!isProfileClicked);
        setShowProfileMenu(!showProfileMenu);
    };

    return (
        <div className='navbar-container'>
            <div className="navbar">
                <img 
                    className='logo' 
                    src={logo} 
                    alt="News Digest" 
                    onClick={() => navigate('/')}
                    style={{ cursor: 'pointer' }}
                />
                <form className='Searchform' onSubmit={handleSearch}>
                    <input 
                        className='Searchinput' 
                        type="text" 
                        placeholder="Search" 
                        name="search"
                        ref={searchInputRef}
                    />
                    <button className='searchbutton' type="submit">
                        <img className='searchicon' src={search} alt="Search" />
                    </button>
                </form>
                <div className="profile-container" ref={menuRef}>
                        <NavLink to='/subscriptions'>
                            <img
                                src={isSubscriptionsActive || isPageHovered ? pageactive : page}
                                alt="Swappable"
                                className='page'
                                onMouseEnter={() => setIsPageHovered(true)}
                                onMouseLeave={() => setIsPageHovered(false)}
                            />
                        </NavLink>
                        <NavLink to='/likes' className='liked-nav'>
                            <img className={isLikesActive ? 'liked-active': 'liked'} src={heart} alt="" />
                        </NavLink>
                        <NavLink to='/bookmarks' className='bookmarked-nav'>
                            <img className={isBookmarksActive ? 'bookmarked-active' : 'bookmarked'} src={bookmarked} alt="" />
                        </NavLink>
                        <img
                            className='profile'
                            src={isProfileActive || isProfileClicked || isProfileHovered ? profileactive : profile}
                            onClick={handleProfileClick}
                            onMouseEnter={() => setIsProfileHovered(true)}
                            onMouseLeave={() => setIsProfileHovered(false)}
                        />
                        {showProfileMenu && (
                            <div className="profile-menu">
                                <button onClick={() => navigate('/profile/details')}>Profile</button>
                                <button onClick={logout}>Logout</button>
                            </div>
                        )}
                </div>
            </div>
            <Navbarbottom />
        </div>
    )
}

export default Navbar;