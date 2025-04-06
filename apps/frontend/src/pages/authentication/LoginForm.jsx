import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import "./authentication.css";
import AuthFormMain from './authformmain';
import { Link, useNavigate } from 'react-router-dom';
import { validateLoginForm } from '../../services/validations';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    credentials: ''
  });

  const { accessToken, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      navigate('/');
    }
  }, [accessToken, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const trimmedValue = value.replace(/^\s+/g, '');
    
    setFormData(prev => ({
      ...prev,
      [name]: trimmedValue
    }));

    // Clear errors when user types
    setErrors(prev => ({
      ...prev,
      [name]: '',
      credentials: ''
    }));
  };

  const handleSubmit = async (e) => {   
    e.preventDefault();
    
    const { errors: validationErrors, isValid } = validateLoginForm(formData);
    setErrors(prev => ({
      ...prev,
      ...validationErrors,
      credentials: ''
    }));

    if (!isValid) return;

    try {
      const formDataToSend = new URLSearchParams();
      formDataToSend.append("username", formData.username.trim());
      formDataToSend.append("password", formData.password.trim());

      const response = await login(formDataToSend);
      
      if (response.status === 200) {
        navigate('/');
      } else if (response.status === 401) {
        setErrors(prev => ({
          ...prev,
          credentials: 'Invalid username or password'
        }));
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
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
              className={`auth-form-input ${errors.username ? 'error-input' : ''}`}
              type="text" 
              name="username"
              value={formData.username}
              placeholder='Enter your username'
              onChange={handleInputChange}
            />
            {errors.username && <p className='auth-form-error'>{errors.username}</p>}
            
            <label className='auth-form-label' htmlFor="password">Password</label>
            <input 
              className={`auth-form-input ${errors.password ? 'error-input' : ''}`}
              type="password"
              name="password"
              value={formData.password}
              placeholder='Enter your password'
              onChange={handleInputChange}
            />
            {errors.password && <p className='auth-form-error'>{errors.password}</p>}
            {errors.credentials && <p className='auth-form-error'>{errors.credentials}</p>}
          </div>
          <button className='auth-form-button' type="submit">Login</button>
          <p className='auth-form-text'>
            Don&apos;t have an account? <Link className='auth-form-link' to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;