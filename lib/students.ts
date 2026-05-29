import type { Collection } from "mongodb";
import clientPromise from "./mongodb";

export type Student = {
  firstName: string;
  lastName: string;
  fullName: string;
  studentNumber: string;
  grade: string;
  checkIn: boolean;
};

type StudentRecord = Partial<Student> & {
  name?: string;
};

let indexEnsured = false;

function buildFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function normalizeStudent(student: StudentRecord): Student | null {
  const firstName = String(student.firstName ?? "").trim();
  const lastName = String(student.lastName ?? "").trim();
  const legacyName = String(student.name ?? "").trim();
  const fullName = String(student.fullName ?? legacyName ?? "").trim();
  const studentNumber = String(student.studentNumber ?? "").trim();
  const grade = String(student.grade ?? "").trim();

  const resolvedFullName =
    fullName || buildFullName(firstName, lastName) || legacyName;

  if (!studentNumber || !resolvedFullName) {
    return null;
  }

  const derivedFirstName =
    firstName || resolvedFullName.split(/\s+/)[0] || resolvedFullName;
  const derivedLastName =
    lastName || resolvedFullName.split(/\s+/).slice(1).join(" ") || resolvedFullName;

  return {
    firstName: derivedFirstName,
    lastName: derivedLastName,
    fullName: resolvedFullName,
    studentNumber,
    grade,
    checkIn: student.checkIn ?? false,
  };
}

async function getStudentsCollection(): Promise<Collection<Student>> {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB ?? "jfsscheckin";
  const collection = client.db(dbName).collection<Student>("students");

  if (!indexEnsured) {
    await collection.createIndex({ studentNumber: 1 }, { unique: true });
    indexEnsured = true;
  }

  return collection;
}

export async function listStudents(): Promise<Student[]> {
  const collection = await getStudentsCollection();
  const students = await collection
    .find(
      {},
      {
        projection: {
          _id: 0,
          firstName: 1,
          lastName: 1,
          fullName: 1,
          name: 1,
          studentNumber: 1,
          grade: 1,
          checkIn: 1,
        },
      }
    )
    .sort({ studentNumber: 1 })
    .toArray();

  return students.map((student) => normalizeStudent(student)).filter(
    (student): student is Student => student !== null
  );
}

export async function checkInStudent(
  studentNumber: string
): Promise<{ status: "checked_in" | "already_checked_in" | "not_found"; student?: Student }> {
  const collection = await getStudentsCollection();

  const updateResult = await collection.findOneAndUpdate(
    { studentNumber, checkIn: false },
    { $set: { checkIn: true } },
    {
      returnDocument: "after",
      projection: {
        _id: 0,
        firstName: 1,
        lastName: 1,
        fullName: 1,
        name: 1,
        studentNumber: 1,
        grade: 1,
        checkIn: 1,
      },
    }
  );

  if (updateResult) {
    return {
      status: "checked_in",
      student: normalizeStudent(updateResult) ?? undefined,
    };
  }

  const existing = await collection.findOne(
    { studentNumber },
    {
      projection: {
        _id: 0,
        firstName: 1,
        lastName: 1,
        fullName: 1,
        name: 1,
        studentNumber: 1,
        grade: 1,
        checkIn: 1,
      },
    }
  );

  if (!existing) {
    return { status: "not_found" };
  }

  return {
    status: "already_checked_in",
    student: normalizeStudent(existing) ?? undefined,
  };
}
