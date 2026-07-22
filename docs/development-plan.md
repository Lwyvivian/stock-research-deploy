# 分阶段开发执行计划

## 总览

| 阶段 | 名称 | 预计周期 | 核心交付物 |
|------|------|----------|------------|
| Phase 0 | 项目脚手架 | 1天 ✅ | 文件夹结构、规范文档、CLAUDE.md |
| Phase 1 | 后端骨架 | 3-4天 | FastAPI + DB + JWT认证 + 项目管理CRUD |
| Phase 2 | 数据采集引擎 | 4-5天 | 三市场数据采集器 + Celery任务 + 进度追踪 |
| Phase 3 | AI文档解析引擎 | 3-4天 | DeepSeek集成 + 结构化提取 + 引用系统 |
| Phase 4 | 同业对标 + 多空论点 | 3-4天 | 对标计算引擎 + 论点生成 + 用户编辑API |
| Phase 5 | 简报导出 | 2-3天 | PPT生成 + PDF导出 |
| Phase 6 | 前端开发 | 5-7天 | React项目 + 6个页面 + 设计系统 |
| Phase 7 | 联调 + 部署 | 2-3天 | 前后端联调 + Docker Compose + Nginx |

---

## Phase 0：项目脚手架 ✅

### 目标
建立项目基础结构和文档体系，为后续所有开发提供规范指引。

### 任务清单
- [x] 创建 `devlog/` 文件夹 + 首日开发日志
- [x] 创建 `docs/` 文件夹 + 全部 6 个规范文档
- [x] 创建项目根目录 `CLAUDE.md`

### 验收标准
- 所有文件路径正确、内容完整
- CLAUDE.md 中路径链接指向正确文件

---

## Phase 1：后端骨架

### 目标
搭建 FastAPI 后端框架，完成数据库连接、用户认证、项目管理基础 CRUD。

### 任务清单

#### 1.1 开发环境配置
- [ ] 安装 Python 3.11+、Node.js 20+、PostgreSQL 15、Redis 7
- [ ] 创建 `backend/` 目录结构
- [ ] 编写 `requirements.txt`
- [ ] 编写 `docker-compose.yml`（api + db + redis 服务）

#### 1.2 数据库
- [ ] 编写 User 和 Project 的 SQLAlchemy 模型
- [ ] 配置 Alembic 数据库迁移
- [ ] 创建初始迁移脚本
- [ ] 编写 database.py 连接管理

#### 1.3 用户认证
- [ ] 实现 `POST /api/auth/register`（邮箱 + 密码注册）
- [ ] 实现 `POST /api/auth/login`（返回 JWT Token）
- [ ] 实现 `GET /api/auth/me`（获取当前用户信息）
- [ ] 实现 JWT 认证中间件（依赖注入）
- [ ] 编写 auth 相关 Pydantic Schema

#### 1.4 项目管理
- [ ] 实现 `POST /api/projects`（创建研究项目）
- [ ] 实现 `GET /api/projects`（获取用户项目列表）
- [ ] 实现 `GET /api/projects/:id`（获取项目详情）
- [ ] 实现 `DELETE /api/projects/:id`（删除项目）
- [ ] 项目数据隔离（用户只能操作自己的项目）

#### 1.5 配置与工具
- [ ] 编写 `config.py`（环境变量管理）
- [ ] 配置 CORS 中间件
- [ ] FastAPI 应用入口 `main.py`

### 验收标准
- `docker-compose up` 启动 api + db + redis 三个服务
- 访问 `http://localhost:8000/docs` 可见 Swagger API 文档
- 注册/登录接口可用，JWT Token 可解密
- 项目 CRUD 接口可正常增删查改

---

## Phase 2：数据采集引擎

### 目标
实现三市场（A股/美股/港股）财经数据自动采集，异步任务 + 进度追踪。

### 任务清单

#### 2.1 采集器基类
- [ ] 定义 `BaseCollector` 抽象基类
- [ ] 定义统一文档输出格式（Document Schema）
- [ ] 实现采集进度回调机制

