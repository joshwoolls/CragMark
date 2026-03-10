import React, { useRef, useState } from "react";
import HoldMarker from "./HoldMarker";

export default function WallCanvas({ imageUrl, holds, onAddHold, onRemoveHold, onUpdateHold, activeHoldType, interactive = false }) {
  const containerRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleTap = (e) => {
    if (!interactive || !onAddHold || !imageLoaded) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onAddHold({ x, y, type: activeHoldType || "middle", size: 28 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-zinc-900 select-none touch-none"
      onClick={handleTap}
    >
      <img
        src={imageUrl}
        alt="Climbing wall"
        className="w-full h-auto block"
        onLoad={() => setImageLoaded(true)}
        draggable={false}
      />
      {imageLoaded && holds?.map((hold, i) => (
        <HoldMarker
          key={i}
          hold={hold}
          index={i}
          onRemove={onRemoveHold}
          onUpdate={onUpdateHold}
          interactive={interactive}
        />
      ))}
      {interactive && imageLoaded && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full">
          Tap to mark · Tap again to select & resize · Drag ring or use +/- buttons
        </div>
      )}
    </div>
  );
}