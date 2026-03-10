import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Plus, Minus, Trash2 } from "lucide-react";

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
  const [isSelected, setIsSelected] = useState(false);
  const lastYRef = useRef(0);
  
  const size = hold.size || DEFAULT_SIZE;
  const sizeInPixels = DEFAULT_SIZE + (size - 1) * SIZE_SCALE;

  const handlePointerDown = (e) => {
    if (!interactive || !onUpdate) return;
    e.preventDefault();
    setIsResizing(true);
    lastYRef.current = e.clientY || e.touches?.[0]?.clientY || 0;
  };

  const handlePointerMove = (e) => {
    if (!isResizing || !onUpdate) return;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const delta = lastYRef.current - clientY;
    const newSize = Math.max(1, Math.min(100, (hold.size || DEFAULT_SIZE) + delta));
    if (newSize !== (hold.size || DEFAULT_SIZE)) {
      onUpdate(index, { ...hold, size: newSize });
    }
    lastYRef.current = clientY;
  };

  const handlePointerUp = () => {
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

  const adjustSize = (delta) => {
    if (!interactive || !onUpdate) return;
    const newSize = Math.max(1, Math.min(100, (hold.size || DEFAULT_SIZE) + delta));
    onUpdate(index, { ...hold, size: newSize });
  };

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove);
      window.addEventListener("touchend", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("touchmove", handlePointerMove);
        window.removeEventListener("touchend", handlePointerUp);
      };
    }
  }, [isResizing, hold, index, onUpdate]);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${hold.x}%`, top: `${hold.y}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsSelected(false);
      }}
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
          if (interactive) {
            setIsSelected(!isSelected);
          } else if (onRemove) {
            onRemove(index);
          }
        }}
      >
        {holdLabels[hold.type] && (
          <span className="text-white text-[10px] font-bold leading-none">
            {holdLabels[hold.type]}
          </span>
        )}
      </button>

      {/* Resize handle and controls - visible on hover (desktop) or selection (mobile) */}
      {interactive && (isHovered || isSelected) && (
        <>
          {/* Drag handle */}
          <div
            className="absolute border-2 border-dashed border-white rounded-full opacity-50 hover:opacity-100 transition-opacity cursor-ns-resize pointer-events-auto"
            style={{
              width: `${sizeInPixels + 8}px`,
              height: `${sizeInPixels + 8}px`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            title="Drag to resize · Scroll to adjust · Use +/- buttons"
          />

          {/* Size adjustment buttons for mobile */}
          {isSelected && (
            <div className="absolute flex gap-2 pointer-events-auto -bottom-12 left-1/2 -translate-x-1/2">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  adjustSize(-5);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  adjustSize(-5);
                }}
                className="w-8 h-8 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white shadow-lg"
                title="Decrease size"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  adjustSize(5);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  adjustSize(5);
                }}
                className="w-8 h-8 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-white shadow-lg"
                title="Increase size"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (onRemove) onRemove(index);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (onRemove) onRemove(index);
                }}
                className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center text-white shadow-lg"
                title="Delete hold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}