import React from "react";
import { cn } from "@/lib/utils";

const holdColors = {
  start: "bg-emerald-500 border-emerald-300 shadow-emerald-500/50",
  middle: "bg-sky-500 border-sky-300 shadow-sky-500/50",
  finish: "bg-rose-500 border-rose-300 shadow-rose-500/50",
};

const holdLabels = {
  start: "S",
  middle: "",
  finish: "F",
};

export default function HoldMarker({ hold, index, onRemove, interactive = false }) {
  return (
    <button
      className={cn(
        "absolute rounded-full border-2 shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-150",
        holdColors[hold.type],
        interactive ? "w-7 h-7 active:scale-125" : "w-6 h-6",
        interactive && "cursor-pointer"
      )}
      style={{ left: `${hold.x}%`, top: `${hold.y}%` }}
      onClick={(e) => {
        e.stopPropagation();
        if (interactive && onRemove) onRemove(index);
      }}
    >
      {holdLabels[hold.type] && (
        <span className="text-white text-[10px] font-bold leading-none">
          {holdLabels[hold.type]}
        </span>
      )}
    </button>
  );
}