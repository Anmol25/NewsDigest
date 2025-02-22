import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/AuthComponent/LoginForm';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (formData) => {
    try {
      await login(formData);
      // Navigate to the saved location or default to top-stories
      const from = location.state?.from || '/top-stories';
      navigate(from);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <LoginForm onLogin={handleLogin} />
  );
};

export default Login;