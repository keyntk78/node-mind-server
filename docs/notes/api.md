# Notes API Plan

> **Service:** Notes Service
> **Base URL:** `/api/v1`
> **Content-Type:** `application/json`
> **Current scope:** Page tree, block editor, reorder, archive/trash, search, favorite.

---

## 1. Mục Tiêu

Tài liệu này là kế hoạch tạo API cho phần ghi chú kiểu Notion gồm Page tree, Block editor và các chức năng quản lý vòng đời page. Phase 1 chỉ tập trung vào API tối thiểu để frontend có thể tạo sidebar tree, mở page detail và chỉnh sửa block.

Các nguyên tắc chính:

1. Mỗi page thuộc một workspace.
2. Page có thể nằm ở root hoặc nằm dưới một parent page.
3. Tree sidebar chỉ lấy page chưa archive và chưa nằm trong trash.
4. Page detail trả metadata page và danh sách blocks theo `orderIndex`.
5. Block content lưu dạng JSON để hỗ trợ nhiều loại block.
6. Reorder page/block là batch update để kéo thả ổn định.
7. Archive khác trash: archive ẩn khỏi tree nhưng có thể restore; trash dùng soft delete.
8. Permanent delete chỉ triển khai sau khi soft delete hoạt động ổn định.

---

## 2. API Status Overview

| Nhóm | API | Method | Path | Status | Phase |
|------|-----|--------|------|--------|-------|
| Page | Create Page | POST | `/api/v1/pages` | Planned | MVP |
| Page | Get Page Tree | GET | `/api/v1/pages/tree?workspaceId=uuid` | Planned | MVP |
| Page | Get Page Detail | GET | `/api/v1/pages/:pageId` | Planned | MVP |
| Page | Update Page Metadata | PATCH | `/api/v1/pages/:pageId` | Planned | MVP |
| Page | Move Page | PATCH | `/api/v1/pages/:pageId/move` | Planned | MVP |
| Page | Reorder Pages | PATCH | `/api/v1/pages/reorder` | Planned | Phase 1 |
| Block | Create Block | POST | `/api/v1/pages/:pageId/blocks` | Planned | MVP |
| Block | Update Block | PATCH | `/api/v1/blocks/:blockId` | Planned | MVP |
| Block | Delete Block | DELETE | `/api/v1/blocks/:blockId` | Planned | Phase 1 |
| Block | Reorder Blocks | PATCH | `/api/v1/pages/:pageId/blocks/reorder` | Planned | MVP |
| Archive | Archive Page | PATCH | `/api/v1/pages/:pageId/archive` | Planned | Phase 2 |
| Archive | Restore Page | PATCH | `/api/v1/pages/:pageId/restore` | Planned | Phase 2 |
| Trash | Soft Delete Page | DELETE | `/api/v1/pages/:pageId` | Planned | Phase 2 |
| Trash | Get Trash | GET | `/api/v1/pages/trash?workspaceId=uuid` | Planned | Phase 2 |
| Trash | Permanent Delete Page | DELETE | `/api/v1/pages/:pageId/permanent` | Planned | Phase 2 |
| Search | Search Pages | GET | `/api/v1/pages/search?workspaceId=uuid&q=nestjs` | Planned | Phase 3 |
| Favorite | Favorite Page | PATCH | `/api/v1/pages/:pageId/favorite` | Planned | Phase 3 |
| Favorite | Get Favorites | GET | `/api/v1/pages/favorites?workspaceId=uuid` | Planned | Phase 3 |

---

## 3. MVP APIs

Chỉ triển khai 8 API này trước để có editor cơ bản:

| # | API | Method | Path |
|---|-----|--------|------|
| 1 | Create Page | POST | `/api/v1/pages` |
| 2 | Get Page Tree | GET | `/api/v1/pages/tree` |
| 3 | Get Page Detail | GET | `/api/v1/pages/:pageId` |
| 4 | Update Page Metadata | PATCH | `/api/v1/pages/:pageId` |
| 5 | Move Page | PATCH | `/api/v1/pages/:pageId/move` |
| 6 | Create Block | POST | `/api/v1/pages/:pageId/blocks` |
| 7 | Update Block | PATCH | `/api/v1/blocks/:blockId` |
| 8 | Reorder Blocks | PATCH | `/api/v1/pages/:pageId/blocks/reorder` |

---

## 4. Data Model Dự Kiến

