import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RegisterUserForm from '../components/AuthComponent/RegisterUserForm';

const RegisterUser = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) {
      navigate('/');
    } else {
      navigate('/register');
    }
  }, [accessToken, navigate]);

  return (
    <RegisterUserForm />
  );
};

export default RegisterUser;