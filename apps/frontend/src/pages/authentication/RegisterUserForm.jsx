import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import "./authentication.css";
import logo from "../../assets/logo.png";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const RegisterUserForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userExists, setUserExists] = useState(false);
    const [emailExists, setEmailExists] = useState(false);

    const navigate = useNavigate();
    
    const { accessToken, register } = useAuth();

    useEffect(() => {
        if (accessToken) {
            navigate('/');
        }
    }, [accessToken, navigate]);

    const handleSubmit = async (e) => {
        // Reset the error messages
        setUserExists(false);
        setEmailExists(false);
        e.preventDefault();
        try {
            const credentials = { "fullname": name, "email": email, "username": username, "password": password };
            const response = await register(credentials);
            if (response.status == 200) {
                navigate('/login');
            }
            else if (response.status == 409) {
                console.log(response.data.detail);
                if (response.data.detail.userExists == true){
                    setUserExists(true);
                }
                if (response.data.detail.emailExists == true){
                    setEmailExists(true);
                }
            }
        } catch (error) {
            console.error('Register failed:', error);
        }
    }

    return (
        <div className='auth-form-page-container'>
            <div className='auth-form-header'>
                <img className='auth-form-logo' src={logo} alt="logo" />
            </div>
            <div className='auth-form-container'>
                <form className='auth-form' onSubmit={handleSubmit}>
                    <h1 className='auth-form-title'>Register</h1>
                    <div className='auth-form-input-container'>
                        <label className='auth-form-label' htmlFor="name">Name</label>
                        <input className='auth-form-input' type="text" value={name} placeholder='Enter your name' onChange={(e) => setName(e.target.value)} />
                        <label className='auth-form-label' htmlFor="email">Email</label>
                        <input className='auth-form-input' type="email" value={email} placeholder='Enter your email' onChange={(e) => setEmail(e.target.value)} />
                        {emailExists && <p className='auth-form-error'>Email already exists</p>}
                        <label className='auth-form-label' htmlFor="username">Username</label>
                        <input className='auth-form-input' type="text" value={username} placeholder='Enter your username' onChange={(e) => setUsername(e.target.value)} />
                        {userExists && <p className='auth-form-error'>Username already exists</p>}
                        <label className='auth-form-label' htmlFor="password">Password</label>
                        <input className='auth-form-input' type="password" value={password} placeholder='Enter your password' onChange={(e) => setPassword(e.target.value)} />
                    </div>  
                    <button className='auth-form-button' type="submit">Register</button>
                    <p className='auth-form-text'>Already have an account? <Link className='auth-form-link' to="/login">Login</Link></p>
                </form>
            </div>
        </div>
    )
}

export default RegisterUserForm;