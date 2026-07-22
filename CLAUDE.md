# CLAUDE.md — AI Stock Research Assistant 工作指引

## 项目概述
AI-Powered Stock Research Assistant（人工智能股票研究助手），面向股票投研人员的全自动研究流水线工具。将传统人工繁琐的资料搜集、信息整理、竞品对标、论点梳理工作自动化，输出可直接用于PPT演示的标准化投研简报。

## 核心规范文件路径

| 文件 | 路径 | 说明 |
|------|------|------|
| 产品需求规格 | [docs/requirements.md](docs/requirements.md) | 完整功能清单、页面结构、业务逻辑 |
| 技术选型架构 | [docs/tech-stack.md](docs/tech-stack.md) | 前后端技术栈、数据流架构、第三方集成 |
| UI设计规范 | [docs/design-spec.md](docs/design-spec.md) | 配色、字体、间距、组件规范 |
| 开发执行计划 | [docs/development-plan.md](docs/development-plan.md) | 分阶段里程碑、任务拆解、验收标准 |
| API接口规范 | [docs/api-spec.md](docs/api-spec.md) | RESTful接口定义、请求响应格式 |
| 数据库设计 | [docs/database-schema.md](docs/database-schema.md) | 表结构、关系、索引设计 |

## 每日工作流程

1. **读取开发日志**：先查看 `devlog/` 中最新的日志文件，了解当前进度和待办事项
2. **确认当前阶段**：对照 [docs/development-plan.md](docs/development-plan.md) 确认当前开发阶段
3. **执行开发任务**：按照当天待办事项逐项完成，每次只聚焦一个功能模块
4. **更新开发日志**：在 `devlog/` 中创建或更新当日日志，记录完成事项和新的待办事项

## 开发原则

- **分步推进**：每次只完成一个明确的功能模块，不过度扩展，确保每步稳定可验证
- **文档同步**：代码变更同时更新对应的规范文档，保持文档与代码一致
- **中文优先**：所有UI文案、代码注释、文档内容使用简体中文
- **可追溯性**：所有AI生成内容必须标注来源引用，引用使用浅灰色上标标注可点击跳转
- **模块化**：数据源接口、LLM接口均设计为可插拔模块，方便后续切换升级

## 目标用户
股票行业研究员、投资分析师，面向办公桌面端大屏使用（Chrome / Edge 主流桌面浏览器）。

## 部署环境
- 前端：PC端网页浏览器（Chrome / Edge），适配桌面大屏操作场景
- 后端：Web服务端部署，Docker容器化
- 底层依赖：LLM大模型接口（DeepSeek）+ 公开财经数据源接口（akshare / yfinance / SEC EDGAR）

## 技术栈速览

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Ant Design 5 + ECharts |
| 后端 | Python FastAPI + Celery + Redis |
| 数据库 | PostgreSQL 15 + SQLAlchemy 2.0 |
| LLM | DeepSeek API（OpenAI兼容格式） |
| 数据源 | akshare (A股/港股) + yfinance (美股/港股) + SEC EDGAR |
| 导出 | python-pptx (PPT) + WeasyPrint (PDF) |
| 部署 | Docker + Docker Compose + Nginx |
