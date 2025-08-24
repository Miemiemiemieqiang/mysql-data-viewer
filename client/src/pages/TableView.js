import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Select, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Pagination, 
  Modal, 
  Tabs,
  message,
  Spin,
  Alert
} from 'antd';
import { 
  ReloadOutlined, 
  EyeOutlined, 
  SearchOutlined, 
  FilterOutlined,
  DatabaseOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { tableService, dataSourceService } from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

const TableView = () => {
  const [dataSources, setDataSources] = useState([]);
  const [currentDataSource, setCurrentDataSource] = useState('default');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [tableStructure, setTableStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [relatedData, setRelatedData] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  useEffect(() => {
    loadDataSources();
  }, []);

  useEffect(() => {
    if (currentDataSource) {
      loadTables();
    }
  }, [currentDataSource]);

  useEffect(() => {
    if (selectedTable) {
      loadTableData();
      loadTableStructure();
    }
  }, [selectedTable, pagination.current, pagination.pageSize, filters, currentDataSource]);

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
      setSelectedTable(null); // 清除选中的表
      setTableData(null); // 清除表数据
    } catch (error) {
      message.error('加载表列表失败');
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      const params = {
        dataSource: currentDataSource,
        page: pagination.current,
        limit: pagination.pageSize,
        filters: JSON.stringify(filters),
      };
      
      const data = await tableService.getTableData(selectedTable, params);
      setTableData(data);
      setPagination(prev => ({
        ...prev,
        total: data.total,
      }));
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTableStructure = async () => {
    if (!selectedTable) return;
    
    try {
      const structure = await tableService.getTableStructure(selectedTable, currentDataSource);
      setTableStructure(structure);
    } catch (error) {
      message.error('加载表结构失败');
    }
  };

  const handleTableChange = (value) => {
    setSelectedTable(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    setFilters({});
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
  };

  const handleViewRelated = async (record) => {
    setSelectedRow(record);
    setLoading(true);
    
    try {
      const related = await tableService.getRelatedData(selectedTable, record.id, currentDataSource);
      setRelatedData(related);
      setShowRelatedModal(true);
    } catch (error) {
      message.error('加载关联数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceChange = (value) => {
    setCurrentDataSource(value);
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value,
    }));
  };

  const getColumns = () => {
    if (!tableStructure) return [];
    
    return tableStructure.map(column => ({
      title: column.Field,
      dataIndex: column.Field,
      key: column.Field,
      sorter: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`搜索 ${column.Field}`}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={confirm}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={confirm}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      render: (text) => {
        if (text === null || text === undefined) return '-';
        if (typeof text === 'boolean') return text ? '是' : '否';
        if (typeof text === 'object') return JSON.stringify(text);
        return String(text);
      },
    }));
  };

  const actionColumns = [
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewRelated(record)}
        >
          查看关联
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Alert
          message="数据源切换"
          description="您可以通过切换数据源来浏览不同数据库中的表结构和数据。"
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
            onChange={handleDataSourceChange}
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
            style={{ width: 200 }}
            placeholder="选择表"
            value={selectedTable}
            onChange={handleTableChange}
          >
            {tables.map(table => (
              <Option key={table} value={table}>{table}</Option>
            ))}
          </Select>
          
          {selectedTable && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadTableData}
              loading={loading}
            >
              刷新
            </Button>
          )}
        </Space>

        {selectedTable && tableData && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">数据源: {currentDataSource}</Tag>
              <Tag color="blue">表名: {selectedTable}</Tag>
              <Tag color="green">总记录数: {pagination.total}</Tag>
            </div>

            <Table
              columns={[...getColumns(), ...actionColumns]}
              dataSource={tableData.data}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
              size="small"
            />

            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePaginationChange}
              onShowSizeChange={handlePaginationChange}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => `${range[0]}-${range[1]} / ${total}`}
              style={{ marginTop: 16, textAlign: 'right' }}
            />
          </div>
        )}
      </Card>

      {/* 关联数据模态框 */}
      <Modal
        title={`关联数据 - ${selectedTable} ID: ${selectedRow?.id}`}
        visible={showRelatedModal}
        onCancel={() => setShowRelatedModal(false)}
        width={1000}
        footer={null}
      >
        <Tabs>
          {Object.entries(relatedData).map(([tableName, data]) => (
            <TabPane tab={tableName} key={tableName}>
              <Table
                columns={data.length > 0 ? Object.keys(data[0]).map(key => ({
                  title: key,
                  dataIndex: key,
                  key: key,
                  render: (text) => {
                    if (text === null || text === undefined) return '-';
                    if (typeof text === 'boolean') return text ? '是' : '否';
                    if (typeof text === 'object') return JSON.stringify(text);
                    return String(text);
                  },
                })) : []}
                dataSource={data}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          ))}
        </Tabs>
      </Modal>
    </div>
  );
};

export default TableView;