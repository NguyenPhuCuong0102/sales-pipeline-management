import React, { useContext } from 'react';
import { Layout, Menu, theme, Avatar } from 'antd';
import { 
  DashboardOutlined, 
  ProjectOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (e) => {
    if (e.key === 'logout') {
      logout();
    } else {
      navigate(e.key);
    }
  };

  const mainMenuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/kanban', icon: <AppstoreOutlined />, label: 'Pipeline (Kanban)' },
    { key: '/opportunities', icon: <ProjectOutlined />, label: 'Cơ hội bán hàng' },
    { key: '/customers', icon: <TeamOutlined />, label: 'Khách hàng' },
    (user?.role === 'MANAGER') && {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Quản trị hệ thống',
    },
  ];

  const footerMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
  ];

  return (
    // THAY ĐỔI 1: Đặt chiều cao cố định 100vh và ẩn cuộn ở khung ngoài
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      
      <Sider collapsible breakpoint="lg" collapsedWidth="0">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Logo */}
            <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', letterSpacing: '1px', flexShrink: 0 }}>
              CORE CRM
            </div>

            {/* Menu Chính */}
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={handleMenuClick}
              items={mainMenuItems.filter(Boolean)}
              style={{ flex: 1, overflowY: 'auto' }} // Menu dài quá thì cuộn riêng menu
            />

            {/* Menu Đăng xuất */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Menu theme="dark" mode="inline" onClick={handleMenuClick} items={footerMenuItems} selectable={false} />
            </div>
            
            <div style={{ height: 8 }} /> 
        </div>
      </Sider>

      {/* THAY ĐỔI 2: Cho phép cuộn ở khung bên phải (Header + Content) */}
      <Layout style={{ overflowY: 'auto' }}>
        
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,0.08)', position: 'sticky', top: 0, zIndex: 1, width: '100%' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Hệ thống Quản lý Bán hàng</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <span style={{ marginRight: 8 }}>
                Xin chào, 
                <b style={{ cursor: 'pointer', color: '#1890ff', marginLeft: 4 }} onClick={() => navigate('/profile')}>
                    {user?.username}
                </b> 
                <span style={{ fontSize: '12px', color: '#888', marginLeft: 5 }}>({user?.role})</span>
             </span>
             <Avatar style={{ backgroundColor: '#1890ff', cursor: 'pointer' }} icon={<UserOutlined />} onClick={() => navigate('/profile')} />
          </div>
        </Header>

        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;