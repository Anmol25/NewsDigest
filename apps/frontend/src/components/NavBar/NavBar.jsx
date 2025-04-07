import logo from '../../assets/logo.png';
import profile from '../../assets/Icons/profile.svg';
import profileactive from '../../assets/Icons/profile_active.svg';
import search from '../../assets/Icons/search.svg';
import heart from '../../assets/Icons/heart.svg';
import bookmarked from '../../assets/Icons/bookmarked.svg';
import page from '../../assets/Icons/page.svg';
import pageactive from '../../assets/Icons/page_active.svg';
import user from '../../assets/Icons/user.svg';
import history from '../../assets/Icons/history.svg'
import exit from '../../assets/Icons/exit.svg'
import hamburger from '../../assets/Icons/hamburger.svg';
import './NavBar.css';
import { useNavigate, NavLink, useMatch } from 'react-router-dom';
import { useState, useEffect, useRef} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NavBarBottom from './NavBarBottom';

function NavBar(){
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const menuRef = useRef(null);
    const [isProfileHovered, setIsProfileHovered] = useState(false);
    const [isProfileClicked, setProfileClicked] = useState(false);
    const [isPageHovered, setIsPageHovered] = useState(false);
    const searchInputRef = useRef(null);
    const matchSearch = useMatch('/search/*');
    const [useContext, setUseContext] = useState(false);

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
            setUseContext(false);
        }
    }, [matchSearch]);

    const handleSearch = (e) => {
        e.preventDefault();
        const searchQuery = e.target.search.value.trim();
        if (!searchQuery) {
            if (searchInputRef.current) {
                searchInputRef.current.value = '';
            }
            return;
        }
        navigate(`/search?query=${searchQuery}${useContext ? '&context=true' : ''}`);
    }

    const handleProfileClick = () => {
        setProfileClicked(!isProfileClicked);
        setShowProfileMenu(!showProfileMenu);
    };

    const handleProfileMenuNavigation = (path) => {
        navigate(path);
        setShowProfileMenu(false);
        setProfileClicked(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
        document.dispatchEvent(new CustomEvent('sidebarToggle', {
            detail: { isOpen: !sidebarOpen }
        }));
    };

    return (
        <div className='navbar-container'>
            <div className="navbar">
                <div className="navbar-left">
                    <img 
                        className='hamburger' 
                        src={hamburger} 
                        alt="Hamburger" 
                        onClick={toggleSidebar}
                    />
                    <img 
                        className='logo' 
                        src={logo} 
                        alt="News Digest" 
                        onClick={() => navigate('/')}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
                
                <form className='Searchform' onSubmit={handleSearch}>
                    <input 
                        className='Searchinput' 
                        type="text" 
                        placeholder="Search" 
                        name="search"
                        ref={searchInputRef}
                    />
                    <div className='context-button-container'>
                    <button 
                        type="button" 
                        className={`context-button ${useContext ? 'context-active' : ''}`}
                        onClick={() => setUseContext(!useContext)}
                    >
                        Context
                    </button>
                    </div>
                    
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
                                <button onClick={() => handleProfileMenuNavigation('/profile/details')}>
                                    <img className='profileimg' src={user} alt="User" />
                                    Profile
                                </button>
                                <button onClick={() => handleProfileMenuNavigation('/profile/history')}>
                                    <img className='profileimg' src={history} alt="History" />
                                    History
                                </button>
                                <button onClick={() => {
                                    setShowProfileMenu(false);
                                    setProfileClicked(false);
                                    logout();
                                }}>
                                    <img className='profileimg' src={exit} alt="Exit" />
                                    Logout
                                </button>
                            </div>
                        )}
                </div>
            </div>
            <NavBarBottom />
        </div>
    )
}

export default NavBar;