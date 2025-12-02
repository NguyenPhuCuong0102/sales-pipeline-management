import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Địa chỉ Backend Django
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động thêm Token vào mỗi yêu cầu nếu đã đăng nhập
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const authType = localStorage.getItem('auth_type');
  
  if (token) {
    if (authType === 'basic') {
        config.headers.Authorization = `Basic ${token}`;
    } else {
        config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default axiosClient;