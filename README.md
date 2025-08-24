# MySQL 数据查看器

一个基于Web的MySQL数据查看器，支持多数据源配置、级联展示关联数据、动态配置查询方式和关联关系，并具备浏览器缓存功能。

## 功能特性

### 🔗 多数据源管理
- **数据源配置** - 支持配置多个MySQL数据源
- **连接测试** - 添加数据源前可测试连接有效性
- **动态切换** - 在不同数据源间快速切换
- **连接池管理** - 每个数据源独立的连接池管理

### 🔍 数据浏览
- **表结构查看** - 查看数据库中所有表的结构
- **数据分页** - 支持大数据集的分页浏览
- **搜索过滤** - 每列支持实时搜索和过滤
- **排序功能** - 支持多列排序

### 🔗 级联数据展示
- **关联数据查看** - 一键查看关联表数据
- **模态框展示** - 在新窗口中展示关联数据
- **多层级关联** - 支持多层级数据关联

### ⚙️ 动态配置
- **关联关系配置** - 可视化配置表间关联关系
- **实时生效** - 配置修改后立即生效
- **关系类型支持** - 支持一对一、一对多、多对一关系

### 🛠️ 查询构建器
- **可视化构建** - 通过选择表自动生成SQL
- **SQL编辑器** - 支持手动编写和修改SQL
- **查询历史** - 保存查询历史记录
- **表结构参考** - 实时查看表结构

### 💾 浏览器缓存
- **智能缓存** - 自动缓存表结构、数据等
- **缓存管理** - 可查看和管理缓存状态
- **性能优化** - 减少重复请求，提升响应速度
- **缓存清理** - 支持清理过期或不需要的缓存

### 🎨 用户界面
- **响应式设计** - 适配桌面和移动设备
- **现代化UI** - 基于Ant Design的现代化界面
- **连接状态监控** - 实时显示数据库连接状态
- **错误处理** - 完善的错误提示和处理

## 技术栈

### 前端
- **React 18** - 现代化的用户界面框架
- **Ant Design** - 企业级UI组件库
- **Axios** - HTTP客户端
- **React Router** - 路由管理

### 后端
- **Node.js** - 服务端运行环境
- **Express** - Web应用框架
- **MySQL2** - MySQL数据库驱动
- **CORS** - 跨域资源共享

### 安全特性
- **查询限制** - 只允许SELECT查询
- **参数验证** - 严格的输入验证
- **错误处理** - 完善的错误处理机制

## 安装和使用

### 环境要求
- Node.js 16+
- MySQL 5.7+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd contract-drafting-dashboard
   ```

2. **安装依赖**
   ```bash
   npm run install:all
   ```

3. **配置数据库**
   ```bash
   cd server
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接信息
   ```

4. **启动应用**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 http://localhost:3000

### 配置说明

#### 数据库配置
编辑 `server/.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database

# 服务器配置
PORT=3001
```

#### 关联关系配置
关联关系配置文件位于 `server/config/relationships.json`：
```json
{
  "users": [
    {
      "foreignTable": "orders",
      "foreignKey": "user_id",
      "localKey": "id",
      "relationshipType": "one-to-many"
    }
  ]
}
```

## 使用指南

### 数据源管理
1. 从左侧导航栏选择"数据源管理"
2. 点击"添加数据源"按钮
3. 填写数据库连接信息
4. 点击"测试连接"验证配置
5. 保存配置后可在各页面切换使用

### 数据浏览
1. 从左侧导航栏选择"数据表"
2. 首先选择要使用的"数据源"
3. 在下拉菜单中选择要查看的表
4. 使用搜索框进行数据过滤
5. 点击"查看关联"按钮查看关联数据

### 配置关联关系
1. 从左侧导航栏选择"关联配置"
2. 选择主表
3. 填写关联表、外键字段、本地键字段
4. 选择关系类型并保存

### 使用查询构建器
1. 从左侧导航栏选择"查询构建器"
2. 选择要查询的"数据源"
3. 选择要查询的表
4. 点击"快速构建"生成基础SQL
5. 根据需要修改SQL语句
6. 点击"执行查询"查看结果

### 缓存管理
1. 从左侧导航栏选择"数据源管理"
2. 切换到"缓存管理"标签页
3. 查看缓存统计信息
4. 可手动清理缓存

## API文档

### 数据源相关
- `GET /api/datasources` - 获取所有数据源
- `POST /api/datasources` - 添加新数据源
- `PUT /api/datasources/:name` - 更新数据源
- `DELETE /api/datasources/:name` - 删除数据源
- `POST /api/datasources/test` - 测试数据源连接

### 数据表相关
- `GET /api/tables?dataSource=:name` - 获取所有表
- `GET /api/tables/:tableName/structure?dataSource=:name` - 获取表结构
- `GET /api/tables/:tableName/data?dataSource=:name` - 获取表数据
- `GET /api/tables/:tableName/:id/related?dataSource=:name` - 获取关联数据

### 关联关系相关
- `GET /api/relationships` - 获取关联配置
- `POST /api/relationships` - 保存关联配置

### 查询相关
- `POST /api/query` - 执行自定义查询

## 项目结构

```
contract-drafting-dashboard/
├── server/                 # 后端服务
│   ├── config/            # 配置文件
│   ├── index.js           # 主文件
│   ├── package.json       # 依赖配置
│   └── .env.example       # 环境变量示例
├── client/                # 前端应用
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   │   ├── components/    # 组件
│   │   ├── pages/        # 页面
│   │   ├── services/     # 服务
│   │   └── App.js        # 主组件
│   └── package.json       # 依赖配置
└── package.json           # 项目配置
```

## 常见问题

### 数据库连接失败
1. 检查数据库配置是否正确
2. 确保MySQL服务正在运行
3. 检查网络连接

### 关联数据无法显示
1. 确保已正确配置关联关系
2. 检查外键约束是否正确
3. 验证数据完整性

### 查询执行失败
1. 确保SQL语法正确
2. 检查表名和字段名是否正确
3. 确保只有SELECT查询

## 开发指南

### 添加新功能
1. 在相应目录创建新组件
2. 更新路由配置
3. 添加必要的API接口
4. 测试功能完整性

### 自定义样式
1. 修改 `client/src/App.css`
2. 或修改 `client/src/index.css`
3. 遵循Ant Design主题规范

### 扩展API
1. 在 `server/index.js` 中添加新路由
2. 实现相应的业务逻辑
3. 更新前端服务调用

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题请提交Issue或联系开发者。