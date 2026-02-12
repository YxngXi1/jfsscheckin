import fs from "node:fs/promises";
import { MongoClient } from "mongodb";

const [, , inputFile] = process.argv;

if (!inputFile) {
  console.error("Usage: node --env-file=.env.local scripts/import-students.mjs <path-to-students.json>");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "jfsscheckin";

if (!uri) {
  console.error("Missing MONGODB_URI in environment variables.");
  process.exit(1);
}

const raw = await fs.readFile(inputFile, "utf8");
const parsed = JSON.parse(raw);

const students = Array.isArray(parsed)
  ? parsed
  : Array.isArray(parsed.students)
    ? parsed.students
    : null;

if (!students) {
  console.error("JSON must be an array or an object with a students array.");
  process.exit(1);
}

const cleaned = students
  .map((student) => ({
    name: String(student.name ?? student.StudentName ?? "").trim(),
    studentNumber: String(
      student.studentNumber ?? student.StudentNumber ?? ""
    ).trim(),
    checkIn:
      typeof student.checkIn === "boolean"
        ? student.checkIn
        : typeof student.checkin === "boolean"
          ? student.checkin
          : false,
  }))
  .filter((student) => student.name && student.studentNumber);

if (!cleaned.length) {
  console.error("No valid students found in JSON file.");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const collection = client.db(dbName).collection("students");

  await collection.createIndex({ studentNumber: 1 }, { unique: true });

  const operations = cleaned.map((student) => ({
    updateOne: {
      filter: { studentNumber: student.studentNumber },
      update: {
        $set: {
          name: student.name,
          studentNumber: student.studentNumber,
          checkIn: student.checkIn,
        },
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  console.log(`Imported ${cleaned.length} students.`);
  console.log(`Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
} finally {
  await client.close();
}
