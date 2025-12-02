import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, RocketTwoTone } from '@ant-design/icons';
import '../Auth.css';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- THÊM ĐOẠN NÀY ---
  useEffect(() => {
    document.title = "Đăng nhập - Core CRM";
  }, []);
  // ---------------------

  const onFinish = async (values) => {
    setLoading(true);
    const success = await login(values.username, values.password);
    setLoading(false);
    
    if (success) {
      message.success('Đăng nhập thành công!');
      navigate('/');
    } else {
      message.error('Sai thông tin đăng nhập!');
    }
  };

  return (
    <Row className="auth-wrapper">
      <Col xs={24} md={10} lg={8} className="auth-form-container">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <RocketTwoTone style={{ fontSize: '48px' }} />
            <h2 style={{ fontSize: '28px', margin: '10px 0', fontWeight: 'bold', color: '#001529' }}>Đăng nhập</h2>
            <p style={{ color: '#888' }}>Chào mừng quay trở lại với Core CRM</p>
          </div>

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập Tên đăng nhập!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ</Checkbox>
              </Form.Item>
              <Link to="/forgot-password" style={{ float: 'right', color: '#1890ff' }}>
                Quên mật khẩu?
              </Link>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 45, fontWeight: '600' }}>
                Đăng nhập
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              Chưa có tài khoản? <Link to="/register" style={{ fontWeight: 'bold', color: '#1890ff' }}>Đăng ký ngay</Link>
            </div>
          </Form>
        </div>
      </Col>

      <Col xs={0} md={14} lg={16} className="auth-banner-container">
        <img 
          src="https://img.freepik.com/free-vector/sales-consulting-concept-illustration_114360-9025.jpg" 
          alt="Login Illustration" 
          className="banner-img" 
        />
        <h1 className="banner-title">Quản lý Pipeline Hiệu quả</h1>
        <p className="banner-desc">
          Theo dõi hành trình khách hàng, tối ưu hóa tỷ lệ chuyển đổi và thúc đẩy doanh thu của bạn ngay hôm nay.
        </p>
      </Col>
    </Row>
  );
};

export default LoginPage;