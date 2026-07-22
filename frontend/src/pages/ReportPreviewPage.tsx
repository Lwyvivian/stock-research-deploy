/** Interactive PPT Editor — edit, theme, charts, add/delete slides, PDF export */
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Spin, Typography, message, Modal, Select, Input, Space, ColorPicker, Slider, Dropdown, Tag } from 'antd';
import { DownloadOutlined, SoundOutlined, PrinterOutlined, PlusOutlined, DeleteOutlined, EditOutlined, BgColorsOutlined, BarChartOutlined, FontSizeOutlined, FilePdfOutlined } from '@ant-design/icons';
import html2pdf from 'html2pdf.js';
import apiClient from '../api/client';

const { Title, Text } = Typography;

const THEMES: Record<string, Record<string, string>> = {
  'deep-blue': { '--primary': '#163D7A', '--bg': '#fff', '--text': '#1a1a1a', '--accent': '#E8EFF9', name: 'Deep Blue' },
  'dark': { '--primary': '#4a9eff', '--bg': '#1a1a2e', '--text': '#e0e0e0', '--accent': '#16213e', name: 'Dark Mode' },
  'classic': { '--primary': '#333', '--bg': '#fff', '--text': '#1a1a1a', '--accent': '#f5f5f5', name: 'Classic White' },
  'warm': { '--primary': '#8B6914', '--bg': '#fff', '--text': '#3a2a0a', '--accent': '#fdf6e3', name: 'Warm Professional' },
};

