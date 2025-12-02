import React, { useState, useEffect } from 'react';
import { Button, Form, Input, message, Row, Col, Card } from 'antd';
import { MailOutlined, ArrowLeftOutlined, RocketTwoTone } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../Auth.css';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Quên mật khẩu - Core CRM";
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axiosClient.post('auth/password-reset/', values);
      message.success('Đã gửi yêu cầu! Vui lòng kiểm tra Email (hoặc Terminal) để lấy link.');
      // Không chuyển trang ngay để người dùng đọc thông báo
    } catch (error) {
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ width: 400, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <RocketTwoTone style={{ fontSize: '40px' }} />
            <h2 style={{ marginBottom: 5 }}>Quên mật khẩu?</h2>
            <p style={{ color: '#888' }}>Nhập email để nhận link đặt lại</p>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Gửi yêu cầu
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
             <Link to="/login"><ArrowLeftOutlined /> Quay lại Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;