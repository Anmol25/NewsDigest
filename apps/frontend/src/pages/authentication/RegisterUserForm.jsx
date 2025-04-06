import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import "./authentication.css";
import AuthFormMain from './authformmain';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const RegisterUserForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState({
        name: '',
        email: '',
        username: '',
        password: ''
    });
    const [userExists, setUserExists] = useState(false);
    const [emailExists, setEmailExists] = useState(false);

    const navigate = useNavigate();
    
    const { accessToken, register } = useAuth();

    useEffect(() => {
        if (accessToken) {
            navigate('/');
        }
    }, [accessToken, navigate]);

    const validateForm = () => {
        const errors = {
            name: '',
            email: '',
            username: '',
            password: ''
        };
        let isValid = true;

        // Name validation
        const trimmedName = name.trim();
        if (!trimmedName) {
            errors.name = 'Name is required';
            isValid = false;
        } else if (trimmedName.length < 2) {
            errors.name = 'Name must be at least 2 characters long';
            isValid = false;
        }

        // Email validation
        const trimmedEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(trimmedEmail)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Username validation
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            errors.username = 'Username is required';
            isValid = false;
        } else if (trimmedUsername.length < 3) {
            errors.username = 'Username must be at least 3 characters long';
            isValid = false;
        }

        // Password validation
        const trimmedPassword = password.trim();
        if (!trimmedPassword) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (trimmedPassword.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleInputChange = (e, setter) => {
        // Remove leading/trailing spaces as user types
        setter(e.target.value.replace(/^\s+/g, ''));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUserExists(false);
        setEmailExists(false);
        setFormErrors({
            name: '',
            email: '',
            username: '',
            password: ''
        });

        if (!validateForm()) {
            return;
        }

        try {
            const credentials = {
                "fullname": name.trim(),
                "email": email.trim().toLowerCase(),
                "username": username.trim(),
                "password": password.trim()
            };
            
            const response = await register(credentials);
            if (response.status == 200) {
                navigate('/login');
            }
            else if (response.status == 409) {
                if (response.data.detail.userExists == true) {
                    setUserExists(true);
                }
                if (response.data.detail.emailExists == true) {
                    setEmailExists(true);
                }
            }
        } catch (error) {
            console.error('Register failed:', error);
        }
    }

    return (
        <div className='auth-form-page-container'>
            <AuthFormMain />
            <div className='auth-form-container'>
                <form className='auth-form' onSubmit={handleSubmit}>
                    <h1 className='auth-form-title'>Register</h1>
                    <div className='auth-form-input-container'>
                        <label className='auth-form-label' htmlFor="name">Name</label>
                        <input 
                            className={`auth-form-input ${formErrors.name ? 'error-input' : ''}`}
                            type="text"
                            value={name}
                            placeholder='Enter your name'
                            onChange={(e) => handleInputChange(e, setName)}
                        />
                        {formErrors.name && <p className='auth-form-error'>{formErrors.name}</p>}

                        <label className='auth-form-label' htmlFor="email">Email</label>
                        <input 
                            className={`auth-form-input ${formErrors.email ? 'error-input' : ''}`}
                            type="email"
                            value={email}
                            placeholder='Enter your email'
                            onChange={(e) => handleInputChange(e, setEmail)}
                        />
                        {formErrors.email && <p className='auth-form-error'>{formErrors.email}</p>}
                        {emailExists && <p className='auth-form-error'>Email already exists</p>}

                        <label className='auth-form-label' htmlFor="username">Username</label>
                        <input 
                            className={`auth-form-input ${formErrors.username ? 'error-input' : ''}`}
                            type="text"
                            value={username}
                            placeholder='Enter your username'
                            onChange={(e) => handleInputChange(e, setUsername)}
                        />
                        {formErrors.username && <p className='auth-form-error'>{formErrors.username}</p>}
                        {userExists && <p className='auth-form-error'>Username already exists</p>}

                        <label className='auth-form-label' htmlFor="password">Password</label>
                        <input 
                            className={`auth-form-input ${formErrors.password ? 'error-input' : ''}`}
                            type="password"
                            value={password}
                            placeholder='Enter your password'
                            onChange={(e) => handleInputChange(e, setPassword)}
                        />
                        {formErrors.password && <p className='auth-form-error'>{formErrors.password}</p>}
                    </div>  
                    <button className='auth-form-button' type="submit">Register</button>
                    <p className='auth-form-text'>Already have an account? <Link className='auth-form-link' to="/login">Login</Link></p>
                </form>
            </div>
        </div>
    )
}

export default RegisterUserForm;