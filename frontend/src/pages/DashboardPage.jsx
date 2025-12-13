import React, { useContext, useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, List, Spin, Empty, Tag, Tooltip, Button, Space, Select } from 'antd';
import {
  DollarCircleOutlined,
  ShoppingOutlined,
  UserOutlined,
  TrophyOutlined,
  CalendarOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie,
} from 'recharts';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import dayjs from 'dayjs';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // State bộ lọc thời gian cho biểu đồ hiệu suất
  const [timeRange, setTimeRange] = useState(6);

  useEffect(() => {
    document.title = "Tổng quan - Core CRM";
    fetchDashboardData();
  }, [timeRange]); // Tải lại khi thay đổi số tháng

  const fetchDashboardData = async () => {
    try {
      // Gửi tham số months lên backend
      const response = await axiosClient.get(`dashboard/stats/?months=${timeRange}`);
      setStats(response.data);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await axiosClient.patch(`tasks/${task.id}/`, { is_completed: !task.is_completed });
      fetchDashboardData();
    } catch (error) {
      console.error('Lỗi cập nhật task', error);
    }
  };

  if (loading) return <Spin tip="Đang tải dữ liệu..." style={{ display: 'block', margin: '50px auto' }} />;

  const data = stats || {
    expected_revenue: 0, open_deals_count: 0, new_customers_count: 0, win_rate: 0,
    revenue_by_stage: [], upcoming_deals: [], my_tasks: [], rep_performance: []
  };

  // --- STYLE CHUNG ---
  const cardStyle = { borderRadius: 8, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', border: '1px solid #f0f0f0', height: '100%', overflow: 'hidden' };

  // --- 1. KPI CARDS ---
  const KpiCards = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable style={{ ...cardStyle, borderTop: '4px solid #3f8600' }}>
          <Statistic title={<span style={{ color: '#666', fontWeight: 600 }}>Doanh thu (Open + Won)</span>} value={data.expected_revenue} prefix={<DollarCircleOutlined style={{ backgroundColor: '#f6ffed', padding: 8, borderRadius: '50%', color: '#3f8600' }} />} suffix="đ" valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} formatter={val => new Intl.NumberFormat('vi-VN', { compactDisplay: 'short', notation: 'compact' }).format(val)} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable style={{ ...cardStyle, borderTop: '4px solid #1890ff' }}>
          <Statistic title={<span style={{ color: '#666', fontWeight: 600 }}>Cơ hội Đang mở</span>} value={data.open_deals_count} prefix={<ShoppingOutlined style={{ backgroundColor: '#e6f7ff', padding: 8, borderRadius: '50%', color: '#1890ff' }} />} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable style={{ ...cardStyle, borderTop: '4px solid #722ed1' }}>
          <Statistic title={<span style={{ color: '#666', fontWeight: 600 }}>Khách hàng Mới (30 ngày)</span>} value={data.new_customers_count} prefix={<UserOutlined style={{ backgroundColor: '#f9f0ff', padding: 8, borderRadius: '50%', color: '#722ed1' }} />} valueStyle={{ color: '#722ed1', fontWeight: 'bold' }} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} hoverable style={{ ...cardStyle, borderTop: '4px solid #fa8c16' }}>
          <Statistic title={<span style={{ color: '#666', fontWeight: 600 }}>Tỷ lệ Thắng</span>} value={data.win_rate} suffix="%" prefix={<TrophyOutlined style={{ backgroundColor: '#fff7e6', padding: 8, borderRadius: '50%', color: '#fa8c16' }} />} valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }} />
        </Card>
      </Col>
    </Row>
  );

  // --- 2. BIỂU ĐỒ DOANH THU (MANAGER) ---
  const RevenueChart = () => (
    <Card title={<span>💰 Giá trị Tiềm năng theo Giai đoạn</span>} bordered={false} style={cardStyle} headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
      {data.revenue_by_stage && data.revenue_by_stage.length > 0 ? (
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={data.revenue_by_stage} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} style={{ fontSize: 12, fontWeight: 500 }} />
              <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8 }} formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {data.revenue_by_stage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#1890ff', '#13c2c2', '#722ed1', '#eb2f96', '#fa8c16'][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '50px 0' }} />
      )}
    </Card>
  );

  // --- [CẬP NHẬT] BIỂU ĐỒ HIỆU SUẤT CÁ NHÂN (DẠNG CỘT + BỘ LỌC) ---
  const RepPerformanceChart = () => (
    <Card
      title={<span>📈 Hiệu suất Bán hàng</span>}
      bordered={false}
      style={cardStyle}
      headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
      extra={
        <Select
          defaultValue={6}
          style={{ width: 120 }}
          onChange={(val) => setTimeRange(val)}
          size="small"
        >
          <Select.Option value={3}>3 tháng</Select.Option>
          <Select.Option value={6}>6 tháng</Select.Option>
          <Select.Option value={9}>9 tháng</Select.Option>
          <Select.Option value={12}>12 tháng</Select.Option>
        </Select>
      }
    >
      {data.rep_performance && data.rep_performance.length > 0 ? (
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={data.rep_performance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" style={{ fontSize: 12 }} />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: 8 }}
                formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'}
              />
              <Legend />
              <Bar
                dataKey="sales"
                name="Doanh số Thắng"
                fill="#52c41a"
                radius={[4, 4, 0, 0]}
                barSize={30}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty description="Chưa có đơn hàng Thắng nào trong khoảng thời gian này" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '50px 0' }} />
      )}
    </Card>
  );

  // --- 3. DANH SÁCH CÔNG VIỆC ---
  const MyTaskList = () => {
    const getPriorityTag = (priority) => {
      switch (priority) {
        case 'HIGH': return <Tag color="error">Gấp</Tag>;
        case 'MEDIUM': return <Tag color="warning">Thường</Tag>;
        default: return <Tag color="default">Thấp</Tag>;
      }
    };

    return (
      <Card
        title={<span>📋 Việc cần làm gấp <Tag color="blue" style={{ marginLeft: 5 }}>{data.my_tasks?.length || 0}</Tag></span>}
        bordered={false}
        style={cardStyle}
        headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
        bodyStyle={{ padding: '0 12px' }}
      >
        <List
          itemLayout="horizontal"
          dataSource={data.my_tasks || []}
          locale={{
            emptyText: <Empty description="Tuyệt vời! Hết việc rồi." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          }}
          renderItem={item => (
            <List.Item
              actions={[
                <Tooltip title={item.is_completed ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}>
                  <Button
                    type="text"
                    shape="circle"
                    icon={<CheckCircleOutlined style={{ fontSize: 18 }} />}
                    style={{
                      color: item.is_completed ? '#52c41a' : '#bfbfbf',
                      backgroundColor: item.is_completed ? '#f6ffed' : 'transparent'
                    }}
                    onClick={() => handleToggleTask(item)}
                  />
                </Tooltip>
              ]}
              style={{ opacity: item.is_completed ? 0.6 : 1, transition: 'all 0.3s' }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: 8,
                    background: item.priority === 'HIGH' ? '#fff1f0' : '#e6f7ff',
                    color: item.priority === 'HIGH' ? '#cf1322' : '#1890ff'
                  }}>
                    {item.priority === 'HIGH' ? <ClockCircleOutlined /> : <CalendarOutlined />}
                  </div>
                }
                title={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, textDecoration: item.is_completed ? 'line-through' : 'none' }}>
                      {item.title}
                    </span>
                    {getPriorityTag(item.priority)}
                  </Space>
                }
                description={
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    <Space split="|">
                      <span style={{ color: dayjs(item.due_date).isBefore(dayjs()) ? 'red' : '#8c8c8c' }}>
                        {dayjs(item.due_date).format('DD/MM HH:mm')}
                      </span>
                      {item.opportunity_name && (
                        <Link to={`/opportunities/${item.opportunity}`} style={{ color: '#1890ff' }}>
                          🔗 {item.opportunity_name}
                        </Link>
                      )}
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  // --- 4. DANH SÁCH DEADLINES ---
  const UpcomingList = () => (
    <Card
      title={<span>🔥 Giao dịch sắp chốt (Deadlines)</span>}
      bordered={false}
      style={{ ...cardStyle, height: 'auto', minHeight: 'fit-content' }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
    >
      <List
        itemLayout="horizontal"
        dataSource={data.upcoming_deals || []}
        locale={{ emptyText: <Empty description="Không có deal nào sắp đến hạn" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={item => (
          <List.Item actions={[<Link key="view" to={`/opportunities/${item.id}`}><RightOutlined /></Link>]}>
            <List.Item.Meta
              avatar={<CalendarOutlined style={{ fontSize: 24, color: '#faad14', marginTop: 5 }} />}
              title={<Link to={`/opportunities/${item.id}`} style={{ fontWeight: 600, color: '#262626' }}>{item.title}</Link>}
              description={
                <div style={{ fontSize: 12 }}>
                  <Space direction="vertical" size={0}>
                    <span>Ngày chốt: <b style={{ color: '#d48806' }}>{dayjs(item.expected_close_date).format('DD/MM/YYYY')}</b></span>
                    <Tag color="green" style={{ border: 0, background: '#f6ffed', color: '#389e0d', marginTop: 4 }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', compactDisplay: 'short' }).format(item.value)}
                    </Tag>
                  </Space>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const LostReasonChart = () => {
    // Màu sắc cho các múi tròn
    const COLORS = ['#ff4d4f', '#ff7a45', '#ffa940', '#ffc53d', '#bae637'];

    return (
      <Card
        title={<span>📉 Phân tích Lý do Thất bại</span>}
        bordered={false}
        style={cardStyle}
        headStyle={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}
      >
        {data.lost_reason_data && data.lost_reason_data.length > 0 ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.lost_reason_data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // Tạo biểu đồ hình bánh donut
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.lost_reason_data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name, props) => [value, props.payload.full_name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty description="Chưa có dữ liệu thất bại" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '50px 0' }} />
        )}
      </Card>
    );
  };



  return (
    <div>
      <h2 style={{ marginBottom: 24, fontWeight: 700, color: '#262626' }}>
        {user?.role === 'MANAGER' ? '📊 Bảng Điều khiển Quản lý' : `🚀 Xin chào, ${user?.username}`}
      </h2>
      <KpiCards />
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {user?.role === 'MANAGER' ? (
          <>
            <Col xs={24} lg={14}><RevenueChart /></Col>
            <Col xs={24} lg={10}><LostReasonChart /></Col>
            <Col xs={24} span={24} style={{ marginTop: 16 }}><UpcomingList /></Col>
          </>
        ) : (
          <>
            <Col xs={24} lg={12}><MyTaskList /></Col>
            <Col xs={24} lg={12}>
              <div style={{ marginBottom: 24 }}><RepPerformanceChart /></div>
              <UpcomingList />
            </Col>
          </>
        )}
      </Row>
    </div>
  );
};

export default DashboardPage;