const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// SQL logging format configuration
const SQL_LOG_FORMAT = process.env.SQL_LOG_FORMAT || 'formatted'; // 'formatted', 'compact', 'pretty'

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database connection pools for multiple data sources
const dbPools = new Map();

// Initialize database connections
async function initDatabases() {
  try {
    // Default connection from environment variables
    const defaultConnectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'test',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    const defaultPool = mysql.createPool(defaultConnectionConfig);
    dbPools.set('default', defaultPool);
    
    // Load additional data sources from config
    const dataSources = loadDataSources();
    for (const source of dataSources) {
      if (source.name !== 'default') {
        // Remove name property from connection config as it's not valid for MySQL2
        const { name, ...connectionConfig } = source;
        const pool = mysql.createPool(connectionConfig);
        dbPools.set(source.name, pool);
      }
    }
    
    console.log(`Database connections established: ${dbPools.size} sources`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}


// Enhanced query execution with logging
async function executeQueryWithLogging(pool, sql, params = []) {
  const timestamp = new Date().toISOString();
  
  // Clean SQL for execution
  const cleanSql = sql.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Log SQL based on configured format
  logSqlQuery(timestamp, sql, params);
  
  try {
    const [results] = await pool.execute(cleanSql, params);
    return results;
  } catch (error) {
    console.error(`[${timestamp}] SQL Error: ${error.message}`);
    throw error;
  }
}

// Log SQL query in different formats
function logSqlQuery(timestamp, sql, params) {
  switch (SQL_LOG_FORMAT) {
    case 'compact':
      const compactSql = sql.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`[${timestamp}] SQL: ${compactSql}${params.length > 0 ? ` | Params: ${JSON.stringify(params)}` : ''}`);
      break;
      
    case 'pretty':
      console.log(`\n[${timestamp}] 🗄️  SQL QUERY:`);
      console.log('┌' + '─'.repeat(60) + '┐');
      const prettySql = formatSqlForLogging(sql);
      prettySql.split('\n').forEach(line => {
        console.log(`│ ${line.padEnd(58)} │`);
      });
      if (params.length > 0) {
        console.log(`│ ${'Parameters: ' + JSON.stringify(params).padEnd(44)} │`);
      }
      console.log('└' + '─'.repeat(60) + '┘\n');
      break;
      
    case 'formatted':
    default:
      console.log(`[${timestamp}] Executing SQL:`);
      const formattedSql = formatSqlForLogging(sql);
      console.log(formattedSql);
      if (params.length > 0) {
        console.log(`Parameters: ${JSON.stringify(params)}`);
      }
      console.log('');
      break;
  }
}

// Format SQL for better logging display
function formatSqlForLogging(sql) {
  // Remove escaped newlines and normalize whitespace
  const normalized = sql.replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
  
  // Split by SQL keywords for better formatting
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET'];
  let formatted = normalized;
  
  // Add line breaks before major keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\s+${keyword}\\s+`, 'gi');
    formatted = formatted.replace(regex, `\n${keyword} `);
  });
  
  // Clean up multiple line breaks and indentation
  formatted = formatted.replace(/\n\s*\n/g, '\n');
  formatted = formatted.split('\n').map(line => line.trim()).join('\n');
  
  // Add basic indentation
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indentedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    // Decrease indent for certain keywords
    if (trimmed.match(/^(FROM|WHERE|GROUP BY|ORDER BY|HAVING)/i)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indentedLine = '  '.repeat(indentLevel) + trimmed;
    
    // Increase indent for certain keywords
    if (trimmed.match(/^(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|HAVING)/i)) {
      indentLevel++;
    }
    
    return indentedLine;
  });
  
  return indentedLines.filter(line => line).join('\n');
}

// Get database pool by name
function getDbPool(name = 'default') {
  return dbPools.get(name);
}