#### 2.2 A股采集器
- [ ] 集成 akshare：财报数据
- [ ] 集成 akshare：公司公告
- [ ] 集成 akshare：财务指标
- [ ] 新闻抓取（东方财富等公开源）

#### 2.3 美股采集器
- [ ] 集成 yfinance：财务数据（Income/Balance/CashFlow）
- [ ] SEC EDGAR：10-K/10-Q 年报季报
- [ ] SEC EDGAR：8-K 重大事件公告
- [ ] 美股新闻（Yahoo Finance RSS）

#### 2.4 港股采集器
- [ ] 集成 akshare：港股财务数据
- [ ] 集成 yfinance：港股补充数据
- [ ] 港交所披露易公告

#### 2.5 Celery 任务
- [ ] 配置 Celery + Redis broker
- [ ] 编写 `collect_project_data` 异步任务
- [ ] 任务状态与进度写入 Redis
- [ ] 异常处理与重试机制

#### 2.6 API 接口
- [ ] `POST /api/projects/:id/collect`（启动采集）
- [ ] `GET /api/projects/:id/collect/status`（查询进度）
- [ ] `GET /api/projects/:id/documents`（获取已采集文档）
- [ ] `POST /api/projects/:id/documents/upload`（手动上传）

### 验收标准
- 输入 A 股股票代码，成功抓取财报和公告数据
- 输入美股 Ticker，成功抓取 SEC 文件和 yfinance 数据
- 采集进度可实时查询
- 采集失败的文档正确标记并提示

---

## Phase 3：AI 文档解析引擎

### 目标
集成 DeepSeek API，实现文档智能解析与结构化信息提取，建立引用溯源系统。

### 任务清单

#### 3.1 LLM 客户端
- [ ] 封装 `LLMClient` 基类（OpenAI 兼容接口）
- [ ] 实现 `DeepSeekClient`
- [ ] 配置 API Key、模型选择、超时重试
- [ ] 预留切换其他模型的扩展点

#### 3.2 结构化提取 Pipeline
- [ ] 设计 Prompt 模板（System Prompt + User Prompt）
- [ ] 实现财报文档 → 结构化信息的提取逻辑
- [ ] 提取类别：业务变动 / 管理层战略 / 财务异动 / 风险预警 / 待确认疑问
- [ ] 输出 JSON Schema 定义（确保 LLM 输出结构一致）

#### 3.3 引用溯源系统
- [ ] 每条 AI 提炼内容附带原始文档 ID + 原文片段引用
- [ ] 引用编号自动生成（[1], [2], ...）
- [ ] 支持从引用反向跳转原始文档位置

#### 3.4 Celery 任务
- [ ] 编写 `analyze_project_documents` 异步任务
- [ ] 批量文档逐篇解析 + 结果聚合

#### 3.5 API 接口
- [ ] `POST /api/projects/:id/analyze`（启动 AI 解析）
- [ ] `GET /api/projects/:id/analysis`（获取解析结果）
- [ ] `PUT /api/projects/:id/analysis/:item_id`（编辑提炼内容）

### 验收标准
- 传入一篇年报/财报文本，LLM 能正确提取结构化信息
- 每条提取结果附带原文引用
- 用户可编辑、保存修改后的提炼内容

---

## Phase 4：同业对标 + 多空论点

### 目标
实现同业对标自动计算和多空论点自动生成，支持用户自定义编辑。

### 任务清单

#### 4.1 同业对标引擎
- [ ] 对标维度计算：营收增速 / 毛利率净利率 / 研发强度 / 估值 / 客户结构 / 业务进度
- [ ] 差异显著性检测（偏离均值 >20% 高亮）
- [ ] 数据写入 `peer_comparisons` 表

#### 4.2 多空论点引擎
- [ ] 设计论点生成 Prompt 模板
- [ ] 调用 DeepSeek 生成 Bull Case（上涨催化 + 被低估利好）
- [ ] 调用 DeepSeek 生成 Bear Case（下行风险 + 已定价预期）
- [ ] 论点附带数据支撑来源

