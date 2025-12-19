// app/api/hobbies/[id]/route.ts (Next.js App Router)
// Copy file này vào: [backend-nextjs]/app/api/hobbies/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// PATCH /api/hobbies/[id]
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

    const hobbyIndex = db.hobbies?.findIndex(
      (h: any) => h.id === params.id && h.candidate_id === candidate.id
    );

    if (hobbyIndex === -1) {
      return NextResponse.json({ error: "Hobby not found" }, { status: 404 });
    }

    db.hobbies[hobbyIndex] = {
      ...db.hobbies[hobbyIndex],
      ...body,
      updated_at: new Date().toISOString().split("T")[0],
    };

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return NextResponse.json(db.hobbies[hobbyIndex]);
  } catch (error) {
    console.error("Error updating hobby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/hobbies/[id]
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

    const hobbyIndex = db.hobbies?.findIndex(
      (h: any) => h.id === params.id && h.candidate_id === candidate.id
    );

    if (hobbyIndex === -1) {
      return NextResponse.json({ error: "Hobby not found" }, { status: 404 });
    }

    db.hobbies.splice(hobbyIndex, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json({ message: "Hobby deleted" });
  } catch (error) {
    console.error("Error deleting hobby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



