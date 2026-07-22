# 数据库表结构设计

## 一、ER 关系概览

```
users (1) ────────< projects (N)
projects (1) ─────< documents (N)
projects (1) ─────< analysis_items (N)
documents (1) ────< analysis_items (N)
projects (1) ─────< peer_comparisons (N)
projects (1) ─────< thesis_items (N)
projects (1) ─────< export_records (N)
```

---

## 二、表结构详细定义

### 2.1 `users` — 用户表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK, 默认 gen_random_uuid() | 用户唯一ID |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | 登录邮箱 |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt 哈希密码 |
| `name` | VARCHAR(100) | NOT NULL | 用户姓名 |
| `is_active` | BOOLEAN | NOT NULL, 默认 TRUE | 账户激活状态 |
| `created_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 注册时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 最后更新时间 |

索引：
- `idx_users_email` UNIQUE on `(email)`

---

### 2.2 `projects` — 研究项目表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 项目唯一ID |
| `user_id` | UUID | FK → users.id, NOT NULL | 所属用户 |
| `stock_code` | VARCHAR(20) | NOT NULL | 标的股票代码 |
| `stock_name` | VARCHAR(200) | NOT NULL | 标的公司名称 |
| `market` | VARCHAR(5) | NOT NULL | 市场（A / US / HK） |
| `peers` | JSONB | NOT NULL, 默认 '[]' | 竞品公司列表 `[{code, name, market}]` |
| `data_sources` | JSONB | NOT NULL, 默认 '{}' | 数据源开关 `{earnings, news, transcripts, presentations}` |
| `status` | VARCHAR(20) | NOT NULL, 默认 'created' | 项目状态（created / collecting / collected / analyzing / analyzed / comparing / thesis_generated / completed / failed） |
| `created_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 最后更新时间 |

索引：
- `idx_projects_user_id` on `(user_id)`
- `idx_projects_status` on `(status)`
- `idx_projects_created_at` on `(created_at DESC)`

---

### 2.3 `documents` — 文档表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 文档唯一ID |
| `project_id` | UUID | FK → projects.id ON DELETE CASCADE, NOT NULL | 所属项目 |
| `type` | VARCHAR(30) | NOT NULL | 文档类型（earnings / news / transcript / presentation / uploaded / other） |
| `title` | VARCHAR(500) | NOT NULL | 文档标题 |
| `source_url` | TEXT | NULL | 原始来源URL |
| `source_name` | VARCHAR(200) | NULL | 数据来源名称（如"巨潮资讯"、"SEC EDGAR"） |
| `content` | TEXT | NULL | 文档正文内容（全文） |
| `content_preview` | VARCHAR(500) | NULL | 内容前200字预览 |
| `file_path` | VARCHAR(500) | NULL | 上传文件的本地存储路径 |
| `file_type` | VARCHAR(20) | NULL | 上传文件类型（pdf / docx / txt） |
| `fetch_status` | VARCHAR(20) | NOT NULL, 默认 'pending' | 采集状态（pending / fetching / completed / failed） |
| `fetch_error` | TEXT | NULL | 采集失败原因 |
| `word_count` | INTEGER | NULL | 字数统计 |
| `fetched_at` | TIMESTAMPTZ | NULL | 采集完成时间 |
| `created_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 创建时间 |

索引：
- `idx_documents_project_id` on `(project_id)`
- `idx_documents_type` on `(project_id, type)`
- `idx_documents_fetch_status` on `(project_id, fetch_status)`

---

### 2.4 `analysis_items` — AI 提炼条目表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 条目唯一ID |
| `project_id` | UUID | FK → projects.id ON DELETE CASCADE, NOT NULL | 所属项目 |
| `document_id` | UUID | FK → documents.id ON DELETE SET NULL, NULL | 来源文档（可多个来源，主要来源） |
| `category` | VARCHAR(30) | NOT NULL | 提炼类别（business_change / management_strategy / financial_anomaly / risk_alert / open_question） |
| `title` | VARCHAR(300) | NOT NULL | 提炼标题（一句话总结） |
| `content` | TEXT | NOT NULL | AI 提炼的详细内容 |
| `edited_title` | VARCHAR(300) | NULL | 用户修改后的标题 |
| `edited_content` | TEXT | NULL | 用户修改后的内容 |
| `citations` | JSONB | NOT NULL, 默认 '[]' | 引用列表 `[{document_id, document_title, excerpt, page}]` |
| `confidence` | DECIMAL(3,2) | NULL | AI 置信度（0.00-1.00） |
| `is_edited` | BOOLEAN | NOT NULL, 默认 FALSE | 是否被用户编辑过 |
| `created_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 最后更新时间 |

