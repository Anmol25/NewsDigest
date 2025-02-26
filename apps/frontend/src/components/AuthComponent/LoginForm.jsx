import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import "./AuthComponent.css";
import logo from "../../assets/logo.png";
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { accessToken, login } = useAuth();
  const [WrongUser, setWrongUser] = useState(false);
  const [WrongPassword, setWrongPassword] = useState(false);
  const navigate = useNavigate();

  // If user is already logged in, redirect to home page  
  useEffect(() => {
    if (accessToken) {
      navigate('/');
    }
  }, [accessToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await login(formData);
        if (response.status == 401) {
          if (response.data.detail.user == false){
              setWrongUser(true);
          }
          else if (response.data.detail.password == false){
              setWrongPassword(true);
          }
        }
        else if (response.status == 200) {
          navigate('/');
        }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className='auth-form-page-container'>
      <div className='auth-form-header'>
        <img className='auth-form-logo' src={logo} alt="logo" />
      </div>
    <div className='auth-form-container'>
        <form className='auth-form' onSubmit={handleSubmit}>
          <h1 className='auth-form-title'>Login</h1>
          <div className='auth-form-input-container'>
            <label className='auth-form-label' htmlFor="username">Username</label>
            <input className='auth-form-input' type="text" value={username} placeholder='Enter your username' onChange={(e) => setUsername(e.target.value)} />
            {WrongUser && <p className='auth-form-error'>Invalid username</p>}
            <label className='auth-form-label' htmlFor="password">Password</label>
            <input className='auth-form-input' type="password" value={password} placeholder='Enter your password' onChange={(e) => setPassword(e.target.value)} />
            {WrongPassword && <p className='auth-form-error'>Invalid password</p>}
          </div>
          <button className='auth-form-button' type="submit">Login</button>
          <p className='auth-form-text'>Don't have an account? <Link className='auth-form-link' to="/register">Register</Link></p>
        </form>
    </div>
    </div>
  );
};

export default LoginForm;