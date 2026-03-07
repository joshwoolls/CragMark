import React from "react";
import { cn } from "@/lib/utils";

const holdTypes = [
  { key: "start", label: "Start", color: "bg-emerald-500", ring: "ring-emerald-400" },
  { key: "middle", label: "Middle", color: "bg-sky-500", ring: "ring-sky-400" },
  { key: "finish", label: "Finish", color: "bg-rose-500", ring: "ring-rose-400" },
];

export default function HoldTypePicker({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {holdTypes.map((type) => (
        <button
          key={type.key}
          type="button"
          onClick={() => onChange(type.key)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
            value === type.key
              ? `${type.color} text-white shadow-lg ring-2 ${type.ring} ring-offset-2 ring-offset-zinc-950`
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          )}
        >
          <div className={cn("w-3 h-3 rounded-full", type.color)} />
          {type.label}
        </button>
      ))}
    </div>
  );
}