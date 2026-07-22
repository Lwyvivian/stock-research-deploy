/** Peer Comparison — AI auto-discovers peers, then analyzes */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Typography, Spin, message, Space, Empty, Alert } from 'antd';
import { ReloadOutlined, RightCircleOutlined, ThunderboltOutlined, SearchOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import apiClient from '../api/client';

const { Title, Text } = Typography;
const COLORS = ['#163D7A', '#E6772E', '#2D995F', '#722ED1', '#FA8C16'];

export default function PeerComparisonPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [peers, setPeers] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await apiClient.get(`/projects/${projectId}`);
        setProject(d.data);
        setPeers(d.data.peers || []);
        // Try loading cached comparison
        const { data: cd } = await apiClient.get(`/projects/${projectId}/peer-comparison`);
        if (cd.data) setData(cd.data);
      } catch { } finally { setLoading(false); }
    })();
  }, [projectId]);

  const handleDiscoverPeers = async () => {
    setDiscovering(true);
    try {
      const { data: d } = await apiClient.post(`/projects/${projectId}/discover-peers`);
      setPeers(d.data.peers);
      message.success(`AI found ${d.data.peers.length} peer companies`);
    } catch (err: any) { message.error(err.response?.data?.detail || 'Discovery failed'); }
    finally { setDiscovering(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: d } = await apiClient.post(`/projects/${projectId}/peer-comparison`);
      setData(d.data);
      message.success('Comparison generated successfully');
    } catch (err: any) { message.error(err.response?.data?.detail || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  const barOption = data ? {
    tooltip: { trigger: 'axis' }, legend: { data: data.tickers },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.metrics.map((m: any) => m.name) }, yAxis: { type: 'value' },
    series: data.tickers.map((t: string, i: number) => ({ name: t, type: 'bar', data: data.metrics.map((m: any) => m.values.find((v: any) => v.ticker === t)?.value || 0), itemStyle: { color: COLORS[i] || '#163D7A' } })),
  } : null;

  const columns = [
    { title: 'Category', dataIndex: 'category', key: 'cat', width: 110, render: (v: string, _: any, i: number) => i > 0 && data.metrics[i-1]?.category === v ? '' : <Tag color="#163D7A">{v}</Tag> },
    { title: 'Metric', dataIndex: 'name', key: 'name', width: 140 },
    ...(data?.tickers || []).map((t: string, ti: number) => ({
      title: <span style={{ color: ti === 0 ? '#163D7A' : undefined, fontWeight: ti === 0 ? 'bold' : undefined }}>{t}{ti === 0 ? ' ⭐' : ''}</span>,
      key: t,
      render: (_: any, record: any) => {
        const v = record.values?.find((x: any) => x.ticker === t);
        if (!v) return '-';
        const vals = record.values.map((x: any) => x.value).filter((x: number) => !isNaN(x));
        const isMax = v.value === Math.max(...vals);
        const isMin = vals.length > 1 && v.value === Math.min(...vals);
        return <span style={{ color: isMax ? '#2D995F' : isMin ? '#E6772E' : '#333', fontWeight: isMax || isMin ? 'bold' : 'normal' }}>{v.value}{record.unit}</span>;
      },
    })),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Peer Comparison Analysis</Title>
        <Space>
          <Button icon={<RightCircleOutlined />} onClick={() => navigate(`/projects/${projectId}/thesis`)}>Go to Thesis</Button>
        </Space>
      </div>

      {/* Peer Discovery Section */}
      <Card style={{ marginBottom: 16 }} title={<span><SearchOutlined /> AI Peer Discovery</span>}>
        {peers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>No peer companies configured. Let AI automatically find comparable companies for {project?.stock_name || 'this stock'}.</Text>
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleDiscoverPeers} loading={discovering}>
              {discovering ? 'AI Searching...' : `Find Peers for ${project?.stock_code || 'Stock'}`}
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>{project?.stock_name} ({project?.stock_code}) ⭐ Target</Text>
              <span style={{ margin: '0 8px', color: '#999' }}>vs</span>
              {peers.map((p: any, i: number) => (
                <Tag key={i} color={COLORS[i+1]} style={{ margin: '2px 4px', padding: '4px 10px', fontSize: 13 }}>{p.code} — {p.name} ({p.market})</Tag>
              ))}
            </div>
            <Space>
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate} loading={generating} size="large">
                {data ? 'Refresh Comparison' : 'Run Peer Comparison'}
              </Button>
              <Button icon={<SearchOutlined />} onClick={handleDiscoverPeers} loading={discovering} size="small">Re-discover Peers</Button>
            </Space>
          </div>
        )}
      </Card>

      {/* Results */}
      {generating && <Spin size="large" style={{ display: 'block', marginTop: 40 }} tip="AI analyzing peer data..." />}
      {data && !generating && (
        <>
          <Card style={{ marginBottom: 16 }} title="📊 Comparison Table">
            <Table columns={columns} dataSource={data.metrics} rowKey="name" pagination={false} size="middle" bordered />
          </Card>
          {barOption && <Card style={{ marginBottom: 16 }} title="📈 Comparison Chart"><ReactECharts option={barOption} style={{ height: 400 }} /></Card>}
          {data.narrative && <Card title="🤖 AI Qualitative Analysis"><Text style={{ whiteSpace: 'pre-wrap' }}>{data.narrative}</Text></Card>}
        </>
      )}
    </div>
  );
}
