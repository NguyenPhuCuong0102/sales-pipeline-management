import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { Card, Tag, Avatar, Spin, message, Button, Typography, Badge, Tooltip } from 'antd';
import { 
  UserOutlined, 
  ReloadOutlined, 
  CalendarOutlined,
  DollarCircleFilled 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import dayjs from 'dayjs';

const { Text } = Typography;

// --- CSS ẨN THANH CUỘN ---
const hideScrollbarStyle = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

// --- HÀM HELPER ---
const getStageColor = (index, name = '') => {
  if (name.toLowerCase().includes('won') || name.toLowerCase().includes('thắng')) return '#52c41a';
  if (name.toLowerCase().includes('lost') || name.toLowerCase().includes('thua')) return '#ff4d4f';
  const colors = ['#1890ff', '#13c2c2', '#fa8c16', '#722ed1', '#eb2f96', '#faad14'];
  return colors[index % colors.length];
};

// --- COMPONENT: THẺ GIAO DỊCH ---
const KanbanCard = ({ opportunity, color }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id.toString(),
    data: { ...opportunity },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.05 : 1})`,
    opacity: isDragging ? 0 : 1,
    cursor: 'grab',
    marginBottom: 12,
  } : { marginBottom: 12, cursor: 'grab' };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card 
        size="small" 
        hoverable 
        bordered={false} 
        style={{ 
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            borderRadius: 8,
            borderLeft: `4px solid ${color}`,
            overflow: 'hidden'
        }}
        bodyStyle={{ padding: '10px 12px' }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, lineHeight: '1.4' }}>
            <Link to={`/opportunities/${opportunity.id}`} style={{ color: '#262626' }}>
                {opportunity.title}
            </Link>
        </div>

        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <UserOutlined style={{ fontSize: 10 }} /> 
                <Text type="secondary" style={{ fontWeight: 500 }}>
                    {opportunity.customer_name}
                </Text>
            </div>
            
            {opportunity.expected_close_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CalendarOutlined style={{ fontSize: 10 }} /> 
                    <span>{dayjs(opportunity.expected_close_date).format('DD/MM/YYYY')}</span>
                </div>
            )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
           <Tag color="green" style={{ margin: 0, border: 'none', background: '#f6ffed', color: '#389e0d', fontWeight: 600 }}>
             <DollarCircleFilled /> {new Intl.NumberFormat('vi-VN', { compactDisplay: 'short', notation: 'compact' }).format(opportunity.value)}
           </Tag>
           
           <Tooltip title={opportunity.owner_name}>
                <Avatar 
                    size={22} 
                    style={{ backgroundColor: color, fontSize: 10, cursor: 'pointer' }}
                >
                    {opportunity.owner_name ? opportunity.owner_name.charAt(0).toUpperCase() : <UserOutlined />}
                </Avatar>
           </Tooltip>
        </div>
      </Card>
    </div>
  );
};

// --- COMPONENT: CỘT GIAI ĐOẠN ---
const KanbanColumn = ({ stage, opportunities, color }) => {
  const { setNodeRef } = useDroppable({
    id: stage.id.toString(),
  });

  const totalValue = opportunities.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div style={{ 
        flex: '0 0 280px', 
        marginRight: 16,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }}>
      {/* Header */}
      <div style={{ 
          background: '#fff', 
          padding: '12px 16px', 
          borderRadius: '8px 8px 0 0', 
          borderTop: `3px solid ${color}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          marginBottom: 2
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#262626' }}>{stage.name}</h4>
            <Badge count={opportunities.length} style={{ backgroundColor: '#f0f0f0', color: '#595959' }} />
        </div>
        <div style={{ fontSize: 11, color: '#8c8c8c' }}>
            Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(totalValue)}
        </div>
      </div>
      
      {/* Body (Đã thêm class no-scrollbar) */}
      <div 
        ref={setNodeRef} 
        className="no-scrollbar" // <--- CLASS ẨN THANH CUỘN DỌC
        style={{ 
            flex: 1, 
            background: '#f5f7fa', 
            padding: 10,
            borderRadius: '0 0 8px 8px',
            overflowY: 'auto', // Vẫn cho phép scroll
            minHeight: 100
        }}
      >
        {opportunities.map(opp => (
          <KanbanCard key={opp.id} opportunity={opp} color={color} />
        ))}
        {opportunities.length === 0 && (
            <div style={{ textAlign: 'center', color: '#d9d9d9', marginTop: 20, fontSize: 12 }}>
                Trống
            </div>
        )}
      </div>
    </div>
  );
};

// --- TRANG CHÍNH ---
const KanbanPage = () => {
  const [stages, setStages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState(null);

  useEffect(() => {
    document.title = "Pipeline Kanban - Core CRM";
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stageRes, oppRes] = await Promise.all([
        axiosClient.get('stages/'),
        axiosClient.get('opportunities/?page_size=1000')
      ]);
      const rawStages = Array.isArray(stageRes.data) ? stageRes.data : stageRes.data.results;
      const rawOpps = Array.isArray(oppRes.data) ? oppRes.data : oppRes.data.results;
      setStages(rawStages.sort((a, b) => a.order - b.order));
      setOpportunities(rawOpps);
    } catch (error) {
      message.error('Lỗi tải dữ liệu Kanban');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const item = opportunities.find(o => o.id.toString() === event.active.id);
    setActiveDragItem(item);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) return;

    const cardId = active.id;
    const newStageId = parseInt(over.id);
    const currentOpp = opportunities.find(o => o.id.toString() === cardId);
    
    if (currentOpp.stage === newStageId) return;

    setOpportunities(prev => prev.map(o => {
        if (o.id.toString() === cardId) return { ...o, stage: newStageId };
        return o;
    }));

    try {
        await axiosClient.patch(`opportunities/${cardId}/`, { stage: newStageId });
        message.success('Đã chuyển giai đoạn');
    } catch (error) {
        message.error('Lỗi cập nhật server!');
        fetchData();
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.5' } },
    }),
  };

  if (loading) return <Spin style={{ display: 'block', margin: '50px auto' }} />;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Inject CSS ẩn thanh cuộn */}
      <style>{hideScrollbarStyle}</style>

      <div style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0 }}>Pipeline View</h2>
                <span style={{ color: '#8c8c8c' }}>Kéo thả để cập nhật tiến độ</span>
            </div>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
        </div>

        {/* Khu vực chứa cột (Đã thêm class no-scrollbar) */}
        <div 
            className="no-scrollbar" // <--- CLASS ẨN THANH CUỘN NGANG
            style={{ 
                display: 'flex', 
                overflowX: 'auto', // Vẫn cho phép scroll ngang
                paddingBottom: 10, 
                height: '100%',
                alignItems: 'flex-start' 
            }}
        >
            {stages.map((stage, index) => (
                <KanbanColumn 
                    key={stage.id} 
                    stage={stage} 
                    color={getStageColor(index, stage.name)}
                    opportunities={opportunities.filter(o => o.stage === stage.id)} 
                />
            ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
            {activeDragItem ? (
                <Card size="small" style={{ 
                    width: 280, 
                    cursor: 'grabbing', 
                    transform: 'rotate(4deg) scale(1.05)', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    borderLeft: `4px solid #1890ff`,
                    borderRadius: 8
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 5 }}>{activeDragItem.title}</div>
                    <Tag color="green"><DollarCircleFilled /> {new Intl.NumberFormat('vi-VN').format(activeDragItem.value)}</Tag>
                </Card>
            ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default KanbanPage;