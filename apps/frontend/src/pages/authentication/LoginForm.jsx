import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import "./authentication.css";
import AuthFormMain from './authformmain';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: ''
  });
  const { accessToken, login } = useAuth();
  const navigate = useNavigate();
  const [invalidCredentials, setInvalidCredentials] = useState(false);

  // If user is already logged in, redirect to home page  
  useEffect(() => {
    if (accessToken) {
      navigate('/');
    }
  }, [accessToken, navigate]);

  const validateForm = () => {
    const errors = {
      username: '',
      password: ''
    };
    let isValid = true;

    // Username validation
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      errors.username = 'Username is required';
      isValid = false;
    }

    // Password validation
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      errors.password = 'Password is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {   
    e.preventDefault();
    setInvalidCredentials(false);
    setFormErrors({ username: '', password: '' });

    if (!validateForm()) {
      return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("username", username.trim());
        formData.append("password", password.trim());

        const response = await login(formData);
        if (response.status == 401) {
          setInvalidCredentials(true);
        }
        else if (response.status == 200) {
          navigate('/');
        }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleInputChange = (e, setter) => {
    // Remove leading/trailing spaces as user types
    setter(e.target.value.replace(/^\s+/g, ''));
  };

  return (
    <div className='auth-form-page-container'>
      <AuthFormMain />
      <div className='auth-form-container'>
        <form className='auth-form' onSubmit={handleSubmit}>
          <h1 className='auth-form-title'>Login</h1>
          <div className='auth-form-input-container'>
            <label className='auth-form-label' htmlFor="username">Username</label>
            <input 
              className={`auth-form-input ${formErrors.username ? 'error-input' : ''}`}
              type="text" 
              value={username}
              placeholder='Enter your username'
              onChange={(e) => handleInputChange(e, setUsername)}
            />
            {formErrors.username && <p className='auth-form-error'>{formErrors.username}</p>}
            
            <label className='auth-form-label' htmlFor="password">Password</label>
            <input 
              className={`auth-form-input ${formErrors.password ? 'error-input' : ''}`}
              type="password"
              value={password}
              placeholder='Enter your password'
              onChange={(e) => handleInputChange(e, setPassword)}
            />
            {formErrors.password && <p className='auth-form-error'>{formErrors.password}</p>}
            {invalidCredentials && <p className='auth-form-error'>Invalid username or password</p>}
          </div>
          <button className='auth-form-button' type="submit">Login</button>
          <p className='auth-form-text'>Don&apos;t have an account? <Link className='auth-form-link' to="/register">Register</Link></p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;