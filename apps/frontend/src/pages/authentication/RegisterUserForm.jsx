import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import "./authentication.css";
import AuthFormMain from './authformmain';
import { Link, useNavigate } from 'react-router-dom';
import { validateRegistrationForm } from '../../services/validations';

const RegisterUserForm = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        username: '',
        password: ''
    });

    const [errors, setErrors] = useState({
        fullname: '',
        email: '',
        username: '',
        password: '',
        exists: {
            email: false,
            username: false
        }
    });

    const navigate = useNavigate();
    const { accessToken, register } = useAuth();

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
            exists: {
                ...prev.exists,
                [name]: false
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { errors: validationErrors, isValid } = validateRegistrationForm(formData);
        setErrors(prev => ({
            ...prev,
            ...validationErrors,
            exists: { email: false, username: false }
        }));

        if (!isValid) return;

        try {
            const credentials = {
                fullname: formData.fullname.trim(),
                email: formData.email.trim().toLowerCase(),
                username: formData.username.trim(),
                password: formData.password.trim()
            };
            
            const response = await register(credentials);
            if (response.status === 200) {
                navigate('/login');
            } else if (response.status === 409) {
                setErrors(prev => ({
                    ...prev,
                    exists: {
                        username: response.data.detail.userExists === true,
                        email: response.data.detail.emailExists === true
                    }
                }));
            }
        } catch (error) {
            console.error('Register failed:', error);
        }
    };

    return (
        <div className='auth-form-page-container'>
            <AuthFormMain />
            <div className='auth-form-container'>
                <form className='auth-form' onSubmit={handleSubmit}>
                    <h1 className='auth-form-title'>Register</h1>
                    <div className='auth-form-input-container'>
                        <label className='auth-form-label' htmlFor="fullname">Name</label>
                        <input 
                            className={`auth-form-input ${errors.fullname ? 'error-input' : ''}`}
                            type="text"
                            name="fullname"
                            value={formData.fullname}
                            placeholder='Enter your name'
                            onChange={handleInputChange}
                        />
                        {errors.fullname && <p className='auth-form-error'>{errors.fullname}</p>}

                        <label className='auth-form-label' htmlFor="email">Email</label>
                        <input 
                            className={`auth-form-input ${(errors.email || errors.exists.email) ? 'error-input' : ''}`}
                            type="email"
                            name="email"
                            value={formData.email}
                            placeholder='Enter your email'
                            onChange={handleInputChange}
                        />
                        {errors.email && <p className='auth-form-error'>{errors.email}</p>}
                        {errors.exists.email && <p className='auth-form-error'>Email already exists</p>}

                        <label className='auth-form-label' htmlFor="username">Username</label>
                        <input 
                            className={`auth-form-input ${(errors.username || errors.exists.username) ? 'error-input' : ''}`}
                            type="text"
                            name="username"
                            value={formData.username}
                            placeholder='Enter your username'
                            onChange={handleInputChange}
                        />
                        {errors.username && <p className='auth-form-error'>{errors.username}</p>}
                        {errors.exists.username && <p className='auth-form-error'>Username already exists</p>}

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
                    </div>  
                    <button className='auth-form-button' type="submit">Register</button>
                    <p className='auth-form-text'>
                        Already have an account? <Link className='auth-form-link' to="/login">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterUserForm;