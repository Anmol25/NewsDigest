import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const url = 'http://localhost:8000';


export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await axios.post(`${url}/refresh-token`);
        setAccessToken(response.data.access_token);
      } catch (error) {
        setAccessToken(null);
      }
    };
    refreshToken();
  }, []);

  const login = async (credentials) => {
    const response = await axios.post(`${url}/login`, credentials);
    setAccessToken(response.data.access_token);
  };

  const logout = async () => {
    try {
      await axios.post(`${url}/logout`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);