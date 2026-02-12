import { NextResponse } from "next/server";
import { listStudents } from "@/lib/students";

export const runtime = "nodejs";

export async function GET() {
  try {
    const students = await listStudents();
    return NextResponse.json({ students });
  } catch (error) {
    console.error("Failed to load students:", error);
    return NextResponse.json(
      { error: "Failed to load students." },
      { status: 500 }
    );
  }
}
