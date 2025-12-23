# Hướng dẫn Debug Lỗi 400

## Vấn đề

Lỗi 400 Bad Request khi thêm awards/skills/references/hobbies

## Nguyên nhân có thể

1. **Backend chưa có route** - Cần tạo route `/api/awards`, `/api/skills`, `/api/references`, `/api/hobbies`
2. **Validation fail** - Backend có route nhưng validation không pass
3. **Format dữ liệu sai** - Backend expect format khác

## Cách kiểm tra

### 1. Kiểm tra Console Logs

Sau khi thêm logging, bạn sẽ thấy trong console:

- Payload được gửi đi
- Response error từ backend
- Status code và error message

### 2. Kiểm tra Backend có route chưa

- Mở backend Next.js project
- Kiểm tra xem có file `app/api/awards/route.ts` (hoặc `pages/api/awards/index.js`) chưa
- Nếu chưa có, copy từ `backend-routes-templates/`

### 3. So sánh với routes hoạt động

Kiểm tra cách backend xử lý `activities` và `certificates`:

- Xem file `app/api/activities/route.ts` hoặc `pages/api/activities/index.js`
- So sánh với template đã tạo
- Đảm bảo format giống nhau

### 4. Kiểm tra Database Path

Trong backend route, kiểm tra path đến database.json:

```typescript
const dbPath = path.join(process.cwd(), "database", "database.json");
```

Có thể cần điều chỉnh theo cấu trúc project của bạn.

### 5. Kiểm tra Authentication

Đảm bảo backend xử lý token đúng cách:

```typescript
const token = request.headers.get("authorization")?.replace("Bearer ", "");
const candidate = db.Candidates?.find((c: any) => c.token === token);
```

## Giải pháp nhanh

1. **Copy routes từ templates:**

   - Copy các file từ `backend-routes-templates/` vào backend Next.js
   - Đảm bảo path đến database.json đúng
   - Restart backend server

2. **Kiểm tra database.json:**

   - Đảm bảo có collections: `awards`, `skills`, `references`, `hobbies`
   - Đảm bảo format đúng

3. **Test lại:**
   - Mở console để xem logs
   - Thử thêm award/skill/reference/hobby
   - Xem error message chi tiết

## Nếu vẫn lỗi 400

Kiểm tra trong console:

- Payload được gửi đi có đúng không?
- Backend error message là gì?
- Có field nào bị thiếu không?

Sau đó so sánh với payload của `activities` hoặc `certificates` (đang hoạt động) để tìm sự khác biệt.





