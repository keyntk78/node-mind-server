# Auth API Index

> Danh sách API auth đã triển khai và API auth đang được lên kế hoạch.

---

## Base Information

| Key | Value |
|-----|-------|
| Base URL | `/api/v1/auth` |
| Auth hiện tại | Public cho 6 API onboarding/login/refresh/logout |
| Content-Type | `application/json` |
| OTP TTL | 300 giây |
| Local Mail UI | `http://localhost:8025` |

---

## Implemented APIs

| # | API | Method | Path | Auth | Status | Spec |
|---|-----|--------|------|------|--------|------|
| 1 | Register | POST | `/api/v1/auth/register` | Public | Implemented | [01-register-api.md](./01-register-api.md) |
| 2 | Verify Email | POST | `/api/v1/auth/verify-email` | Public | Implemented | [02-verify-email-api.md](./02-verify-email-api.md) |
| 3 | Resend Verification OTP | POST | `/api/v1/auth/resend-verification-otp` | Public | Implemented | [03-resend-verification-otp-api.md](./03-resend-verification-otp-api.md) |
| 4 | Login | POST | `/api/v1/auth/login` | Public | Implemented | [04-login-api.md](./04-login-api.md) |
| 5 | Refresh Token | POST | `/api/v1/auth/refresh` | Public refresh token | Implemented | [05-refresh-token-api.md](./05-refresh-token-api.md) |
| 6 | Logout | POST | `/api/v1/auth/logout` | Public refresh token | Implemented | [06-logout-api.md](./06-logout-api.md) |

---

## Quick Flow

```mermaid
sequenceDiagram
    actor C as Client
    participant API as Auth API
    participant R as Redis
    participant M as Mail Queue

    C->>API: POST /register
    API->>R: SET auth:otp:{email} EX 300
    API->>M: SEND_OTP_EMAIL
    API-->>C: 201 userId, email, isVerified=false

    C->>API: POST /verify-email
    API->>R: GET auth:otp:{email}
    API-->>C: 200 tokens, user, workspace

    C->>API: POST /resend-verification-otp
    API->>R: SET auth:otp:{email} EX 300
    API->>M: SEND_OTP_EMAIL
    API-->>C: 200 email, expiresIn=300

    C->>API: POST /login
    API-->>C: 200 tokens, user, workspace, roles

    C->>API: POST /refresh
    API-->>C: 200 rotated tokens

    C->>API: POST /logout
    API-->>C: 200 loggedOut=true
```

---

## Local Test Order

1. Start local services:

```bash
docker compose up -d redis redisinsight mailpit
```

2. Start API server:

```bash
pnpm start:dev
```

3. Call `POST /api/v1/auth/register`.
4. Read OTP from Mailpit or Redis.
5. Call `POST /api/v1/auth/verify-email`.
6. If OTP expired, call `POST /api/v1/auth/resend-verification-otp`.
7. Call `POST /api/v1/auth/login`.
8. Call `POST /api/v1/auth/refresh` with the latest `refreshToken`.
9. Call `POST /api/v1/auth/logout` with the latest `refreshToken`.

---

## Related Docs

| File | Mô tả |
|------|------|
| [api.md](./api.md) | Kế hoạch tổng thể và roadmap auth API |
| [postman.md](./postman.md) | Hướng dẫn test 3 API bằng Postman |
| [node-mind-auth.postman_collection.json](./node-mind-auth.postman_collection.json) | Collection import trực tiếp vào Postman |
| [database.md](./database.md) | Database, Redis key, auth flow nền |
| [05-refresh-token-api.md](./05-refresh-token-api.md) | Plan chi tiết refresh token API |
| [06-logout-api.md](./06-logout-api.md) | Plan chi tiết logout API |
