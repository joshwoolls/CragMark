import React, { useState, useRef } from "react";
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

const DEFAULT_SIZE = 28; // Base size in pixels
const SIZE_SCALE = 0.5; // Pixels per hold

export default function HoldMarker({ hold, index, onRemove, onUpdate, interactive = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const lastYRef = useRef(0);
  
  const size = hold.size || DEFAULT_SIZE;
  const sizeInPixels = DEFAULT_SIZE + (size - 1) * SIZE_SCALE;

  const handleMouseDown = (e) => {
    if (!interactive || !onUpdate) return;
    e.preventDefault();
    setIsResizing(true);
    lastYRef.current = e.clientY;
  };

  const handleMouseMove = (e) => {
    if (!isResizing || !onUpdate) return;
    const delta = lastYRef.current - e.clientY;
    const newSize = Math.max(1, Math.min(100, (hold.size || DEFAULT_SIZE) + delta));
    if (newSize !== (hold.size || DEFAULT_SIZE)) {
      onUpdate(index, { ...hold, size: newSize });
    }
    lastYRef.current = e.clientY;
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleWheel = (e) => {
    if (!interactive || !onUpdate || !isHovered) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    const newSize = Math.max(1, Math.min(100, (hold.size || DEFAULT_SIZE) + delta));
    if (newSize !== (hold.size || DEFAULT_SIZE)) {
      onUpdate(index, { ...hold, size: newSize });
    }
  };

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, hold, index, onUpdate]);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${hold.x}%`, top: `${hold.y}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
    >
      {/* Main hold marker */}
      <button
        className={cn(
          "relative rounded-full border-2 shadow-lg flex items-center justify-center transition-all duration-150",
          holdColors[hold.type],
          interactive && "cursor-pointer hover:scale-110"
        )}
        style={{ width: `${sizeInPixels}px`, height: `${sizeInPixels}px` }}
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

      {/* Resize handle - visible on hover when interactive */}
      {interactive && isHovered && (
        <div
          className="absolute border-2 border-dashed border-white rounded-full opacity-50 hover:opacity-100 transition-opacity cursor-ns-resize pointer-events-auto"
          style={{
            width: `${sizeInPixels + 8}px`,
            height: `${sizeInPixels + 8}px`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onMouseDown={handleMouseDown}
          title="Drag to resize · Scroll to adjust size"
        />
      )}
    </div>
  );
}