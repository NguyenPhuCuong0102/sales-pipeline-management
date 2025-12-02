import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Import các trang
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './components/MainLayout';
import OpportunityPage from './pages/OpportunityPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import DashboardPage from './pages/DashboardPage';
import CustomerPage from './pages/CustomerPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SettingsPage from './pages/SettingsPage';
import KanbanPage from './pages/KanbanPage';
import ProfilePage from './pages/ProfilePage'; 
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';

// Component bảo vệ
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Đang tải...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirmPage />} />
          
          {/* Các trang nằm trong MainLayout */}
          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="opportunities" element={<OpportunityPage />} />
            <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
            <Route path="customers" element={<CustomerPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="kanban" element={<KanbanPage />} />
            
            {/* THÊM DÒNG NÀY ĐỂ TRANG PROFILE CHẠY ĐƯỢC */}
            <Route path="profile" element={<ProfilePage />} />
            
          </Route>  
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;