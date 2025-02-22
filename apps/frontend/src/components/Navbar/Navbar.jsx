import logo from '../../assets/logo.png';
import profile from '../../assets/defaultphoto.jpg';
import search from '../../assets/search.png';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';

function Navbar(){
    const navigate = useNavigate();
    const handleSearch = (e) => {
        e.preventDefault();
        const searchQuery = e.target.search.value;
        navigate(`/search?query=${searchQuery}`);
    }
    return (
        
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
            <img className='profile' src={profile} alt="Profile" />
        </div>
    )
}

export default Navbar;