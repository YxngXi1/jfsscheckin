import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { parseStudentsFromWorkbookBuffer } from "@/lib/student-import.js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload an .xlsx file using the file field named file." },
        { status: 400 }
      );
    }

    const students = parseStudentsFromWorkbookBuffer(
      Buffer.from(await file.arrayBuffer())
    );

    if (!students.length) {
      return NextResponse.json(
        { error: "No valid students were found in the spreadsheet." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB ?? "jfsscheckin";
    const collection = client.db(dbName).collection("students");

    await collection.createIndex({ studentNumber: 1 }, { unique: true });

    const operations = students.map((student) => ({
      updateOne: {
        filter: { studentNumber: student.studentNumber },
        update: {
          $set: {
            firstName: student.firstName,
            lastName: student.lastName,
            fullName: student.fullName,
            studentNumber: student.studentNumber,
            grade: student.grade,
          },
          $setOnInsert: {
            checkIn: false,
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations, { ordered: false });

    return NextResponse.json({
      imported: students.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("Failed to import students:", error);
    return NextResponse.json(
      { error: "Failed to import students from spreadsheet." },
      { status: 500 }
    );
  }
}