#### 4.3 API 接口
- [ ] `POST /api/projects/:id/peer-comparison`（启动对标）
- [ ] `GET /api/projects/:id/peer-comparison`（获取对标结果）
- [ ] `POST /api/projects/:id/thesis/generate`（生成论点）
- [ ] `GET /api/projects/:id/thesis`（获取论点）
- [ ] `POST/PUT/DELETE /api/projects/:id/thesis/*`（自定义论点 CRUD）

### 验收标准
- 多家公司对标数据正确计算，差异项正确标色
- 多空论点逻辑合理，每条有数据支撑
- 用户可增删改自定义论点

---

## Phase 5：简报导出

### 目标
实现 PPT 和 PDF 两种格式的投研简报导出。

### 任务清单

#### 5.1 PPT 导出
- [ ] 设计 PPT 模板（python-pptx）
- [ ] 7 页固定结构：核心论点/公司概览/财务快照/多头/空头/催化风险/结论
- [ ] 表格 + 图表嵌入
- [ ] 引用标注保留

#### 5.2 PDF 导出
- [ ] 设计 HTML 模板（Jinja2）
- [ ] WeasyPrint HTML → PDF 转换
- [ ] 中文字体支持

#### 5.3 API 接口
- [ ] `GET /api/projects/:id/export/pdf`
- [ ] `GET /api/projects/:id/export/pptx`

### 验收标准
- PPT 文件可正常打开编辑，结构完整
- PDF 文件格式正确，中文正常显示
- 引用标注在导出文件中保留

---

## Phase 6：前端开发

### 目标
React 前端项目搭建，6 个页面的完整实现，设计系统落地。

### 任务清单

#### 6.1 项目初始化
- [ ] Vite + React + TypeScript 项目创建
- [ ] Ant Design 5 集成 + 主题定制（配色/字体）
- [ ] 路由配置（React Router v6）
- [ ] Zustand 状态管理初始化
- [ ] Axios 客户端封装（拦截器 + JWT Token）

#### 6.2 通用组件
- [ ] `AppLayout`（顶部导航 + 左侧菜单 + 内容区）
- [ ] `CitationBadge`（引用标注组件）
- [ ] `DataTable`（增强表格：交替行色、异动标色、排序）
- [ ] `ComparisonChart`（ECharts 对标图表）
- [ ] `ThesisCard`（论点卡片）

#### 6.3 页面实现
- [ ] 页面 1：HomePage（搜索框、竞品添加、数据源开关、启动按钮、历史列表）
- [ ] 页面 2：DataCollectionPage（进度面板、文档列表、缺失提示、上传入口）
- [ ] 页面 3：DocumentAnalysisPage（三栏工作台：文档列表/AI提炼/编辑面板）
- [ ] 页面 4：PeerComparisonPage（对标表格 + 图表 + 高亮标注）
- [ ] 页面 5：ThesisPage（多头/空头两栏 + 自定义论点 + 增删改）
- [ ] 页面 6：ReportPreviewPage（幻灯片预览 + PDF/PPT 导出按钮）

#### 6.4 登录/注册页
- [ ] LoginPage（邮箱 + 密码登录）
- [ ] RegisterPage（注册表单）

### 验收标准
- 6 个页面均可正常渲染，路由跳转正常
- 设计配色与规范文档一致
- 与后端 API 联调通过

---

## Phase 7：联调 + 部署

### 目标
前后端全链路联调，Docker 容器化，生产环境配置。

### 任务清单
- [ ] 前后端联调（API 对接、异常处理、加载状态）
- [ ] Docker Compose 一键部署配置
- [ ] Nginx 反向代理配置
- [ ] 环境变量管理（.env 文件）
- [ ] 基础安全配置（HTTPS、CORS、Rate Limiting）
- [ ] README.md 部署说明

### 验收标准
- `docker-compose up -d` 一键启动全部服务
- 浏览器访问可正常使用全部功能
- API 文档可通过 `/api/docs` 访问

---

## 附录：开发规范

### Git 提交规范
```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 代码审查检查点
- [ ] 中文注释覆盖关键逻辑
- [ ] API 端点有对应的 Pydantic Schema
- [ ] 新增数据模型有 Alembic 迁移
- [ ] 异步耗时操作使用 Celery 任务
