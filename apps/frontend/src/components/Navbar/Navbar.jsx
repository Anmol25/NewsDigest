import logo from '../../assets/logo.png';
import profile from '../../assets/defaultphoto.jpg';
import search from '../../assets/search.png';
import './Navbar.css';

function Navbar(){
    return (
        <div className="navbar">
            <img className='logo' src={logo} alt="News Digest"/>
            <form className='Searchform'>
                <input className='Searchinput' type="text" placeholder="Search" name="search"/>
                <button className='searchbutton' type="submit"><img className='searchicon' src={search} alt="Search" /></button>
            </form>
            <img className='profile' src={profile} alt="Profile" />
        </div>
    )
}

export default Navbar;