# 07 - Current User API Spec

> **API:** `GET /api/v1/auth/me`
> **Auth:** Bearer access token
> **Status:** Implemented
> **Mục tiêu:** Trả về context đăng nhập hiện tại gồm `user`, `workspace`, `roles` giống login nhưng không trả token.

---

## Tổng Quan

API này dùng cho client khôi phục auth context sau khi reload app hoặc cần đồng bộ lại thông tin user hiện tại.

Flow hiện tại:

1. Client gửi `Authorization: Bearer <accessToken>`.
2. `JwtAuthGuard` verify access token.
3. Lấy `userId` và `workspaceId` từ access token.
4. Load user hiện tại từ DB.
5. Chặn user không tồn tại, inactive, hoặc chưa verify.
6. Load workspace mà user đang thuộc về theo `workspaceId` trong token.
7. Load roles của user trong workspace đó.
8. Trả `user`, `workspace`, `roles`.

Endpoint này không tạo session mới, không rotate refresh token, không trả `accessToken` hoặc `refreshToken`.

---

## Request

```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

Không có request body.

---

## Response

Controller:

```ts
return this.responseService.success('Current user context', result);
```

### 200 OK

```json
{
  "message": "Current user context",
  "data": {
    "user": {
      "id": "018fd1e8-3c74-7f41-9fb2-78a7790d1b2a",
      "email": "user@example.com",
      "isVerified": true,
      "mfaEnabled": false
    },
    "workspace": {
      "id": "2f5c3d99-5c65-4e37-a8c4-21f80b21bb9a",
      "name": "Nguyen Van's Workspace",
      "slug": "nguyen-vans-workspace",
      "membership": "OWNER"
    },
    "roles": ["WORKSPACE_OWNER"]
  },
  "timestamp": "2026-06-03T10:30:00.000Z",
  "path": "/api/v1/auth/me",
  "method": "GET"
}
```

| Field | Type | Mô tả |
|-------|------|-------|
| `data.user.id` | string | User ID |
| `data.user.email` | string | Email đã normalize |
| `data.user.isVerified` | boolean | Trạng thái verify email |
| `data.user.mfaEnabled` | boolean | Trạng thái MFA |
| `data.workspace` | object | Workspace hiện tại theo access token |
| `data.roles` | string[] | Role codes trong workspace hiện tại |

---

## Error Cases

| HTTP | Code | Khi nào |
|------|------|---------|
| 401 | `AUTHENTICATION_ERROR` | Thiếu/sai/hết hạn Bearer access token |
| 401 | `AUTHENTICATION_ERROR` | Access token thiếu `workspaceId` |
| 403 | `ACCOUNT_NOT_READY` | User inactive hoặc chưa verify |
| 403 | `WORKSPACE_REQUIRED` | Workspace trong token không còn active hoặc user không còn là member |

---

## Curl

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOi..."
```

---

## Test Checklist

| Case | Expected |
|------|----------|
| Access token hợp lệ | 200 + `user`, `workspace`, `roles` |
| Response thành công | Không có `accessToken`, không có `refreshToken` |
| Thiếu Authorization header | 401 |
| Access token hết hạn | 401 |
| User bị inactive sau khi token được cấp | 403 |
| User bị remove khỏi workspace sau khi token được cấp | 403 |
