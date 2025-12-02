import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Row, Col, Descriptions, Tag, Button, 
  Timeline, Input, message, Tabs, Space, Spin, 
  Modal, Form, DatePicker, Select, Empty, Typography, Table, InputNumber, Popconfirm 
} from 'antd';
import { 
  ArrowLeftOutlined, PhoneOutlined, MailOutlined, 
  ClockCircleOutlined, CheckCircleOutlined, ScheduleOutlined,
  CloseCircleOutlined, RightOutlined, PlusOutlined, DeleteOutlined, ShopOutlined
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

const OpportunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [stages, setStages] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [items, setItems] = useState([]); 
  const [productsList, setProductsList] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // --- STATE MỚI CHO MODAL LÝ DO THUA ---
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostForm] = Form.useForm();
  // --------------------------------------

  const [taskForm] = Form.useForm();
  const [productForm] = Form.useForm();
  
  const [creatingTask, setCreatingTask] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState('CALL');

  useEffect(() => {
    fetchDetail();
    fetchStages();
    fetchProducts(); 
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [oppRes, actRes, taskRes, itemRes] = await Promise.all([
        axiosClient.get(`opportunities/${id}/`),
        axiosClient.get(`activities/?opportunity=${id}`),
        axiosClient.get(`tasks/?opportunity=${id}`),
        axiosClient.get(`opportunity-items/?opportunity=${id}`) 
      ]);
      
      setOpportunity(oppRes.data);
      setActivities(Array.isArray(actRes.data) ? actRes.data : (actRes.data.results || []));
      const taskList = Array.isArray(taskRes.data) ? taskRes.data : (taskRes.data.results || []);
      setTasks(taskList.filter(t => !t.is_completed));
      const itemList = Array.isArray(itemRes.data) ? itemRes.data : (itemRes.data.results || []);
      setItems(itemList);
    } catch (error) {
      message.error('Không tìm thấy giao dịch!');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await axiosClient.get('stages/');
      let rawStages = Array.isArray(res.data) ? res.data : (res.data.results || []);
      rawStages.sort((a, b) => a.order - b.order);
      setStages(rawStages);
    } catch (error) {}
  };

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get('products/?active=true');
      setProductsList(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch (error) {}
  };

  const activeStages = stages.filter(s => {
      const name = s.name.toLowerCase();
      return !name.includes('thắng') && !name.includes('won') && 
             !name.includes('thua') && !name.includes('lost') && !name.includes('hủy');
  });

  const handleAddProduct = async (values) => {
    setAddingProduct(true);
    try {
      await axiosClient.post('opportunity-items/', {
        opportunity: id,
        product: values.product,
        quantity: values.quantity,
        unit_price: values.unit_price
      });
      message.success('Đã thêm sản phẩm');
      setIsProductModalOpen(false);
      productForm.resetFields();
      fetchDetail(); 
    } catch (error) {
      message.error('Lỗi thêm sản phẩm');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
        await axiosClient.delete(`opportunity-items/${itemId}/`);
        message.success('Đã xóa sản phẩm');
        fetchDetail();
    } catch (error) {
        message.error('Lỗi khi xóa');
    }
  };

  const onProductChange = (productId) => {
    const product = productsList.find(p => p.id === productId);
    if (product) {
        productForm.setFieldsValue({ unit_price: product.price });
    }
  };

  // --- XỬ LÝ NÚT CHỐT ĐƠN / THUA ---
  const handleCloseDeal = async (statusType) => {
    if (statusType === 'LOST') {
        // Nếu là Thua -> Mở modal nhập lý do
        setIsLostModalOpen(true);
        return;
    }
    
    // Nếu là Thắng -> Xử lý ngay
    submitStatusChange('WON');
  };

  // Hàm gọi API cập nhật trạng thái
  const submitStatusChange = async (statusType, reason = null) => {
    try {
        let payload = { status: statusType };
        if (reason) payload.lost_reason = reason; // Gửi kèm lý do nếu có

        let targetStage = null;
        if (statusType === 'WON') {
            targetStage = stages.find(s => s.type === 'WON');
        } else {
            targetStage = stages.find(s => s.type === 'LOST');
        }
        if (targetStage) payload.stage = targetStage.id;

        await axiosClient.patch(`opportunities/${id}/`, payload);
        message.success(statusType === 'WON' ? 'Đã chốt đơn thành công' : 'Đã đóng giao dịch');
        setIsLostModalOpen(false);
        fetchDetail();
    } catch (error) {
        message.error('Lỗi cập nhật');
    }
  };

  // Xử lý khi submit form lý do thua
  const handleLostSubmit = (values) => {
      submitStatusChange('LOST', values.lost_reason);
  };

  const handleChangeStage = async (newStageId) => {
    try {
      await axiosClient.patch(`opportunities/${id}/`, { stage: newStageId, status: 'OPEN' });
      message.success('Đã cập nhật tiến độ');
      fetchDetail();
    } catch (error) { message.error('Lỗi cập nhật'); }
  };

  const handleLogActivity = async () => {
    if (!activityNote.trim()) return message.warning('Vui lòng nhập nội dung!');
    setLogging(true);
    try {
      await axiosClient.post('activities/', { opportunity: id, type: activityType, summary: activityNote });
      message.success('Đã ghi lại hoạt động');
      setActivityNote('');
      fetchDetail(); 
    } catch (error) { message.error('Lỗi khi lưu hoạt động'); } finally { setLogging(false); }
  };

  const handleCreateTask = async (values) => {
    setCreatingTask(true);
    try {
      await axiosClient.post('tasks/', { opportunity: id, title: values.title, priority: values.priority, due_date: values.due_date.toISOString() });
      message.success('Đã lên lịch công việc!');
      setIsTaskModalOpen(false);
      taskForm.resetFields();
      fetchDetail();
    } catch (error) { message.error('Lỗi khi tạo công việc'); } finally { setCreatingTask(false); }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1); else navigate('/opportunities');
  };

  if (loading || !opportunity) return <Spin tip="Đang tải..." style={{ display: 'block', margin: '50px auto' }} />;

  const itemColumns = [
    { title: 'Mã', dataIndex: 'product_code', key: 'code' },
    { title: 'Sản phẩm', dataIndex: 'product_name', key: 'name', render: t => <b>{t}</b> },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    { title: 'Đơn giá', dataIndex: 'unit_price', key: 'price', align: 'right', render: v => new Intl.NumberFormat('vi-VN').format(v) },
    { title: 'Thành tiền', dataIndex: 'total_price', key: 'total', align: 'right', render: v => <span style={{color: '#3f8600'}}>{new Intl.NumberFormat('vi-VN').format(v)}</span> },
    { 
        title: '', key: 'action', 
        render: (_, r) => <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDeleteItem(r.id)} />
    }
  ];

  return (
    <div style={{ paddingBottom: 50 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>Quay lại</Button>
      </div>

      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Card 
            title={<span style={{ fontSize: 18 }}>{opportunity.title}</span>} 
            extra={<Tag color={opportunity.status === 'WON' ? 'green' : opportunity.status === 'LOST' ? 'red' : 'blue'}>{opportunity.status}</Tag>}
            bordered={false}
            style={{ marginBottom: 20 }}
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Khách hàng"><b>{opportunity.customer_name}</b></Descriptions.Item>
              <Descriptions.Item label="Giá trị (Tổng deal)">
                 <span style={{ color: '#3f8600', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(opportunity.value)}
                 </span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đóng dự kiến">{dayjs(opportunity.expected_close_date).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Người phụ trách">{opportunity.owner_name}</Descriptions.Item>
              {/* Hiện lý do thua nếu có */}
              {opportunity.status === 'LOST' && opportunity.lost_reason && (
                  <Descriptions.Item label={<span style={{color: 'red'}}>Lý do thất bại</span>}>
                      {opportunity.lost_reason}
                  </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 24 }}>
                <Button type="dashed" icon={<ScheduleOutlined />} style={{ marginBottom: 20, width: '100%', borderColor: '#fa8c16', color: '#fa8c16' }} onClick={() => setIsTaskModalOpen(true)}>
                    + Lên lịch làm việc / Nhắc nhở
                </Button>

                {tasks.length > 0 && (
                    <Card size="small" style={{ marginBottom: 20, background: '#fff7e6', borderColor: '#ffd591' }}>
                        <h4 style={{ marginTop: 0, color: '#fa8c16', marginBottom: 10 }}>Việc cần làm:</h4>
                        {tasks.map(t => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px dashed #ffd591', paddingBottom: 4 }}>
                                <span>{t.priority === 'HIGH' && <Tag color="red" style={{ marginRight: 5 }}>Gấp</Tag>}{t.title}</span>
                                <span style={{ fontSize: 12, color: '#888' }}>{dayjs(t.due_date).format('DD/MM HH:mm')}</span>
                            </div>
                        ))}
                    </Card>
                )}

                <h4>📍 Tiến độ Giao dịch:</h4>
                <div style={{ marginBottom: 30, marginTop: 10 }}>
                    {activeStages.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {activeStages.map(stage => {
                                const isActive = opportunity.stage === stage.id;
                                return (
                                    <Button
                                        key={stage.id}
                                        type={isActive ? 'primary' : 'default'}
                                        shape="round"
                                        style={{ marginBottom: 5, borderColor: isActive ? '#1890ff' : '#d9d9d9', fontWeight: isActive ? 'bold' : 'normal', boxShadow: isActive ? '0 2px 5px rgba(24, 144, 255, 0.3)' : 'none' }}
                                        onClick={() => handleChangeStage(stage.id)}
                                        icon={isActive ? <CheckCircleOutlined /> : <RightOutlined style={{ fontSize: 10, color: '#ccc' }} />}
                                    >
                                        {stage.name}
                                    </Button>
                                );
                            })}
                        </div>
                    ) : <Empty description="Chưa có dữ liệu Giai đoạn" />}
                </div>

                <h4>🏁 Kết thúc:</h4>
                <Space>
                    <Button type="primary" size="large" style={{ background: '#52c41a', borderColor: '#52c41a', minWidth: 150 }} icon={<CheckCircleOutlined />} onClick={() => handleCloseDeal('WON')} disabled={opportunity.status === 'WON'}>Đánh dấu THẮNG</Button>
                    <Button danger size="large" style={{ minWidth: 150 }} icon={<CloseCircleOutlined />} onClick={() => handleCloseDeal('LOST')} disabled={opportunity.status === 'LOST'}>Đánh dấu THUA</Button>
                </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card bordered={false} bodyStyle={{ padding: 0 }}>
            <Tabs 
                type="card"
                defaultActiveKey="ACTIVITY" 
                items={[
                    { 
                        label: <span><ClockCircleOutlined /> Nhật ký</span>, 
                        key: 'ACTIVITY',
                        children: (
                            <div style={{ padding: 20 }}>
                                <Tabs 
                                    size="small"
                                    defaultActiveKey="CALL" 
                                    onChange={(key) => setActivityType(key)}
                                    items={[
                                        { label: <span><PhoneOutlined /> Gọi</span>, key: 'CALL' },
                                        { label: <span><MailOutlined /> Email</span>, key: 'EMAIL' },
                                        { label: <span><ClockCircleOutlined /> Gặp</span>, key: 'MEETING' },
                                        { label: 'Ghi chú', key: 'NOTE' },
                                    ]}
                                />
                                <Input.Group compact style={{ marginTop: 10 }}>
                                    <TextArea rows={3} placeholder={`Nhập nội dung...`} value={activityNote} onChange={e => setActivityNote(e.target.value)} />
                                    <Button type="primary" block onClick={handleLogActivity} loading={logging} style={{ marginTop: 8 }}>Lưu Hoạt động</Button>
                                </Input.Group>
                                <div style={{ marginTop: 20, maxHeight: 400, overflowY: 'auto' }}>
                                    <Timeline>
                                        {activities.map(act => (
                                            <Timeline.Item key={act.id} color="blue" dot={act.type === 'CALL' ? <PhoneOutlined /> : <ClockCircleOutlined />}>
                                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: 13 }}>{act.user_name} <span style={{ fontWeight: 'normal', color: '#888' }}>- {act.type}</span></p>
                                                <p style={{ margin: '4px 0', color: '#333' }}>{act.summary}</p>
                                                <small style={{ color: '#999' }}>{dayjs(act.created_at).format('DD/MM/YYYY - HH:mm')}</small>
                                            </Timeline.Item>
                                        ))}
                                    </Timeline>
                                </div>
                            </div>
                        )
                    },
                    { 
                        label: <span><ShopOutlined /> Sản phẩm ({items.length})</span>, 
                        key: 'PRODUCTS',
                        children: (
                            <div style={{ padding: 10 }}>
                                <div style={{ marginBottom: 10, textAlign: 'right' }}>
                                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsProductModalOpen(true)}>Thêm SP</Button>
                                </div>
                                <Table 
                                    dataSource={items} 
                                    columns={itemColumns} 
                                    rowKey="id" 
                                    pagination={false} 
                                    size="small"
                                    summary={pageData => {
                                        const total = pageData.reduce((sum, current) => sum + current.total_price, 0);
                                        return (
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={4} align="right"><b>Tổng:</b></Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right">
                                                    <Text type="success" strong>{new Intl.NumberFormat('vi-VN').format(total)}</Text>
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={2} />
                                            </Table.Summary.Row>
                                        );
                                    }}
                                />
                            </div>
                        )
                    },
                ]}
            />
          </Card>
        </Col>
      </Row>

      {/* MODAL 1: TASK */}
      <Modal title="Lên lịch Công việc" open={isTaskModalOpen} onCancel={() => setIsTaskModalOpen(false)} footer={null}>
        <Form form={taskForm} layout="vertical" onFinish={handleCreateTask}>
            <Form.Item name="title" label="Việc cần làm" rules={[{ required: true }]}><Input placeholder="VD: Gọi lại chốt giá..." /></Form.Item>
            <Row gutter={16}>
                <Col span={12}><Form.Item name="due_date" label="Hạn chót" rules={[{ required: true }]}><DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}>
                    <Form.Item name="priority" label="Mức độ ưu tiên" initialValue="MEDIUM">
                        <Select><Select.Option value="LOW">Thấp</Select.Option><Select.Option value="MEDIUM">Trung bình</Select.Option><Select.Option value="HIGH">Cao</Select.Option></Select>
                    </Form.Item>
                </Col>
            </Row>
            <div style={{ textAlign: 'right', marginTop: 10 }}><Button onClick={() => setIsTaskModalOpen(false)} style={{ marginRight: 8 }}>Hủy</Button><Button type="primary" htmlType="submit" loading={creatingTask}>Lưu Công việc</Button></div>
        </Form>
      </Modal>

      {/* MODAL 2: PRODUCT */}
      <Modal title="Thêm Sản phẩm vào Giao dịch" open={isProductModalOpen} onCancel={() => setIsProductModalOpen(false)} footer={null}>
         <Form form={productForm} layout="vertical" onFinish={handleAddProduct}>
            <Form.Item name="product" label="Sản phẩm / Dịch vụ" rules={[{ required: true }]}>
                <Select placeholder="Chọn sản phẩm" showSearch optionFilterProp="children" onChange={onProductChange}>
                    {productsList.map(p => <Select.Option key={p.id} value={p.id}>{p.code} - {p.name} ({new Intl.NumberFormat('vi-VN').format(p.price)})</Select.Option>)}
                </Select>
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}><Form.Item name="quantity" label="Số lượng" initialValue={1} rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="unit_price" label="Đơn giá bán" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit" block loading={addingProduct}>Thêm vào đơn</Button>
         </Form>
      </Modal>

      {/* MODAL 3: LOST REASON (MỚI) */}
      <Modal title="Xác nhận Thất bại" open={isLostModalOpen} onCancel={() => setIsLostModalOpen(false)} footer={null}>
          <p>Rất tiếc vì chúng ta đã mất đơn hàng này. Vui lòng cho biết lý do:</p>
          <Form form={lostForm} layout="vertical" onFinish={handleLostSubmit}>
              <Form.Item name="lost_reason" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
                  <TextArea rows={3} placeholder="VD: Giá quá cao, Khách chọn đối thủ A, Không liên lạc được..." />
              </Form.Item>
              <Button danger type="primary" htmlType="submit" block>Xác nhận Đóng</Button>
          </Form>
      </Modal>
    </div>
  );
};

export default OpportunityDetailPage;