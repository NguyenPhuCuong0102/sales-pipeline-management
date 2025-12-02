import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Row, Col, Descriptions, Tag, Button, 
  Timeline, Input, message, Tabs, Space, Spin, 
  Modal, Form, DatePicker, Select, Empty, Typography, Alert 
} from 'antd';
import { 
  ArrowLeftOutlined, PhoneOutlined, MailOutlined, 
  ClockCircleOutlined, CheckCircleOutlined, ScheduleOutlined,
  CloseCircleOutlined, RightOutlined
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import dayjs from 'dayjs';

const { TextArea } = Input;

const OpportunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  
  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState('CALL');
  const [logging, setLogging] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm] = Form.useForm();
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    fetchDetail();
    fetchStages();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [oppRes, actRes, taskRes] = await Promise.all([
        axiosClient.get(`opportunities/${id}/`),
        axiosClient.get(`activities/?opportunity=${id}`),
        axiosClient.get(`tasks/?opportunity=${id}`)
      ]);
      
      setOpportunity(oppRes.data);
      setActivities(Array.isArray(actRes.data) ? actRes.data : (actRes.data.results || []));
      const taskList = Array.isArray(taskRes.data) ? taskRes.data : (taskRes.data.results || []);
      setTasks(taskList.filter(t => !t.is_completed));

    } catch (error) {
      console.error("Lỗi tải chi tiết:", error);
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
      
      if (rawStages.length === 0) {
        console.warn("⚠️ API trả về danh sách giai đoạn rỗng!");
      }

      rawStages.sort((a, b) => a.order - b.order);
      setStages(rawStages);
    } catch (error) {
      console.error("❌ Lỗi tải giai đoạn:", error);
      message.error("Không thể tải danh sách giai đoạn.");
    }
  };

  // --- LỌC BỎ CÁC GIAI ĐOẠN THẮNG/THUA (ĐỂ KHÓA) ---
  const activeStages = stages.filter(s => {
      const name = s.name.toLowerCase();
      // Loại bỏ các giai đoạn có tên chứa từ khóa kết thúc
      return !name.includes('thắng') && !name.includes('won') && 
             !name.includes('thua') && !name.includes('lost') && !name.includes('hủy');
  });

  // --- CÁC HÀM XỬ LÝ (GIỮ NGUYÊN) ---
  const handleCloseDeal = async (statusType) => {
    try {
        let payload = { status: statusType };
        let targetStage = null;
        if (statusType === 'WON') {
            targetStage = stages.find(s => s.name.toLowerCase().includes('thắng') || s.name.toLowerCase().includes('won'));
        } else {
            targetStage = stages.find(s => s.name.toLowerCase().includes('thua') || s.name.toLowerCase().includes('lost') || s.name.toLowerCase().includes('hủy'));
        }

        if (targetStage) payload.stage = targetStage.id;

        await axiosClient.patch(`opportunities/${id}/`, payload);
        message.success(statusType === 'WON' ? 'Chúc mừng! Đã chốt đơn thành công' : 'Đã đóng giao dịch');
        fetchDetail();
    } catch (error) {
        message.error('Lỗi cập nhật');
    }
  };

  const handleChangeStage = async (newStageId) => {
    try {
      await axiosClient.patch(`opportunities/${id}/`, { stage: newStageId, status: 'OPEN' });
      message.success('Đã cập nhật tiến độ');
      fetchDetail();
    } catch (error) {
      message.error('Lỗi cập nhật');
    }
  };

  const handleLogActivity = async () => {
    if (!activityNote.trim()) return message.warning('Vui lòng nhập nội dung!');
    setLogging(true);
    try {
      await axiosClient.post('activities/', {
        opportunity: id,
        type: activityType,
        summary: activityNote,
      });
      message.success('Đã ghi lại hoạt động');
      setActivityNote('');
      fetchDetail(); 
    } catch (error) {
      message.error('Lỗi khi lưu hoạt động');
    } finally {
      setLogging(false);
    }
  };

  const handleCreateTask = async (values) => {
    setCreatingTask(true);
    try {
      await axiosClient.post('tasks/', {
        opportunity: id,
        title: values.title,
        priority: values.priority,
        due_date: values.due_date.toISOString(),
      });
      message.success('Đã lên lịch công việc!');
      setIsTaskModalOpen(false);
      taskForm.resetFields();
      fetchDetail();
    } catch (error) {
      message.error('Lỗi khi tạo công việc');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/opportunities');
  };

  if (loading || !opportunity) return <Spin tip="Đang tải..." style={{ display: 'block', margin: '50px auto' }} />;

  return (
    <div style={{ paddingBottom: 50 }}>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          Quay lại
        </Button>
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
              <Descriptions.Item label="Giá trị">
                 <span style={{ color: '#3f8600', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(opportunity.value)}
                 </span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đóng dự kiến">{dayjs(opportunity.expected_close_date).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Người phụ trách">{opportunity.owner_name}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
                <Button 
                    type="dashed" 
                    icon={<ScheduleOutlined />} 
                    style={{ marginBottom: 20, width: '100%', borderColor: '#fa8c16', color: '#fa8c16' }}
                    onClick={() => setIsTaskModalOpen(true)}
                >
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

                {/* --- UI TIẾN ĐỘ --- */}
                <h4>📍 Tiến độ Giao dịch:</h4>
                <div style={{ marginBottom: 30, marginTop: 10 }}>
                    {stages.length === 0 ? (
                        <Alert 
                            message="Chưa có dữ liệu Giai đoạn" 
                            description="Vui lòng liên hệ Admin để vào trang Cài đặt -> Cấu hình Pipeline và tạo các giai đoạn bán hàng."
                            type="warning" 
                            showIcon 
                        />
                    ) : activeStages.length === 0 ? (
                        <Alert message="Không tìm thấy giai đoạn làm việc (Có thể do tên giai đoạn chứa toàn từ khóa kết thúc)" type="info" showIcon />
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {activeStages.map(stage => {
                                const isActive = opportunity.stage === stage.id;
                                return (
                                    <Button
                                        key={stage.id}
                                        type={isActive ? 'primary' : 'default'}
                                        shape="round"
                                        style={{ 
                                            marginBottom: 5,
                                            borderColor: isActive ? '#1890ff' : '#d9d9d9',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            boxShadow: isActive ? '0 2px 5px rgba(24, 144, 255, 0.3)' : 'none'
                                        }}
                                        onClick={() => handleChangeStage(stage.id)}
                                        icon={isActive ? <CheckCircleOutlined /> : <RightOutlined style={{ fontSize: 10, color: '#ccc' }} />}
                                    >
                                        {stage.name}
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <h4>🏁 Kết thúc:</h4>
                <Space>
                    <Button 
                        type="primary" 
                        size="large"
                        style={{ background: '#52c41a', borderColor: '#52c41a', minWidth: 150 }} 
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleCloseDeal('WON')}
                        disabled={opportunity.status === 'WON'}
                    >
                        Đánh dấu THẮNG
                    </Button>
                    <Button 
                        danger 
                        size="large"
                        style={{ minWidth: 150 }}
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleCloseDeal('LOST')}
                        disabled={opportunity.status === 'LOST'}
                    >
                        Đánh dấu THUA
                    </Button>
                </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          {/* PHẦN PHẢI GIỮ NGUYÊN (NHẬT KÝ CHĂM SÓC) */}
          <Card title="📝 Nhật ký Chăm sóc" bordered={false}>
             <Tabs 
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
                <TextArea 
                    rows={3} 
                    placeholder={`Nhập nội dung chi tiết ${activityType}...`} 
                    value={activityNote}
                    onChange={e => setActivityNote(e.target.value)}
                />
                <Button type="primary" block onClick={handleLogActivity} loading={logging} style={{ marginTop: 8 }}>
                    Lưu Hoạt động
                </Button>
             </Input.Group>
             
             <div style={{ marginTop: 30, maxHeight: 500, overflowY: 'auto', paddingRight: 10 }}>
                <Timeline>
                    {activities.map(act => (
                        <Timeline.Item 
                            key={act.id} 
                            color={act.type === 'CALL' ? 'blue' : act.type === 'WON' ? 'green' : 'gray'}
                            dot={act.type === 'CALL' ? <PhoneOutlined /> : act.type === 'EMAIL' ? <MailOutlined /> : <ClockCircleOutlined />}
                        >
                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: 13 }}>
                                {act.user_name} <span style={{ fontWeight: 'normal', color: '#888' }}>đã ghi nhận {act.type}</span>
                            </p>
                            <p style={{ margin: '4px 0', color: '#333' }}>{act.summary}</p>
                            <small style={{ color: '#999' }}>{dayjs(act.created_at).format('DD/MM/YYYY - HH:mm')}</small>
                        </Timeline.Item>
                    ))}
                    <Timeline.Item color="green">Giao dịch được khởi tạo</Timeline.Item>
                </Timeline>
             </div>
          </Card>
        </Col>
      </Row>

      <Modal title="Lên lịch Công việc" open={isTaskModalOpen} onCancel={() => setIsTaskModalOpen(false)} footer={null}>
        <Form form={taskForm} layout="vertical" onFinish={handleCreateTask}>
            <Form.Item name="title" label="Việc cần làm" rules={[{ required: true }]}>
                <Input placeholder="VD: Gọi lại chốt giá..." />
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="due_date" label="Hạn chót" rules={[{ required: true }]}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="priority" label="Mức độ ưu tiên" initialValue="MEDIUM">
                        <Select>
                            <Select.Option value="LOW">Thấp</Select.Option>
                            <Select.Option value="MEDIUM">Trung bình</Select.Option>
                            <Select.Option value="HIGH">Cao (Gấp)</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
                <Button onClick={() => setIsTaskModalOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={creatingTask}>Lưu Công việc</Button>
            </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OpportunityDetailPage;