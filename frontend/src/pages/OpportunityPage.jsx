import React, { useEffect, useState, useContext } from 'react';
import {
  Table, Tag, Button, message, Space, Modal, Form,
  Input, InputNumber, Select, DatePicker, Popconfirm, Tooltip, Row, Col
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, EditOutlined,
  DeleteOutlined, QuestionCircleOutlined, SearchOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext để lấy role
import dayjs from 'dayjs';

const { Option } = Select;

const OpportunityPage = () => {
  const { user } = useContext(AuthContext); // Lấy thông tin user
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stages, setStages] = useState([]);
  const [usersList, setUsersList] = useState([]); // Danh sách nhân viên (cho filter)
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    stage: '',
    owner: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const isManager = user?.role === 'MANAGER';

  useEffect(() => {
    document.title = "Quản lý Cơ hội - Core CRM";
    fetchStages();
    if (isManager) {
      fetchUsers();
    }
    fetchOpportunities();
  }, [filters]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchOpportunities = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);           // Trang số mấy
      params.append('page_size', pageSize);
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.owner) params.append('owner', filters.owner);

      const response = await axiosClient.get(`opportunities/?${params.toString()}`);

      if (response.data && Array.isArray(response.data.results)) {
        setData(response.data.results);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.data.count,
        });
      }
    } catch (error) {
      console.error(error);
      message.error('Không thể tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities(1, pagination.pageSize);
  }, [filters]);

  const handleTableChange = (newPagination) => {
    fetchOpportunities(newPagination.current, newPagination.pageSize);
  };

  const fetchStages = async () => {
    try {
      const res = await axiosClient.get('stages/');
      setStages(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (e) { }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get('auth/users/');
      setUsersList(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (e) { }
  };

  const fetchAuxData = async () => {
    try {
      const custRes = await axiosClient.get('customers/');
      setCustomers(Array.isArray(custRes.data) ? custRes.data : (custRes.data.results || []));
    } catch (error) {
      message.warning('Không tải được danh sách chọn');
    }
  };

  const handleExport = async () => {
    try {
      message.loading({ content: 'Đang tạo file báo cáo...', key: 'exportMsg' });
      const response = await axiosClient.get('opportunities/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_cao_co_hoi_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      message.success({ content: 'Xuất file thành công!', key: 'exportMsg' });
    } catch (error) {
      console.error(error);
      message.error({ content: 'Lỗi khi xuất file!', key: 'exportMsg' });
    }
  };

  // --- HANDLERS CHO FILTERS ---
  const handleSearchChange = (e) => setFilters(prev => ({ ...prev, search: e.target.value }));
  const handleStatusChange = (value) => setFilters(prev => ({ ...prev, status: value }));
  const handleStageChange = (value) => setFilters(prev => ({ ...prev, stage: value }));
  const handleOwnerChange = (value) => setFilters(prev => ({ ...prev, owner: value })); // Mới

  const clearFilters = () => {
    setFilters({ search: '', status: '', stage: '', owner: '' });
  };

  // --- CRUD HANDLERS ---
  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
    fetchAuxData();
  };

  const openEditModal = (record) => {
    setEditingId(record.id);
    setIsModalOpen(true);
    fetchAuxData();
    form.setFieldsValue({
      ...record,
      customer: record.customer,
      stage: record.stage,
      expected_close_date: record.expected_close_date ? dayjs(record.expected_close_date) : null,
    });
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        expected_close_date: values.expected_close_date ? values.expected_close_date.format('YYYY-MM-DD') : null,
      };

      if (editingId) {
        await axiosClient.patch(`opportunities/${editingId}/`, payload);
        message.success('Cập nhật thành công!');
      } else {
        await axiosClient.post('opportunities/', payload);
        message.success('Tạo cơ hội thành công!');
      }
      form.resetFields();
      setIsModalOpen(false);
      fetchOpportunities();
    } catch (error) {
      message.error('Có lỗi xảy ra!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`opportunities/${id}/`);
      message.success('Đã xóa giao dịch');
      fetchOpportunities();
    } catch (error) {
      message.error('Lỗi khi xóa!');
    }
  };

  const columns = [
    {
      title: 'Tên Giao dịch',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => <Link to={`/opportunities/${record.id}`} style={{ fontWeight: 600 }}>{text}</Link>,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer',
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      align: 'right',
      render: (val) => val ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val) : '0',
    },
    {
      title: 'Giai đoạn',
      dataIndex: 'stage_name',
      key: 'stage',
      render: (stage) => <Tag color="blue">{stage}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => {
        let color = status === 'WON' ? 'green' : status === 'LOST' ? 'red' : 'geekblue';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Phụ trách',
      dataIndex: 'owner_name',
      key: 'owner',
      // Highlight màu khác nếu là mình
      render: (text) => <span style={{ fontWeight: text === user?.username ? 'bold' : 'normal' }}>{text}</span>
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa"><Button icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)} /></Tooltip>
          <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)} okText="Có" cancelText="Không">
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* --- THANH CÔNG CỤ (TOOLBAR) ĐÃ SỬA LỖI LAYOUT --- */}
      <div style={{
        background: '#fff',
        padding: '16px',
        borderRadius: 8,
        marginBottom: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        display: 'flex',
        flexWrap: 'wrap', // Tự động xuống dòng nếu hết chỗ
        gap: 16, // Khoảng cách giữa các phần tử
        justifyContent: 'space-between', // Đẩy 2 nhóm sang 2 bên
        alignItems: 'center'
      }}>

        {/* NHÓM 1: BỘ LỌC (BÊN TRÁI) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, flex: 1, minWidth: '300px' }}>
          <Input
            placeholder="Tìm tên giao dịch, khách hàng..."
            prefix={<SearchOutlined style={{ color: '#ccc' }} />}
            value={filters.search}
            onChange={handleSearchChange}
            allowClear
            style={{ width: 220 }}
          />

          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            allowClear
            onChange={handleStatusChange}
            value={filters.status || undefined}
          >
            <Option value="OPEN">Đang mở</Option>
            <Option value="WON">Thắng</Option>
            <Option value="LOST">Thua</Option>
          </Select>

          <Select
            placeholder="Giai đoạn"
            style={{ width: 160 }}
            allowClear
            onChange={handleStageChange}
            value={filters.stage || undefined}
          >
            {stages.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
          </Select>

          {/* Chỉ hiện filter Nhân viên nếu là Manager */}
          {isManager && (
            <Select
              placeholder="Nhân viên"
              style={{ width: 150 }}
              allowClear
              onChange={handleOwnerChange}
              value={filters.owner || undefined}
            >
              {usersList.map(u => <Option key={u.id} value={u.id}>{u.username}</Option>)}
            </Select>
          )}

          <Button icon={<ReloadOutlined />} onClick={clearFilters} title="Xóa bộ lọc" />
        </div>

        {/* NHÓM 2: HÀNH ĐỘNG (BÊN PHẢI) */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Xuất Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Tạo mới
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        bordered
        locale={{ emptyText: 'Không tìm thấy dữ liệu phù hợp' }}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal title={editingId ? "Cập nhật" : "Tạo mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 20 }}>
          <Form.Item name="title" label="Tên Giao dịch" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="customer" label="Khách hàng" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {customers.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: 180 }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                min={0}
                disabled={!!editingId} // <--- CHỈ CHO NHẬP KHI TẠO MỚI, KHÔNG CHO SỬA
                placeholder={editingId ? "Tự động tính từ SP" : "Nhập giá trị dự kiến"}
              />
            </Form.Item>
            <Form.Item name="expected_close_date" label="Ngày chốt" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: 180 }} />
            </Form.Item>
          </Space>
          <Form.Item name="stage" label="Giai đoạn" rules={[{ required: true }]}>
            <Select>{stages.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginTop: 10 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>Lưu</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OpportunityPage;