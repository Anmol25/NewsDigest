import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '../services/AxiosConfig';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
  
    const refreshToken = async () => {
      try {
        const response = await axios.post(`/refresh-token`);
        setAccessToken(response.data.access_token);
      } catch (error) {
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
  
    useEffect(() => {
      refreshToken();
    }, []);
  
    const login = async (formdata) => {
      try {
        const response = await axios.post(`/token`, formdata);
        setAccessToken(response.data.access_token);
        return { status: 200, data: response.data };
      } catch (error) {
        return {
          status: error.response.status,
          data: error.response.data
        };
      }
    };
  
    const register = async (credentials) => {
      try {
        const response = await axios.post(`/register`, credentials);
        return { status: 200, data: response.data };
      } catch (error) {
        return {
          status: error.response.status,
          data: error.response.data
        };
      }
    };
    
    const logout = async () => {
      try {
        await axios.post(`/logout`);
        setAccessToken(null);
        navigate('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };
  
    return (
      <AuthContext.Provider value={{ 
        accessToken, 
        isLoading,
        login, 
        logout,
        register
      }}>
        {children}
      </AuthContext.Provider>
    );
};
  
export const useAuth = () => useContext(AuthContext);