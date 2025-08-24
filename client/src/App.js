import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Card, Row, Col, Spin, Alert } from 'antd';
import { TableOutlined, SettingOutlined, DatabaseOutlined, ApiOutlined } from '@ant-design/icons';
import { Routes, Route, useNavigate } from 'react-router-dom';
import TableView from './pages/TableView';
import RelationshipConfig from './pages/RelationshipConfig';
import QueryBuilder from './pages/QueryBuilder';
import DataSourceManager from './pages/DataSourceManager';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        setConnectionStatus(true);
      } else {
        setError('数据库连接失败');
      }
    } catch (err) {
      setError('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      key: 'tables',
      icon: <TableOutlined />,
      label: '数据表',
      onClick: () => navigate('/')
    },
    {
      key: 'query',
      icon: <DatabaseOutlined />,
      label: '查询构建器',
      onClick: () => navigate('/query')
    },
    {
      key: 'datasources',
      icon: <ApiOutlined />,
      label: '数据源管理',
      onClick: () => navigate('/datasources')
    },
    {
      key: 'config',
      icon: <SettingOutlined />,
      label: '关联配置',
      onClick: () => navigate('/config')
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="连接错误"
          description={error}
          type="error"
          showIcon
          action={
            <button onClick={checkConnection} style={{ border: 'none', background: 'none', color: '#1890ff', cursor: 'pointer' }}>
              重试
            </button>
          }
        />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '6px' }} />
        <Menu
          theme="dark"
          defaultSelectedKeys={['tables']}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
            <Title level={4} style={{ margin: 0 }}>
              MySQL 数据查看器
            </Title>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                background: connectionStatus ? '#52c41a' : '#ff4d4f',
                color: 'white',
                fontSize: '12px'
              }}>
                {connectionStatus ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          <Routes>
            <Route path="/" element={<TableView />} />
            <Route path="/query" element={<QueryBuilder />} />
            <Route path="/datasources" element={<DataSourceManager />} />
            <Route path="/config" element={<RelationshipConfig />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;