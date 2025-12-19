// app/api/skills/route.ts (Next.js App Router)
// Copy file này vào: [backend-nextjs]/app/api/skills/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// GET /api/skills
export async function GET(request: NextRequest) {
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

    const skills =
      db.skills?.filter((s: any) => s.candidate_id === candidate.id) || [];
    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/skills
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

    const newSkill = {
      id: Date.now().toString(),
      candidate_id: candidate.id,
      skill_name: body.skill_name,
      level: body.level || "",
      description: body.description || "",
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    };

    if (!db.skills) db.skills = [];
    db.skills.push(newSkill);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



