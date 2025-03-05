import logo from '../../assets/logo.png';
import profile from '../../assets/defaultphoto.jpg';
import search from '../../assets/search.png';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbarbottom from './Navbarbottom';

function Navbar(){
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef(null);
    const topics = ["For You", "Top Stories", "Latest", "India", "World", "Economy",
        "Science", "Tech", "Sports", "Entertainment"];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const searchQuery = e.target.search.value;
        navigate(`/search?query=${searchQuery}`);
    }

    const handleProfileClick = () => {
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
                    <input className='Searchinput' type="text" placeholder="Search" name="search"/>
                    <button className='searchbutton' type="submit"><img className='searchicon' src={search} alt="Search" /></button>
                </form>
                <div className="profile-container" ref={menuRef}>
                    <img 
                        className='profile' 
                        src={profile} 
                        alt="Profile" 
                        onClick={handleProfileClick}
                        style={{ cursor: 'pointer' }}
                    />
                    {showProfileMenu && (
                        <div className="profile-menu">
                            {/* <button onClick={() => navigate('/profile')}>Profile</button> */}
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