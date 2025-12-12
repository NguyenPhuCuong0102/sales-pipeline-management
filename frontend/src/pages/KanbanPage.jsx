import React, { useEffect, useState } from 'react';
import { Card, Tag, Spin, Avatar, Tooltip, Button, message } from 'antd';
// Dùng thư viện mới ổn định hơn
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import dayjs from 'dayjs';

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

const KanbanPage = () => {
  const [stages, setStages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Pipeline Bán hàng - Core CRM";
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stageRes, oppRes] = await Promise.all([
        axiosClient.get('stages/'),
        axiosClient.get('opportunities/?page_size=1000') 
      ]);
      
      const stagesData = Array.isArray(stageRes.data) ? stageRes.data : (stageRes.data.results || []);
      const oppsData = Array.isArray(oppRes.data) ? oppRes.data : (oppRes.data.results || []);

      stagesData.sort((a, b) => a.order - b.order);

      setStages(stagesData);
      setOpportunities(oppsData);
    } catch (error) {
      console.error("Lỗi tải Kanban:", error);
      message.error('Không thể tải dữ liệu Pipeline');
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStageId = parseInt(destination.droppableId);
    
    // Optimistic Update
    const updatedOpps = opportunities.map(opp => {
      if (opp.id === parseInt(draggableId)) {
        return { ...opp, stage: newStageId };
      }
      return opp;
    });
    setOpportunities(updatedOpps);

    // API Call
    try {
      await axiosClient.patch(`opportunities/${draggableId}/`, { stage: newStageId });
      message.success('Đã cập nhật trạng thái');
    } catch (error) {
      message.error('Lỗi khi lưu thay đổi, đang hoàn tác...');
      fetchData();
    }
  };

  const getOppsByStage = (stageId) => opportunities.filter(op => op.stage === stageId);

  const calculateTotal = (opps) => opps.reduce((sum, item) => sum + parseFloat(item.value), 0);

  if (loading) return <Spin tip="Đang tải Pipeline..." style={{ display: 'block', margin: '50px auto' }} />;

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Inject CSS vào trang */}
        <style>{hideScrollbarStyle}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Quản lý Pipeline</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/opportunities')}>Tạo Deal mới</Button>
        </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div 
            className="no-scrollbar" // <--- Ẩn thanh cuộn ngang
            style={{ 
                display: 'flex', 
                gap: '16px', 
                overflowX: 'auto', 
                paddingBottom: '20px',
                height: '100%',
                alignItems: 'flex-start'
            }}
        >
          {stages.map(stage => {
            const stageOpps = getOppsByStage(stage.id);
            const totalValue = calculateTotal(stageOpps);

            return (
              <div key={stage.id} style={{ 
                  width: 320, 
                  minWidth: 320, 
                  background: '#f4f5f7', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  maxHeight: '100%'
              }}>
                <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d9d9d9' }}>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: 13, color: '#5e6c84' }}>{stage.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>{stageOpps.length} deals</span>
                    <span style={{ color: '#3f8600', fontWeight: 'bold' }}>
                        {new Intl.NumberFormat('vi-VN', { compactDisplay: 'short', notation: 'compact' }).format(totalValue)}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={String(stage.id)}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="no-scrollbar" // <--- Ẩn thanh cuộn dọc
                      style={{ 
                          flexGrow: 1,
                          overflowY: 'auto', 
                          minHeight: 100,
                          background: snapshot.isDraggingOver ? '#e6f7ff' : 'transparent',
                          transition: 'background 0.2s',
                          borderRadius: 4,
                          padding: '4px'
                      }}
                    >
                      {stageOpps.length > 0 ? stageOpps.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={String(opp.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                marginBottom: 10,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                              }}
                            >
                              <Card 
                                size="small" 
                                hoverable 
                                bordered={false}
                                style={{ 
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                                    borderLeft: `4px solid ${opp.status === 'WON' ? '#52c41a' : opp.status === 'LOST' ? '#ff4d4f' : '#1890ff'}`
                                }}
                                onClick={() => navigate(`/opportunities/${opp.id}`)}
                              >
                                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {opp.title}
                                </div>
                                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                    {opp.customer_name}
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Tag color="green" style={{ margin: 0, border: 'none', background: '#f6ffed' }}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', compactDisplay: 'short' }).format(opp.value)}
                                    </Tag>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {opp.expected_close_date && (
                                            <Tooltip title={`Ngày chốt: ${dayjs(opp.expected_close_date).format('DD/MM/YYYY')}`}>
                                                <span style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center' }}>
                                                    <CalendarOutlined style={{ marginRight: 3 }} /> 
                                                    {dayjs(opp.expected_close_date).format('DD/MM')}
                                                </span>
                                            </Tooltip>
                                        )}
                                        {opp.owner_name && (
                                            <Tooltip title={opp.owner_name}>
                                                <Avatar size={22} style={{ backgroundColor: '#1890ff', fontSize: 10 }}>
                                                    {opp.owner_name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      )) : (
                          <div style={{ textAlign: 'center', padding: '30px 0', color: '#ccc', fontSize: 12 }}>
                              Kéo thẻ vào đây
                          </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanPage;