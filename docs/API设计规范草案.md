# 前后端 API 设计规范草案

## 1. API 设计原则

### 1.1 RESTful 风格
- 使用标准 HTTP 方法：GET（查询）、POST（创建）、PUT（更新）、PATCH（部分更新）、DELETE（删除）
- URL 使用名词复数形式，避免动词：`/api/users` 而非 `/api/getUsers`
- 层级关系通过 URL 路径体现：`/api/users/{userId}/orders`

### 1.2 版本管理
- 在 URL 中包含版本号：`/api/v1/users`
- 主版本号变更表示不兼容的 API 修改
- 保持至少一个旧版本的兼容性，给前端留出迁移时间

### 1.3 统一命名规范
- URL 路径使用小写字母和中划线：`/api/user-profiles`
- JSON 字段使用 camelCase：`{ "userId": 1, "firstName": "Zhang" }`
- 布尔值字段使用 `is/has/can` 前缀：`isActive`, `hasPermission`

## 2. 统一响应格式

### 2.1 成功响应
```typescript
interface SuccessResponse<T> {
  code: number;        // 业务状态码，200 表示成功
  data: T;             // 实际数据
  message: string;     // 提示信息
  timestamp: number;   // 服务器时间戳
  requestId: string;   // 请求追踪 ID
}
```

示例：
```json
{
  "code": 200,
  "data": {
    "userId": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com"
  },
  "message": "success",
  "timestamp": 1699420800000,
  "requestId": "req-abc123"
}
```

### 2.2 错误响应
```typescript
interface ErrorResponse {
  code: number;        // 业务错误码
  message: string;     // 错误描述（用户可见）
  error: string;       // 错误类型（开发用）
  details?: any;       // 详细错误信息（可选，开发环境）
  timestamp: number;
  requestId: string;
  path: string;        // 请求路径
}
```

示例：
```json
{
  "code": 40001,
  "message": "用户名或密码错误",
  "error": "INVALID_CREDENTIALS",
  "timestamp": 1699420800000,
  "requestId": "req-abc123",
  "path": "/api/v1/auth/login"
}
```

### 2.3 列表响应（分页）
```typescript
interface PageResponse<T> {
  code: number;
  data: {
    items: T[];           // 数据列表
    total: number;        // 总记录数
    page: number;         // 当前页码（从 1 开始）
    pageSize: number;     // 每页大小
    hasNext: boolean;     // 是否有下一页
  };
  message: string;
  timestamp: number;
  requestId: string;
}
```

## 3. 错误码设计

### 3.1 HTTP 状态码
- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `204 No Content` - 删除成功（无返回内容）
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 无权限
- `404 Not Found` - 资源不存在
- `409 Conflict` - 资源冲突（如重复创建）
- `422 Unprocessable Entity` - 业务逻辑验证失败
- `429 Too Many Requests` - 请求过于频繁
- `500 Internal Server Error` - 服务器内部错误
- `503 Service Unavailable` - 服务暂时不可用

### 3.2 业务状态码设计
采用 5 位数字，按模块划分：

**通用错误（10000-19999）**
- `10000` - 未知错误
- `10001` - 参数验证失败
- `10002` - 数据不存在
- `10003` - 操作失败
- `10004` - 请求过于频繁

**认证相关（20000-29999）**
- `20001` - Token 缺失
- `20002` - Token 过期
- `20003` - Token 无效
- `20004` - 用户名或密码错误
- `20005` - 账号已被禁用

**权限相关（30000-39999）**
- `30001` - 无权限访问
- `30002` - 角色权限不足
- `30003` - 资源权限不足

**业务相关（40000+，按模块细分）**
- `40001` - 用户模块错误
- `50001` - 订单模块错误
- ...

## 4. 请求规范

### 4.1 查询参数（GET）
```
GET /api/v1/users?page=1&pageSize=20&status=active&keyword=zhang&sortBy=createTime&order=desc
```

通用分页参数：
- `page` - 页码（从 1 开始）
- `pageSize` - 每页大小（默认 20，最大 100）
- `sortBy` - 排序字段
- `order` - 排序方向（`asc` / `desc`）

### 4.2 请求体（POST/PUT/PATCH）
```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "profile": {
    "firstName": "San",
    "lastName": "Zhang",
    "age": 25
  }
}
```

### 4.3 批量操作
```json
POST /api/v1/users/batch-delete
{
  "ids": [1, 2, 3, 4, 5]
}
```

## 5. 认证与授权

### 5.1 认证方式
采用 JWT (JSON Web Token) 机制：

**登录流程：**
1. 前端发送用户名密码到 `/api/v1/auth/login`
2. 后端验证成功，返回 `accessToken` 和 `refreshToken`
3. 前端将 `accessToken` 存储在内存，`refreshToken` 存储在 httpOnly cookie

**认证请求：**
```
Authorization: Bearer <accessToken>
```

### 5.2 Token 刷新
```
POST /api/v1/auth/refresh
Cookie: refreshToken=xxx

Response:
{
  "code": 200,
  "data": {
    "accessToken": "new-access-token",
    "expiresIn": 3600
  }
}
```

### 5.3 Token 过期处理
- `accessToken` 有效期：1 小时
- `refreshToken` 有效期：7 天
- 前端收到 401 错误时，自动调用刷新接口
- 刷新失败则跳转到登录页

## 6. 接口文档规范

### 6.1 使用 OpenAPI 3.0 规范
所有接口必须编写 OpenAPI 文档，包含：
- 接口描述
- 请求参数（路径、查询、请求体）
- 响应格式（成功和各种错误情况）
- 示例数据

### 6.2 自动生成 TypeScript 类型
使用工具（如 openapi-typescript）自动生成前端类型定义：
```typescript
// 自动生成
export interface User {
  userId: number;
  username: string;
  email: string;
  createTime: string;
}

export interface GetUsersResponse {
  code: number;
  data: {
    items: User[];
    total: number;
    page: number;
    pageSize: number;
  };
  message: string;
}
```

### 6.3 Mock Server
- 开发环境提供 Mock Server（基于 OpenAPI 文档）
- 前端可在后端接口未完成前独立开发
- Mock 数据应贴近真实场景

## 7. 接口变更管理

### 7.1 变更通知机制
- 接口修改前必须通知前端（至少提前 2 个工作日）
- 通过文档变更记录（Changelog）追踪修改
- 重大变更需要在技术例会上讨论

### 7.2 兼容性原则
**向后兼容的变更（可直接发布）：**
- 添加新的接口
- 添加新的可选参数
- 添加新的响应字段

**不兼容的变更（需要版本升级）：**
- 删除或重命名字段
- 修改字段类型
- 修改必填参数
- 修改响应结构

### 7.3 废弃接口处理
1. 在文档中标记为 `@deprecated`
2. 响应头添加 `X-API-Deprecated: true`
3. 至少保留一个版本周期（3-6 个月）
4. 提前通知前端迁移到新接口

## 8. 性能优化建议

### 8.1 接口性能指标
- P95 响应时间 < 200ms
- P99 响应时间 < 500ms
- 错误率 < 0.1%

### 8.2 优化策略
- **分页加载**：列表接口必须支持分页
- **字段筛选**：支持 `fields` 参数只返回需要的字段
  ```
  GET /api/v1/users/123?fields=userId,username,email
  ```
- **数据聚合**：提供批量查询接口，减少请求次数
  ```
  POST /api/v1/users/batch-get
  { "ids": [1, 2, 3] }
  ```
- **缓存策略**：
  - GET 请求设置合理的 `Cache-Control`
  - 支持 `ETag` / `Last-Modified` 条件请求
  - 频繁访问的数据提供缓存机制

### 8.3 是否需要 BFF 层
**需要讨论：**
- 如果有多个客户端（Web、移动端、小程序）且需求差异大
- 需要接口聚合、数据裁剪、格式转换
- 可以考虑引入 BFF（Backend for Frontend）层

**BFF 职责：**
- 接口聚合（一次请求获取多个后端数据）
- 数据格式转换（适配前端需求）
- 缓存管理（减轻后端压力）
- 权限前置校验

## 9. 接口安全

### 9.1 输入验证
- 所有输入参数必须进行类型和格式验证
- 字符串长度限制
- 特殊字符过滤（防止 SQL 注入、XSS）

### 9.2 敏感数据保护
- 密码等敏感信息必须加密传输（HTTPS）
- 响应中不返回敏感信息（如密码哈希）
- 日志中脱敏处理

### 9.3 防护措施
- **防重放攻击**：使用 nonce + timestamp 机制
- **防 CSRF**：使用 CSRF Token 或 SameSite Cookie
- **防刷接口**：实现频率限制（Rate Limiting）
  - 登录接口：5 次/分钟
  - 发送验证码：1 次/分钟
  - 普通接口：100 次/分钟

## 10. 开发调试

### 10.1 请求追踪
- 每个请求生成唯一 `requestId`
- 前端可通过 `X-Request-ID` 请求头传递追踪 ID
- 日志中记录 `requestId` 便于问题排查

### 10.2 开发环境支持
- 提供 Swagger UI 在线文档和调试工具
- 提供 Postman Collection 导出
- 测试环境数据可重置

### 10.3 错误日志
- 5xx 错误必须记录完整堆栈信息
- 关键业务操作记录审计日志
- 慢查询日志（响应时间 > 1s）

## 附：需要讨论的问题

### 与后端对齐
1. **API 风格选择**：RESTful vs GraphQL？
   - RESTful：简单直接，生态成熟
   - GraphQL：灵活强大，但学习成本高，需要评估团队能力

2. **认证方案**：JWT vs Session？
   - JWT：无状态，适合分布式，但 Token 较大
   - Session：有状态，需要共享存储（Redis）

3. **是否需要 BFF 层**？
   - 如果业务复杂度高、多端差异大，建议引入
   - 如果业务简单，直接调用后端即可

4. **接口聚合策略**：
   - 页面级接口聚合（一个接口返回页面所需全部数据）
   - 还是细粒度接口（前端自行组合）

5. **文件上传**：
   - 直传 OSS 还是经过后端？
   - 大文件分片上传方案

6. **实时通信**：
   - 是否需要 WebSocket / SSE？
   - 消息推送机制

### 前端关注点
1. 接口响应时间是否有监控？如何保证性能 SLA？
2. 接口变更如何通知？能否提前提供 Mock 数据？
3. 错误码是否有统一管理和文档？
4. 是否支持接口降级和熔断机制？

