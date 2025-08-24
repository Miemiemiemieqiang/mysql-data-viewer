import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Table, 
  Tabs, 
  message, 
  Space,
  Modal,
  Popconfirm,
  Tag,
  TreeSelect
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { relationshipService, tableService } from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

const RelationshipConfig = () => {
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableColumns, setTableColumns] = useState({});

  useEffect(() => {
    loadTables();
    loadRelationships();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableStructure(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    try {
      const tableList = await tableService.getTables();
      setTables(tableList);
    } catch (error) {
      message.error('加载表列表失败');
    }
  };

  const loadRelationships = async () => {
    try {
      const config = await relationshipService.getRelationships();
      setRelationships(config);
    } catch (error) {
      message.error('加载关联配置失败');
    }
  };

  const loadTableStructure = async (tableName) => {
    try {
      const structure = await tableService.getTableStructure(tableName);
      const columns = structure.map(col => col.Field);
      setTableColumns(prev => ({
        ...prev,
        [tableName]: columns
      }));
    } catch (error) {
      message.error('加载表结构失败');
    }
  };

  const handleAddRelationship = async (values) => {
    try {
      const newRelationship = {
        foreignTable: values.foreignTable,
        foreignKey: values.foreignKey,
        localKey: values.localKey,
        relationshipType: values.relationshipType || 'one-to-many'
      };

      const updatedRelationships = {
        ...relationships,
        [selectedTable]: [...(relationships[selectedTable] || []), newRelationship]
      };

      await relationshipService.saveRelationships(updatedRelationships);
      setRelationships(updatedRelationships);
      form.resetFields();
      message.success('关联关系添加成功');
    } catch (error) {
      message.error('添加关联关系失败');
    }
  };

  const handleDeleteRelationship = async (table, index) => {
    try {
      const updatedRelationships = {
        ...relationships,
        [table]: relationships[table].filter((_, i) => i !== index)
      };

      await relationshipService.saveRelationships(updatedRelationships);
      setRelationships(updatedRelationships);
      message.success('关联关系删除成功');
    } catch (error) {
      message.error('删除关联关系失败');
    }
  };

  const handleSaveAll = async () => {
    try {
      await relationshipService.saveRelationships(relationships);
      message.success('所有配置保存成功');
    } catch (error) {
      message.error('保存配置失败');
    }
  };

  const getRelationshipColumns = () => [
    {
      title: '关联表',
      dataIndex: 'foreignTable',
      key: 'foreignTable',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '外键',
      dataIndex: 'foreignKey',
      key: 'foreignKey',
      render: (text) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: '本地键',
      dataIndex: 'localKey',
      key: 'localKey',
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: '关系类型',
      dataIndex: 'relationshipType',
      key: 'relationshipType',
      render: (text) => {
        const typeMap = {
          'one-to-one': '一对一',
          'one-to-many': '一对多',
          'many-to-one': '多对一'
        };
        return <Tag color="purple">{typeMap[text] || text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record, index) => (
        <Popconfirm
          title="确定删除这个关联关系吗？"
          onConfirm={() => handleDeleteRelationship(selectedTable, index)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="danger"
            size="small"
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Tabs>
          <TabPane tab="关联配置" key="config">
            <Space style={{ marginBottom: 16 }}>
              <Select
                style={{ width: 200 }}
                placeholder="选择主表"
                value={selectedTable}
                onChange={setSelectedTable}
              >
                {tables.map(table => (
                  <Option key={table} value={table}>{table}</Option>
                ))}
              </Select>
              
              {selectedTable && (
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => loadTableStructure(selectedTable)}
                >
                  刷新表结构
                </Button>
              )}
              
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveAll}
                loading={loading}
              >
                保存所有配置
              </Button>
            </Space>

            {selectedTable && (
              <div>
                <Card title={`为表 "${selectedTable}" 添加关联关系`} size="small" style={{ marginBottom: 16 }}>
                  <Form
                    form={form}
                    layout="inline"
                    onFinish={handleAddRelationship}
                  >
                    <Form.Item
                      name="foreignTable"
                      label="关联表"
                      rules={[{ required: true, message: '请选择关联表' }]}
                    >
                      <Select style={{ width: 150 }}>
                        {tables.filter(t => t !== selectedTable).map(table => (
                          <Option key={table} value={table}>{table}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="foreignKey"
                      label="外键字段"
                      rules={[{ required: true, message: '请输入外键字段' }]}
                    >
                      <Select style={{ width: 150 }}>
                        {tableColumns[form.getFieldValue('foreignTable')]?.map(col => (
                          <Option key={col} value={col}>{col}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="localKey"
                      label="本地键字段"
                      rules={[{ required: true, message: '请输入本地键字段' }]}
                    >
                      <Select style={{ width: 150 }}>
                        {tableColumns[selectedTable]?.map(col => (
                          <Option key={col} value={col}>{col}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="relationshipType"
                      label="关系类型"
                      initialValue="one-to-many"
                    >
                      <Select style={{ width: 120 }}>
                        <Option value="one-to-one">一对一</Option>
                        <Option value="one-to-many">一对多</Option>
                        <Option value="many-to-one">多对一</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        htmlType="submit"
                      >
                        添加
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>

                {relationships[selectedTable] && relationships[selectedTable].length > 0 && (
                  <Card title={`表 "${selectedTable}" 的关联关系`} size="small">
                    <Table
                      columns={getRelationshipColumns()}
                      dataSource={relationships[selectedTable]}
                      rowKey={(record, index) => index}
                      pagination={false}
                      size="small"
                    />
                  </Card>
                )}
              </div>
            )}
          </TabPane>

          <TabPane tab="配置预览" key="preview">
            <Card title="当前关联配置" size="small">
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '16px', 
                borderRadius: '4px',
                maxHeight: '500px',
                overflow: 'auto'
              }}>
                {JSON.stringify(relationships, null, 2)}
              </pre>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default RelationshipConfig;