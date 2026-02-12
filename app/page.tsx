"use client";

import { useMemo, useState } from "react";
import studentsSeed from "../utils/data";

type Student = {
  name: string;
  studentNumber: string;
  checkIn: boolean;
};

export default function Home() {
  const [students, setStudents] = useState<Student[]>(studentsSeed);
  const [query, setQuery] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return students;
    }
    return students.filter((student) =>
      student.studentNumber.includes(trimmed)
    );
  }, [query, students]);

  const selectedStudent = useMemo(() => {
    if (!selectedNumber) return null;
    return students.find((student) => student.studentNumber === selectedNumber) || null;
  }, [selectedNumber, students]);

  const handleExactSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const exactMatch = students.find(
      (student) => student.studentNumber === trimmed
    );
    if (exactMatch) {
      setSelectedNumber(exactMatch.studentNumber);
    }
  };

  const handleCheckIn = () => {
    if (!selectedStudent) return;
    if (!selectedStudent.checkIn) return;
    setStudents((prev) =>
      prev.map((student) =>
        student.studentNumber === selectedStudent.studentNumber
          ? { ...student, checkIn: false }
          : student
      )
    );
    setSelectedNumber(null);
  };

  return (
    <div className="min-h-screen bg-[#07164a] text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-200">
            Student Check-In
          </p>
          <h1 className="text-4xl font-semibold text-blue-50">
            SAC SEMI CHECK IN
          </h1>
          <p className="max-w-2xl text-base text-blue-100">
            Type a student number to filter. Press Enter for an exact match.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-700/80 bg-blue-950/60 p-6 shadow-lg">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">
                Student Number
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  className="w-full rounded-xl border border-blue-700/80 bg-[#050a24] px-4 py-3 text-lg text-blue-50 outline-none transition focus:border-sky-400"
                  placeholder="Type a student number"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const value = event.currentTarget.value;
                      const trimmed = value.trim();
                      const exactMatch = students.find(
                        (student) => student.studentNumber === trimmed
                      );
                      if (exactMatch) {
                        setSelectedNumber(exactMatch.studentNumber);
                      } else if (filtered.length === 1) {
                        setSelectedNumber(filtered[0].studentNumber);
                      } else {
                        event.currentTarget.blur();
                      }
                    }
                  }}
                />
                <button
                  className="rounded-xl border border-blue-700/80 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-blue-100 transition hover:border-sky-300 hover:text-sky-200"
                  onClick={() => handleExactSearch(query)}
                  type="button"
                >
                  Open
                </button>
              </div>
              <p className="mt-2 text-xs text-blue-200/70">
                Press Enter or click Open to jump to an exact match.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-blue-100">
                <span>Matches</span>
                <span>{filtered.length} students</span>
              </div>
              <div className="grid gap-3">
                {filtered.map((student) => (
                  <button
                    key={student.studentNumber}
                    className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${
                      selectedStudent?.studentNumber === student.studentNumber
                        ? "border-sky-400 bg-sky-400/10"
                        : "border-blue-800/80 bg-blue-950/60 hover:border-blue-500"
                    }`}
                    onClick={() => setSelectedNumber(student.studentNumber)}
                    type="button"
                  >
                    <div>
                      <p className="text-lg font-semibold text-blue-50">
                        {student.name}
                      </p>
                      <p className="text-sm text-blue-200/80">
                        #{student.studentNumber}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                        student.checkIn
                          ? "bg-emerald-400/20 text-emerald-200"
                          : "bg-rose-500/20 text-rose-200"
                      }`}
                    >
                      {student.checkIn ? "Not Checked In" : "Checked In"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-blue-700/80 bg-blue-950/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
                Profile
              </h2>
              {selectedStudent ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-2xl font-semibold text-blue-50">
                      {selectedStudent.name}
                    </p>
                    <p className="text-sm text-blue-200/80">
                      Student #{selectedStudent.studentNumber}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-700/80 bg-[#050a24] p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-200/80">
                      Status
                    </p>
                    <p className="mt-2 text-lg text-blue-50">
                      {selectedStudent.checkIn
                        ? "Eligible to check in"
                        : "Already checked in"}
                    </p>
                  </div>
                  <button
                    className={`w-full rounded-xl py-3 text-sm font-semibold uppercase tracking-wider transition ${
                      selectedStudent.checkIn
                        ? "bg-sky-400 text-blue-950 hover:bg-sky-300"
                        : "cursor-not-allowed bg-blue-900/60 text-blue-200/50"
                    }`}
                    onClick={handleCheckIn}
                    disabled={!selectedStudent.checkIn}
                    type="button"
                  >
                    {selectedStudent.checkIn ? "Check In Student" : "Checked In"}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-blue-200/80">
                  Select a student from the list or search for an exact match.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-blue-700/80 bg-blue-950/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
                  All Students
                </h2>
                <span className="text-xs text-blue-200/70">
                  {students.length} total
                </span>
              </div>
              <div className="mt-4 max-h-80 overflow-y-auto pr-2">
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.studentNumber}
                      className="flex items-center justify-between rounded-xl border border-blue-700/80 bg-[#050a24] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-blue-50">
                          {student.name}
                        </p>
                        <p className="text-xs text-blue-200/80">
                          #{student.studentNumber}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                          student.checkIn
                            ? "bg-emerald-400/20 text-emerald-200"
                            : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {student.checkIn ? "Not Checked In" : "Checked In"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