export default function ReportPreviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');
  const [stockName, setStockName] = useState('');
  const [loading, setLoading] = useState(true);
  const [speech, setSpeech] = useState('');
  const [speechOpen, setSpeechOpen] = useState(false);
  const [speechLoading, setSpeechLoading] = useState(false);
  const [theme, setTheme] = useState('deep-blue');
  const [editing, setEditing] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [chartModal, setChartModal] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState('');

  useEffect(() => {
    (async () => {
      try { const { data: d } = await apiClient.get(`/projects/${projectId}/report`); setHtml(d.data.html); setStockName(d.data.stock_name); }
      catch { message.error('Failed to load report'); } finally { setLoading(false); }
    })();
  }, [projectId]);

  // Apply theme CSS variables
  useEffect(() => {
    const t = THEMES[theme];
    if (!t) return;
    const root = containerRef.current;
    if (!root) return;
    Object.entries(t).forEach(([k, v]) => { if (k !== 'name') root.style.setProperty(k, v); });
  }, [theme, html]);

  // Apply editing state to slides
  useEffect(() => {
    if (!containerRef.current) return;
    const slides = containerRef.current.querySelectorAll('.slide');
    slides.forEach(s => { (s as HTMLElement).contentEditable = editing ? 'true' : 'false'; });
  }, [editing, html]);

  const handleSpeech = async () => {
    setSpeechLoading(true);
    try { const { data: d } = await apiClient.post(`/projects/${projectId}/speech`); setSpeech(d.data.speech); setSpeechOpen(true); }
    catch { message.error('Speech generation failed'); } finally { setSpeechLoading(false); }
  };

  const handleDownloadPDF = async () => {
    if (!containerRef.current) return;
    message.loading({ content: 'Generating PDF...', key: 'pdf' });
    try {
      const slides = containerRef.current.querySelectorAll('.slide');
      // Wrap slides in a clean container for PDF
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'padding:20px;font-family:Segoe UI,sans-serif';
      slides.forEach(s => wrapper.appendChild(s.cloneNode(true)));
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `${stockName}_Pitch_Deck.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(wrapper).save();
      message.success({ content: 'PDF downloaded!', key: 'pdf' });
    } catch (e) {
      message.error({ content: 'PDF generation failed', key: 'pdf' });
    }
  };

  const handleDownload = () => {
    if (!containerRef.current) return;
    const fullHTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${stockName} Pitch</title><style>
:root{--primary:${THEMES[theme]['--primary']};--bg:${THEMES[theme]['--bg']};--text:${THEMES[theme]['--text']};--accent:${THEMES[theme]['--accent']}}
body{font-family:'Segoe UI',sans-serif;color:var(--text);background:var(--bg);padding:30px}
.slide{background:var(--bg);max-width:1000px;margin:0 auto 28px;padding:44px 52px;border-radius:8px;box-shadow:0 1px 8px rgba(0,0,0,.06);min-height:540px}
.sn{color:var(--primary);font-size:11px;font-weight:700;margin-bottom:6px;letter-spacing:3px}
.st{color:var(--primary);font-size:21px;font-weight:700;border-bottom:3px solid var(--primary);padding-bottom:10px;margin-bottom:20px}
.sc{font-size:14px;line-height:1.75}.sc h3{color:var(--primary);font-size:15px;margin:14px 0 6px}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
th{background:var(--primary);color:#fff;padding:7px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #e8e8e8}
@media print{body{background:#fff;padding:0}.slide{box-shadow:none;margin:0;border-radius:0}}
</style></head><body>${containerRef.current.innerHTML}</body></html>`;
    const b = new Blob([fullHTML], { type: 'text/html' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = `${stockName}_Pitch_Deck.html`; a.click(); URL.revokeObjectURL(a.href);
    message.success('Downloaded! Open in browser → Print → Save as PDF.');
  };

  const handleAddSlide = () => {
    if (!containerRef.current) return;
    const slide = document.createElement('div');
    slide.className = 'slide'; slide.contentEditable = String(editing);
    slide.innerHTML = `<div class="sn">NEW SLIDE</div><h2 class="st">Add Title Here</h2><div class="sc"><p>Click to add content...</p></div>`;
    containerRef.current.appendChild(slide);
    slide.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteSlide = () => {
    if (!containerRef.current) return;
    const slides = containerRef.current.querySelectorAll('.slide');
    if (slides.length <= 1) { message.warning('Cannot delete the last slide'); return; }
    const last = slides[slides.length - 1];
    if (confirm('Delete the last slide?')) last.remove();
  };

  const handleInsertChart = () => {
    if (!containerRef.current || !chartData.trim()) return;
    const values = chartData.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (values.length < 2) { message.error('Enter comma-separated numbers (e.g. 45,30,15,10)'); return; }
    const labels = values.map((_, i) => `Item ${i + 1}`);
    const max = Math.max(...values);
    let svg = '';
    if (chartType === 'bar') {
      svg = `<svg viewBox="0 0 400 200" width="100%" height="200">${values.map((v, i) => { const h = (v / max) * 140; const x = 40 + i * 80; return `<rect x="${x}" y="${160 - h}" width="60" height="${h}" fill="${['#163D7A','#2D995F','#E6772E','#5B8FC1','#FA8C16'][i]||'#163D7A'}" rx="3"/><text x="${x + 30}" y="${155 - h}" text-anchor="middle" font-size="11">${v}</text><text x="${x + 30}" y="185" text-anchor="middle" font-size="9">${labels[i]}</text>`; }).join('')}</svg>`;
    } else if (chartType === 'pie') {
      const total = values.reduce((s, v) => s + v, 0); let cum = 0;
      svg = `<svg viewBox="0 0 200 160" width="200" height="160">${values.map((v, i) => { const sa = (cum / total) * 360; cum += v; const ea = (cum / total) * 360; const r = 55, cx = 75, cy = 75; const x1 = cx + r * Math.cos((sa - 90) * Math.PI / 180), y1 = cy + r * Math.sin((sa - 90) * Math.PI / 180), x2 = cx + r * Math.cos((ea - 90) * Math.PI / 180), y2 = cy + r * Math.sin((ea - 90) * Math.PI / 180); return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${ea - sa > 180 ? 1 : 0},1 ${x2},${y2} Z" fill="${['#163D7A','#2D995F','#E6772E','#5B8FC1','#FA8C16'][i] || '#999'}"/><text x="145" y="${15 + i * 16}" font-size="9">${labels[i]}: ${Math.round(v / total * 100)}%</text>`; }).join('')}</svg>`;
    } else {
      const pts = values.map((v, i) => `${40 + i * 80},${160 - (v / max) * 140}`).join(' ');
      svg = `<svg viewBox="0 0 400 200" width="100%" height="200"><polyline points="${pts}" fill="none" stroke="#163D7A" stroke-width="2"/>${values.map((v, i) => `<circle cx="${40 + i * 80}" cy="${160 - (v / max) * 140}" r="3" fill="#163D7A"/><text x="${40 + i * 80}" y="${155 - (v / max) * 140}" text-anchor="middle" font-size="9">${v}</text>`).join('')}${values.map((_, i) => `<text x="${40 + i * 80}" y="185" text-anchor="middle" font-size="9">${labels[i]}</text>`).join('')}</svg>`;
    }
    const slide = document.createElement('div');
    slide.className = 'slide'; slide.contentEditable = String(editing);
    slide.innerHTML = `<div class="sn">CHART</div><h2 class="st">Inserted Chart</h2><div class="sc">${svg}</div>`;
    containerRef.current.appendChild(slide);
    slide.scrollIntoView({ behavior: 'smooth' });
    setChartModal(false); setChartData('');
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;

  return (
    <div>
      {/* Floating Toolbar */}
      <Card size="small" style={{ position: 'sticky', top: 0, zIndex: 50, marginBottom: 16, background: '#fff', borderBottom: '2px solid #163D7A' }}>
        <Space wrap>
          <Tag color="#163D7A" style={{ fontWeight: 700 }}>📊 {stockName}</Tag>
          <Button size="small" type={editing ? 'primary' : 'default'} icon={<EditOutlined />} onClick={() => setEditing(!editing)}>{editing ? 'Editing ON' : 'Edit Text'}</Button>
          {editing && <>
            <span style={{ fontSize: 12, color: '#666' }}>Font:</span>
            <Slider min={10} max={32} value={fontSize} onChange={setFontSize} style={{ width: 80 }} />
            <ColorPicker value={textColor} onChange={(_, c) => setTextColor(c)} size="small" />
          </>}
          <Dropdown menu={{ items: Object.entries(THEMES).map(([k, v]) => ({ key: k, label: v.name, onClick: () => setTheme(k) })) }}>
            <Button size="small" icon={<BgColorsOutlined />}>{THEMES[theme].name}</Button>
          </Dropdown>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddSlide}>Add Slide</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDeleteSlide}>Delete Last</Button>
          <Button size="small" icon={<BarChartOutlined />} onClick={() => setChartModal(true)}>Insert Chart</Button>
          <Button size="small" icon={<SoundOutlined />} onClick={handleSpeech} loading={speechLoading}>AI Speech</Button>
          <Button size="small" type="primary" icon={<FilePdfOutlined />} onClick={handleDownloadPDF}>Download PDF</Button>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload}>HTML</Button>
        </Space>
      </Card>

      {/* Editable Report */}
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }}
        style={{ '--primary': THEMES[theme]['--primary'], '--bg': THEMES[theme]['--bg'], '--text': THEMES[theme]['--text'], '--accent': THEMES[theme]['--accent'] } as any}
      />

      {/* Speech Modal */}
      <Modal title={`🎙️ ${stockName} — 3-Minute Pitch`} open={speechOpen} onCancel={() => setSpeechOpen(false)} footer={<Button onClick={() => setSpeechOpen(false)}>Close</Button>} width={700}>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 2, background: '#fafafa', padding: 20, borderRadius: 6 }}>{speech}</div>
      </Modal>

      {/* Chart Insertion Modal */}
      <Modal title="Insert Chart" open={chartModal} onOk={handleInsertChart} onCancel={() => setChartModal(false)}>
        <Select value={chartType} onChange={setChartType} style={{ width: '100%', marginBottom: 12 }}
          options={[{ value: 'bar', label: 'Bar Chart' }, { value: 'pie', label: 'Pie Chart' }, { value: 'line', label: 'Line Chart' }]} />
        <Input.TextArea rows={3} value={chartData} onChange={e => setChartData(e.target.value)}
          placeholder="Enter values: 45, 30, 15, 10" />
        <Text type="secondary" style={{ fontSize: 11 }}>Comma-separated numbers. First 5 values will be used.</Text>
      </Modal>
    </div>
  );
}
