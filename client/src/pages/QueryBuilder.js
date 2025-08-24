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
  Tabs,
  Tag,
  Row,
  Col,
  Alert
} from 'antd';
import { 
  PlayCircleOutlined, 
  SaveOutlined, 
  ClearOutlined,
  CopyOutlined,
  DatabaseOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { queryService, tableService, dataSourceService } from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const QueryBuilder = () => {
  const [dataSources, setDataSources] = useState([]);
  const [currentDataSource, setCurrentDataSource] = useState('default');
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [tableColumns, setTableColumns] = useState({});
  const [queryHistory, setQueryHistory] = useState([]);
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDataSources();
    loadQueryHistory();
  }, []);

  useEffect(() => {
    if (currentDataSource) {
      loadTables();
    }
  }, [currentDataSource]);

  useEffect(() => {
    selectedTables.forEach(table => {
      loadTableStructure(table);
    });
  }, [selectedTables]);

  const loadDataSources = async () => {
    try {
      const sources = await dataSourceService.getDataSources();
      setDataSources(sources);
    } catch (error) {
      message.error('加载数据源失败');
    }
  };

  const loadTables = async () => {
    try {
      const tableList = await tableService.getTables(currentDataSource);
      setTables(tableList);
      setSelectedTables([]);
    } catch (error) {
      message.error('加载表列表失败');
    }
  };

  const loadTableStructure = async (tableName) => {
    if (tableColumns[tableName]) return;
    
    try {
      const structure = await tableService.getTableStructure(tableName, currentDataSource);
      const columns = structure.map(col => ({
        field: col.Field,
        type: col.Type,
        key: col.Field
      }));
      setTableColumns(prev => ({
        ...prev,
        [tableName]: columns
      }));
    } catch (error) {
      message.error('加载表结构失败');
    }
  };

  const loadQueryHistory = () => {
    const history = localStorage.getItem('queryHistory');
    if (history) {
      setQueryHistory(JSON.parse(history));
    }
  };

  const saveToHistory = (query) => {
    const historyItem = {
      id: Date.now(),
      query,
      timestamp: new Date().toLocaleString(),
      dataSource: currentDataSource,
    };
    
    const newHistory = [historyItem, ...queryHistory.slice(0, 9)];
    setQueryHistory(newHistory);
    localStorage.setItem('queryHistory', JSON.stringify(newHistory));
  };

  const handleExecuteQuery = async (values) => {
    const query = values.query.trim();
    if (!query) {
      message.error('请输入SQL查询语句');
      return;
    }

    if (!query.toLowerCase().startsWith('select')) {
      message.error('只允许执行SELECT查询');
      return;
    }

    setLoading(true);
    try {
      const result = await queryService.executeQuery(query, currentDataSource);
      setQueryResult(result);
      saveToHistory(query);
      message.success('查询执行成功');
    } catch (error) {
      message.error('查询执行失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClearQuery = () => {
    form.setFieldsValue({ query: '' });
    setQueryResult(null);
  };

  const handleLoadFromHistory = (item) => {
    form.setFieldsValue({ query: item.query });
    if (item.dataSource) {
      setCurrentDataSource(item.dataSource);
    }
  };

  const handleQuickBuild = () => {
    if (selectedTables.length === 0) {
      message.error('请先选择表');
      return;
    }

    let query = 'SELECT\n';
    
    // 构建SELECT字段
    const selectFields = [];
    selectedTables.forEach(table => {
      if (tableColumns[table]) {
        tableColumns[table].forEach(col => {
          selectFields.push(`${table}.${col.field}`);
        });
      }
    });
    query += '  ' + selectFields.join(',\n  ') + '\nFROM\n';
    
    // 构建FROM子句
    query += '  ' + selectedTables.join(',\n  ');
    
    // 构建WHERE子句（简单示例）
    if (selectedTables.length > 1) {
      query += '\nWHERE\n  1=1';
    }
    
    form.setFieldsValue({ query });
  };

  const getResultColumns = () => {
    if (!queryResult || queryResult.length === 0) return [];
    
    return Object.keys(queryResult[0]).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      render: (text) => {
        if (text === null || text === undefined) return '-';
        if (typeof text === 'boolean') return text ? '是' : '否';
        if (typeof text === 'object') return JSON.stringify(text);
        return String(text);
      },
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="查询构建器" size="small">
            <Alert
              message="数据源选择"
              description="选择要查询的数据源，然后选择表来构建SQL查询。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Space style={{ marginBottom: 16 }}>
              <DatabaseOutlined />
              <Select
                style={{ width: 200 }}
                placeholder="选择数据源"
                value={currentDataSource}
                onChange={setCurrentDataSource}
              >
                {dataSources.map(source => (
                  <Option key={source.name} value={source.name}>
                    <Space>
                      {source.name}
                      {source.isDefault && <Tag color="green">默认</Tag>}
                    </Space>
                  </Option>
                ))}
              </Select>
              
              <SwapOutlined />
              
              <Select
                mode="multiple"
                style={{ width: 300 }}
                placeholder="选择表"
                value={selectedTables}
                onChange={setSelectedTables}
              >
                {tables.map(table => (
                  <Option key={table} value={table}>{table}</Option>
                ))}
              </Select>
              
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleQuickBuild}
              >
                快速构建
              </Button>
            </Space>

            <Form
              form={form}
              onFinish={handleExecuteQuery}
              layout="vertical"
            >
              <Form.Item
                name="query"
                label="SQL查询语句"
                rules={[{ required: true, message: '请输入SQL查询语句' }]}
              >
                <TextArea
                  rows={10}
                  placeholder="请输入SELECT查询语句..."
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  执行查询
                </Button>
                
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearQuery}
                >
                  清空
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="查询历史" size="small">
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {queryHistory.length === 0 ? (
                <p>暂无查询历史</p>
              ) : (
                queryHistory.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleLoadFromHistory(item)}
                  >
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      {item.timestamp}
                    </div>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxHeight: '60px'
                    }}>
                      {item.query}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {queryResult && (
        <Card title="查询结果" style={{ marginTop: 16 }} size="small">
          <Alert
            message="查询结果"
            description={`共找到 ${queryResult.length} 条记录`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(JSON.stringify(queryResult, null, 2))}
              >
                复制结果
              </Button>
            }
          />
          
          <Table
            columns={getResultColumns()}
            dataSource={queryResult}
            rowKey={(record, index) => index}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        </Card>
      )}

      {/* 表结构参考 */}
      <Card title="表结构参考" style={{ marginTop: 16 }} size="small">
        <Tabs>
          {selectedTables.map(table => (
            <TabPane tab={table} key={table}>
              <Table
                columns={[
                  { title: '字段名', dataIndex: 'field', key: 'field' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                ]}
                dataSource={tableColumns[table] || []}
                rowKey="field"
                pagination={false}
                size="small"
              />
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default QueryBuilder;