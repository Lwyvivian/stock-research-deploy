/** 多空投资论点页 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Spin, message, Tag, Modal, Input, Select, Space, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, RightCircleOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';

const { Title, Text, Paragraph } = Typography;
const CC: Record<string, string> = { high: '#2D995F', medium: '#E6772E', low: '#999' };

export default function ThesisPage() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [bull, setBull] = useState<any[]>([]);
  const [bear, setBear] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newDir, setNewDir] = useState('bull');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const fetchData = async () => {
    try { const { data: d } = await apiClient.get(`/projects/${projectId}/thesis`); setBull(d.data.bull || []); setBear(d.data.bear || []); }
    catch { } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [projectId]);

  const handleGenerate = async () => { setLoading(true); try { const { data: d } = await apiClient.post(`/projects/${projectId}/thesis/generate`); setBull(d.data.bull||[]); setBear(d.data.bear||[]); message.success(`Generated ${d.data.bull.length} bull + ${d.data.bear.length} bear`); } catch (e: any) { message.error(e.response?.data?.detail || t('common.error')); } finally { setLoading(false); } };
  const handleAdd = async () => { try { await apiClient.post(`/projects/${projectId}/thesis/custom`, { direction: newDir, title: newTitle, content: newContent }); message.success(t('common.success')); setModalOpen(false); setNewTitle(''); setNewContent(''); fetchData(); } catch { message.error(t('common.error')); } };
  const handleDelete = async (id: string) => { await apiClient.delete(`/projects/${projectId}/thesis/${id}`); message.success(t('thesis.deleteSuccess')); fetchData(); };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  const hasData = bull.length > 0 || bear.length > 0;

  const CardList = ({ items, color, bg, icon, label }: any) => (
    <Card title={<span>{icon} {label} ({items.length})</span>} style={{ background: bg }}>
      {items.map((item: any) => (
        <Card key={item.id} size="small" style={{ marginBottom: 12 }} extra={<Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />}>
          <Space style={{ marginBottom: 4 }}><Tag color={CC[item.conviction]}>{item.conviction}</Tag><Text strong>{item.title}</Text>{item.is_custom && <Tag>{t('thesis.custom')}</Tag>}</Space>
          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{item.content}</Paragraph>
        </Card>
      ))}
    </Card>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('thesis.title')}</Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>{t('thesis.addCustom')}</Button>
          <Button type="primary" onClick={handleGenerate} icon={<ReloadOutlined />} loading={loading}>{t('thesis.aiGenerate')}</Button>
          <Button icon={<RightCircleOutlined />} onClick={() => navigate(`/projects/${projectId}/report`)}>{t('thesis.enterReport')}</Button>
        </Space>
      </div>
      {!hasData ? <div style={{ textAlign: 'center', paddingTop: 80 }}><Text type="secondary">{t('thesis.noData')}</Text></div>
        : <Row gutter={24}>
          <Col span={12}><CardList items={bull} color="#2D995F" bg="#f6ffed" icon={<RiseOutlined style={{ color: '#2D995F' }} />} label={t('thesis.bull')} /></Col>
          <Col span={12}><CardList items={bear} color="#E6772E" bg="#fff7e6" icon={<FallOutlined style={{ color: '#E6772E' }} />} label={t('thesis.bear')} /></Col>
        </Row>
      }
      <Modal title={t('thesis.addTitle')} open={modalOpen} onOk={handleAdd} onCancel={() => setModalOpen(false)}>
        <Select value={newDir} onChange={setNewDir} style={{ width: '100%', marginBottom: 12 }} options={[{ value: 'bull', label: t('thesis.bullLabel') }, { value: 'bear', label: t('thesis.bearLabel') }]} />
        <Input placeholder={t('thesis.thesisTitle')} value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ marginBottom: 12 }} />
        <Input.TextArea rows={4} placeholder={t('thesis.thesisContent')} value={newContent} onChange={e => setNewContent(e.target.value)} />
      </Modal>
    </div>
  );
}
