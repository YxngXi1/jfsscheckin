import { NextResponse } from "next/server";
import { checkInStudent } from "@/lib/students";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ studentNumber: string }>;
};

export async function PATCH(_request: Request, context: Params) {
  try {
    const { studentNumber } = await context.params;
    const result = await checkInStudent(studentNumber);

    if (result.status === "checked_in") {
      return NextResponse.json({ status: result.status, student: result.student });
    }

    if (result.status === "already_checked_in") {
      return NextResponse.json(
        { status: result.status, student: result.student },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { status: result.status, error: "Student not found." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Failed to check in student:", error);
    return NextResponse.json(
      { error: "Failed to check in student." },
      { status: 500 }
    );
  }
}
