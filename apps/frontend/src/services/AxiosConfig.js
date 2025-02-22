import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

export const useAxios = () => {
  const { accessToken } = useAuth(); // Get token from context

  useEffect(() => {
    // Request interceptor to add Authorization header
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
    };
  }, [accessToken]); // Runs when token changes

  return axiosInstance;
};


export default axiosInstance;
