import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Input, Modal, Form, message, Tag, Space, InputNumber, Select, Popconfirm } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  UserOutlined, 
  OrderedListOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

const SettingsPage = () => {
  useEffect(() => {
    document.title = "Quản trị hệ thống - Core CRM";
  }, []);

  const items = [
    {
      key: '1',
      label: <span><OrderedListOutlined /> Cấu hình Pipeline</span>,
      children: <PipelineSettings />,
    },
    {
      key: '2',
      label: <span><UserOutlined /> Quản lý Nhân viên</span>,
      children: <UserListSettings />,
    },
  ];

  return (
    <div>
      <h2>⚙️ Cài đặt Hệ thống</h2>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

// --- 1. COMPONENT QUẢN LÝ GIAI ĐOẠN (GIỮ NGUYÊN) ---
const PipelineSettings = () => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchStages = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('stages/');
      setStages(Array.isArray(res.data) ? res.data : res.data.results);
    } catch (error) {
      message.error('Lỗi tải giai đoạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStages(); }, []);

  const handleAddStage = async (values) => {
    try {
      await axiosClient.post('stages/', values);
      message.success('Thêm giai đoạn thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchStages();
    } catch (error) {
      message.error('Lỗi khi thêm giai đoạn');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`stages/${id}/`);
      message.success('Đã xóa giai đoạn');
      fetchStages();
    } catch (error) {
      message.error('Không thể xóa (Có thể đang chứa giao dịch)');
    }
  };

  const columns = [
    { title: 'Thứ tự', dataIndex: 'order', key: 'order', width: 80, align: 'center' },
    { title: 'Tên Giai đoạn', dataIndex: 'name', key: 'name', render: text => <b>{text}</b> },
    { 
      title: 'Hành động', 
      key: 'action', 
      render: (_, record) => (
        <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>Xóa</Button>
      ) 
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Thêm Giai đoạn mới
        </Button>
      </div>
      <Table dataSource={stages} columns={columns} rowKey="id" loading={loading} pagination={false} />

      <Modal title="Thêm Giai đoạn Pipeline" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} onFinish={handleAddStage} layout="vertical">
          <Form.Item name="name" label="Tên giai đoạn" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Đã gửi báo giá" />
          </Form.Item>
          <Form.Item name="type" label="Loại giai đoạn" rules={[{ required: true }]} initialValue="OPEN">
            <Select>
                <Select.Option value="OPEN">🔵 Đang xử lý (Open)</Select.Option>
                <Select.Option value="WON">🟢 Thành công (Won)</Select.Option>
                <Select.Option value="LOST">🔴 Thất bại (Lost)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="order" label="Thứ tự hiển thị" rules={[{ required: true }]} initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Lưu</Button>
        </Form>
      </Modal>
    </div>
  );
};

// --- 2. COMPONENT QUẢN LÝ NHÂN VIÊN (ĐÃ NÂNG CẤP) ---
const UserListSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Lưu user đang sửa (nếu có)
  const [form] = Form.useForm();

  // Tải danh sách
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('auth/users/'); 
      setUsers(Array.isArray(res.data) ? res.data : res.data.results);
    } catch (error) {
      message.error('Lỗi tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý mở modal (Thêm hoặc Sửa)
  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue(user); // Điền dữ liệu cũ nếu là sửa
    } else {
      form.resetFields(); // Reset nếu là thêm mới
    }
    setIsModalOpen(true);
  };

  // Xử lý Submit (Thêm hoặc Sửa)
  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        // --- LOGIC SỬA (PATCH) ---
        await axiosClient.patch(`auth/users/${editingUser.id}/`, values);
        message.success('Cập nhật nhân viên thành công');
      } else {
        // --- LOGIC THÊM (POST) ---
        await axiosClient.post('auth/users/', values);
        message.success('Thêm nhân viên thành công');
      }
      
      setIsModalOpen(false);
      fetchUsers(); // Tải lại danh sách
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra! (Có thể tên đăng nhập đã trùng)');
    }
  };

  // Xử lý Xóa
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`auth/users/${id}/`);
      message.success('Đã xóa nhân viên');
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi xóa nhân viên');
    }
  };

  const columns = [
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username', render: t => <b>{t}</b> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Vai trò', 
      dataIndex: 'role', 
      key: 'role',
      render: role => {
        let color = role === 'ADMIN' ? 'red' : role === 'MANAGER' ? 'gold' : 'blue';
        return <Tag color={color}>{role}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          
          <Popconfirm
            title="Xóa nhân viên?"
            description="Bạn có chắc chắn muốn xóa tài khoản này không?"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>
          Thêm Nhân viên mới
        </Button>
      </div>
      
      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
      />

      {/* MODAL THÊM / SỬA USER */}
      <Modal 
        title={editingUser ? "Cập nhật Nhân viên" : "Thêm Nhân viên Mới"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input disabled={!!editingUser} /> {/* Không cho sửa Username */}
          </Form.Item>
          
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]} initialValue="REP">
            <Select>
              <Select.Option value="REP">Nhân viên Kinh doanh (Sales Rep)</Select.Option>
              <Select.Option value="MANAGER">Trưởng phòng (Manager)</Select.Option>
              <Select.Option value="ADMIN">Quản trị viên (Admin)</Select.Option>
            </Select>
          </Form.Item>

          {/* Chỉ hiển thị trường mật khẩu khi THÊM MỚI (editingUser = null) */}
          {!editingUser && (
            <Form.Item 
              name="password" 
              label="Mật khẩu" 
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Button type="primary" htmlType="submit" block>
            {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;