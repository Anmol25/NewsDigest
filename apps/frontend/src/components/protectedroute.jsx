import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/Authcontext';

const ProtectedRoute = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
    }
  }, [accessToken, navigate]);

  return accessToken ? <Outlet /> : null;
};

export default ProtectedRoute;