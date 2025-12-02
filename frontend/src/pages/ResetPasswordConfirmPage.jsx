import React, { useState, useEffect } from 'react';
import { Button, Form, Input, message, Card } from 'antd';
import { LockOutlined, RocketTwoTone } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const ResetPasswordConfirmPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { uid, token } = useParams(); // Lấy tham số từ URL

  useEffect(() => {
    document.title = "Đặt lại mật khẩu - Core CRM";
  }, []);

  const onFinish = async (values) => {
    if (values.new_password !== values.confirm_password) {
        return message.error('Mật khẩu xác nhận không khớp!');
    }

    setLoading(true);
    try {
      await axiosClient.post('auth/password-reset-confirm/', {
        uid: uid,
        token: token,
        new_password: values.new_password
      });
      message.success('Thành công! Đang chuyển về trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error(error);
      message.error('Link không hợp lệ hoặc đã hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ width: 400, borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <RocketTwoTone style={{ fontSize: '40px' }} />
            <h2 style={{ marginBottom: 5 }}>Đặt lại mật khẩu</h2>
            <p style={{ color: '#888' }}>Nhập mật khẩu mới của bạn</p>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="new_password"
            rules={[{ required: true, message: 'Nhập mật khẩu mới' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" size="large" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            dependencies={['new_password']}
            rules={[{ required: true, message: 'Xác nhận mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordConfirmPage;