import React, { useRef, useState, useEffect } from "react";
import HoldMarker from "./HoldMarker";

export default function WallCanvas({ imageUrl, holds, onAddHold, onRemoveHold, onUpdateHold, activeHoldType, interactive = false }) {
  const containerRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastDragPos, setLastDragPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setImageLoaded(false);
  }, [imageUrl]);

  const handleWheel = (e) => {
    if (!interactive) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.5, scale * delta), 4);
    setScale(newScale);
  };

  const handleMouseDown = (e) => {
    if (!interactive || e.button !== 0) return; // Only left click
    setIsDragging(true);
    setLastDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !interactive) return;
    const dx = e.clientX - lastDragPos.x;
    const dy = e.clientY - lastDragPos.y;
    setTranslateX(translateX + dx);
    setTranslateY(translateY + dy);
    setLastDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (!interactive) return;
    if (e.touches.length === 1) {
      // Single touch - start dragging
      setIsDragging(true);
      setLastDragPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Pinch zoom - calculate initial distance
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setLastDragPos({ x: distance, y: scale });
    }
  };

  const handleTouchMove = (e) => {
    if (!interactive) return;
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      // Dragging
      const dx = e.touches[0].clientX - lastDragPos.x;
      const dy = e.touches[0].clientY - lastDragPos.y;
      setTranslateX(translateX + dx);
      setTranslateY(translateY + dy);
      setLastDragPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scaleChange = distance / lastDragPos.x;
      const newScale = Math.min(Math.max(0.5, scale * scaleChange), 4);
      setScale(newScale);
      setLastDragPos({ x: distance, y: newScale });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e) => {
    if (!interactive) return;
    e.preventDefault();
    // Reset zoom on double click
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  const handleTap = (e) => {
    if (!interactive || !onAddHold || !imageLoaded) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onAddHold({ x, y, type: activeHoldType || "middle", size: 28 });
  };

  // Calculate transform for image
  const imageTransform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-zinc-900 select-none touch-none cursor-grab active:cursor-grabbing"
      onClick={handleTap}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Climbing wall"
        className="w-full h-auto block origin-top-left transition-transform duration-75"
        style={{ transform: imageTransform }}
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
          Scroll to zoom · Drag to pan · Double-click to reset
        </div>
      )}
      {interactive && imageLoaded && scale > 1 && (
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white/70 text-xs px-2 py-1 rounded">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}