import { createContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm helper để lấy thông tin user từ Backend
  const fetchUserInfo = async () => {
    try {
      const response = await axiosClient.get('auth/me/');
      setUser(response.data); // Backend trả về { username, role, ... }
      return true;
    } catch (error) {
      console.error("Không thể lấy thông tin user:", error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth_type');
      setUser(null);
      return false;
    }
  };

  // Hàm Đăng nhập
  const login = async (username, password) => {
    try {
      // 1. Tạo Token Basic Auth
      const token = btoa(`${username}:${password}`); 
      
      // 2. Lưu tạm token để axiosClient có thể dùng ngay
      localStorage.setItem('access_token', token);
      localStorage.setItem('auth_type', 'basic');

      // 3. Gọi API /auth/me/ để kiểm tra token và lấy Role
      const success = await fetchUserInfo();
      
      if (success) {
        return true;
      } else {
        // Nếu gọi API thất bại (sai pass), xóa token
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_type');
        return false;
      }
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_type');
    setUser(null);
  };

  // Kiểm tra phiên đăng nhập khi F5 trang
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Thay vì set user giả, ta gọi API để lấy thông tin thật (có Role)
        await fetchUserInfo();
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};