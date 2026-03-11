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
    
    const touchCount = e.touches.length;
    console.log("WallCanvas touchStart - count:", touchCount);
    
    if (touchCount === 1) {
      // Single touch - let it bubble to holds, don't prevent default
      return;
    } else if (touchCount === 2) {
      // Pinch zoom - prevent default to stop page scrolling
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setLastDragPos({ x: distance, y: scale });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!interactive) return;
    
    const touchCount = e.touches.length;
    
    if (touchCount === 1) {
      // Single touch - let it bubble to holds for resizing
      return;
    } else if (touchCount >= 2) {
      // Two or more fingers - pan and zoom
      e.preventDefault();
      
      if (isDragging) {
        // Panning with two fingers
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const dx = centerX - lastDragPos.x;
        const dy = centerY - lastDragPos.y;
        setTranslateX(translateX + dx);
        setTranslateY(translateY + dy);
        setLastDragPos({ x: centerX, y: centerY });
      } else {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scaleChange = distance / lastDragPos.x;
        const newScale = Math.min(Math.max(0.5, scale * scaleChange), 4);
        setScale(newScale);
        setLastDragPos({ x: distance, y: newScale });
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!interactive) return;
    const touchCount = e.touches.length;
    console.log("WallCanvas touchEnd - remaining touches:", touchCount);
    if (touchCount < 2) {
      setIsDragging(false);
    }
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
    // Only add hold if it's a single touch and not already interacting with a hold
    if (!interactive || !onAddHold || !imageLoaded) return;
    if (e.touches && e.touches.length > 1) return; // Ignore multi-touch
    
    // Check if we're clicking on a hold marker (it will have stopped propagation)
    if (e.target !== containerRef.current && e.target !== imageRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    onAddHold({ x, y, type: activeHoldType || "middle", size: 28 });
  };

  // Calculate transform for image
  const imageTransform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-zinc-900 select-none touch-none"
      style={{ touchAction: "none" }}
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