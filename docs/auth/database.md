

---

## Mục lục

- [1. PostgreSQL Schema — Cấu trúc Bảng Dữ liệu](#1-postgresql-schema--cấu-trúc-bảng-dữ-liệu)
    - [A. Authentication & User Profile](#a-authentication--user-profile)
    - [B. Workspace — Multi-Tenant](#b-workspace--multi-tenant)
    - [C. RBAC — Phân quyền theo Workspace](#c-rbac--phân-quyền-theo-workspace)
    - [D. Session Management](#d-session-management)
    - [ERD Diagram](#erd-diagram)
- [2. Redis Strategy — Key-Value Design](#2-redis-strategy--key-value-design)
- [3. Quy Trình Đăng Ký (Register)](#3-quy-trình-đăng-ký-register)
- [4. Quy Trình Đăng Nhập (Login)](#4-quy-trình-đăng-nhập-login)
- [5. Xác Thực OTP](#5-xác-thực-otp)
- [6. Quên Mật khẩu (Forgot Password)](#6-quên-mật-khẩu-forgot-password)
- [7. Xác Thực 2 Lớp (MFA / TOTP)](#7-xác-thực-2-lớp-mfa--totp)
- [8. Làm Mới Token (Refresh Token)](#8-làm-mới-token-refresh-token)
- [9. Đăng Xuất (Logout)](#9-đăng-xuất-logout)
- [10. Quản Lý Workspace](#10-quản-lý-workspace)
- [11. Đặc Điểm Kỹ Thuật Nổi Bật](#11-đặc-điểm-kỹ-thuật-nổi-bật)

---

## 1. PostgreSQL Schema — Cấu trúc Bảng Dữ liệu

Hệ thống sử dụng **UUID** cho tất cả Primary Key để tăng tính bảo mật và thuận tiện cho việc đồng bộ hóa dữ liệu. Mỗi nhóm bảng được tách biệt theo chức năng.

### A. Authentication & User Profile

Quản lý thông tin đăng nhập cốt lõi và thông tin cá nhân tách biệt.

#### Bảng: `users` - Core Auth

|Column|Type|Constraint|Mô tả|
|---|---|---|---|
|id|UUID|PK, DEFAULT uuid_generate_v4()|Khóa chính|
|email|VARCHAR(255)|UNIQUE NOT NULL|Email đăng nhập|
|password_hash|VARCHAR(255)|NULLABLE|Hash mật khẩu (bcrypt)|
|is_active|BOOLEAN|DEFAULT true|Kích hoạt tài khoản|
|is_verified|BOOLEAN|DEFAULT false|Đã xác thực email|
|mfa_enabled|BOOLEAN|DEFAULT false|Bật MFA|
|mfa_secret_encrypted|TEXT|NULLABLE|TOTP secret (AES-256 encrypted)|
|last_login_at|TIMESTAMPTZ|NULLABLE|Lần cuối đăng nhập|
|created_at|TIMESTAMPTZ|DEFAULT NOW()|Tạo lúc|
|updated_at|TIMESTAMPTZ|DEFAULT NOW()|Cập nhật lúc|

> **Lưu ý:** `mfa_secret_encrypted` được chuyển từ bảng riêng vào thẳng `users` để giảm JOIN. Luôn mã hóa AES-256 trước khi lưu.

#### Bảng: `social_accounts` - OAuth Providers

|Column|Type|Constraint|Mô tả|
|---|---|---|---|
|id|UUID|PK|Khóa chính|
|user_id|UUID|FK → users(id) ON DELETE CASCADE|Người dùng|
|provider|VARCHAR(50)|NOT NULL|google, facebook, github|
|provider_external_id|VARCHAR(255)|NOT NULL|ID trên provider|
|email|VARCHAR(255)|NULLABLE|Email từ provider|
|created_at|TIMESTAMPTZ|DEFAULT NOW()|Tạo lúc|

> **UNIQUE(provider, provider_external_id)** — đảm bảo 1 tài khoản social chỉ liên kết với 1 user.

#### Bảng: `profiles` - Thông tin cá nhân

|Column|Type|Constraint|Mô tả|
|---|---|---|---|
|id|UUID|PK|Khóa chính|
|user_id|UUID|UNIQUE, FK → users(id) 1-1|Liên kết với users|
|first_name|VARCHAR(100)|NULLABLE|Tên|
|last_name|VARCHAR(100)|NULLABLE|Họ|
|avatar_url|TEXT|NULLABLE|Đường dẫn ảnh đại diện|
|phone_number|VARCHAR(20)|NULLABLE|Số điện thoại|
|bio|TEXT|NULLABLE|Giới thiệu bản thân|
|updated_at|TIMESTAMPTZ|DEFAULT NOW()|Cập nhật lúc|

---

### B. Workspace — Multi-Tenant

Mỗi user có thể tạo nhiều workspace và tham gia vào workspace của người khác. Workspace là đơn vị độc lập cho dữ liệu của từng team. Mỗi lần đăng nhập, user chọn 1 workspace để làm việc.

#### Bảng: `workspaces`

| Column      | Type         | Constraint                     | Mô tả                           |
| ----------- | ------------ | ------------------------------ | ------------------------------- |
| id          | UUID         | PK, DEFAULT uuid_generate_v4() | Khóa chính                      |
| name        | VARCHAR(255) | NOT NULL                       | Tên workspace                   |
| slug        | VARCHAR(100) | UNIQUE NOT NULL                | Slug URL-friendly (vd: my-team) |
| description | TEXT         | NULLABLE                       | Mô tả                           |
| logo_url    | TEXT         | NULLABLE                       | Logo workspace                  |
| created_by  | UUID         | FK → users(id) NOT NULL        | Người tạo workspace             |
| is_active   | BOOLEAN      | DEFAULT true                   | Workspace đang hoạt động        |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()                  | Tạo lúc                         |
| updated_at  | TIMESTAMPTZ  | DEFAULT NOW()                  | Cập nhật lúc                    |

#### Bảng: `user_workspaces` (N-N)

|Column|Type|Constraint|Mô tả|
|---|---|---|---|
|user_id|UUID|FK → users(id) ON DELETE CASCADE|Người dùng|
|workspace_id|UUID|FK → workspaces(id) ON DELETE CASCADE|Workspace|
|membership|VARCHAR(20)|NOT NULL DEFAULT 'MEMBER'|OWNER, ADMIN, MEMBER|
|joined_at|TIMESTAMPTZ|DEFAULT NOW()|Thời điểm tham gia|

> **PK:** `(user_id, workspace_id)` — composite primary key.
>
> **`membership`** phân biệt quyền trong workspace:
>
> - `OWNER` — Người tạo workspace, toàn quyền. Mỗi workspace chỉ có 1 OWNER.
> - `ADMIN` — Quản trị viên workspace, có thể mời/kick member.
> - `MEMBER` — Thành viên thông thường.
>
> **Ràng buộc:** Khi `membership = 'OWNER'`, không thể tự hạ cấp hoặc rời workspace trừ khi chuyển quyền OWNER cho người khác trước.

---

### C. RBAC — Phân quyền theo Workspace

> **Lưu ý thiết kế:** RBAC được **đơn giản hóa** — chỉ giữ lại `roles` và `user_roles`. Bảng `permissions` và `role_permissions` được loại bỏ vì permission granularity đủ dùng thông qua `membership` trong `user_workspaces`. Có thể bổ sung lại RBAC đầy đủ khi scale lên B2B.

#### Bảng: `roles`

| Column       | Type         | Constraint                     | Mô tả                                           |
| ------------ | ------------ | ------------------------------ | ----------------------------------------------- |
| id           | UUID         | PK, DEFAULT uuid_generate_v4() | Khóa chính                                      |
| workspace_id | UUID         | FK → workspaces(id) NULLABLE   | NULL = global role; NOT NULL = workspace-scoped |
| code         | VARCHAR(50)  | NOT NULL                       | ADMIN, EDITOR, VIEWER...                        |
| name         | VARCHAR(100) | NOT NULL                       | Tên hiển thị                                    |
| description  | TEXT         | NULLABLE                       | Mô tả vai trò                                   |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()                  | Tạo lúc                                         |

> **UNIQUE(workspace_id, code)**

**Global Roles mặc định (seeded):**

|Code|Mô tả|
|---|---|
|`SUPER_ADMIN`|Quản trị toàn hệ thống|
|`WORKSPACE_OWNER`|Chủ sở hữu workspace (tự động gán khi tạo)|
|`WORKSPACE_ADMIN`|Quản trị viên workspace|
|`WORKSPACE_MEMBER`|Thành viên workspace (mặc định khi tham gia)|

#### Bảng: `user_roles` (N-N, workspace-scoped)

|Column|Type|Constraint|
|---|---|---|
|user_id|UUID|FK → users(id) ON DELETE CASCADE|
|role_id|UUID|FK → roles(id) ON DELETE CASCADE|
|workspace_id|UUID|FK → workspaces(id) ON DELETE CASCADE|

> **PK:** `(user_id, role_id, workspace_id)`

---

### D. Session Management

#### Bảng: `user_sessions`

|Column|Type|Mô tả|
|---|---|---|
|id|UUID|PK|
|user_id|UUID|FK → users(id) ON DELETE CASCADE|
|refresh_token_hash|TEXT|Hash của refresh token|
|device_info|TEXT|OS, Browser, User-Agent|
|ip_address|VARCHAR(45)|IPv4 hoặc IPv6|
|expires_at|TIMESTAMPTZ|Thời điểm hết hạn|
|created_at|TIMESTAMPTZ|Tạo lúc|

> **Thay đổi so với thiết kế cũ:** `workspace_id` được **loại bỏ khỏi `user_sessions`** để tránh session conflict khi user mở nhiều tab với workspace khác nhau. `workspace_id` chỉ tồn tại trong **JWT payload**, không persist trong DB.
>
> Khi user switch workspace, chỉ cần cấp lại Access Token mới với `workspace_id` mới — Session không đổi.

#### Indexes tối ưu hóa

```sql
-- Auth
CREATE INDEX idx_users_email ON users(email) WHERE is_active = true;
CREATE INDEX idx_social_accounts_user ON social_accounts(user_id);

-- Workspace
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_user_workspaces_user ON user_workspaces(user_id);
CREATE INDEX idx_user_workspaces_workspace ON user_workspaces(workspace_id);

-- RBAC
CREATE INDEX idx_roles_workspace ON roles(workspace_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_workspace ON user_roles(workspace_id);

-- Session
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

> **ERD Diagram:** Xem sơ đồ quan hệ thực thể tại [[Sơ đồ ERD Auth Service]]

---

## 2. Redis Strategy — Key-Value Design

Redis được sử dụng cho các tác vụ yêu cầu tốc độ cao và dữ liệu tạm thời.

|Chức năng|Key Pattern|Kiểu DL|TTL|Ghi chú|
|---|---|---|---|---|
|OTP|`auth:otp:{email}`|String|5 phút|Mã 6 chữ số xác thực email|
|Rate Limit|`ratelimit:{ip}:{path}`|String (Counter)|1 phút|Chặn Brute-force|
|Refetch Lock|`auth:refetch:{userId}`|String|10 giây|Tránh Race condition khi refresh token|
|Blacklist JWT|`auth:blacklist:{jti}`|String|theo token|Chặn Access Token đã logout|
|Reset Password|`auth:reset:{tokenHash}`|String|15 phút|Token reset mật khẩu|
|MFA Temp Secret|`auth:mfa:setup:{userId}`|String|5 phút|TOTP secret tạm thời khi setup|
|Session Cache|`session:{sessionId}`|Hash|7 ngày|Cache thông tin session|
|Login Attempt|`login:fail:{email}`|String (Counter)|15 phút|Đếm số lần đăng nhập thất bại|
|User Permissions|`perm:{userId}:{workspaceId}`|Set|15 phút|Cache permissions của user trong workspace|
|Workspace Roles|`ws:roles:{workspaceId}`|Hash|30 phút|Cache danh sách role trong workspace|


---

## 3. Quy Trình Đăng Ký (Register)

|Bước|Mô tả|
|---|---|
|1|**Nhận dữ liệu**<br>Client gửi: email, password, first_name, last_name. Validate định dạng email, độ phức tạp mật khẩu (min 8 ký tự, chữ hoa, số, ký tự đặc biệt).|
|2|**Kiểm tra trùng lặp**<br>Query `SELECT` vào bảng `users WHERE email = $1`. Nếu tồn tại → trả về lỗi 409 Conflict.|
|3|**Hash mật khẩu**<br>Dùng bcrypt với saltRounds=12. **KHÔNG** bao giờ lưu mật khẩu plain text.|
|4|**Tạo bản ghi**<br>`BEGIN TRANSACTION` → INSERT users → INSERT profiles → COMMIT.|
|5|**Gửi OTP xác thực**<br>Tạo mã OTP 6 chữ số. Lưu Redis: `SET auth:otp:{email} {otp} EX 300`. Gửi email async qua Queue (BullMQ).|
|6|**Trả về kết quả**<br>Trả về 201 Created. **KHÔNG** trả về token ngay — yêu cầu xác thực email trước.|
|7|**Người dùng xác thực**<br>Người dùng nhập OTP, hệ thống xác thực (xem Section 5). Sau khi xác thực, `is_verified = true`.|
|8|**Tự động tạo Workspace mặc định**<br>Sau khi xác thực email thành công, hệ thống tự động tạo 1 workspace mặc định: tên = "{first_name}'s Workspace", user là OWNER.|

> **Rate Limit:** Giới hạn 5 lần đăng ký từ 1 IP trong 1 giờ bằng Redis.

---

## 4. Quy Trình Đăng Nhập (Login)

|Bước|Mô tả|
|---|---|
|1|**Nhận dữ liệu**<br>Client gửi: email, password, device_info. Validate basic định dạng.|
|2|**Kiểm tra Rate Limit**<br>Kiểm tra Redis key `login:fail:{email}`. Nếu >= 5 lần thất bại → lock 15 phút, trả 429 Too Many Requests.|
|3|**Tìm người dùng**<br>Query `users WHERE email = $1 AND is_active = true AND is_verified = true`.|
|4|**So sánh mật khẩu**<br>`bcrypt.compare(plainPassword, user.password_hash)`. Nếu sai → tăng counter Redis, trả 401.|
|5|**Kiểm tra MFA**<br>Nếu `user.mfa_enabled = true` → **KHÔNG** cấp token ngay, trả về `{mfa_required: true, temp_token: ...}`. Chuyển sang luồng MFA.|
|6|**Lấy danh sách workspace**<br>Query `user_workspaces JOIN workspaces` lấy danh sách workspace của user.|
|7|**Tạo Session**<br>`INSERT` vào `user_sessions` (không có `workspace_id`). JWT Access Token chứa `sub`, `jti`, `roles` (global).|
|8|**Trả về tokens + workspaces**<br>Trả kèm danh sách workspace để client hiển thị màn hình chọn workspace.|

> **Trường hợp user chưa có workspace:** Vẫn cấp token, `workspaces: []` rỗng. Client chuyển hướng sang màn hình tạo workspace đầu tiên.

---

## 4b. Chọn Workspace Sau Đăng Nhập

|Bước|Mô tả|
|---|---|
|1|**Client gửi workspace_id**<br>Sau khi user chọn workspace từ danh sách, gọi API `POST /auth/select-workspace` với `workspace_id`.|
|2|**Kiểm tra membership**<br>Xác thực user có thuộc workspace đó không (`user_workspaces`). Nếu không → 403.|
|3|**Cấp lại Access Token**<br>Tạo Access Token mới chứa `workspace_id`, `roles` (workspace-scoped). TTL = 15 phút.|
|4|**Cache permissions**<br>`SADD perm:{userId}:{workspaceId} ...` lên Redis.|
|5|**Trả về Access Token mới**<br>Client dùng token này để gọi các API trong workspace. Refresh Token không đổi.|

---

## 5. Xác Thực OTP

|Bước|Mô tả|
|---|---|
|1|**Gửi OTP**<br>Tạo mã ngẫu nhiên 6 chữ số (`crypto.randomInt`). Lưu Redis: `SET auth:otp:{email} {otp} EX 300`.|
|2|**Người dùng nhập OTP**<br>Client gửi: email + otp_code.|
|3|**Lấy OTP từ Redis**<br>`GET auth:otp:{email}`. Nếu không tồn tại (hết hạn) → trả lỗi 410 Gone.|
|4|**So sánh OTP**<br>Dùng hàm so sánh constant-time để chống timing attack.|
|5|**Xử lý kết quả**<br>Thành công: `DEL auth:otp:{email}`, cập nhật `is_verified = true`. Tạo workspace mặc định. Trả về token + workspaces.|
|6|**Chống Brute-force**<br>Giới hạn 5 lần thử sai OTP. Sau đó xóa key và yêu cầu gửi lại OTP mới.|

---

## 6. Quên Mật khẩu (Forgot Password)

|Bước|Mô tả|
|---|---|
|1|**Yêu cầu reset**<br>Client gửi email. Hệ thống **LUÔN** trả 200 OK dù email có tồn tại hay không (chống User Enumeration).|
|2|**Kiểm tra người dùng**<br>Tìm user trong DB. Nếu không tìm thấy → silent fail.|
|3|**Tạo Reset Token**<br>Tạo token 32 bytes (`crypto.randomBytes`). Hash rồi lưu Redis: `SET auth:reset:{hash} {userId} EX 900`.|
|4|**Gửi email**<br>Link reset hết hạn sau 15 phút, single-use.|
|5|**Xác thực token**<br>Hash token nhận được, `GET` từ Redis. Không tồn tại → 410 Gone.|
|6|**Cập nhật mật khẩu**<br>Hash mật khẩu mới, `UPDATE users SET password_hash`. `DEL` key Redis. **Invalidate tất cả session của user**.|
|7|**Thông báo**<br>Gửi email cảnh báo: "Mật khẩu đã được thay đổi".|

---

## 7. Xác Thực 2 Lớp (MFA / TOTP)

|Bước|Mô tả|
|---|---|
|1|**Kích hoạt MFA**<br>Tạo TOTP Secret (Base32, 20 bytes). Lưu tạm Redis: `SET auth:mfa:setup:{userId} {secret} EX 300`.|
|2|**Hiển thị QR Code**<br>Tạo otpauth URI: `otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}`.|
|3|**Xác thực thiết lập**<br>Verify TOTP với secret trong Redis → mã hóa AES-256 → `UPDATE users SET mfa_enabled = true, mfa_secret_encrypted = $1`.|
|4|**Đăng nhập với MFA**<br>Sau khi xác thực mật khẩu đúng → trả `{mfa_required: true, temp_token: short_lived_jwt}`.|
|5|**Xác thực TOTP**<br>Giải mã `mfa_secret_encrypted`, verify mã 6 chữ số (±30 giây lệch giờ).|
|6|**Cấp token**<br>Thành công → tạo Session + Access Token + Refresh Token bình thường.|
|7|**Recovery Codes**<br>Khi setup MFA, tạo 10 Recovery Code (one-time use). Lưu hash vào DB.|

---

## 8. Làm Mới Token (Refresh Token)

|Bước|Mô tả|
|---|---|
|1|**Client gửi Refresh Token**<br>Access Token hết hạn (401) → gửi Refresh Token lên `POST /api/auth/refresh`.|
|2|**Kiểm tra Refresh Lock**<br>`GET auth:refresh:{userId}`. Nếu tồn tại → 429.|
|3|**Đặt Lock**<br>`SET auth:refresh:{userId} 1 EX 10 NX`.|
|4|**Xác thực Refresh Token**<br>Tìm session trong DB, so sánh hash refresh token, kiểm tra `expires_at`.|
|5|**Token Rotation**<br>Tạo Access Token mới (15 phút, giữ nguyên `workspace_id` trong payload) và Refresh Token mới (7 ngày).|
|6|**Xóa Lock & Trả về**<br>`DEL auth:refresh:{userId}`. Trả `{access_token, refresh_token}`.|

> Refresh Token không hợp lệ → buộc logout toàn bộ session của user.

---

## 9. Đăng Xuất (Logout)

|Bước|Mô tả|
|---|---|
|1|**Client gửi yêu cầu**<br>`DELETE /api/auth/logout` với Access Token trong header.|
|2|**Blacklist Access Token**<br>`SET auth:blacklist:{jti} 1 EX (token_remaining_ttl)`.|
|3|**Xóa Session**<br>`DELETE FROM user_sessions WHERE id = {session_id}` (thiết bị hiện tại) hoặc `WHERE user_id = {user_id}` (tất cả thiết bị).|
|4|**Trả về 200 OK**<br>Client xóa access_token và refresh_token khỏi bộ nhớ/cookie.|

---

## 10. Quản Lý Workspace

### 10.1 Tạo Workspace Mới

|Bước|Mô tả|
|---|---|
|1|Client gửi: name, description, logo_url.|
|2|Tạo slug từ name (lowercase, `-`, unique). Nếu trùng → thêm suffix.|
|3|`INSERT INTO workspaces`.|
|4|`INSERT INTO user_workspaces (membership = 'OWNER')`.|
|5|Gán role `WORKSPACE_OWNER` vào `user_roles`.|
|6|Trả 201 Created + workspace info.|


### 10.2 Mời Thành Viên

|Bước|Mô tả|
|---|---|
|1|Người gửi phải là OWNER hoặc ADMIN.|
|2|Tìm user được mời qua email.|
|3|`INSERT INTO user_workspaces (membership = 'MEMBER')`.|
|4|Gán role `WORKSPACE_MEMBER`.|
|5|Gửi email / in-app notification.|

### 10.3 Rời Workspace

|Bước|Mô tả|
|---|---|
|1|OWNER phải chuyển quyền trước khi rời.|
|2|`DELETE FROM user_workspaces`.|
|3|`DELETE FROM user_roles WHERE user_id = $1 AND workspace_id = $2`.|
|4|Invalidate Access Token hiện tại của user nếu `workspace_id` trong JWT trùng với workspace đang rời.|

## 11. Đặc Điểm Kỹ Thuật Nổi Bật

- **Simplified RBAC:** Loại bỏ `permissions` và `role_permissions` — không cần thiết cho personal/team app. Permission granularity được handle bởi `user_workspaces.membership` (workspace-level). Có thể mở rộng RBAC đầy đủ khi scale lên B2B.

- **Session Decoupled từ Workspace:** `workspace_id` chỉ trong JWT payload, không lưu trong `user_sessions`. Cho phép user mở nhiều tab với workspace khác nhau mà không conflict session.

- **Multi-Tenant Workspace:** 1 user có thể tạo và tham gia nhiều workspace. JWT Access Token chứa `workspace_id` để downstream services xác định context mà không cần query thêm. Phân quyền theo 3 mức: OWNER / ADMIN / MEMBER.

- **Token Rotation với Redis Lock:** Refresh Token được rotate mỗi lần sử dụng, chống replay attack. Redis lock (`auth:refetch:{userId}`) ngăn race condition khi client gửi nhiều refresh request đồng thời.

- **Defense in Depth:** Chống timing attack (dummy hash khi email không tồn tại), chống user enumeration (forgot password luôn 200 OK), rate limiting đa tầng (IP + email), OTP single-use.
