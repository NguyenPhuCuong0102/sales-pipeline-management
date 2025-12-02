import React, { useContext, useEffect, useState } from 'react';
import { Card, Tabs, Form, Input, Button, message, Avatar } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formInfo] = Form.useForm();
  const [formPass] = Form.useForm();

  useEffect(() => {
    document.title = "Hồ sơ cá nhân - Core CRM";
    if (user) {
      formInfo.setFieldsValue({
        username: user.username,
        email: user.email,
        role: user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'MANAGER' ? 'Trưởng phòng' : 'Nhân viên'
      });
    }
  }, [user]);

  const handleUpdateInfo = async (values) => {
    setLoading(true);
    try {
      await axiosClient.put('auth/me/', { email: values.email });
      message.success('Cập nhật thông tin thành công!');
    } catch (error) {
      message.error('Lỗi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    if (values.new_password !== values.confirm_password) {
      return message.error('Mật khẩu xác nhận không khớp!');
    }
    
    setLoading(true);
    try {
      await axiosClient.put('auth/change-password/', {
        old_password: values.old_password,
        new_password: values.new_password
      });
      message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      formPass.resetFields();
    } catch (error) {
      if (error.response?.data?.old_password) {
         message.error(error.response.data.old_password[0]);
      } else {
         message.error('Lỗi đổi mật khẩu');
      }
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: '1',
      label: <span><UserOutlined /> Thông tin chung</span>,
      children: (
        <Form form={formInfo} layout="vertical" onFinish={handleUpdateInfo} style={{ maxWidth: 400 }}>
          <Form.Item label="Tên đăng nhập" name="username">
            <Input prefix={<UserOutlined />} disabled />
          </Form.Item>
          <Form.Item label="Vai trò" name="role">
            <Input prefix={<SafetyOutlined />} disabled />
          </Form.Item>
          <Form.Item 
            label="Email" 
            name="email" 
            rules={[{ type: 'email', message: 'Email không hợp lệ' }, { required: true, message: 'Vui lòng nhập email' }]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Lưu thay đổi</Button>
        </Form>
      ),
    },
    {
      key: '2',
      label: <span><LockOutlined /> Đổi mật khẩu</span>,
      children: (
        <Form form={formPass} layout="vertical" onFinish={handleChangePassword} style={{ maxWidth: 400 }}>
          <Form.Item 
            label="Mật khẩu hiện tại" 
            name="old_password" 
            rules={[{ required: true, message: 'Nhập mật khẩu cũ' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item 
            label="Mật khẩu mới" 
            name="new_password" 
            rules={[{ required: true, message: 'Nhập mật khẩu mới' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item 
            label="Xác nhận mật khẩu mới" 
            name="confirm_password" 
            rules={[{ required: true, message: 'Nhập lại mật khẩu mới' }]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" danger htmlType="submit" loading={loading}>Đổi mật khẩu</Button>
        </Form>
      ),
    },
  ];

  return (
    <div>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar size={64} style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
            <div>
                <h2 style={{ margin: 0 }}>{user?.username}</h2>
                <span style={{ color: '#888' }}>{user?.email}</span>
            </div>
        </div>

        <Card>
            <Tabs defaultActiveKey="1" items={items} />
        </Card>
    </div>
  );
};

export default ProfilePage;