import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, RocketTwoTone } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../Auth.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- THÊM ĐOẠN NÀY ---
  useEffect(() => {
    document.title = "Đăng ký tài khoản - Core CRM";
  }, []);
  // ---------------------

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axiosClient.post('auth/register/', values);
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      message.error('Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="auth-wrapper">
      <Col xs={24} md={10} lg={8} className="auth-form-container">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <RocketTwoTone style={{ fontSize: '48px' }} />
            <h2 style={{ fontSize: '28px', margin: '10px 0', fontWeight: 'bold', color: '#001529' }}>Đăng ký</h2>
            <p style={{ color: '#888' }}>Tham gia đội ngũ kinh doanh ngay hôm nay</p>
          </div>

          <Form
            name="register"
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
              name="email"
              rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
            </Form.Item>
            
            <Form.Item
              name="role"
              initialValue="REP"
              label="Vai trò đăng ký"
            >
               <Select placeholder="Chọn vai trò">
                  <Select.Option value="REP">Nhân viên Kinh doanh (Sales Rep)</Select.Option>
                  <Select.Option value="MANAGER">Trưởng phòng (Manager)</Select.Option>
               </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 45, fontWeight: '600' }}>
                Đăng ký ngay
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 10 }}>
              Đã có tài khoản? <Link to="/login" style={{ fontWeight: 'bold', color: '#1890ff' }}>Đăng nhập</Link>
            </div>
          </Form>
        </div>
      </Col>

      <Col xs={0} md={14} lg={16} className="auth-banner-container">
        <img 
          src="https://img.freepik.com/free-vector/revenue-concept-illustration_114360-2936.jpg" 
          alt="Register Illustration" 
          className="banner-img" 
        />
        <h1 className="banner-title">Gia nhập Đội ngũ Chiến thắng</h1>
        <p className="banner-desc">
          Cung cấp công cụ mạnh mẽ giúp bạn kiểm soát mọi giao dịch, từ khách hàng tiềm năng đến khi chốt đơn.
        </p>
      </Col>
    </Row>
  );
};

export default RegisterPage;