### 4.1 Pages

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `id` | uuid | Yes | Page ID |
| `workspaceId` | uuid | Yes | Workspace sở hữu page |
| `parentId` | uuid/null | No | Page cha, null nếu ở root |
| `title` | string | Yes | Tiêu đề page |
| `icon` | string/null | No | Emoji hoặc icon |
| `coverUrl` | string/null | No | Cover image |
| `orderIndex` | number | Yes | Thứ tự trong cùng parent |
| `createdBy` | uuid | Yes | User tạo page |
| `lastEditedBy` | uuid | Yes | User sửa cuối |
| `isArchived` | boolean | Yes | Đã archive |
| `isDeleted` | boolean | Yes | Đang nằm trong trash |
| `deletedAt` | datetime/null | No | Thời điểm soft delete |
| `createdAt` | datetime | Yes | Thời điểm tạo |
| `updatedAt` | datetime | Yes | Thời điểm cập nhật |

### 4.2 Blocks

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `id` | uuid | Yes | Block ID |
| `pageId` | uuid | Yes | Page chứa block |
| `type` | string | Yes | Loại block |
| `content` | json | Yes | Nội dung linh hoạt theo block type |
| `orderIndex` | number | Yes | Thứ tự trong page |
| `createdAt` | datetime | Yes | Thời điểm tạo |
| `updatedAt` | datetime | Yes | Thời điểm cập nhật |

Supported block types Phase 1:

```text
paragraph
heading_1
heading_2
heading_3
bullet_list
numbered_list
todo
quote
code
image
divider
```

---

## 5. Page API Contracts

### 5.1 Create Page

```http
POST /api/v1/pages
```

Auth: Bearer access token

Request:

```json
{
  "workspaceId": "workspace-uuid",
  "parentId": null,
  "title": "Backend"
}
```

Response:

```json
{
  "message": "Page created successfully",
  "data": {
    "id": "page-uuid",
    "workspaceId": "workspace-uuid",
    "parentId": null,
    "title": "Backend",
    "icon": null,
    "coverUrl": null,
    "orderIndex": 0,
    "isArchived": false,
    "isDeleted": false,
    "createdAt": "2026-06-02T10:30:00.000Z",
    "updatedAt": "2026-06-02T10:30:00.000Z"
  }
}
```

Rules:

1. Validate user là member của workspace.
2. Nếu `parentId` khác null, parent phải thuộc cùng workspace.
3. `orderIndex` mặc định là vị trí cuối cùng trong cùng `parentId`.
4. Page mới mặc định `isArchived=false`, `isDeleted=false`.

### 5.2 Get Page Tree

```http
GET /api/v1/pages/tree?workspaceId=workspace-uuid
```

Auth: Bearer access token

Response:

```json
{
  "message": "Page tree fetched successfully",
  "data": [
    {
      "id": "page-uuid-1",
      "workspaceId": "workspace-uuid",
      "parentId": null,
      "title": "Backend",
      "icon": "🧠",
      "orderIndex": 0,
      "children": [
        {
          "id": "page-uuid-2",
          "workspaceId": "workspace-uuid",
          "parentId": "page-uuid-1",
          "title": "NestJS",
          "icon": null,
          "orderIndex": 0,
          "children": []
        }
      ]
    }
  ]
}
```

Rules:

1. Chỉ lấy page có `isArchived=false` và `isDeleted=false`.
2. Sort theo `parentId`, sau đó `orderIndex ASC`, `createdAt ASC`.
3. Build tree ở application layer hoặc query layer.

### 5.3 Get Page Detail

```http
GET /api/v1/pages/:pageId
```

Auth: Bearer access token

Response:

```json
{
  "message": "Page fetched successfully",
  "data": {
    "id": "page-uuid",
    "workspaceId": "workspace-uuid",
    "parentId": null,
    "title": "NestJS Notes",
    "icon": "🧠",
    "coverUrl": "https://example.com/cover.png",
    "orderIndex": 0,
    "isArchived": false,
    "isDeleted": false,
    "blocks": [
      {
        "id": "block-uuid",
        "pageId": "page-uuid",
        "type": "paragraph",
        "content": {
          "text": "Hello Node Mind"
        },
        "orderIndex": 0
      }
    ]
  }
}
```

Rules:

1. Page phải tồn tại và user có quyền truy cập workspace.
2. Blocks sort theo `orderIndex ASC`, `createdAt ASC`.
3. Không trả page đã `isDeleted=true` trong API detail thông thường.

### 5.4 Update Page Metadata

```http
PATCH /api/v1/pages/:pageId
```

Auth: Bearer access token

Request:

```json
{
  "title": "NestJS Notes",
  "icon": "🧠",
  "coverUrl": "https://example.com/cover.png"
}
```

Rules:

1. Cho phép update một phần: `title`, `icon`, `coverUrl`.
2. `title` không được rỗng nếu được gửi lên.
3. Update `lastEditedBy` và `updatedAt`.

### 5.5 Move Page

```http
PATCH /api/v1/pages/:pageId/move
```

Auth: Bearer access token

Request:

```json
{
  "parentId": "parent-page-uuid",
  "orderIndex": 2
}
```

