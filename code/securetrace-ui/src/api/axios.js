import axios from 'axios';

// Base URL points to your .NET API
// When deployed to Azure, this will be overridden by environment variable
const api = axios.create({
  baseURL: 'https://localhost:63094', // ← your local API port
});

// Interceptor: automatically attach the JWT token to every request
// so we don't have to manually add it in every component
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: if API returns 401, clear the token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
