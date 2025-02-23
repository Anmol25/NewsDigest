import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/AuthComponent/LoginForm';

const Login = () => {
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    try {
      await login(formData);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <LoginForm onLogin={handleLogin} />
  );
};

export default Login;