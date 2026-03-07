import React from "react";
import { cn } from "@/lib/utils";

const boulderGrades = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12+"];
const sportGrades = ["5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a+"];

export default function GradeSelector({ value, onChange, style = "boulder" }) {
  const grades = style === "boulder" ? boulderGrades : sportGrades;

  return (
    <div className="flex flex-wrap gap-2">
      {grades.map((grade) => (
        <button
          key={grade}
          type="button"
          onClick={() => onChange(grade)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
            value === grade
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          )}
        >
          {grade}
        </button>
      ))}
    </div>
  );
}