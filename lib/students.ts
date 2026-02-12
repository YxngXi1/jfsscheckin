import type { Collection } from "mongodb";
import clientPromise from "./mongodb";

export type Student = {
  name: string;
  studentNumber: string;
  checkIn: boolean;
};

let indexEnsured = false;

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
  return collection
    .find({}, { projection: { _id: 0, name: 1, studentNumber: 1, checkIn: 1 } })
    .sort({ studentNumber: 1 })
    .toArray();
}

export async function checkInStudent(
  studentNumber: string
): Promise<{ status: "checked_in" | "already_checked_in" | "not_found"; student?: Student }> {
  const collection = await getStudentsCollection();

  const updateResult = await collection.findOneAndUpdate(
    { studentNumber, checkIn: false },
    { $set: { checkIn: true } },
    { returnDocument: "after", projection: { _id: 0, name: 1, studentNumber: 1, checkIn: 1 } }
  );

  if (updateResult) {
    return { status: "checked_in", student: updateResult };
  }

  const existing = await collection.findOne(
    { studentNumber },
    { projection: { _id: 0, name: 1, studentNumber: 1, checkIn: 1 } }
  );

  if (!existing) {
    return { status: "not_found" };
  }

  return { status: "already_checked_in", student: existing };
}