// Load data sources configuration
function loadDataSources() {
  try {
    const configPath = path.join(__dirname, 'config', 'datasources.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    }
    return [];
  } catch (error) {
    console.error('Error loading data sources:', error);
    return [];
  }
}

// Save data sources configuration
function saveDataSources(sources) {
  try {
    const configDir = path.join(__dirname, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    
    const configPath = path.join(configDir, 'datasources.json');
    fs.writeFileSync(configPath, JSON.stringify(sources, null, 2));
  } catch (error) {
    console.error('Error saving data sources:', error);
    throw error;
  }
}

// Test database connection
async function testConnection(config) {
  try {
    // Remove name property from connection config as it's not valid for MySQL2
    const { name, ...connectionConfig } = config;
    const testPool = mysql.createPool({
      ...connectionConfig,
      connectionLimit: 1,
      waitForConnections: false
    });
    
    const connection = await testPool.getConnection();
    console.log(`[${new Date().toISOString()}] Testing database connection to ${config.host}:${config.port}`);
    await connection.ping();
    console.log(`[${new Date().toISOString()}] Connection test successful`);
    connection.release();
    await testPool.end();
    
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Load table relationships configuration
function loadRelationships() {
  try {
    const configPath = path.join(__dirname, 'config', 'relationships.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    }
    return {};
  } catch (error) {
    console.error('Error loading relationships:', error);
    return {};
  }
}

// API Routes

// Get database tables
app.get('/api/tables', async (req, res) => {
  try {
    const { dataSource = 'default' } = req.query;
    const pool = getDbPool(dataSource);
    
    if (!pool) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    const tables = await executeQueryWithLogging(pool, 'SHOW TABLES');
    const tableList = tables.map(row => Object.values(row)[0]);
    res.json(tableList);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get table structure
app.get('/api/tables/:tableName/structure', async (req, res) => {
  try {
    const { dataSource = 'default' } = req.query;
    const pool = getDbPool(dataSource);
    
    if (!pool) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    const columns = await executeQueryWithLogging(pool, `DESCRIBE ${req.params.tableName}`);
    res.json(columns);
  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ error: 'Failed to fetch table structure' });
  }
});

// Get table data with pagination
app.get('/api/tables/:tableName/data', async (req, res) => {
  try {
    const { dataSource = 'default', page = 1, limit = 50, filters = '{}' } = req.query;
    const pool = getDbPool(dataSource);
    
    if (!pool) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM ${req.params.tableName}`;
    const filterObj = JSON.parse(filters);
    
    // Apply filters
    if (Object.keys(filterObj).length > 0) {
      const whereClauses = Object.entries(filterObj).map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key} LIKE '%${value}%'`;
        }
        return `${key} = ${value}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    const data = await executeQueryWithLogging(pool, query);
    const countResult = await executeQueryWithLogging(pool, `SELECT COUNT(*) as total FROM ${req.params.tableName}`);
    
    res.json({
      data,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Failed to fetch table data' });
  }
});

// Get related data
app.get('/api/tables/:tableName/:id/related', async (req, res) => {
  try {
    const { dataSource = 'default' } = req.query;
    const { tableName, id } = req.params;
    const pool = getDbPool(dataSource);
    
    if (!pool) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    const relationships = loadRelationships();
    const relatedData = {};
    
    if (relationships[tableName]) {
      for (const relation of relationships[tableName]) {
        const { foreignTable, foreignKey, localKey } = relation;
        
        try {
          const query = `
            SELECT * FROM ${foreignTable} 
            WHERE ${foreignKey} = ?
          `;
          
          const data = await executeQueryWithLogging(pool, query, [id]);
          relatedData[foreignTable] = data;
        } catch (tableError) {
          console.warn(`Table ${foreignTable} not found or query failed:`, tableError.message);
          // Continue with other relationships even if one fails
          relatedData[foreignTable] = [];
        }
      }
    }
    
    res.json(relatedData);
  } catch (error) {
    console.error('Error fetching related data:', error);
    res.status(500).json({ error: 'Failed to fetch related data' });
  }
});

// Save relationships configuration
app.post('/api/relationships', async (req, res) => {
  try {
    const configDir = path.join(__dirname, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    
    const configPath = path.join(configDir, 'relationships.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    
    res.json({ message: 'Relationships saved successfully' });
  } catch (error) {
    console.error('Error saving relationships:', error);
    res.status(500).json({ error: 'Failed to save relationships' });
  }
});

// Get relationships configuration
app.get('/api/relationships', async (req, res) => {
  try {
    const relationships = loadRelationships();
    res.json(relationships);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// Execute custom query
app.post('/api/query', async (req, res) => {
  try {
    const { query, dataSource = 'default' } = req.body;
    const pool = getDbPool(dataSource);
    
    if (!pool) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    if (!query || !query.trim().toLowerCase().startsWith('select')) {
      res.status(400).json({ error: 'Only SELECT queries are allowed' });
    } else {
      const data = await executeQueryWithLogging(pool, query);
      res.json(data);
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

// Data source management APIs

// Get all data sources
app.get('/api/datasources', async (req, res) => {
  try {
    const sources = loadDataSources();
    const defaultConfig = {
      name: 'default',
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'test',
      isDefault: true
    };
    
    const allSources = [defaultConfig, ...sources.filter(s => s.name !== 'default')];
    res.json(allSources);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
});

// Add new data source
app.post('/api/datasources', async (req, res) => {
  try {
    const { name, host, user, password, database, port = 3306 } = req.body;
    
    if (!name || !host || !user || !database) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sources = loadDataSources();
    
    // Check if name already exists
    if (sources.some(s => s.name === name) || name === 'default') {
      return res.status(400).json({ error: 'Data source name already exists' });
    }
    
    const newSource = {
      name,
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    // Test connection before saving
    const testResult = await testConnection(newSource);
    if (!testResult.success) {
      return res.status(400).json({ error: `Connection test failed: ${testResult.message}` });
    }
    
    sources.push(newSource);
    saveDataSources(sources);
    
    // Add to connection pools (remove name property as it's not valid for MySQL2)
    const { name: _, ...connectionConfig } = newSource;
    const pool = mysql.createPool(connectionConfig);
    dbPools.set(name, pool);
    
    res.json({ message: 'Data source added successfully', source: newSource });
  } catch (error) {
    console.error('Error adding data source:', error);
    res.status(500).json({ error: 'Failed to add data source' });
  }
});

// Update data source
app.put('/api/datasources/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { host, user, password, database, port = 3306 } = req.body;
    
    if (name === 'default') {
      return res.status(400).json({ error: 'Cannot modify default data source' });
    }
    
    const sources = loadDataSources();
    const sourceIndex = sources.findIndex(s => s.name === name);
    
    if (sourceIndex === -1) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    const updatedSource = {
      ...sources[sourceIndex],
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    // Test connection before updating
    const testResult = await testConnection(updatedSource);
    if (!testResult.success) {
      return res.status(400).json({ error: `Connection test failed: ${testResult.message}` });
    }
    
    sources[sourceIndex] = updatedSource;
    saveDataSources(sources);
    
    // Update connection pool
    const oldPool = dbPools.get(name);
    if (oldPool) {
      await oldPool.end();
    }
    
    // Remove name property as it's not valid for MySQL2
    const { name: _, ...connectionConfig } = updatedSource;
    const newPool = mysql.createPool(connectionConfig);
    dbPools.set(name, newPool);
    
    res.json({ message: 'Data source updated successfully', source: updatedSource });
  } catch (error) {
    console.error('Error updating data source:', error);
    res.status(500).json({ error: 'Failed to update data source' });
  }
});

// Delete data source
app.delete('/api/datasources/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (name === 'default') {
      return res.status(400).json({ error: 'Cannot delete default data source' });
    }
    
    const sources = loadDataSources();
    const filteredSources = sources.filter(s => s.name !== name);
    
    if (filteredSources.length === sources.length) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    saveDataSources(filteredSources);
    
    // Close connection pool
    const pool = dbPools.get(name);
    if (pool) {
      await pool.end();
      dbPools.delete(name);
    }
    
    res.json({ message: 'Data source deleted successfully' });
  } catch (error) {
    console.error('Error deleting data source:', error);
    res.status(500).json({ error: 'Failed to delete data source' });
  }
});

// Test data source connection
app.post('/api/datasources/test', async (req, res) => {
  try {
    const { host, user, password, database, port = 3306 } = req.body;
    
    if (!host || !user || !database) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const testConfig = {
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    };
    
    const result = await testConnection(testConfig);
    res.json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

// Start server
async function startServer() {
  await initDatabases();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();