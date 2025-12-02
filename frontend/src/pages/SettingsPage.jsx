import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Input, Modal, Form, message, Tag, Space, InputNumber, Select, Popconfirm, Switch } from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, 
  UserOutlined, OrderedListOutlined, ShopOutlined, 
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
    {
      key: '3',
      label: <span><ShopOutlined /> Danh mục Sản phẩm</span>,
      children: <ProductSettings />,
    },
  ];

  return (
    <div>
      <h2>⚙️ Cài đặt Hệ thống</h2>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

// --- 1. COMPONENT QUẢN LÝ GIAI ĐOẠN ---
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
        title: 'Loại', 
        dataIndex: 'type', 
        key: 'type',
        render: type => {
            if(type === 'WON') return <Tag color="success">Thắng (Won)</Tag>;
            if(type === 'LOST') return <Tag color="error">Thua (Lost)</Tag>;
            return <Tag color="processing">Tiến độ (Open)</Tag>;
        }
    },
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

      <Modal title="Thêm/Sửa Giai đoạn" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
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

// --- 2. COMPONENT QUẢN LÝ NHÂN VIÊN ---
const UserListSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

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

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await axiosClient.patch(`auth/users/${editingUser.id}/`, values);
        message.success('Cập nhật nhân viên thành công');
      } else {
        await axiosClient.post('auth/users/', values);
        message.success('Thêm nhân viên thành công');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra! (Có thể tên đăng nhập đã trùng)');
    }
  };

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
      title: 'Vai trò', dataIndex: 'role', key: 'role',
      render: role => {
        let color = role === 'ADMIN' ? 'red' : role === 'MANAGER' ? 'gold' : 'blue';
        return <Tag color={color}>{role}</Tag>;
      }
    },
    {
      title: 'Hành động', key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm title="Xóa nhân viên?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>Thêm Nhân viên mới</Button>
      </div>
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} />
      <Modal title={editingUser ? "Cập nhật Nhân viên" : "Thêm Nhân viên Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]} initialValue="REP">
            <Select>
              <Select.Option value="REP">Nhân viên Kinh doanh (Sales Rep)</Select.Option>
              <Select.Option value="MANAGER">Trưởng phòng (Manager)</Select.Option>
              <Select.Option value="ADMIN">Quản trị viên (Admin)</Select.Option>
            </Select>
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" block>{editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}</Button>
        </Form>
      </Modal>
    </div>
  );
};

// --- 3. COMPONENT QUẢN LÝ SẢN PHẨM (MỚI) ---
const ProductSettings = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('products/');
      setProducts(Array.isArray(res.data) ? res.data : res.data.results);
    } catch (error) {
      message.error('Lỗi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    if (product) form.setFieldsValue(product);
    else form.resetFields();
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProduct) {
        await axiosClient.patch(`products/${editingProduct.id}/`, values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await axiosClient.post('products/', values);
        message.success('Thêm sản phẩm thành công');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      message.error('Có lỗi xảy ra (Có thể Mã sản phẩm bị trùng)');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`products/${id}/`);
      message.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch (error) {
      message.error('Lỗi khi xóa');
    }
  };

  const columns = [
    { title: 'Mã SP', dataIndex: 'code', key: 'code', width: 100, render: t => <b>{t}</b> },
    { title: 'Tên Sản phẩm', dataIndex: 'name', key: 'name' },
    { 
        title: 'Đơn giá', dataIndex: 'price', key: 'price', align: 'right',
        render: val => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
    },
    { 
        title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', align: 'center',
        render: active => active ? <Tag color="green">Đang bán</Tag> : <Tag color="red">Ngưng</Tag>
    },
    {
      title: 'Hành động', key: 'action', align: 'center',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)} okText="Có" cancelText="Không">
            <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>Thêm Sản phẩm mới</Button>
      </div>
      <Table dataSource={products} columns={columns} rowKey="id" loading={loading} />
      
      <Modal title={editingProduct ? "Sửa Sản phẩm" : "Thêm Sản phẩm"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="code" label="Mã sản phẩm" rules={[{ required: true }]}>
            <Input placeholder="VD: SP001" disabled={!!editingProduct} />
          </Form.Item>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input placeholder="VD: Phần mềm CRM gói Basic" />
          </Form.Item>
          <Form.Item name="price" label="Đơn giá (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_active" label="Trạng thái kinh doanh" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Đang bán" unCheckedChildren="Ngưng bán" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Lưu</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;