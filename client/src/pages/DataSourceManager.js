import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Table, 
  Select,
  Space, 
  message, 
  Modal, 
  Tag, 
  Popconfirm,
  Alert,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tabs
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { dataSourceService, cacheService } from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

const DataSourceManager = () => {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [testing, setTesting] = useState(false);
  const [form] = Form.useForm();
  const [cacheStats, setCacheStats] = useState({});

  useEffect(() => {
    loadDataSources();
    loadCacheStats();
  }, []);

  const loadDataSources = async () => {
    setLoading(true);
    try {
      const sources = await dataSourceService.getDataSources();
      setDataSources(sources);
    } catch (error) {
      message.error('加载数据源失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCacheStats = () => {
    const stats = cacheService.getCacheStats();
    setCacheStats(stats);
  };

  const handleAddSource = () => {
    setEditingSource(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditSource = (source) => {
    if (source.isDefault) {
      message.warning('不能修改默认数据源');
      return;
    }
    setEditingSource(source);
    form.setFieldsValue(source);
    setModalVisible(true);
  };

  const handleDeleteSource = async (name) => {
    if (name === 'default') {
      message.warning('不能删除默认数据源');
      return;
    }
    
    try {
      await dataSourceService.deleteDataSource(name);
      message.success('数据源删除成功');
      loadDataSources();
    } catch (error) {
      message.error('删除数据源失败');
    }
  };

  const handleTestConnection = async (values) => {
    setTesting(true);
    try {
      const result = await dataSourceService.testConnection(values);
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.error(`连接测试失败: ${result.message}`);
      }
    } catch (error) {
      message.error('连接测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingSource) {
        await dataSourceService.updateDataSource(editingSource.name, values);
        message.success('数据源更新成功');
      } else {
        await dataSourceService.addDataSource(values);
        message.success('数据源添加成功');
      }
      setModalVisible(false);
      loadDataSources();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleClearCache = () => {
    cacheService.clearAllCache();
    loadCacheStats();
    message.success('缓存已清除');
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <DatabaseOutlined />
          {text}
          {record.isDefault && <Tag color="green">默认</Tag>}
        </Space>
      ),
    },
    {
      title: '主机',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
      width: 80,
    },
    {
      title: '数据库',
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: '用户名',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSource(record)}
            disabled={record.isDefault}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个数据源吗？"
            onConfirm={() => handleDeleteSource(record.name)}
            okText="确定"
            cancelText="取消"
            disabled={record.isDefault}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.isDefault}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Tabs>
          <TabPane tab="数据源管理" key="datasources">
            <Card
              title="数据源列表"
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddSource}
                  >
                    添加数据源
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadDataSources}
                    loading={loading}
                  >
                    刷新
                  </Button>
                </Space>
              }
            >
              <Table
                columns={columns}
                dataSource={dataSources}
                rowKey="name"
                loading={loading}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>

          <TabPane tab="缓存管理" key="cache">
            <Card title="缓存统计">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="缓存项目数" value={cacheStats.count || 0} />
                </Col>
                <Col span={8}>
                  <Statistic title="缓存大小" value={cacheStats.size || 0} suffix="bytes" />
                </Col>
                <Col span={8}>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleClearCache}
                  >
                    清除所有缓存
                  </Button>
                </Col>
              </Row>
              
              {cacheStats.items && cacheStats.items.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4>缓存详情</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {cacheStats.items.map((item, index) => (
                      <div key={index} style={{ 
                        padding: '8px', 
                        border: '1px solid #f0f0f0', 
                        marginBottom: '8px',
                        borderRadius: '4px'
                      }}>
                        <div><strong>{item.key}</strong></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          时间: {new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          TTL: {Math.round(item.ttl / 1000)}秒
                        </div>
                        {item.expired && (
                          <Tag color="red" size="small">已过期</Tag>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabPane>

          <TabPane tab="连接信息" key="info">
            <Card title="当前连接状态">
              <Alert
                message="连接信息"
                description="系统当前已连接到以下数据源，您可以在数据表页面切换数据源。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Descriptions bordered column={2}>
                <Descriptions.Item label="数据源总数">
                  {dataSources.length}
                </Descriptions.Item>
                <Descriptions.Item label="活跃连接">
                  {dataSources.filter(s => !s.isDefault).length + 1}
                </Descriptions.Item>
                <Descriptions.Item label="默认数据源">
                  default
                </Descriptions.Item>
                <Descriptions.Item label="缓存状态">
                  <Tag color="green">正常</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* 添加/编辑数据源模态框 */}
      <Modal
        title={editingSource ? '编辑数据源' : '添加数据源'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="数据源名称"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="请输入数据源名称" disabled={!!editingSource} />
          </Form.Item>

          <Form.Item
            name="host"
            label="主机地址"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="localhost" />
          </Form.Item>

          <Form.Item
            name="port"
            label="端口"
            rules={[{ required: true, message: '请输入端口' }]}
          >
            <Input type="number" placeholder="3306" />
          </Form.Item>

          <Form.Item
            name="database"
            label="数据库名"
            rules={[{ required: true, message: '请输入数据库名' }]}
          >
            <Input placeholder="请输入数据库名" />
          </Form.Item>

          <Form.Item
            name="user"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingSource ? '更新' : '添加'}
              </Button>
              <Button
                onClick={() => handleTestConnection(form.getFieldsValue())}
                loading={testing}
              >
                测试连接
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourceManager;