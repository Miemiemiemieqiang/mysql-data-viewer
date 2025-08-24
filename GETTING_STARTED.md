# 快速启动指南

## 环境要求

- **Node.js**: 16.0 或更高版本
- **MySQL**: 5.7 或更高版本
- **现代浏览器**: Chrome、Firefox、Safari、Edge
- **操作系统**: macOS、Windows、Linux

## 启动步骤

### 1. 准备数据库

确保您的MySQL服务正在运行，并创建测试数据库：

```sql
-- 创建测试数据库
CREATE DATABASE test_db;
CREATE DATABASE production_db;
CREATE DATABASE staging_db;

-- 创建测试用户（可选）
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 安装依赖

在项目根目录执行：

```bash
# 安装所有依赖（根目录 + 服务端 + 客户端）
npm run install:all
```

或者分别安装：

```bash
# 安装根目录依赖
npm install

# 安装服务端依赖
cd server
npm install

# 安装客户端依赖
cd ../client
npm install
```

### 3. 配置数据库连接

编辑服务器配置文件：

```bash
cd server
cp .env.example .env
```

然后编辑 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=test_db

# 服务器配置
PORT=3001

# 环境配置
NODE_ENV=development
```

### 4. 启动应用

#### 方式一：同时启动前后端（推荐）

在项目根目录执行：

```bash
npm run dev
```

这将同时启动：
- 后端服务器：http://localhost:3001
- 前端应用：http://localhost:3000

#### 方式二：分别启动

**启动后端服务器：**
```bash
cd server
npm start
# 或开发模式
npm run dev
```

**启动前端应用：**
```bash
cd client
npm start
```

### 5. 访问应用

打开浏览器访问：http://localhost:3000

## 验证安装

### 1. 检查后端API

```bash
# 测试后端API
curl http://localhost:3001/api/tables

# 或在浏览器中访问
http://localhost:3001/api/tables
```

### 2. 检查前端界面

浏览器中访问：http://localhost:3000

应该能看到：
- 左侧导航菜单
- 数据库连接状态显示
- 主要功能页面

## 常见问题解决

### 1. 端口冲突

如果3000或3001端口被占用：

```bash
# 更改前端端口（客户端）
cd client
npm start  # 会自动询问是否使用其他端口

# 或创建 .env 文件
echo "PORT=3002" > .env

# 更改后端端口
cd server
编辑 .env 文件，修改 PORT=3002
```

### 2. 数据库连接失败

检查：
- MySQL服务是否运行
- 数据库配置是否正确
- 用户权限是否足够
- 防火墙设置

```bash
# 测试数据库连接
mysql -h localhost -u root -p

# 检查数据库
SHOW DATABASES;
```

### 3. 依赖安装失败

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 4. 权限问题（macOS/Linux）

```bash
# 给予脚本执行权限
chmod +x package.json

# 或使用 sudo
sudo npm install
```

## 开发模式

### 前端开发模式

```bash
cd client
npm run dev
```

支持：
- 热重载
- 源码映射
- 开发工具

### 后端开发模式

```bash
cd server
npm run dev
```

支持：
- 自动重启
- 控制台日志
- 调试模式

## 生产环境部署

### 构建前端

```bash
cd client
npm run build
```

### 启动后端

```bash
cd server
# 设置环境变量
export NODE_ENV=production
npm start
```

### 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server/index.js --name mysql-viewer

# 查看状态
pm2 status

# 查看日志
pm2 logs mysql-viewer
```

## Docker部署（可选）

### 创建Dockerfile

```dockerfile
# 后端Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t mysql-viewer-server .

# 运行容器
docker run -p 3001:3001 -e DB_HOST=host.docker.internal mysql-viewer-server
```

## 停止应用

### 停止开发服务器

- 前端：在终端按 `Ctrl+C`
- 后端：在终端按 `Ctrl+C`

### 停止PM2进程

```bash
pm2 stop mysql-viewer
pm2 delete mysql-viewer
```

## 日志和调试

### 查看日志

```bash
# 后端日志
cd server
npm run dev  # 日志会显示在终端

# PM2日志
pm2 logs mysql-viewer
```

### 调试模式

在 `server/.env` 中设置：

```env
NODE_ENV=development
DEBUG=app:*
```

## 性能优化

### 启用压缩

```bash
# 安装压缩中间件
cd server
npm install compression

# 在 index.js 中添加
const compression = require('compression');
app.use(compression());
```

### 配置缓存

```bash
# 客户端构建优化
cd client
npm run build
```

## 备份和维护

### 备份数据源配置

```bash
# 备份配置文件
cp server/config/datasources.json backup/
cp server/config/relationships.json backup/
```

### 清理缓存

浏览器会自动清理过期缓存，也可在界面中手动清理。

## 获取帮助

如果遇到问题：

1. 查看控制台错误信息
2. 检查网络连接
3. 验证数据库配置
4. 查看项目文档
5. 提交Issue

---

**启动成功后，您就可以开始使用多数据源管理和缓存功能了！**