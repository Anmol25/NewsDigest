import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/Authcontext';
import LoginForm from '../components/LoginForm';
import logo from '../assets/logo.png';
const Login = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [accessToken, navigate]);

  return (
    <div className="login-page-container">
      <div className="login-page-header">
        <img src={logo} alt="logo" />
      </div>
      <div className="login-page">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;