Rules:

1. `parentId` có thể là null để move ra root.
2. Không cho move page vào chính nó.
3. Không cho move page vào descendant của chính nó.
4. Parent mới phải cùng workspace.
5. Nên normalize lại `orderIndex` của siblings sau khi move.

### 5.6 Reorder Pages

```http
PATCH /api/v1/pages/reorder
```

Auth: Bearer access token

Request:

```json
{
  "items": [
    {
      "id": "page-id-1",
      "parentId": null,
      "orderIndex": 0
    },
    {
      "id": "page-id-2",
      "parentId": "page-id-1",
      "orderIndex": 1
    }
  ]
}
```

Rules:

1. Tất cả pages trong `items` phải cùng workspace.
2. Không cho tạo cycle trong page tree.
3. Chạy trong transaction.
4. Dùng cho drag/drop sidebar, có thể để sau MVP nếu đã có `move`.

---

## 6. Block API Contracts

### 6.1 Create Block

```http
POST /api/v1/pages/:pageId/blocks
```

Auth: Bearer access token

Request:

```json
{
  "type": "paragraph",
  "content": {
    "text": "Hello Node Mind"
  },
  "orderIndex": 0
}
```

Response:

```json
{
  "message": "Block created successfully",
  "data": {
    "id": "block-uuid",
    "pageId": "page-uuid",
    "type": "paragraph",
    "content": {
      "text": "Hello Node Mind"
    },
    "orderIndex": 0,
    "createdAt": "2026-06-02T10:30:00.000Z",
    "updatedAt": "2026-06-02T10:30:00.000Z"
  }
}
```

Rules:

1. Page phải tồn tại và chưa bị soft delete.
2. User phải có quyền trong workspace của page.
3. Validate `type` thuộc danh sách supported block types.
4. `content` phải là object JSON.

### 6.2 Update Block

```http
PATCH /api/v1/blocks/:blockId
```

Auth: Bearer access token

Request:

```json
{
  "type": "heading_1",
  "content": {
    "text": "Backend"
  }
}
```

Rules:

1. Cho phép update `type` và `content`.
2. Block phải thuộc page mà user có quyền truy cập.
3. Update `updatedAt` của block và page cha.

### 6.3 Delete Block

```http
DELETE /api/v1/blocks/:blockId
```

Auth: Bearer access token

Rules:

1. Phase 1 có thể hard delete block vì block chưa có trash riêng.
2. Block phải thuộc page mà user có quyền truy cập.
3. Sau delete nên normalize lại `orderIndex`.

### 6.4 Reorder Blocks

```http
PATCH /api/v1/pages/:pageId/blocks/reorder
```

Auth: Bearer access token

Request:

```json
{
  "items": [
    {
      "id": "block-id-1",
      "orderIndex": 0
    },
    {
      "id": "block-id-2",
      "orderIndex": 1
    }
  ]
}
```

Rules:

1. Tất cả blocks trong `items` phải thuộc `pageId`.
2. Chạy trong transaction.
3. Update `updatedAt` của page cha.

---

## 7. Archive / Trash API Contracts

### 7.1 Archive Page

```http
PATCH /api/v1/pages/:pageId/archive
```

Rules:

1. Set `isArchived=true`.
2. Không set `isDeleted`.
3. Page archive không xuất hiện trong tree thường.
4. Có thể archive cả subtree bằng cách filter theo ancestor khi build tree, hoặc cascade archive ở database/application layer.

### 7.2 Restore Page

```http
PATCH /api/v1/pages/:pageId/restore
```

Rules:

1. Set `isArchived=false`, `isDeleted=false`, `deletedAt=null`.
2. Nếu parent đang deleted hoặc archived, restore về root hoặc yêu cầu restore parent trước.

### 7.3 Soft Delete Page

```http
DELETE /api/v1/pages/:pageId
```

Rules:

1. Set `isDeleted=true`.
2. Set `deletedAt=now()`.
3. Page trong trash không xuất hiện trong tree/search/favorites thường.

### 7.4 Get Trash

```http
GET /api/v1/pages/trash?workspaceId=workspace-uuid
```

Rules:

1. Lấy page có `isDeleted=true`.
2. Sort theo `deletedAt DESC`.
3. Có thể trả flat list trước, tree trash để Phase sau.

### 7.5 Permanent Delete Page

```http
DELETE /api/v1/pages/:pageId/permanent
```

Rules:

1. Chỉ cho permanent delete page đang `isDeleted=true`.
2. Xóa blocks trước hoặc dùng cascade.
3. Cần cân nhắc page versions, attachments trước khi triển khai production.

---

## 8. Search API

```http
GET /api/v1/pages/search?workspaceId=workspace-uuid&q=nestjs
```

