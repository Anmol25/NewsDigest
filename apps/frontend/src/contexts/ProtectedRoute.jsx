import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { accessToken, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [accessToken, navigate, location, isLoading]);

  if (isLoading) {
    return null;
  }

  return accessToken ? <Outlet /> : null;
};

export default ProtectedRoute;