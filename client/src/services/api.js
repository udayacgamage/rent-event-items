import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventGoodsToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eventGoodsToken');
      if (window.location.pathname !== '/' && window.location.pathname !== '/admin') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
