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

  // Only render the outlet when we're not loading and have a token
  if (isLoading) {
    return null; // or a loading spinner
  }

  return accessToken ? <Outlet /> : null;
};

export default ProtectedRoute;