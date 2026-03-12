import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

export default function HoldMarker({ hold, index, onRemove, onUpdate, interactive = false, containerWidth, containerHeight }) {
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [popupPos, setPopupPos] = useState(null);
  const markerRef = useRef(null);
  const initialDragPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const size = hold.size || DEFAULT_SIZE;
  const sizeInPixels = DEFAULT_SIZE + (size - 1) * SIZE_SCALE;
  const POPUP_WIDTH = 260;
  const POPUP_HEIGHT = 230;

  // Calculate popup position when selected
  useEffect(() => {
    if (!isSelected || !markerRef.current) return;

    const updatePos = () => {
      const rect = markerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Center horizontally, clamp to viewport
      let left = rect.left + rect.width / 2 - POPUP_WIDTH / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - POPUP_WIDTH - 8));

      // Prefer above, fall back to below, then clamp
      let top;
      if (rect.top >= POPUP_HEIGHT + 12) {
        top = rect.top - POPUP_HEIGHT - 12;
      } else if (window.innerHeight - rect.bottom >= POPUP_HEIGHT + 12) {
        top = rect.bottom + 12;
      } else {
        top = Math.max(8, rect.top - POPUP_HEIGHT - 12);
      }

      setPopupPos({ top, left });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [isSelected, sizeInPixels]);

  // Deselect on outside click
  useEffect(() => {
    if (!isSelected) return;

    const handleOutside = (e) => {
      if (markerRef.current && !markerRef.current.contains(e.target)) {
        // Also allow clicks inside the portal popup
        const popup = document.getElementById(`hold-popup-${index}`);
        if (popup && popup.contains(e.target)) return;
        setIsSelected(false);
      }
    };

    document.addEventListener("pointerdown", handleOutside, true);
    return () => document.removeEventListener("pointerdown", handleOutside, true);
  }, [isSelected, index]);

  // Drag tracking
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

      const dx = clientX - initialDragPos.current.x;
      const dy = clientY - initialDragPos.current.y;

      if (Math.hypot(dx, dy) > 3) didDrag.current = true;

      if (!onUpdate || !containerWidth || !containerHeight) return;
      const percentDx = (dx / containerWidth) * 100;
      const percentDy = (dy / containerHeight) * 100;
      onUpdate(index, { ...hold, x: hold.x + percentDx, y: hold.y + percentDy });
      initialDragPos.current = { x: clientX, y: clientY };
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, hold, index, onUpdate, containerWidth, containerHeight]);

  const handlePointerDown = (e) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    didDrag.current = false;
    initialDragPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (!interactive) {
      if (onRemove) onRemove(index);
      return;
    }
    if (!didDrag.current) {
      setIsSelected(prev => !prev);
    }
  };

  const adjustSize = (delta) => {
    if (!interactive || !onUpdate) return;
    const newSize = Math.max(5, Math.min(80, (hold.size || DEFAULT_SIZE) + delta));
    onUpdate(index, { ...hold, size: newSize });
  };

  const handleTypeChange = (newType) => {
    if (!interactive || !onUpdate) return;
    onUpdate(index, { ...hold, type: newType });
  };

  return (
    <div
      ref={markerRef}
      data-hold-marker="true"
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hold.x}%`, top: `${hold.y}%`, zIndex: isSelected ? 50 : 1 }}
    >
      {/* Hold circle */}
      <button
        className={cn(
          "relative rounded-full border-2 shadow-lg flex items-center justify-center transition-all duration-150 touch-none",
          holdColors[hold.type],
          interactive && "cursor-pointer hover:scale-110",
          isSelected && "ring-2 ring-white ring-offset-1 ring-offset-zinc-950"
        )}
        style={{ width: `${sizeInPixels}px`, height: `${sizeInPixels}px` }}
        onClick={handleButtonClick}
        onPointerDown={handlePointerDown}
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

      {/* Popup rendered via portal to escape overflow:hidden */}
      {interactive && isSelected && popupPos && createPortal(
        <div
          id={`hold-popup-${index}`}
          className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-4"
          style={{
            position: "fixed",
            top: popupPos.top,
            left: popupPos.left,
            width: POPUP_WIDTH,
            zIndex: 9999,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Size controls */}
          <div className="mb-4">
            <p className="text-xs text-zinc-400 mb-2 font-medium">Size</p>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); adjustSize(-5); }}
                className="w-10 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg flex items-center justify-center text-white transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm text-white font-medium">{hold.size || DEFAULT_SIZE}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); adjustSize(5); }}
                className="w-10 h-10 bg-zinc-700 hover:bg-zinc-600 rounded-lg flex items-center justify-center text-white transition-colors"
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
                  onClick={(e) => { e.stopPropagation(); handleTypeChange(type); }}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors",
                    hold.type === type
                      ? cn(holdTypeColors[type], "text-white")
                      : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); if (onRemove) onRemove(index); }}
            className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}