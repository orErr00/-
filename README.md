# REPO-Management

REPO-Management 是一个记录管理系统，包含两套前端：

- 主系统：Java + Spark 提供的静态页面（媒体/列表/标签管理）
- 高级排版编辑器：React + Vite 构建后发布到 Java 静态资源目录 `/layout/`

## 项目架构

```text
REPO-Management
├─ src/main/java/com/mediamanager/          # Java 后端与 API
├─ src/main/resources/public/               # Java 直接提供的静态资源
│  ├─ index.html                            # 主系统入口
│  ├─ css/ js/                              # 原生前端资源
│  └─ layout/                               # React 排版编辑器构建产物
├─ src/                                     # React 排版编辑器源码
│  ├─ components/
│  │  ├─ LayoutEditor/
│  │  ├─ Editor/
│  │  ├─ Preview/
│  │  ├─ StylePanel/
│  │  ├─ ExportPanel/
│  │  └─ ModeSwitcher/
│  └─ utils/
├─ pom.xml                                  # Maven 构建
├─ package.json                             # React/Vite 构建
└─ vite.config.js                           # 输出到 src/main/resources/public/layout
```

## 功能说明

### 主系统

- 管理电影、电视剧、书籍、游戏
- 创建和维护片单
- 标签管理
- 仪表盘与统计信息
- 深色/浅色主题切换

### 高级排版编辑器

- Markdown 编辑
- 实时预览切换
- 多种排版风格
- 一键排版
- 导出 PDF
- 导出图片

## 运行环境

请先确认本机安装以下工具：

- Java 17
- Maven 3.9+
- Node.js 18+（建议 LTS）
- npm 9+

可使用以下命令确认版本：

```bash
java -version
mvn -version
node -v
npm -v
```

## 第一次运行：完整步骤

以下步骤适用于整个项目的首次启动。

### 1. 进入项目目录

```bash
cd /path/to/REPO-Management
```

### 2. 安装 React 编辑器依赖

```bash
npm install
```

### 3. 构建高级排版编辑器静态资源

这一步会把 React 应用构建到 Java 静态目录：

```bash
npm run build
```

构建输出目录为：

```text
src/main/resources/public/layout/
```

### 4. 运行检查

前端源码 lint：

```bash
npm run lint
```

后端测试：

```bash
mvn test
```

### 5. 打包整个项目

```bash
mvn package
```

成功后会生成：

```text
target/media-manager-1.0.0-jar-with-dependencies.jar
```

### 6. 启动系统

```bash
java -jar target/media-manager-1.0.0-jar-with-dependencies.jar
```

启动后访问：

- 主系统：http://localhost:8080/
- 高级排版编辑器：http://localhost:8080/layout/

数据库文件会在运行目录下自动创建：

```text
media.db
```

## 日常开发步骤

如果你修改的是 Java 主系统：

```bash
mvn test
mvn package
java -jar target/media-manager-1.0.0-jar-with-dependencies.jar
```

如果你修改的是 React 排版编辑器源码：

```bash
npm install
npm run lint
npm run build
mvn package
java -jar target/media-manager-1.0.0-jar-with-dependencies.jar
```

## React 排版编辑器单独开发

开发 React 编辑器界面时，可使用 Vite 开发服务器：

```bash
npm install
npm run dev
```

默认访问地址通常为：

```text
http://localhost:5173/
```

说明：

- `npm run dev` 仅用于开发 React 编辑器源码
- Java 主系统入口仍由 Spark 在 `http://localhost:8080/` 提供
- 开发完成后，必须重新执行 `npm run build`，这样 Java 主系统里的 `/layout/` 页面才会更新

## 页面入口说明

主系统左侧导航中的“高级排版编辑器”会直接打开：

```text
/layout/
```

旧的 `#/format` 入口已兼容跳转到新的高级排版编辑器。

## 主要命令

```bash
# 安装前端依赖
npm install

# React 编辑器开发
npm run dev

# React 编辑器 lint
npm run lint

# 生成 /layout/ 静态资源
npm run build

# 运行 Java 测试
mvn test

# 打包整个项目
mvn package

# 启动整个项目
java -jar target/media-manager-1.0.0-jar-with-dependencies.jar
```

## API 概览

### Media

- `GET /api/media`
- `POST /api/media`
- `GET /api/media/:id`
- `PUT /api/media/:id`
- `DELETE /api/media/:id`
- `POST /api/fetch`

### Lists

- `GET /api/lists`
- `POST /api/lists`
- `GET /api/lists/:id`
- `PUT /api/lists/:id`
- `DELETE /api/lists/:id`
- `POST /api/lists/:id/items`
- `DELETE /api/lists/:id/items/:mediaId`
- `PUT /api/lists/:id/reorder`

### Tags

- `GET /api/tags`
- `DELETE /api/tags/:id`

## 已确认的接入方式

- Java 通过 `Spark.staticFiles.location("/public")` 提供 `src/main/resources/public/`
- React 构建输出到 `src/main/resources/public/layout/`
- 访问 `/layout/` 即可打开高级排版编辑器
