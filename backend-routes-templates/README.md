# Backend Routes Templates

Các file trong thư mục này là templates để tạo API routes cho backend Next.js.

## Cách sử dụng:

1. **Xác định cấu trúc backend của bạn:**

   - **App Router**: `app/api/[route]/route.ts`
   - **Pages Router**: `pages/api/[route]/index.js`

2. **Copy các file tương ứng vào backend:**

   - `awards-route.ts` → `app/api/awards/route.ts` (hoặc `pages/api/awards/index.js`)
   - `awards-[id]-route.ts` → `app/api/awards/[id]/route.ts` (hoặc `pages/api/awards/[id].js`)
   - Tương tự cho `skills`, `references`, `hobbies`

3. **Điều chỉnh:**
   - Kiểm tra path đến `database.json` trong backend của bạn
   - Kiểm tra cách xử lý authentication (có thể khác với template)
   - Điều chỉnh field names theo schema database của bạn

## Các routes cần tạo:

### Awards

- ✅ `app/api/awards/route.ts` (GET, POST)
- ✅ `app/api/awards/[id]/route.ts` (PATCH, DELETE)

### Skills

- Cần tạo tương tự awards, thay:
  - `award_name` → `skill_name`
  - Thêm field `level`
  - Bỏ `organization`, `started_at`, `end_at`

### References

- Cần tạo tương tự awards, thay:
  - `award_name` → `full_name`
  - Thêm fields: `position`, `company`, `email`, `phone`
  - Bỏ `organization`, `started_at`, `end_at`

### Hobbies

- Cần tạo tương tự awards, thay:
  - `award_name` → `hobby_name`
  - Bỏ `organization`, `started_at`, `end_at`

## Lưu ý:

1. Đảm bảo `database.json` đã có các collections: `awards`, `skills`, `references`, `hobbies`
2. Kiểm tra cách backend hiện tại xử lý `activities` và `certificates` để đảm bảo nhất quán
3. Test các endpoints sau khi tạo



