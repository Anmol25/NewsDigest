import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '../services/AxiosConfig';

const AuthContext = createContext();



export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
  
    const refreshToken = async () => {
      try {
        const response = await axios.post(`/refresh-token`);
        setAccessToken(response.data.access_token);
      } catch (error) {
        setAccessToken(null);
      }
    };
  
    useEffect(() => {
      refreshToken();
    }, []);
  
    const login = async (formdata) => {
      try {
        const response = await axios.post(`/token`, formdata);
        setAccessToken(response.data.access_token);
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    };
  
    const logout = async () => {
      try {
        await axios.post(`/logout`);
      } catch (error) {
        console.error('Logout failed:', error);
      }
      setAccessToken(null);
    };
  
    return (
      <AuthContext.Provider value={{ 
        accessToken, 
        login, 
        logout 
      }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = () => useContext(AuthContext);