/** 应用主布局 - 侧边导航 + 顶部栏 + 内容区 */
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Space, Typography } from 'antd';
import {
  HomeOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SwapOutlined,
  RiseOutlined,
  ExportOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // 从路径中提取当前项目 ID
  const pathParts = location.pathname.split('/');
  const projectId = pathParts.length > 2 ? pathParts[2] : null;

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: t('nav.home') },
    ...(projectId ? [
      { key: `/projects/${projectId}/data-collection`, icon: <DatabaseOutlined />, label: t('nav.dataCollection') },
      { key: `/projects/${projectId}/analysis`, icon: <FileTextOutlined />, label: t('nav.analysis') },
      { key: `/projects/${projectId}/peer-comparison`, icon: <SwapOutlined />, label: t('nav.peerComparison') },
      { key: `/projects/${projectId}/thesis`, icon: <RiseOutlined />, label: t('nav.thesis') },
      { key: `/projects/${projectId}/report`, icon: <ExportOutlined />, label: t('nav.report') },
    ] : []),
  ];

  const handleLogout = () => { logout(); navigate('/login'); };
  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: t('auth.logout'), onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Text strong style={{ color: '#fff', fontSize: 14, letterSpacing: 1 }}>
            📊 {t('app.title')}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/' ? '/' : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout style={{ marginLeft: 200 }}>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          borderBottom: '1px solid #E8EFF9',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              {user?.name || 'User'}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
