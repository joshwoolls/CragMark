import React, { useRef, useState, useEffect } from "react";
import HoldMarker from "./HoldMarker";

export default function WallCanvas({ imageUrl, holds, onAddHold, onRemoveHold, onUpdateHold, activeHoldType, interactive = false }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [initialPanCenter, setInitialPanCenter] = useState({ x: 0, y: 0 });
  const [initialTranslate, setInitialTranslate] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

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
    e.preventDefault();
    setIsPanning(true);
    setInitialTranslate({ x: translateX, y: translateY });
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !interactive) return;
    e.preventDefault();
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setTranslateX(initialTranslate.x + dx);
    setTranslateY(initialTranslate.y + dy);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e) => {
    if (!interactive) return;
    
    const touchCount = e.touches.length;
    console.log("WallCanvas touchStart - count:", touchCount);
    
    // Check if any touch is on a hold marker
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.closest('[data-hold-marker]')) {
        console.log("Touch on hold marker, ignoring for pan/zoom");
        return;
      }
    }
    
    if (touchCount === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate initial pinch distance
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setInitialPinchDistance(distance);
      setInitialScale(scale);
      
      // Calculate initial center point for panning
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setInitialPanCenter({ x: centerX, y: centerY });
      setInitialTranslate({ x: translateX, y: translateY });
      
      setIsPinching(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!interactive) return;
    
    const touchCount = e.touches.length;
    
    // Check if any touch is on a hold marker
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.closest('[data-hold-marker]')) {
        console.log("Touch on hold marker during move, ignoring for pan/zoom");
        return;
      }
    }
    
    if (touchCount === 2 && isPinching) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate current pinch distance
      const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      
      // Calculate scale based on initial distance
      const scaleChange = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(0.5, initialScale * scaleChange), 4);
      setScale(newScale);
      
      // Calculate current center point
      const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
      const currentCenterY = (touch1.clientY + touch2.clientY) / 2;
      
      // Calculate pan delta from initial center
      const dx = currentCenterX - initialPanCenter.x;
      const dy = currentCenterY - initialPanCenter.y;
      
      setTranslateX(initialTranslate.x + dx);
      setTranslateY(initialTranslate.y + dy);
    }
  };

  const handleTouchEnd = (e) => {
    if (!interactive) return;
    const touchCount = e.touches.length;
    console.log("WallCanvas touchEnd - remaining touches:", touchCount);
    if (touchCount < 2) {
      setIsPinching(false);
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
      <div style={{ transform: imageTransform, transformOrigin: "0 0" }}>
        <img
          ref={imageRef}
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
      </div>

      {interactive && imageLoaded && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full">
          Scroll to zoom · Drag with two fingers to pan · Double-click to reset
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