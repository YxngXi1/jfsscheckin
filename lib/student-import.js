import * as XLSX from "xlsx";

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function readField(row, aliases) {
  const normalizedAliases = aliases.map(normalizeKey);

  for (const [key, value] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeKey(key))) {
      return String(value ?? "").trim();
    }
  }

  return "";
}

export function parseStudentsFromWorkbookBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row) => {
      const firstName = readField(row, ["first name", "firstname", "first", "given name"]);
      const lastName = readField(row, ["last name", "lastname", "last", "surname", "family name"]);
      const directName = readField(row, ["name", "full name", "fullname"]);
      const studentNumber = readField(row, [
        "student number",
        "studentnumber",
        "student no",
        "student #",
        "student id",
        "id",
      ]);
      const grade = readField(row, ["grade", "grade level", "gradelevel", "year"]);

      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || directName;

      if (!fullName || !studentNumber) {
        return null;
      }

      return {
        firstName,
        lastName,
        fullName,
        studentNumber,
        grade,
        checkIn: false,
      };
    })
    .filter(Boolean);
}