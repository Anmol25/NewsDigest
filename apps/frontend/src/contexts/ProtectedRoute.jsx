import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { accessToken, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!isLoading && !accessToken) {
      navigate('/login', { state: { from: location.pathname } });
    } else if (accessToken && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [accessToken, navigate, location, isLoading, isInitialLoad]);

  return (!isLoading && accessToken) ? <Outlet /> : null;
};

export default ProtectedRoute;