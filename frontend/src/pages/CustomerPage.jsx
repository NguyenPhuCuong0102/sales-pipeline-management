import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, Tooltip, Row, Col } from 'antd';
import { 
  UserAddOutlined, ReloadOutlined, MailOutlined, 
  PhoneOutlined, EditOutlined, DeleteOutlined, 
  QuestionCircleOutlined, SearchOutlined, UploadOutlined, DownloadOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom'; 
import axiosClient from '../api/axiosClient';
import { Upload } from 'antd';

const CustomerPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = "Danh sách Khách hàng - Core CRM";
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = searchText ? `customers/?search=${searchText}` : 'customers/';
      const response = await axiosClient.get(url);
      
      if (Array.isArray(response.data)) {
        setData(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setData(response.data.results);
      } else {
        setData([]);
      }
    } catch (error) {
      message.error('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };


  const handleOpenCreate = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingId) {
        await axiosClient.patch(`customers/${editingId}/`, values);
        message.success('Cập nhật thành công!');
      } else {
        await axiosClient.post('customers/', values);
        message.success('Thêm mới thành công!');
      }
      form.resetFields();
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      message.error('Có lỗi xảy ra!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`customers/${id}/`);
      message.success('Đã xóa khách hàng');
      fetchCustomers();
    } catch (error) {
      message.error('Lỗi xóa (Có thể đang có giao dịch liên kết)');
    }
  };

  const handleUpload = async (info) => {
    const { file } = info;
    if (file.status !== 'uploading') {
        // Antd Upload tự động set status, ta chỉ cần chặn upload mặc định và tự gọi API
        return; 
    }
  };

  // Cấu hình cho component Upload
  const uploadProps = {
    name: 'file',
    showUploadList: false, // Không hiện danh sách file đã chọn (upload xong là thôi)
    beforeUpload: async (file) => {
      // 1. Kiểm tra file
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      if (!isCSV) {
        message.error('Bạn chỉ được upload file CSV!');
        return Upload.LIST_IGNORE;
      }

      // 2. Gọi API Import ngay lập tức
      const formData = new FormData();
      formData.append('file', file);

      message.loading({ content: 'Đang nhập dữ liệu...', key: 'importMsg' });
      try {
        const response = await axiosClient.post('customers/import/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success({ content: response.data.message, key: 'importMsg' });
        fetchCustomers(); // Tải lại bảng sau khi import
      } catch (error) {
        message.error({ content: 'Lỗi khi nhập file!', key: 'importMsg' });
      }

      return false; // Ngăn không cho antd tự upload (vì ta đã gọi API thủ công)
    },
  };
  
  // Hàm tải file mẫu (để người dùng biết nhập cột gì)
  const downloadTemplate = () => {
      const csvContent = "\uFEFFTên Khách hàng,Email,SĐT\nNguyễn Văn A,a@test.com,0909123456";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau_import_khach_hang.csv');
      document.body.appendChild(link);
      link.click();
  };

  const columns = [
    {
      title: 'Tên Khách hàng',
      dataIndex: 'name',
      key: 'name',
      // --- DÒNG BẠN VỪA SỬA (Giờ đã hoạt động vì có import Link) ---
      render: (text, record) => (
        <Link to={`/customers/${record.id}`} style={{ fontWeight: 600, color: '#1890ff' }}>
            {text}
        </Link>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email ? <Space><MailOutlined style={{ color: '#888' }} /><a href={`mailto:${email}`}>{email}</a></Space> : <span style={{ color: '#ccc' }}>--</span>,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone ? <Space><PhoneOutlined style={{ color: '#888' }} /><a href={`tel:${phone}`}>{phone}</a></Space> : <span style={{ color: '#ccc' }}>--</span>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa"><Button icon={<EditOutlined />} size="small" onClick={() => handleOpenEdit(record)} /></Tooltip>
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)} okText="Có" cancelText="Không">
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ background: '#fff', padding: '16px', borderRadius: 8, marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Row justify="space-between" align="middle">
            <Col xs={24} sm={12} md={8}>
                <Input 
                    placeholder="Tìm theo tên, email, sđt..." 
                    prefix={<SearchOutlined style={{ color: '#ccc' }} />} 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
            </Col>
            <Col>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>File mẫu</Button>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Import CSV</Button>
                    </Upload>
                    <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>Tải lại</Button>
                    <Button type="primary" icon={<UserAddOutlined />} onClick={handleOpenCreate}>Thêm khách hàng</Button>
                </Space>
            </Col>
        </Row>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} bordered pagination={{ pageSize: 8 }} />

      <Modal title={editingId ? "Cập nhật Khách hàng" : "Thêm Khách hàng Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 20 }}>
          <Form.Item name="name" label="Tên khách hàng / Công ty" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Công ty TNHH ABC" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>{editingId ? "Lưu thay đổi" : "Lưu"}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerPage;