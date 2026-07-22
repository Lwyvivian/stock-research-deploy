# API 接口规范

## 一、通用规范

### 1.1 基础路径
```
开发环境：http://localhost:8000/api
生产环境：https://<domain>/api
```

### 1.2 请求格式
- Content-Type：`application/json`
- 认证：`Authorization: Bearer <jwt_token>`
- 字符编码：UTF-8

### 1.3 响应格式

成功响应：
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

列表响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

错误响应：
```json
{
  "code": 400,
  "message": "错误描述",
  "detail": "详细错误信息（可选）"
}
```

### 1.4 HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（Token 缺失或无效） |
| 403 | 无权限（访问他人资源） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已注册） |
| 500 | 服务器内部错误 |

---

## 二、认证模块 `/api/auth`

### 2.1 用户注册
```
POST /api/auth/register
```

请求体：
```json
{
  "email": "user@example.com",
  "password": "secure_password_8+chars",
  "name": "张三"
}
```

响应：
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "张三",
      "created_at": "2026-07-21T10:00:00Z"
    },
    "access_token": "jwt_token_string",
    "token_type": "bearer"
  }
}
```

### 2.2 用户登录
```
POST /api/auth/login
```

请求体：
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "张三"
    },
    "access_token": "jwt_token_string",
    "token_type": "bearer"
  }
}
```

### 2.3 获取当前用户
```
GET /api/auth/me
```
需要认证：是

响应：
```json
{
  "code": 200,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "张三",
    "created_at": "2026-07-21T10:00:00Z"
  }
}
```

---

## 三、项目管理模块 `/api/projects`

所有端点需要认证。用户只能访问自己的项目。

### 3.1 创建项目
```
POST /api/projects
```

请求体：
```json
{
  "stock_code": "000001",
  "stock_name": "平安银行",
  "market": "A",              // "A" | "US" | "HK"
  "peers": [
    { "code": "600036", "name": "招商银行", "market": "A" },
    { "code": "601166", "name": "兴业银行", "market": "A" }
  ],
  "data_sources": {
    "earnings": true,         // 财报
    "news": true,             // 新闻
    "transcripts": true,      // 电话会
    "presentations": true     // 投资者演示
  }
}
```

响应：
```json
{
  "code": 201,
  "data": {
    "id": "project-uuid",
    "stock_code": "000001",
    "stock_name": "平安银行",
    "market": "A",
    "status": "created",
    "created_at": "2026-07-21T10:00:00Z"
  }
}
```

### 3.2 获取项目列表
```
GET /api/projects?page=1&page_size=20
```

响应：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "stock_code": "000001",
        "stock_name": "平安银行",
        "market": "A",
        "status": "completed",
        "created_at": "2026-07-21T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

### 3.3 获取项目详情
```
GET /api/projects/:project_id
```

响应：
```json
{
  "code": 200,
  "data": {
    "id": "uuid",
    "stock_code": "000001",
    "stock_name": "平安银行",
    "market": "A",
    "peers": [...],
    "data_sources": {...},
    "status": "collecting",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 3.4 删除项目
```
DELETE /api/projects/:project_id
```

响应：
```json
{
  "code": 200,
  "message": "项目已删除"
}
```

---

## 四、数据采集模块 `/api/projects/:project_id`

### 4.1 启动数据采集
```
POST /api/projects/:project_id/collect
```

响应：
```json
{
  "code": 202,
  "message": "数据采集任务已启动",
  "data": {
    "task_id": "celery-task-uuid"
  }
}
```

### 4.2 查询采集进度
```
GET /api/projects/:project_id/collect/status
```

响应：
```json
{
  "code": 200,
  "data": {
    "status": "in_progress",          // "pending" | "in_progress" | "completed" | "failed"
    "progress": {
      "earnings": { "total": 4, "completed": 3, "status": "in_progress" },
      "news": { "total": 20, "completed": 20, "status": "completed" },
      "transcripts": { "total": 2, "completed": 0, "status": "pending" },
      "presentations": { "total": 1, "completed": 1, "status": "completed" }
    },
    "overall_percent": 65.5,
    "failed_items": [
      { "type": "earnings", "title": "2025年报", "reason": "数据源暂时不可用" }
    ]
  }
}
```

### 4.3 获取文档列表
```
GET /api/projects/:project_id/documents?type=earnings&page=1&page_size=20
```

响应：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "doc-uuid",
        "type": "earnings",
        "title": "平安银行2025年年度报告",
        "source_url": "https://...",
        "fetched_at": "2026-07-21T10:05:00Z",
        "content_preview": "前200字预览..."
      }
    ],
    "total": 4
  }
}
```

### 4.4 手动上传文档
```
POST /api/projects/:project_id/documents/upload
```
Content-Type：`multipart/form-data`

表单字段：
- `file`：文件（PDF/Word/TXT，最大 20MB）
- `type`：文档类型（"earnings" | "news" | "transcripts" | "presentations" | "other"）
- `title`：文档标题（可选，默认使用文件名）

