"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  name: string;
  studentNumber: string;
  checkIn: boolean;
};

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    const loadStudents = async (showLoading: boolean) => {
      try {
        setIsRefreshing(true);
        if (showLoading) {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const response = await fetch("/api/students", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load students");
        }

        const data = (await response.json()) as { students: Student[] };
        setStudents(data.students);
      } catch {
        setErrorMessage("Could not load students from database.");
      } finally {
        setIsRefreshing(false);
        if (showLoading) {
          setIsLoading(false);
        }
      }
    };

    void loadStudents(true);

    const intervalId = setInterval(() => {
      void loadStudents(false);
    }, 60_000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

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
    return (
      students.find((student) => student.studentNumber === selectedNumber) ||
      null
    );
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

  const handleCheckIn = async () => {
    if (!selectedStudent || selectedStudent.checkIn || isCheckingIn) return;

    try {
      setIsCheckingIn(true);
      setErrorMessage(null);

      const response = await fetch(
        `/api/students/${selectedStudent.studentNumber}/check-in`,
        {
          method: "PATCH",
        }
      );

      const data = (await response.json()) as {
        status: "checked_in" | "already_checked_in" | "not_found";
        student?: Student;
        error?: string;
      };

      if (data.status === "not_found") {
        setErrorMessage("Student not found.");
        return;
      }

      if (data.student) {
        setStudents((prev) =>
          prev.map((student) =>
            student.studentNumber === data.student?.studentNumber
              ? data.student
              : student
          )
        );
      }

      if (data.status === "already_checked_in") {
        setErrorMessage(
          "This student was already checked in from another device."
        );
      } else {
        setSelectedNumber(null);
      }
    } catch {
      setErrorMessage("Could not complete check-in.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07164a] text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">
            {isRefreshing ? "Refreshing..." : "Up to date"}
          </p>
          <p className="text-sm uppercase tracking-[0.4em] text-blue-200">
            Student Check-In
          </p>
          <h1 className="text-4xl font-semibold text-blue-50">
            SAC SEMI CHECK IN
          </h1>
          <p className="max-w-2xl text-base text-blue-100">
            Type a student number to filter. Press Enter for an exact match.
          </p>
          {errorMessage ? (
            <p className="text-sm text-rose-300">{errorMessage}</p>
          ) : null}
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
                {isLoading ? (
                  <p className="rounded-2xl border border-blue-800/80 bg-blue-950/60 px-5 py-4 text-sm text-blue-200/80">
                    Loading students...
                  </p>
                ) : (
                  filtered.map((student) => (
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
                          !student.checkIn
                            ? "bg-emerald-400/20 text-emerald-200"
                            : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {student.checkIn ? "Checked In" : "Not Checked In"}
                      </span>
                    </button>
                  ))
                )}
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
                        ? "Already checked in"
                        : "Eligible to check in"}
                    </p>
                  </div>
                  <button
                    className={`w-full rounded-xl py-3 text-sm font-semibold uppercase tracking-wider transition ${
                      !selectedStudent.checkIn
                        ? "bg-sky-400 text-blue-950 hover:bg-sky-300"
                        : "cursor-not-allowed bg-blue-900/60 text-blue-200/50"
                    }`}
                    onClick={() => void handleCheckIn()}
                    disabled={selectedStudent.checkIn || isCheckingIn}
                    type="button"
                  >
                    {!selectedStudent.checkIn
                      ? isCheckingIn
                        ? "Checking In..."
                        : "Check In Student"
                      : "Checked In"}
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
                          !student.checkIn
                            ? "bg-emerald-400/20 text-emerald-200"
                            : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {student.checkIn ? "Checked In" : "Not Checked In"}
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
