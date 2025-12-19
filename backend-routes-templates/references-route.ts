// app/api/references/route.ts (Next.js App Router)
// Copy file này vào: [backend-nextjs]/app/api/references/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// GET /api/references
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

    const references =
      db.references?.filter((r: any) => r.candidate_id === candidate.id) || [];
    return NextResponse.json(references);
  } catch (error) {
    console.error("Error fetching references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/references
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

    const newReference = {
      id: Date.now().toString(),
      candidate_id: candidate.id,
      full_name: body.full_name,
      position: body.position || "",
      company: body.company || "",
      email: body.email || "",
      phone: body.phone || "",
      description: body.description || "",
      created_at: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    };

    if (!db.references) db.references = [];
    db.references.push(newReference);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json(newReference, { status: 201 });
  } catch (error) {
    console.error("Error creating reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



