import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, Minus, Trash2 } from "lucide-react";

const holdColors = {
  start: "bg-emerald-500/40 border-emerald-300 shadow-emerald-500/30",
  middle: "bg-sky-500/40 border-sky-300 shadow-sky-500/30",
  finish: "bg-rose-500/40 border-rose-300 shadow-rose-500/30",
};

const holdLabels = {
  start: "S",
  middle: "",
  finish: "F",
};

const holdTypeColors = {
  start: "bg-emerald-600 hover:bg-emerald-500",
  middle: "bg-sky-600 hover:bg-sky-500",
  finish: "bg-rose-600 hover:bg-rose-500",
};

const DEFAULT_SIZE = 28;
const SIZE_SCALE = 0.5;

export default function HoldMarker({ hold, index, onRemove, onUpdate, interactive = false, containerWidth, containerHeight, isSelected: externalIsSelected, onSelectionChange }) {
  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [popupPosition, setPopupPosition] = useState("above");
  const markerRef = useRef(null);
  const lastYRef = useRef(0);
  const initialDragPos = useRef({ x: 0, y: 0 });

  // Handle external selection changes
  useEffect(() => {
    if (externalIsSelected !== undefined) {
      setIsSelected(externalIsSelected);
    }
  }, [externalIsSelected]);

  const size = hold.size || DEFAULT_SIZE;
  const sizeInPixels = DEFAULT_SIZE + (size - 1) * SIZE_SCALE;

  const handlePointerDown = (e) => {
    if (!interactive || !onUpdate) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    initialDragPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e) => {
    if (!interactive || !onUpdate) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
      setIsDragging(true);
      initialDragPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleDragMove = (e) => {
    if (!isDragging || !onUpdate || !containerWidth || !containerHeight) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

    const dx = clientX - initialDragPos.current.x;
    const dy = clientY - initialDragPos.current.y;

    const percentDx = (dx / containerWidth) * 100;
    const percentDy = (dy / containerHeight) * 100;

    onUpdate(index, { ...hold, x: hold.x + percentDx, y: hold.y + percentDy });
    initialDragPos.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    setIsResizing(false);
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !onUpdate) return;
    e.preventDefault();
    if (e.touches && e.touches.length > 0) {
      handleDragMove(e);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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
    const newSize = Math.max(10, Math.min(80, (hold.size || DEFAULT_SIZE) + delta));
    onUpdate(index, { ...hold, size: newSize });
  };

  const handleSelectHold = (e) => {
    e.stopPropagation();
    if (!interactive) {
      if (onRemove) onRemove(index);
      return;
    }
    setIsSelected(true);
    if (onSelectionChange) {
      onSelectionChange(index);
    }
  };

  const handleTypeChange = (newType) => {
    if (!interactive || !onUpdate) return;
    onUpdate(index, { ...hold, type: newType });
  };

  React.useEffect(() => {
    const handlePointerMoveWrapper = (e) => {
      if (isDragging) handleDragMove(e);
    };

    const handlePointerUpWrapper = () => {
      if (isResizing) setIsResizing(false);
      if (isDragging) setIsDragging(false);
    };

    const handleTouchMoveWrapper = (e) => {
      if (isDragging) handleDragMove(e);
    };

    const handleTouchEndWrapper = () => {
      if (isResizing) setIsResizing(false);
      if (isDragging) setIsDragging(false);
    };

    if (isResizing || isDragging) {
      window.addEventListener("pointermove", handlePointerMoveWrapper);
      window.addEventListener("pointerup", handlePointerUpWrapper);
      window.addEventListener("touchmove", handleTouchMoveWrapper, { passive: false });
      window.addEventListener("touchend", handleTouchEndWrapper);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMoveWrapper);
      window.removeEventListener("pointerup", handlePointerUpWrapper);
      window.removeEventListener("touchmove", handleTouchMoveWrapper);
      window.removeEventListener("touchend", handleTouchEndWrapper);
    };
  }, [isResizing, isDragging, hold, index, onUpdate]);

  return (
    <div
      ref={markerRef}
      data-hold-marker
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${hold.x}%`, top: `${hold.y}%` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
    >
      {/* Hold circle */}
      <button
        className={cn(
          "relative rounded-full border-2 shadow-lg flex items-center justify-center transition-all duration-150 touch-none",
          holdColors[hold.type],
          interactive && "cursor-pointer hover:scale-110",
          isSelected && "ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
        )}
        style={{ width: `${sizeInPixels}px`, height: `${sizeInPixels}px` }}
        onClick={handleSelectHold}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
      >
        {holdLabels[hold.type] && (
          <span className="text-white text-[10px] font-bold leading-none">
            {holdLabels[hold.type]}
          </span>
        )}
      </button>

      {/* Selection ring */}
      {interactive && isSelected && (
        <div
          className="absolute border-2 border-dashed border-white rounded-full pointer-events-none"
          style={{
            width: `${sizeInPixels + 8}px`,
            height: `${sizeInPixels + 8}px`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* Popup UI */}
      {interactive && isSelected && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-4 z-50 pointer-events-auto"
          style={{
            bottom: "100%",
            marginBottom: "12px",
            minWidth: "280px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Resize controls */}
          <div className="mb-4">
            <p className="text-xs text-zinc-400 mb-2 font-medium">Size</p>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  adjustSize(-5);
                }}
                className="w-10 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg flex items-center justify-center text-white transition-colors"
                title="Decrease size"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm text-white font-medium">{hold.size || DEFAULT_SIZE}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  adjustSize(5);
                }}
                className="w-10 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg flex items-center justify-center text-white transition-colors"
                title="Increase size"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Type selector */}
          <div className="mb-4">
            <p className="text-xs text-zinc-400 mb-2 font-medium">Type</p>
            <div className="flex gap-2">
              {["start", "middle", "finish"].map((type) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTypeChange(type);
                  }}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors",
                    hold.type === type
                      ? cn(holdTypeColors[type], "text-white")
                      : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                  )}
                >
                  {type === "start" ? "Start" : type === "middle" ? "Middle" : "Finish"}
                </button>
              ))}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onRemove) onRemove(index);
            }}
            className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}