索引：
- `idx_analysis_project_id` on `(project_id)`
- `idx_analysis_category` on `(project_id, category)`
- `idx_analysis_document_id` on `(document_id)`

---

### 2.5 `peer_comparisons` — 同业对标数据表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 对标记录唯一ID |
| `project_id` | UUID | FK → projects.id ON DELETE CASCADE, NOT NULL | 所属项目 |
| `company_code` | VARCHAR(20) | NOT NULL | 公司代码 |
| `company_name` | VARCHAR(200) | NOT NULL | 公司名称 |
| `is_target` | BOOLEAN | NOT NULL, 默认 FALSE | 是否为标的公司 |
| `metrics` | JSONB | NOT NULL | 全部对标指标数据 |
| `created_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 创建时间 |

`metrics` JSONB 结构：
```json
{
  "revenue_growth": { "value": 3.2, "unit": "%", "period": "Q4_2025" },
  "gross_margin": { "value": 45.2, "unit": "%", "period": "FY2025" },
  "net_margin": { "value": 12.8, "unit": "%", "period": "FY2025" },
  "rd_intensity": { "value": 8.5, "unit": "%", "period": "FY2025" },
  "pe_ratio": { "value": 15.3, "unit": "x", "as_of": "2026-07-21" },
  "ps_ratio": { "value": 2.1, "unit": "x", "as_of": "2026-07-21" },
  "pb_ratio": { "value": 1.8, "unit": "x", "as_of": "2026-07-21" },
  "ev_ebitda": { "value": 12.5, "unit": "x", "as_of": "2026-07-21" },
  "customer_structure": { "top5_concentration": 35.0, "note": "前五大客户集中度35%" },
  "business_progress": { "stage": "expansion", "note": "全国性扩张阶段" },
  "narrative": { "summary": "零售转型+科技赋能", "differentiation": "同业中科技投入占比最高" }
}
```

索引：
- `idx_peer_project_id` on `(project_id)`
- `idx_peer_company` on `(project_id, company_code)`

---

### 2.6 `thesis_items` — 投资论点表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 论点唯一ID |
| `project_id` | UUID | FK → projects.id ON DELETE CASCADE, NOT NULL | 所属项目 |
| `direction` | VARCHAR(10) | NOT NULL | 方向（bull / bear） |
| `title` | VARCHAR(300) | NOT NULL | 论点标题 |
| `content` | TEXT | NOT NULL | 论点详细内容 |
| `citations` | JSONB | NOT NULL, 默认 '[]' | 数据支撑引用 |
| `is_custom` | BOOLEAN | NOT NULL, 默认 FALSE | 是否为用户自定义（TRUE）还是AI生成（FALSE） |
| `sort_order` | INTEGER | NOT NULL, 默认 0 | 排序序号 |
| `created_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 最后更新时间 |

索引：
- `idx_thesis_project_id` on `(project_id)`
- `idx_thesis_direction` on `(project_id, direction)`

---

### 2.7 `export_records` — 导出记录表

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PK | 导出记录唯一ID |
| `project_id` | UUID | FK → projects.id ON DELETE CASCADE, NOT NULL | 所属项目 |
| `format` | VARCHAR(10) | NOT NULL | 导出格式（pdf / pptx） |
| `file_path` | VARCHAR(500) | NOT NULL | 服务器端文件路径 |
| `file_size` | INTEGER | NULL | 文件大小（bytes） |
| `created_at` | TIMESTAMPTZ | NOT NULL, 默认 NOW() | 导出时间 |

索引：
- `idx_export_project_id` on `(project_id)`

---

## 三、数据迁移策略（Alembic）

### 3.1 初始迁移（Phase 1）
创建全部 7 张表的基础结构。

### 3.2 后续迁移原则
- 每个 Phase 的模型变更单独生成一个迁移文件
- 迁移文件命名：`XXXX_描述性名称.py`（如 `0001_init_tables.py`）
- 每个迁移必须包含 `upgrade()` 和 `downgrade()` 方法
- 执行前先在开发环境测试迁移正反向

### 3.3 迁移命令
```bash
# 生成迁移文件
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚一步
alembic downgrade -1
```

---

## 四、数据库查询优化建议

- 所有 `project_id` 相关查询都建立了索引
- JSONB 查询使用 GIN 索引（如需要频繁查询 peers/ citations 内部字段）
- 大文本字段（content）建议分离存储或使用 TOAST 压缩
- 频繁读取的配置数据使用 Redis 缓存
- 列表查询统一使用分页（默认 page_size=20，最大 100）
