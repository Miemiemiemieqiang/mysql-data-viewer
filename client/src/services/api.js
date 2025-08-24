import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 浏览器缓存管理
class CacheManager {
  constructor() {
    this.prefix = 'mysql_viewer_';
    this.defaultTTL = 30 * 60 * 1000; // 30分钟
  }

  set(key, data, ttl = this.defaultTTL) {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(this.prefix + key, JSON.stringify(item));
  }

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(this.prefix + key));
      if (!item) return null;
      
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      return null;
    }
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

const cache = new CacheManager();

export const tableService = {
  // 获取所有表
  getTables: async (dataSource = 'default') => {
    const cacheKey = `tables_${dataSource}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await api.get('/api/tables', { params: { dataSource } });
    cache.set(cacheKey, response.data);
    return response.data;
  },

  // 获取表结构
  getTableStructure: async (tableName, dataSource = 'default') => {
    const cacheKey = `structure_${dataSource}_${tableName}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await api.get(`/api/tables/${tableName}/structure`, { 
      params: { dataSource } 
    });
    cache.set(cacheKey, response.data);
    return response.data;
  },

  // 获取表数据
  getTableData: async (tableName, params = {}) => {
    const { dataSource = 'default', page, limit, filters } = params;
    const cacheKey = `data_${dataSource}_${tableName}_${page}_${limit}_${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await api.get(`/api/tables/${tableName}/data`, { params });
    cache.set(cacheKey, response.data, 5 * 60 * 1000); // 5分钟缓存
    return response.data;
  },

  // 获取关联数据
  getRelatedData: async (tableName, id, dataSource = 'default') => {
    const cacheKey = `related_${dataSource}_${tableName}_${id}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await api.get(`/api/tables/${tableName}/${id}/related`, { 
      params: { dataSource } 
    });
    cache.set(cacheKey, response.data, 10 * 60 * 1000); // 10分钟缓存
    return response.data;
  },

  // 清除表相关缓存
  clearTableCache: (tableName, dataSource = 'default') => {
    cache.remove(`tables_${dataSource}`);
    cache.remove(`structure_${dataSource}_${tableName}`);
    // 清除数据缓存（使用通配符方式）
    Object.keys(localStorage)
      .filter(key => key.startsWith(cache.prefix + `data_${dataSource}_${tableName}`))
      .forEach(key => localStorage.removeItem(key));
  },
};

export const relationshipService = {
  // 获取关联配置
  getRelationships: async () => {
    const cacheKey = 'relationships';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await api.get('/api/relationships');
    cache.set(cacheKey, response.data);
    return response.data;
  },

  // 保存关联配置
  saveRelationships: async (config) => {
    const response = await api.post('/api/relationships', config);
    cache.set('relationships', response.data);
    return response.data;
  },
};

export const queryService = {
  // 执行自定义查询
  executeQuery: async (query, dataSource = 'default') => {
    const response = await api.post('/api/query', { query, dataSource });
    return response.data;
  },
};

export const dataSourceService = {
  // 获取所有数据源
  getDataSources: async () => {
    const cacheKey = 'datasources';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await api.get('/api/datasources');
    cache.set(cacheKey, response.data);
    return response.data;
  },

  // 添加数据源
  addDataSource: async (source) => {
    const response = await api.post('/api/datasources', source);
    cache.remove('datasources'); // 清除缓存
    return response.data;
  },

  // 更新数据源
  updateDataSource: async (name, source) => {
    const response = await api.put(`/api/datasources/${name}`, source);
    cache.remove('datasources'); // 清除缓存
    return response.data;
  },

  // 删除数据源
  deleteDataSource: async (name) => {
    const response = await api.delete(`/api/datasources/${name}`);
    cache.remove('datasources'); // 清除缓存
    return response.data;
  },

  // 测试数据源连接
  testConnection: async (config) => {
    const response = await api.post('/api/datasources/test', config);
    return response.data;
  },
};

export const cacheService = {
  // 获取缓存统计
  getCacheStats: () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(cache.prefix));
    const size = keys.reduce((total, key) => {
      return total + localStorage.getItem(key).length;
    }, 0);
    
    return {
      count: keys.length,
      size: size,
      items: keys.map(key => {
        const item = JSON.parse(localStorage.getItem(key));
        return {
          key: key.replace(cache.prefix, ''),
          timestamp: item.timestamp,
          ttl: item.ttl,
          expired: Date.now() - item.timestamp > item.ttl
        };
      })
    };
  },

  // 清除所有缓存
  clearAllCache: () => {
    cache.clear();
  },

  // 清除特定缓存
  clearCache: (key) => {
    cache.remove(key);
  },
};

export default api;