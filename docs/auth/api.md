# Auth API Plan

> **Service:** Auth Service
> **Base URL:** `/api/v1/auth`
> **Content-Type:** `application/json`
> **Current scope:** Register, verify email, resend verification OTP, login, refresh token.

---

## 1. Mục Tiêu

Tài liệu này là kế hoạch triển khai Auth API theo từng giai đoạn. Các API đã triển khai được tách riêng ở [index.md](./index.md). Mỗi API chi tiết có file spec riêng để tránh `api.md` bị quá dài và khó cập nhật.

Các nguyên tắc chính:

1. Public auth flow không yêu cầu token cho đến khi email được verify.
2. User mới không nhận token ở bước register.
3. OTP lưu Redis với TTL 300 giây và không trả OTP trong response.
4. Verify email thành công mới tạo workspace mặc định và cấp token.
5. Các response dùng format chuẩn của `ResponseService`.
6. Các API chưa implement phải ghi rõ trạng thái `Planned`, không mô tả như đã sẵn sàng production.

---

## 2. API Status Overview

| Nhóm | API | Method | Path | Status | Spec |
|------|-----|--------|------|--------|------|
| Onboarding | Register | POST | `/api/v1/auth/register` | Implemented | [01-register-api.md](./01-register-api.md) |
| Onboarding | Verify Email | POST | `/api/v1/auth/verify-email` | Implemented | [02-verify-email-api.md](./02-verify-email-api.md) |
| Onboarding | Resend Verification OTP | POST | `/api/v1/auth/resend-verification-otp` | Implemented | [03-resend-verification-otp-api.md](./03-resend-verification-otp-api.md) |
| Authentication | Login | POST | `/api/v1/auth/login` | Implemented | [04-login-api.md](./04-login-api.md) |
| Authentication | Refresh Token | POST | `/api/v1/auth/refresh` | Implemented | [05-refresh-token-api.md](./05-refresh-token-api.md) |
| Authentication | Logout | POST | `/api/v1/auth/logout` | Planned | TBD |
| Authentication | Logout All | POST | `/api/v1/auth/logout-all` | Planned | TBD |
| Workspace Context | Select Workspace | POST | `/api/v1/auth/select-workspace` | Planned | TBD |
| Password | Forgot Password | POST | `/api/v1/auth/forgot-password` | Planned | TBD |
| Password | Reset Password | POST | `/api/v1/auth/reset-password` | Planned | TBD |
| Password | Change Password | PUT | `/api/v1/auth/change-password` | Planned | TBD |
| MFA | Setup MFA | POST | `/api/v1/auth/mfa/setup` | Planned | TBD |
| MFA | Verify MFA Setup | POST | `/api/v1/auth/mfa/verify-setup` | Planned | TBD |
| MFA | Verify MFA Login | POST | `/api/v1/auth/mfa/verify` | Planned | TBD |
| MFA | Disable MFA | DELETE | `/api/v1/auth/mfa/disable` | Planned | TBD |

---

## 3. Current Implemented Flow

```mermaid
flowchart TD
    A[Client register] --> B[POST /api/v1/auth/register]
    B --> C[Create user and profile]
    C --> D[Generate OTP]
    D --> E[Store Redis auth:otp:{email} EX 300]
    E --> F[Send OTP email via BullMQ]
    F --> G[Client verify email]
    G --> H[POST /api/v1/auth/verify-email]
    H --> I{OTP valid?}
    I -- No --> J[410 OTP_EXPIRED]
    I -- Yes --> K[Mark user verified]
    K --> L[Create default workspace]
    L --> M[Assign OWNER role]
    M --> N[Create access and refresh token]
    N --> O[Return tokens + user + workspace]
    G --> P[OTP expired]
    P --> Q[POST /api/v1/auth/resend-verification-otp]
    Q --> D
```

---

## 4. Implemented API Contracts

### 4.1 Register

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "Nguyen Van",
  "lastName": "A"
}
```

Success:

```json
{
  "message": "User registration initiated successfully",
  "data": {
    "userId": "user-uuid",
    "email": "user@example.com",
    "isVerified": false
  },
  "timestamp": "2026-06-02T10:30:00.000Z",
  "path": "/api/v1/auth/register",
  "method": "POST"
}
```

### 4.2 Verify Email

```http
POST /api/v1/auth/verify-email
```

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Success:

```json
{
  "message": "Email verified successfully",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "isVerified": true
    },
    "workspace": {
      "id": "workspace-uuid",
      "name": "Nguyen Van's Workspace",
      "slug": "nguyen-vans-workspace",
      "membership": "OWNER"
    }
  },
  "timestamp": "2026-06-02T10:30:00.000Z",
  "path": "/api/v1/auth/verify-email",
  "method": "POST"
}
```

### 4.3 Resend Verification OTP

```http
POST /api/v1/auth/resend-verification-otp
```

Request:

```json
{
  "email": "user@example.com"
}
```

Success:

```json
{
  "message": "Verification OTP resent",
  "data": {
    "email": "user@example.com",
    "expiresIn": 300
  },
  "timestamp": "2026-06-02T10:30:00.000Z",
  "path": "/api/v1/auth/resend-verification-otp",
  "method": "POST"
}
```

---

## 5. Roadmap Đề Xuất

### Phase 1: Onboarding

Status: Done

1. Register.
2. Verify email.
3. Resend verification OTP.
4. Postman docs cho 3 API đầu.

### Phase 2: Login & Session

Status: In Progress

1. `POST /api/v1/auth/login` - Done.
2. `POST /api/v1/auth/refresh` - Done.
3. `POST /api/v1/auth/logout`
4. `POST /api/v1/auth/logout-all`
5. Session persistence và refresh-token rotation.

### Phase 3: Workspace Context

Status: Planned

1. `POST /api/v1/auth/select-workspace`
2. Access token có `workspaceId`.
3. Load roles theo workspace.

### Phase 4: Password Recovery

Status: Planned

1. `POST /api/v1/auth/forgot-password`
2. `POST /api/v1/auth/reset-password`
3. `PUT /api/v1/auth/change-password`

### Phase 5: MFA

Status: Planned

1. MFA setup bằng TOTP.
2. Verify setup.
3. MFA login challenge.
4. Disable MFA.

---

## 6. Naming Rules

| Rule | Current Decision |
|------|------------------|
| Base auth path | `/api/v1/auth` |
| No duplicated segment | Không dùng `/api/v1/auth/auth/...` |
| Request body casing | camelCase |
| Response token field casing | camelCase |
| OTP resend path | `/resend-verification-otp` |
| User identifier before login | `email` |

---

## 7. Docs Structure

| File | Mục đích |
|------|----------|
| [index.md](./index.md) | Index API đã triển khai |
| [api.md](./api.md) | Kế hoạch tổng thể và roadmap |
| [postman.md](./postman.md) | Hướng dẫn test bằng Postman |
| [node-mind-auth.postman_collection.json](./node-mind-auth.postman_collection.json) | Postman collection import trực tiếp |
| [01-register-api.md](./01-register-api.md) | Spec chi tiết register |
| [02-verify-email-api.md](./02-verify-email-api.md) | Spec chi tiết verify email |
| [03-resend-verification-otp-api.md](./03-resend-verification-otp-api.md) | Spec chi tiết resend OTP |
| [04-login-api.md](./04-login-api.md) | Plan chi tiết login |
| [05-refresh-token-api.md](./05-refresh-token-api.md) | Plan chi tiết refresh token |
| [database.md](./database.md) | Database và Redis strategy |
