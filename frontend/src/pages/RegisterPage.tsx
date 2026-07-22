/** 注册页 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string; name: string }) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', values);
      setTokens(data.access_token, data.refresh_token); setUser(data.user);
      message.success(t('common.success')); navigate('/');
    } catch (err: any) { message.error(err.response?.data?.detail || t('common.error')); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #163D7A 0%, #1a4d9e 50%, #0d2b5e 100%)' }}>
      <Card style={{ width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}><Title level={3} style={{ color: '#163D7A', marginBottom: 4 }}>{t('auth.registerTitle')}</Title><Text type="secondary">{t('auth.registerSubtitle')}</Text></div>
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="name" rules={[{ required: true, message: t('auth.nameRequired') }]}><Input prefix={<UserOutlined />} placeholder={t('auth.name')} /></Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('auth.emailRequired') }]}><Input prefix={<MailOutlined />} placeholder={t('auth.email')} /></Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('auth.passwordRequired') }, { min: 6, message: t('auth.passwordMin') }]}><Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={loading} block>{t('auth.register')}</Button></Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}><Text type="secondary">{t('auth.hasAccount')} <Link to="/login">{t('auth.goLogin')}</Link></Text></div>
      </Card>
    </div>
  );
}