Auth: Bearer access token

Phase 1 search đơn giản theo:

```text
page.title
block.content.text
```

Rules:

1. Chỉ search page chưa archive và chưa deleted.
2. Query `q` trim, min length nên là 2 ký tự.
3. Với PostgreSQL JSONB, có thể search `blocks.content->>'text'`.
4. Full-text search để Phase sau.

---

## 9. Favorite API

### 9.1 Favorite Page

```http
PATCH /api/v1/pages/:pageId/favorite
```

Request:

```json
{
  "isFavorite": true
}
```

Rules:

1. Favorite nên là theo user, không nên là field global trên page.
2. Khuyến nghị tạo bảng `page_favorites(user_id, page_id, created_at)`.
3. `isFavorite=true` thì upsert, `false` thì delete.

### 9.2 Get Favorites

```http
GET /api/v1/pages/favorites?workspaceId=workspace-uuid
```

Rules:

1. Trả danh sách page favorite của current user trong workspace.
2. Không trả page đang deleted.

---

## 10. Implementation Roadmap

### Phase 0: Database

Status: Planned

1. Thêm Prisma model `Page`.
2. Thêm Prisma model `Block`.
3. Thêm migration và indexes cho `workspaceId`, `parentId`, `pageId`, `isArchived`, `isDeleted`.
4. Chạy `prisma generate`.

### Phase 1: MVP Page + Block Editor

Status: Planned

1. `POST /api/v1/pages`
2. `GET /api/v1/pages/tree`
3. `GET /api/v1/pages/:pageId`
4. `PATCH /api/v1/pages/:pageId`
5. `PATCH /api/v1/pages/:pageId/move`
6. `POST /api/v1/pages/:pageId/blocks`
7. `PATCH /api/v1/blocks/:blockId`
8. `PATCH /api/v1/pages/:pageId/blocks/reorder`

Suggested code structure:

```text
src/api/controllers/pages.controller.ts
src/api/controllers/blocks.controller.ts
src/api/dto/notes/request/create-page-request.dto.ts
src/api/dto/notes/request/update-page-request.dto.ts
src/api/dto/notes/request/move-page-request.dto.ts
src/api/dto/notes/request/create-block-request.dto.ts
src/api/dto/notes/request/update-block-request.dto.ts
src/api/dto/notes/request/reorder-blocks-request.dto.ts
src/application/notes/command/*
src/application/notes/query/*
src/domain/entities/page.entity.ts
src/domain/entities/block.entity.ts
src/domain/interfaces/page-repository.interface.ts
src/domain/interfaces/block-repository.interface.ts
src/infrastructure/database/repositories/prisma-page.repository.ts
src/infrastructure/database/repositories/prisma-block.repository.ts
src/infrastructure/database/mappers/page-prisma.mapper.ts
src/infrastructure/database/mappers/block-prisma.mapper.ts
```

### Phase 2: Archive + Trash

Status: Planned

1. `PATCH /api/v1/pages/:pageId/archive`
2. `PATCH /api/v1/pages/:pageId/restore`
3. `DELETE /api/v1/pages/:pageId`
4. `GET /api/v1/pages/trash`
5. `DELETE /api/v1/pages/:pageId/permanent`

### Phase 3: Search + Favorite

Status: Planned

1. `GET /api/v1/pages/search`
2. `PATCH /api/v1/pages/:pageId/favorite`
3. `GET /api/v1/pages/favorites`

### Phase 4: Version + Graph

Status: Planned

1. Page versions.
2. Restore old version.
3. Backlink/page graph.
4. Attachment/file blocks.

---

## 11. Local Test Order Dự Kiến

1. Login hoặc verify email để lấy `accessToken`.
2. Tạo page root bằng `POST /api/v1/pages`.
3. Tạo child page bằng `POST /api/v1/pages` với `parentId`.
4. Gọi `GET /api/v1/pages/tree`.
5. Gọi `GET /api/v1/pages/:pageId`.
6. Tạo block paragraph bằng `POST /api/v1/pages/:pageId/blocks`.
7. Update block thành heading bằng `PATCH /api/v1/blocks/:blockId`.
8. Tạo thêm block và reorder bằng `PATCH /api/v1/pages/:pageId/blocks/reorder`.
9. Move page bằng `PATCH /api/v1/pages/:pageId/move`.
10. Sau MVP mới test archive, trash, search, favorite.

---

## 12. Related Docs

| File | Mô tả |
|------|------|
| [NOTES_DATABASE_DESIGN.md](./NOTES_DATABASE_DESIGN.md) | Thiết kế database notes hiện tại |
| [../auth/api.md](../auth/api.md) | Format plan API auth đang dùng |
| [../auth/index.md](../auth/index.md) | Format index API auth đang dùng |
