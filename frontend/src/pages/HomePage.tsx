/** 首页 - 项目列表 + 新建项目 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Table, Tag, Space, Popconfirm, Typography, Empty, message, Modal, Form, Input, Select, Checkbox, Row, Col, AutoComplete, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, RightCircleOutlined, SearchOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import apiClient from '../api/client';

const { Title } = Typography;

const MARKET_OPTIONS = [
  { value: 'A', label: '🇨🇳 A-Share' }, { value: 'US', label: '🇺🇸 US' }, { value: 'HK', label: '🇭🇰 HK' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockOptions, setStockOptions] = useState<any[]>([]);
  const [peerOptions, setPeerOptions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPeers, setSelectedPeers] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchProjects = async () => {
    setLoading(true);
    try { const { data } = await apiClient.get('/projects?page_size=50'); setProjects(data.data.items || []); }
    catch { /* ignore */ } finally { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  const handleSearch = async (kw: string) => {
    if (kw.length < 1) { setStockOptions([]); return; }
    setSearching(true);
    try {
      const market = form.getFieldValue('market') || undefined;
      const { data } = await apiClient.get('/stocks/search', { params: { q: kw, market } });
      setStockOptions((data.results || []).map((s: any) => ({ value: s.code, label: `${s.code} — ${s.name} (${s.market})`, code: s.code, name: s.name, market: s.market })));
    } catch { } finally { setSearching(false); }
  };

  const handlePeerSearch = async (kw: string) => {
    if (kw.length < 1) { setPeerOptions([]); return; }
    try {
      const market = form.getFieldValue('market') || undefined;
      const { data } = await apiClient.get('/stocks/search', { params: { q: kw, market } });
      setPeerOptions((data.results || []).map((s: any) => ({ value: s.code, label: `${s.code} — ${s.name} (${s.market})`, code: s.code, name: s.name, market: s.market })));
    } catch { }
  };

  const addPeer = (code: string) => {
    const found = peerOptions.find(o => o.code === code);
    if (found && !selectedPeers.find(p => p.code === found.code)) {
      setSelectedPeers([...selectedPeers, found]);
    }
    setPeerOptions([]);
  };

  const removePeer = (code: string) => {
    setSelectedPeers(selectedPeers.filter(p => p.code !== code));
  };

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      const selected = stockOptions.find(o => o.code === values.stock_code_input);
      await apiClient.post('/projects', {
        stock_code: selected?.code || values.stock_code_input || '',
        stock_name: selected?.name || values.stock_name,
        market: values.market,
        peers: selectedPeers.map(p => ({ code: p.code, name: p.name, market: p.market })),
        data_sources: { earnings: values.earnings ?? true, news: values.news ?? true, transcripts: values.transcripts ?? true, presentations: values.presentations ?? true },
      });
      message.success(t('common.success'));
      setModalOpen(false); form.resetFields(); fetchProjects();
    } catch (err: any) { message.error(err.response?.data?.detail || t('common.error')); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try { await apiClient.delete(`/projects/${id}`); message.success(t('common.success')); fetchProjects(); }
    catch { message.error(t('common.error')); }
  };

  const columns = [
    { title: t('project.stockName'), dataIndex: 'stock_name', key: 'name', render: (n: string, r: any) => <Space><span style={{ fontWeight: 500 }}>{n}</span>{r.stock_code && <Tag>{r.stock_code}</Tag>}<Tag color={r.market==='A'?'red':r.market==='US'?'blue':'orange'}>{r.market}</Tag></Space> },
    { title: t('project.status'), dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={({created:'default',collecting:'processing',collected:'blue',analyzing:'processing',completed:'success',failed:'error'} as any)[s]||'default'}>{t(`project.projectStatus.${s}`)}</Tag> },
    { title: t('project.createdAt'), dataIndex: 'created_at', key: 'date', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: t('project.actions'), key: 'act', render: (_: any, r: any) => <Space><Button type="link" icon={<RightCircleOutlined/>} onClick={() => navigate(`/projects/${r.id}/data-collection`)}>{t('project.enter')}</Button><Popconfirm title={t('project.confirmDelete')} onConfirm={() => handleDelete(r.id)}><Button type="link" danger icon={<DeleteOutlined/>}>{t('common.delete')}</Button></Popconfirm></Space> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>{t('project.myProjects')}</Title>
        <Button type="primary" size="large" icon={<PlusOutlined/>} onClick={() => setModalOpen(true)}>{t('project.newProject')}</Button>
      </div>
      <Card>
        {projects.length === 0 && !loading
          ? <Empty description={<div><div style={{fontSize:16,marginBottom:8}}>{t('project.noProjects')}</div><div style={{color:'#999'}}>{t('project.noProjectsDesc')}</div></div>} />
          : <Table columns={columns} dataSource={projects} rowKey="id" loading={loading} pagination={{pageSize:20}} />
        }
      </Card>
      <Modal title={t('project.newProject')} open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="market" label={t('project.market')} rules={[{ required: true }]} initialValue="A"><Select options={MARKET_OPTIONS} onChange={() => { setStockOptions([]); form.setFieldValue('stock_code_input', undefined); }} /></Form.Item></Col>
            <Col span={16}><Form.Item name="stock_code_input" label={t('project.stockCode')} extra={t('project.stockOptional')}><AutoComplete options={stockOptions} onSearch={handleSearch} notFoundContent={searching ? t('common.loading') : t('project.peerPlaceholder')}><Input prefix={<SearchOutlined/>} placeholder={t('project.stockCodePlaceholder')} /></AutoComplete></Form.Item></Col>
          </Row>
          <Form.Item name="stock_name" label={t('project.stockName')} rules={[{ required: true }]}><Input placeholder={t('project.stockNamePlaceholder')} /></Form.Item>
          <Form.Item label={t('project.addPeer')}>
            <AutoComplete options={peerOptions} onSearch={handlePeerSearch} onSelect={addPeer} notFoundContent="Type to search..." style={{ marginBottom: 8 }}>
              <Input prefix={<SearchOutlined />} placeholder="Search peer company... (e.g. MSFT, 茅台)" />
            </AutoComplete>
            <div style={{ marginTop: 4 }}>
              {selectedPeers.map(p => (
                <Tag key={p.code} closable onClose={() => removePeer(p.code)} color="blue" style={{ marginBottom: 4 }}>
                  {p.code} — {p.name} ({p.market})
                </Tag>
              ))}
              {selectedPeers.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No peers added yet</Text>}
            </div>
          </Form.Item>
          <Form.Item label={t('project.dataSources')}><Space wrap>
            {['earnings','news','transcripts','presentations'].map(k => <Form.Item key={k} name={k} noStyle valuePropName="checked" initialValue={true}><Checkbox>{t(`project.${k}`)}</Checkbox></Form.Item>)}
          </Space></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}><Space>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>{t('project.startPipeline')}</Button>
          </Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