响应：
```json
{
  "code": 201,
  "data": {
    "id": "doc-uuid",
    "title": "上传的文件名.pdf",
    "type": "other",
    "fetched_at": "2026-07-21T11:00:00Z"
  }
}
```

---

## 五、文档解析模块 `/api/projects/:project_id`

### 5.1 启动 AI 解析
```
POST /api/projects/:project_id/analyze
```

可选请求体（指定文档范围）：
```json
{
  "document_ids": ["doc-uuid-1", "doc-uuid-2"]   // 不传则解析全部文档
}
```

响应：
```json
{
  "code": 202,
  "message": "AI解析任务已启动",
  "data": {
    "task_id": "celery-task-uuid"
  }
}
```

### 5.2 获取解析结果
```
GET /api/projects/:project_id/analysis?category=business_change
```

查询参数（可选）：
- `category`：筛选类别（"business_change" | "management_strategy" | "financial_anomaly" | "risk_alert" | "open_question"）

响应：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "analysis-uuid",
        "category": "financial_anomaly",
        "title": "Q4营收增速骤降至3.2%",
        "content": "公司2025年Q4营收同比增速从Q3的12.5%骤降至3.2%，主要受零售业务条线收入下滑拖累...",
        "citations": [
          {
            "id": 1,
            "document_id": "doc-uuid",
            "document_title": "平安银行2025年年度报告",
            "excerpt": "第四季度营业收入同比下降3.2%...（第45页）"
          }
        ],
        "created_at": "2026-07-21T10:30:00Z"
      }
    ],
    "categories": {
      "business_change": { "count": 5, "label": "业务变动" },
      "management_strategy": { "count": 3, "label": "管理层战略" },
      "financial_anomaly": { "count": 8, "label": "财务异动" },
      "risk_alert": { "count": 4, "label": "风险预警" },
      "open_question": { "count": 2, "label": "待确认疑问" }
    }
  }
}
```

### 5.3 编辑 AI 提炼内容
```
PUT /api/projects/:project_id/analysis/:item_id
```

请求体：
```json
{
  "title": "修改后的标题",
  "content": "研究员修改后的分析内容..."
}
```

响应：
```json
{
  "code": 200,
  "message": "更新成功",
  "data": { ... }
}
```

---

## 六、同业对标模块 `/api/projects/:project_id`

### 6.1 启动对标分析
```
POST /api/projects/:project_id/peer-comparison
```

响应：
```json
{
  "code": 202,
  "message": "对标分析任务已启动",
  "data": { "task_id": "celery-task-uuid" }
}
```

### 6.2 获取对标结果
```
GET /api/projects/:project_id/peer-comparison
```

响应：
```json
{
  "code": 200,
  "data": {
    "companies": [
      { "code": "000001", "name": "平安银行", "is_target": true },
      { "code": "600036", "name": "招商银行", "is_target": false }
    ],
    "metrics": [
      {
        "category": "增长指标",
        "items": [
          {
            "name": "营收同比增速",
            "unit": "%",
            "values": [
              { "company_code": "000001", "value": 3.2, "is_significant": true, "direction": "negative" },
              { "company_code": "600036", "value": 8.5, "is_significant": false, "direction": "neutral" }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 七、多空论点模块 `/api/projects/:project_id`

### 7.1 生成投资论点
```
POST /api/projects/:project_id/thesis/generate
```

响应：
```json
{
  "code": 202,
  "message": "论点生成任务已启动",
  "data": { "task_id": "celery-task-uuid" }
}
```

### 7.2 获取论点列表
```
GET /api/projects/:project_id/thesis?direction=bull
```

响应：
```json
{
  "code": 200,
  "data": {
    "bull": [
      {
        "id": "thesis-uuid",
        "direction": "bull",
        "title": "零售转型初见成效",
        "content": "公司零售AUM同比增长18%，财富管理中收占比提升至35%...",
        "citations": [
          { "id": 2, "document_id": "doc-uuid", "document_title": "...", "excerpt": "..." }
        ],
        "is_custom": false,
        "created_at": "..."
      }
    ],
    "bear": [ ... ]
  }
}
```

### 7.3 添加自定义论点
```
POST /api/projects/:project_id/thesis/custom
```

请求体：
```json
{
  "direction": "bull",
  "title": "个人自定义论点标题",
  "content": "详细论述..."
}
```

### 7.4 编辑论点
```
PUT /api/projects/:project_id/thesis/:thesis_id
```

### 7.5 删除论点
```
DELETE /api/projects/:project_id/thesis/:thesis_id
```

---

## 八、导出模块 `/api/projects/:project_id`

### 8.1 导出 PDF
```
GET /api/projects/:project_id/export/pdf
```
响应：`application/pdf` 文件流下载

### 8.2 导出 PPT
```
GET /api/projects/:project_id/export/pptx
```
响应：`application/vnd.openxmlformats-officedocument.presentationml.presentation` 文件流下载

---

## 九、WebSocket（可选，Phase 6-7 实现）

### 9.1 进度推送
```
WS /ws/projects/:project_id/progress
```
服务端主动推送采集/解析/对标/导出进度更新。
