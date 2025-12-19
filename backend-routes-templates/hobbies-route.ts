// app/api/hobbies/route.ts (Next.js App Router)
// Copy file này vào: [backend-nextjs]/app/api/hobbies/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// GET /api/hobbies
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

    const hobbies =
      db.hobbies?.filter((h: any) => h.candidate_id === candidate.id) || [];
    return NextResponse.json(hobbies);
  } catch (error) {
    console.error("Error fetching hobbies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/hobbies
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

    const newHobby = {
      id: Date.now().toString(),
      candidate_id: candidate.id,
      hobby_name: body.hobby_name,
      description: body.description || "",
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    };

    if (!db.hobbies) db.hobbies = [];
    db.hobbies.push(newHobby);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json(newHobby, { status: 201 });
  } catch (error) {
    console.error("Error creating hobby:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



