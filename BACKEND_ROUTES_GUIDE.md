# Hướng dẫn tạo API Routes cho Backend Next.js

Bạn cần tạo các API routes sau trong backend Next.js (tương tự như routes cho `activities` và `certificates`):

## Cấu trúc thư mục (Next.js App Router)

Nếu dùng App Router, tạo các file sau:

- `app/api/awards/route.ts`
- `app/api/skills/route.ts`
- `app/api/references/route.ts`
- `app/api/hobbies/route.ts`

## Cấu trúc thư mục (Next.js Pages Router)

Nếu dùng Pages Router, tạo các file sau:

- `pages/api/awards/index.js`
- `pages/api/skills/index.js`
- `pages/api/references/index.js`
- `pages/api/hobbies/index.js`

## Template cho Awards API (App Router - route.ts)

```typescript
// app/api/awards/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// GET /api/awards - Lấy danh sách awards của user hiện tại
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    // Tìm candidate từ token (giống như cách bạn xử lý trong activities/certificates)
    const candidate = db.Candidates?.find((c: any) => c.token === token);
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Filter awards theo candidate_id
    const awards =
      db.awards?.filter((a: any) => a.candidate_id === candidate.id) || [];

    return NextResponse.json(awards);
  } catch (error) {
    console.error("Error fetching awards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/awards - Tạo award mới
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    const candidate = db.Candidates?.find((c: any) => c.token === token);
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const newAward = {
      id: Date.now().toString(),
      candidate_id: candidate.id,
      award_name: body.award_name,
      organization: body.organization,
      started_at: body.started_at || null,
      end_at: body.end_at || null,
      description: body.description || "",
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    };

    if (!db.awards) db.awards = [];
    db.awards.push(newAward);

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json(newAward, { status: 201 });
  } catch (error) {
    console.error("Error creating award:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Template cho Awards API - PATCH và DELETE

```typescript
// app/api/awards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// PATCH /api/awards/[id] - Cập nhật award
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    const candidate = db.Candidates?.find((c: any) => c.token === token);
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const awardIndex = db.awards?.findIndex(
      (a: any) => a.id === params.id && a.candidate_id === candidate.id
    );

    if (awardIndex === -1) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    db.awards[awardIndex] = {
      ...db.awards[awardIndex],
      ...body,
      updated_at: new Date().toISOString().split("T")[0],
    };

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json(db.awards[awardIndex]);
  } catch (error) {
    console.error("Error updating award:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/awards/[id] - Xóa award
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    const candidate = db.Candidates?.find((c: any) => c.token === token);
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const awardIndex = db.awards?.findIndex(
      (a: any) => a.id === params.id && a.candidate_id === candidate.id
    );

    if (awardIndex === -1) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    db.awards.splice(awardIndex, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json({ message: "Award deleted" });
  } catch (error) {
    console.error("Error deleting award:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Lặp lại tương tự cho:

- `skills` (thay `award_name` bằng `skill_name`, thêm `level`)
- `references` (thay `award_name` bằng `full_name`, thêm `position`, `company`, `email`, `phone`)
- `hobbies` (thay `award_name` bằng `hobby_name`, bỏ `organization`, `started_at`, `end_at`)

## Lưu ý:

1. Đảm bảo database.json đã có các collections: `awards`, `skills`, `references`, `hobbies`
2. Kiểm tra cách bạn xử lý authentication trong routes hiện tại (activities, certificates) và áp dụng tương tự
3. Đảm bảo path đến database.json đúng với cấu trúc dự án của bạn





