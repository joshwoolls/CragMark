import React, { useRef, useState, useEffect, useCallback } from "react";
import HoldMarker from "./HoldMarker";

export default function WallCanvas({ imageUrl, holds, onAddHold, onRemoveHold, onUpdateHold, activeHoldType, interactive = false }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);

  // All interaction tracking in refs — never state
  const initialTranslate = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const initialPointerPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const isPointerDown = useRef(false);
  const scaleRef = useRef(1);
  const translateXRef = useRef(0);
  const translateYRef = useRef(0);
  const isPinchingRef = useRef(false);

  useEffect(() => {
    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setImageLoaded(false);
    setImageNaturalSize({ width: 0, height: 0 });
  }, [imageUrl]);

  // ─── NATIVE TOUCH LISTENERS (non-passive) ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
    setImageLoaded(true);
  };

  // ─── WHEEL ZOOM (anchored to cursor) ───────────────────────────────────────
  const handleWheel = (e) => {
    if (!interactive) return;
    e.preventDefault();

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;

    setScale(prevScale => {
      const newScale = Math.min(Math.max(0.5, prevScale * delta), 4);
      const scaleFactor = newScale / prevScale;
      scaleRef.current = newScale;
      const newTranslateX = mouseX - (mouseX - translateXRef.current) * scaleFactor;
      const newTranslateY = mouseY - (mouseY - translateYRef.current) * scaleFactor;
      translateXRef.current = newTranslateX;
      translateYRef.current = newTranslateY;
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
      return newScale;
    });
  };

  // ─── MOUSE EVENTS ──────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (!interactive || e.button !== 0) return;
    e.preventDefault();
    isPointerDown.current = true;
    hasDragged.current = false;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    initialPointerPos.current = { x: e.clientX, y: e.clientY };
    setIsPanning(true);
  };

  const handleMouseMove = (e) => {
    if (!isPointerDown.current || !interactive) return;
    e.preventDefault();

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    // Mark as dragged if moved more than 5px from origin
    if (!hasDragged.current) {
      const dist = Math.hypot(
        e.clientX - initialPointerPos.current.x,
        e.clientY - initialPointerPos.current.y
      );
      if (dist > 5) hasDragged.current = true;
    }

    const newTranslateX = translateXRef.current + dx;
    const newTranslateY = translateYRef.current + dy;
    translateXRef.current = newTranslateX;
    translateYRef.current = newTranslateY;
    setTranslateX(newTranslateX);
    setTranslateY(newTranslateY);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsPanning(false);

    // Only place hold if no drag occurred
    if (!hasDragged.current) {
      placeHold(e.clientX, e.clientY, e.target);
    }
    hasDragged.current = false;
  };

  const handleMouseLeave = () => {
    // Cancel pan on leave but don't place hold
    isPointerDown.current = false;
    hasDragged.current = false;
    setIsPanning(false);
  };

  // ─── TOUCH EVENTS ──────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (!interactive) return;

    const touchCount = e.touches.length;

    // Check if any touch is on a hold marker
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.closest('[data-hold-marker]')) return;
    }

    if (touchCount === 1) {
      hasDragged.current = false;
      isPointerDown.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPointerPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    if (touchCount === 2) {
      e.preventDefault();
      // Second finger down — cancel any single-touch tap
      hasDragged.current = true;
      isPointerDown.current = false;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

      setInitialPinchDistance(distance);
      setInitialScale(scaleRef.current);
      initialTranslate.current = { x: translateXRef.current, y: translateYRef.current };
      isPinchingRef.current = true;
    }
  }, [interactive]);

  const handleTouchMove = useCallback((e) => {
    if (!interactive) return;

    const touchCount = e.touches.length;

    // Check if any touch is on a hold marker
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.closest('[data-hold-marker]')) return;
    }

    // Single finger pan
    if (touchCount === 1 && !isPinchingRef.current && isPointerDown.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePos.current.x;
      const dy = touch.clientY - lastMousePos.current.y;

      if (!hasDragged.current) {
        const dist = Math.hypot(
          touch.clientX - initialPointerPos.current.x,
          touch.clientY - initialPointerPos.current.y
        );
        if (dist > 5) hasDragged.current = true;
      }

      const newTranslateX = translateXRef.current + dx;
      const newTranslateY = translateYRef.current + dy;
      translateXRef.current = newTranslateX;
      translateYRef.current = newTranslateY;
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
      lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    }

    // Pinch zoom (anchored to pinch midpoint)
    if (touchCount === 2 && isPinchingRef.current) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scaleChange = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(0.5, initialScale * scaleChange), 4);

      const containerRect = containerRef.current.getBoundingClientRect();
      const pinchCenterX = (touch1.clientX + touch2.clientX) / 2 - containerRect.left;
      const pinchCenterY = (touch1.clientY + touch2.clientY) / 2 - containerRect.top;

      const scaleFactor = newScale / initialScale;
      const newTranslateX = pinchCenterX - (pinchCenterX - initialTranslate.current.x) * scaleFactor;
      const newTranslateY = pinchCenterY - (pinchCenterY - initialTranslate.current.y) * scaleFactor;

      scaleRef.current = newScale;
      translateXRef.current = newTranslateX;
      translateYRef.current = newTranslateY;
      setScale(newScale);
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
    }
  }, [interactive, initialPinchDistance, initialScale]);

  const handleTouchEnd = useCallback((e) => {
    if (!interactive) return;

    const touchCount = e.touches.length;
    if (touchCount < 2) isPinchingRef.current = false;

    // Single tap — place hold only if no drag
    if (e.changedTouches.length === 1 && touchCount === 0 && !hasDragged.current && isPointerDown.current) {
      const touch = e.changedTouches[0];
      placeHold(touch.clientX, touch.clientY, document.elementFromPoint(touch.clientX, touch.clientY));
    }

    if (touchCount === 0) {
      isPointerDown.current = false;
      hasDragged.current = false;
    }
  }, [interactive]);

  // ─── DOUBLE CLICK RESET ────────────────────────────────────────────────────
  const handleDoubleClick = (e) => {
    if (!interactive) return;
    e.preventDefault();
    scaleRef.current = 1;
    translateXRef.current = 0;
    translateYRef.current = 0;
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // ─── HOLD PLACEMENT ────────────────────────────────────────────────────────
  const placeHold = (clientX, clientY, target) => {
    if (!interactive || !onAddHold || !imageLoaded) return;

    // Don't place if clicking on a hold marker
    if (target && target.closest && target.closest('[data-hold-marker]')) return;

    // Only place if clicking on the container or image itself
    if (target !== containerRef.current && target !== imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerX = clientX - rect.left;
    const containerY = clientY - rect.top;

    const imageX = (containerX - translateX) / scale;
    const imageY = (containerY - translateY) / scale;

    const x = (imageX / rect.width) * 100;
    const y = (imageY / rect.height) * 100;

    onAddHold({ x, y, type: activeHoldType || "middle", size: 28 });
  };

  const imageTransform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-zinc-900 select-none touch-none"
      style={{ touchAction: "none" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="relative"
        style={{ transform: imageTransform, transformOrigin: "0 0" }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Climbing wall"
          className="w-full h-auto block"
          onLoad={handleImageLoad}
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
            containerWidth={containerRef.current?.offsetWidth}
            containerHeight={containerRef.current?.offsetHeight}
          />
        ))}
      </div>

      {interactive && imageLoaded && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full">
          Tap to place · Drag to pan · Pinch to zoom · Double-tap to reset
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