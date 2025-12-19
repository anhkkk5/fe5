// app/api/skills/[id]/route.ts (Next.js App Router)
// Copy file này vào: [backend-nextjs]/app/api/skills/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// PATCH /api/skills/[id]
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

    const skillIndex = db.skills?.findIndex(
      (s: any) => s.id === params.id && s.candidate_id === candidate.id
    );

    if (skillIndex === -1) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    db.skills[skillIndex] = {
      ...db.skills[skillIndex],
      ...body,
      updated_at: new Date().toISOString().split("T")[0],
    };

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return NextResponse.json(db.skills[skillIndex]);
  } catch (error) {
    console.error("Error updating skill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/[id]
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

    const skillIndex = db.skills?.findIndex(
      (s: any) => s.id === params.id && s.candidate_id === candidate.id
    );

    if (skillIndex === -1) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    db.skills.splice(skillIndex, 1);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json({ message: "Skill deleted" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



