// app/api/awards/route.ts (Next.js App Router)
// Copy file này vào: [backend-nextjs]/app/api/awards/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// GET /api/awards
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

// POST /api/awards
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



