# 技术选型与架构设计

## 一、技术栈总览

### 1.1 前端

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | 18.x | UI 框架 | 生态成熟、组件化、适合复杂交互工作台 |
| TypeScript | 5.x | 类型安全 | 大型项目标配，减少运行时错误 |
| Vite | 5.x | 构建工具 | 快速开发服务器，HMR 热更新 |
| Ant Design | 5.x | UI 组件库 | 企业级 SaaS 风格、中文支持好、Table/Form 强大 |
| ECharts | 5.x | 图表库 | 国产图表库、金融图表类型丰富 |
| echarts-for-react | 3.x | React ECharts 封装 | 简化 ECharts 在 React 中的使用 |
| Zustand | 4.x | 状态管理 | 轻量、TypeScript 友好、无模板代码 |
| React Router | 6.x | 路由管理 | 标准方案，嵌套路由支持 |
| Axios | 1.x | HTTP 客户端 | 拦截器、请求取消、错误处理完善 |
| dayjs | 1.x | 日期处理 | 轻量替代 moment.js |

### 1.2 后端

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| Python | 3.11+ | 编程语言 | AI/ML 生态完善，数据处理能力强 |
| FastAPI | 0.100+ | Web 框架 | 异步原生支持、自动 OpenAPI 文档、类型校验 |
| Uvicorn | 0.23+ | ASGI 服务器 | FastAPI 官方推荐 |
| Celery | 5.x | 异步任务队列 | 数据采集和 AI 处理均为耗时任务 |
| Redis | 7.x | 消息队列 + 缓存 | Celery broker、结果缓存、会话存储 |
| PostgreSQL | 15.x | 关系数据库 | 结构化数据、JSON 字段、成熟稳定 |
| SQLAlchemy | 2.0 | ORM | Python 标准 ORM，异步支持 |
| Alembic | 1.x | 数据库迁移 | SQLAlchemy 配套迁移工具 |
| Pydantic | 2.x | 数据校验 | FastAPI 内置，请求/响应模型 |
| python-jose | 3.x | JWT 处理 | 用户认证 Token 生成与校验 |
| bcrypt | 4.x | 密码哈希 | 安全的密码加密存储 |
| httpx | 0.24+ | 异步 HTTP 客户端 | 调用外部 API（DeepSeek、数据源） |

### 1.3 AI & 数据

| 技术 | 用途 | 选型理由 |
|------|------|----------|
| DeepSeek API | LLM 大模型 | 中文能力强、成本适中、OpenAI 兼容格式可灵活切换 |
| akshare | A股/港股数据 | 开源免费、覆盖财报公告行情、持续维护 |
| yfinance | 美股/港股数据 | 免费、Yahoo Finance 非官方接口、覆盖面广 |
| sec-edgar-api | SEC EDGAR 数据 | 美股官方披露文件检索 |

### 1.4 导出 & 部署

| 技术 | 用途 |
|------|------|
| python-pptx | 生成可编辑 PPT 文件 |
| WeasyPrint | HTML → PDF 导出 |
| Jinja2 | 报告模板渲染（HTML/PPT） |
| Docker | 容器化打包 |
| Docker Compose | 多服务编排（API + DB + Redis + Worker） |
| Nginx | 生产环境反向代理 + 静态资源 |

---

## 二、数据流架构

```
┌──────────────┐     HTTP/REST      ┌──────────────────┐
│  浏览器       │ ◄──────────────► │  Nginx (反向代理)  │
│  (React SPA) │                    └────────┬─────────┘
└──────────────┘                             │
                                      ┌──────┴─────────┐
                                      │  FastAPI 服务器  │
                                      │  (Uvicorn)      │
                                      └──────┬─────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                    ┌────┴────┐       ┌─────┴─────┐      ┌─────┴─────┐
                    │PostgreSQL│       │   Redis    │      │  Celery   │
                    │(持久化)  │       │(队列/缓存) │      │  Worker   │
                    └─────────┘       └─────┬─────┘      └─────┬─────┘
                                            │                   │
                                     ┌──────┴──────┐     ┌─────┴──────────┐
                                     │ 任务队列     │     │ 异步任务执行    │
                                     │ (Broker)    │     │ ├─ 数据采集      │
                                     └─────────────┘     │ │  akshare      │
                                                          │ │  yfinance    │
                                                          │ │  SEC EDGAR   │
                                                          │ ├─ AI 文档解析   │
                                                          │ │  DeepSeek API│
                                                          │ └─ 报告导出     │
                                                          │    python-pptx │
                                                          │    WeasyPrint  │
                                                          └────────────────┘
```

### 2.1 核心数据流

1. **用户创建项目** → FastAPI → PostgreSQL 存储项目信息
2. **启动数据采集** → FastAPI → Celery 入队 → Worker 执行采集 → 结果写入 PostgreSQL → 进度更新 Redis
3. **启动 AI 解析** → FastAPI → Celery 入队 → Worker 调用 DeepSeek API → 结构化结果写入 PostgreSQL
4. **同业对标** → Worker 计算对标数据 → 写入 peer_comparisons 表
5. **多空论点** → Worker 调用 DeepSeek → 论点写入 thesis_items 表
6. **导出报告** → Worker 使用 Jinja2 模板 + python-pptx/WeasyPrint 生成文件 → 返回下载链接
7. **前端轮询/WebSocket** → 实时获取进度和数据更新

---

## 三、项目目录结构

