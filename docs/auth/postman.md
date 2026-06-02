# Auth API Postman Guide

> Hướng dẫn tạo Postman collection để test 3 API auth đã triển khai.

---

## 1. Environment Variables

Có thể import trực tiếp collection:

```text
docs/auth/node-mind-auth.postman_collection.json
```

Tạo Postman environment tên `Node Mind Local`:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000/api/v1/auth` | `http://localhost:3000/api/v1/auth` |
| `email` | `user@example.com` | `user@example.com` |
| `password` | `Password123!` | `Password123!` |
| `firstName` | `Nguyen Van` | `Nguyen Van` |
| `lastName` | `A` | `A` |
| `otp` | `123456` | `123456` |
| `accessToken` | empty | empty |
| `refreshToken` | empty | empty |

Header mặc định cho các request:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

---

## 2. Request 1: Register

```http
POST {{baseUrl}}/register
```

Body:

```json
{
  "email": "{{email}}",
  "password": "{{password}}",
  "firstName": "{{firstName}}",
  "lastName": "{{lastName}}"
}
```

Expected status:

```text
201 Created
```

Expected response:

```json
{
  "message": "User registration initiated successfully",
  "data": {
    "userId": "user-uuid",
    "email": "user@example.com",
    "isVerified": false
  }
}
```

Postman Tests:

```js
pm.test("status is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("returns unverified user", function () {
  const json = pm.response.json();
  pm.expect(json.data.email).to.eql(pm.environment.get("email"));
  pm.expect(json.data.isVerified).to.eql(false);
});
```

Sau request này, lấy OTP trong Mailpit:

```text
http://localhost:8025
```

Hoặc lấy từ Redis local:

```bash
docker exec -it node-mind-redis redis-cli GET auth:otp:user@example.com
```

Gán OTP vào Postman environment variable `otp`.

---

## 3. Request 2: Verify Email

```http
POST {{baseUrl}}/verify-email
```

Body:

```json
{
  "email": "{{email}}",
  "otp": "{{otp}}"
}
```

Expected status:

```text
200 OK
```

Expected response:

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
  }
}
```

Postman Tests:

```js
pm.test("status is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("stores tokens", function () {
  const json = pm.response.json();
  pm.environment.set("accessToken", json.data.accessToken);
  pm.environment.set("refreshToken", json.data.refreshToken);
});

pm.test("user is verified", function () {
  const json = pm.response.json();
  pm.expect(json.data.user.isVerified).to.eql(true);
});
```

---

## 4. Request 3: Resend Verification OTP

```http
POST {{baseUrl}}/resend-verification-otp
```

Body:

```json
{
  "email": "{{email}}"
}
```

Expected status:

```text
200 OK
```

Expected response:

```json
{
  "message": "Verification OTP resent",
  "data": {
    "email": "user@example.com",
    "expiresIn": 300
  }
}
```

Postman Tests:

```js
pm.test("status is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("returns OTP ttl", function () {
  const json = pm.response.json();
  pm.expect(json.data.email).to.eql(pm.environment.get("email"));
  pm.expect(json.data.expiresIn).to.eql(300);
});
```

Ghi chú: nếu user đã verify hoặc email không tồn tại, API vẫn trả `200 OK` generic và không gửi email.

---

## 5. Suggested Collection Order

| Order | Request | Khi nào chạy |
|-------|---------|--------------|
| 1 | Register | Tạo user mới |
| 2 | Resend Verification OTP | Khi OTP hết hạn hoặc muốn test resend |
| 3 | Verify Email | Sau khi lấy OTP mới nhất |

Nếu đã verify email thành công, không thể verify lại cùng user. Muốn test lại từ đầu, dùng email mới.

---

## 6. Local Services Checklist

| Service | Command / URL |
|---------|---------------|
| Redis + Mailpit | `docker compose up -d redis redisinsight mailpit` |
| API server | `pnpm start:dev` |
| Mailpit UI | `http://localhost:8025` |
| Redis OTP check | `docker exec -it node-mind-redis redis-cli GET auth:otp:user@example.com` |

---

## 7. Common Errors

| Case | Expected |
|------|----------|
| Email đã tồn tại khi register | `409 EMAIL_ALREADY_EXISTS` |
| OTP sai hoặc hết hạn khi verify | `410 OTP_EXPIRED` |
| OTP không đủ 6 số | `400 VALIDATION_ERROR` |
| Email sai format | `400 VALIDATION_ERROR` |
