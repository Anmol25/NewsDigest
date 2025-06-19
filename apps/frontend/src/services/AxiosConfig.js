import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const useAxios = () => {
  const { accessToken, refreshToken } = useAuth(); // Add refreshToken to destructuring

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

    // Response interceptor to handle token refresh
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Check if the request URL is the refresh token endpoint
        const isRefreshTokenRequest = originalRequest.url === '/refresh-token';

        // If error is 401 and we haven't tried to refresh token yet and it's not a refresh token request
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshTokenRequest) {
          originalRequest._retry = true;

          try {
            const newToken = await refreshToken();
            // Update the original request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            // Create a new request with the updated token
            return await axios({
              ...originalRequest,
              headers: {
                ...originalRequest.headers,
                Authorization: `Bearer ${newToken}`
              }
            });
          } catch (refreshError) {
            // If refresh token fails, reject the promise
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken]); // Add refreshToken to dependencies

  return axiosInstance;
};


export default axiosInstance;