```
stock-pitch/
├── CLAUDE.md
├── devlog/
│   └── YYYY-MM-DD.md
├── docs/
│   ├── requirements.md
│   ├── tech-stack.md
│   ├── design-spec.md
│   ├── development-plan.md
│   ├── api-spec.md
│   └── database-schema.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI 应用入口
│   │   ├── config.py              # 配置管理（环境变量）
│   │   ├── database.py            # 数据库连接 + Session
│   │   ├── models/                # SQLAlchemy 模型
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── document.py
│   │   │   ├── analysis.py
│   │   │   ├── peer_comparison.py
│   │   │   ├── thesis.py
│   │   │   └── export.py
│   │   ├── schemas/               # Pydantic 请求/响应模型
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── project.py
│   │   │   ├── document.py
│   │   │   ├── analysis.py
│   │   │   ├── peer_comparison.py
│   │   │   ├── thesis.py
│   │   │   └── export.py
│   │   ├── api/                   # API 路由
│   │   │   ├── __init__.py
│   │   │   ├── auth.py            # 注册/登录/用户信息
│   │   │   ├── projects.py        # 项目 CRUD
│   │   │   ├── documents.py       # 文档管理
│   │   │   ├── analysis.py        # AI 解析
│   │   │   ├── peer_comparison.py # 同业对标
│   │   │   ├── thesis.py          # 多空论点
│   │   │   └── export.py          # 报告导出
│   │   ├── services/              # 业务逻辑层
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── project_service.py
│   │   │   ├── collector/         # 数据采集模块
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py        # 采集器基类
│   │   │   │   ├── a_share.py     # A股采集器 (akshare)
│   │   │   │   ├── us_share.py    # 美股采集器 (yfinance+SEC)
│   │   │   │   └── hk_share.py    # 港股采集器
│   │   │   ├── analyzer/          # AI 解析模块
│   │   │   │   ├── __init__.py
│   │   │   │   ├── llm_client.py  # LLM 客户端（DeepSeek/OpenAI兼容）
│   │   │   │   └── extractor.py   # 结构化提取 Pipeline
│   │   │   ├── peer_service.py    # 同业对标计算
│   │   │   ├── thesis_service.py  # 论点生成
│   │   │   └── export_service.py  # 报告导出
│   │   ├── tasks/                 # Celery 任务定义
│   │   │   ├── __init__.py
│   │   │   ├── collect.py
│   │   │   ├── analyze.py
│   │   │   ├── compare.py
│   │   │   ├── thesis.py
│   │   │   └── export.py
│   │   └── utils/                 # 工具函数
│   │       ├── __init__.py
│   │       ├── citations.py       # 引用溯源工具
│   │       └── formatters.py      # 数据格式化
│   └── templates/                 # 报告模板
│       ├── report.html            # HTML 报告模板（PDF）
│       └── report_pptx.py         # PPT 生成模板
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx               # 应用入口
│       ├── App.tsx                # 根组件 + 路由
│       ├── theme.ts               # Ant Design 主题定制（配色）
│       ├── api/                   # API 调用层
│       │   ├── client.ts          # Axios 实例 + 拦截器
│       │   ├── auth.ts
│       │   ├── projects.ts
│       │   ├── documents.ts
│       │   ├── analysis.ts
│       │   ├── peer.ts
│       │   ├── thesis.ts
│       │   └── export.ts
│       ├── stores/                # Zustand 状态
│       │   ├── authStore.ts
│       │   ├── projectStore.ts
│       │   └── uiStore.ts
│       ├── pages/                 # 6 个页面组件
│       │   ├── HomePage.tsx
│       │   ├── DataCollectionPage.tsx
│       │   ├── DocumentAnalysisPage.tsx
│       │   ├── PeerComparisonPage.tsx
│       │   ├── ThesisPage.tsx
│       │   └── ReportPreviewPage.tsx
│       ├── components/            # 共享组件
│       │   ├── AppLayout.tsx      # 主布局（导航+内容）
│       │   ├── CitationBadge.tsx  # 引用标注组件
│       │   ├── DataTable.tsx      # 增强表格组件
│       │   ├── ComparisonChart.tsx# 对标图表组件
│       │   └── ThesisCard.tsx     # 论点卡片组件
│       └── utils/
│           ├── format.ts          # 数字/百分比格式化
│           └── constants.ts       # 常量定义
└── docker-compose.yml             # 多服务编排
```

---

## 四、关键架构决策

### 4.1 为什么选择 FastAPI 而不是 Node.js？
- Python 是 AI/ML 领域标准语言，数据采集库（akshare、yfinance）和报告生成（python-pptx）生态远优于 Node.js
- FastAPI 原生异步支持，性能不输 Node.js
- Pydantic + 自动 OpenAPI 文档显著提升开发效率

### 4.2 为什么选择 Celery 做异步任务？
- 数据采集和 AI 处理都是耗时操作（数十秒到数分钟），不能阻塞 HTTP 请求
- Celery + Redis 是 Python 生态最成熟的异步任务方案
- 支持任务重试、进度追踪、定时任务

### 4.3 LLM 接口模块化设计
- 封装统一的 `LLMClient` 基类，定义 `chat()` 和 `stream_chat()` 方法
- DeepSeek 作为默认实现（OpenAI 兼容 API 格式）
- 未来切换到通义千问 / OpenAI / Claude 只需新增一个子类，无需修改业务代码

### 4.4 数据源模块化设计
- 封装统一的 `BaseCollector` 基类，定义 `fetch_documents(stock_code)` 方法
- 每个市场实现独立采集器，互相解耦
- 支持按需启停数据源（用户在页面 1 勾选筛选）
