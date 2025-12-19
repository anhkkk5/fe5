// app/api/awards/[id]/route.ts (Next.js App Router)
// Copy file này vào: [backend-nextjs]/app/api/awards/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "database.json");

// PATCH /api/awards/[id]
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

// DELETE /api/awards/[id]
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



