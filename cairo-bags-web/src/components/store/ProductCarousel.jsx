import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn.js";

/**
 * Infinite-loop Owl-Carousel–style horizontal scroll carousel.
 *
 * Strategy: clone all items and append them BEFORE and AFTER the real items.
 * When the scroll enters the "before-clone" or "after-clone" zone we silently
 * jump back to the matching real position — making the loop seamless.
 *
 * Props:
 *  children   – slide elements
 *  autoplay   – ms between auto-advances, 0 = off  (default 3500)
 *  gap        – gap between items in px             (default 20)
 *  className  – extra classes on the root wrapper
 *  showDots   – show pagination dots                (default true)
 *  showArrows – show prev / next buttons            (default true)
 */
export function ProductCarousel({
  children,
  autoplay = 3500,
  gap = 20,
  className,
  showDots = true,
  showArrows = true,
  loop = true,
}) {
  const trackRef      = useRef(null);
  const autoplayRef   = useRef(null);
  const isJumpingRef  = useRef(false);   // suppress scroll-listener during silent jump
  const dragRef       = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const [activeIndex, setActiveIndex] = useState(0);

  const items = Array.isArray(children) ? children : children ? [children] : [];
  const count = items.length;
  const shouldLoop = loop && count > 1;

  /* ─────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────── */

  /** Width of one carousel cell (item + gap) */
  const cellWidth = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const childIndex = shouldLoop ? count : 0;
    const child = el.children[childIndex];
    return (child?.offsetWidth ?? el.firstElementChild?.offsetWidth ?? 0) + gap;
  }, [count, gap, shouldLoop]);

  /** Scroll offset that puts real item [index] in view */
  const realOffset = useCallback(
    (index) => {
      if (!shouldLoop) return index * cellWidth();
      // real items start after `count` clones at the front
      return (count + index) * cellWidth();
    },
    [count, cellWidth, shouldLoop]
  );

  /* ─────────────────────────────────────────────
     Initialise: jump to real start (skip front clones)
  ───────────────────────────────────────────── */
  useEffect(() => {
    const el = trackRef.current;
    if (!el || count === 0) return;

    const raf = requestAnimationFrame(() => {
      isJumpingRef.current = true;
      el.scrollLeft = shouldLoop ? realOffset(0) : 0;
      requestAnimationFrame(() => { isJumpingRef.current = false; });
    });
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, shouldLoop]);

  /* ─────────────────────────────────────────────
     Scroll handler — sync dot index & loop reset
  ───────────────────────────────────────────── */
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || isJumpingRef.current || count === 0) return;

    const cw     = cellWidth();
    if (!cw) return;

    const scroll = el.scrollLeft;
    const realWidth = count * cw;

    const rawIndex = shouldLoop
      ? Math.round((scroll - realWidth) / cw)
      : Math.round(scroll / cw);
    const dotIndex = shouldLoop
      ? ((rawIndex % count) + count) % count
      : Math.min(Math.max(rawIndex, 0), count - 1);
    setActiveIndex(dotIndex);

    if (!shouldLoop) return;

    // ── Silent loop reset ──
    // If we scroll into the after-clone zone (past the real items)
    if (scroll >= realWidth * 2) {
      isJumpingRef.current = true;
      el.scrollLeft = scroll - realWidth;
      requestAnimationFrame(() => { isJumpingRef.current = false; });
    }
    // If we scroll into the before-clone zone (before the real items)
    else if (scroll < realWidth) {
      isJumpingRef.current = true;
      el.scrollLeft = scroll + realWidth;
      requestAnimationFrame(() => { isJumpingRef.current = false; });
    }
  }, [cellWidth, count, shouldLoop]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  /* ─────────────────────────────────────────────
     Navigation
  ───────────────────────────────────────────── */
  const scrollBy = useCallback(
    (delta) => {
      const el = trackRef.current;
      if (!el) return;
      const cw = cellWidth();
      el.scrollBy({ left: delta * cw, behavior: "smooth" });
    },
    [cellWidth]
  );

  const scrollToReal = useCallback(
    (index) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollTo({ left: realOffset(index), behavior: "smooth" });
    },
    [realOffset]
  );

  /* ─────────────────────────────────────────────
     Autoplay
  ───────────────────────────────────────────── */
  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    if (!autoplay || count === 0) return;
    stopAutoplay();
    autoplayRef.current = setInterval(() => scrollBy(1), autoplay);
  }, [autoplay, count, scrollBy, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  /* ─────────────────────────────────────────────
     Drag / pointer
  ───────────────────────────────────────────── */
  const onPointerDown = (e) => {
    if (!trackRef.current) return;
    dragRef.current = {
      active: true,
      isDragging: false,
      startX: e.clientX,
      scrollLeft: trackRef.current.scrollLeft,
    };
    stopAutoplay();
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active || !trackRef.current) return;
    const walk = e.clientX - dragRef.current.startX;
    
    // threshold to distinguish drag from click
    if (Math.abs(walk) > 5) {
      dragRef.current.isDragging = true;
    }
    
    if (dragRef.current.isDragging) {
      e.preventDefault();
      trackRef.current.scrollLeft = dragRef.current.scrollLeft - (walk * 1.4);
    }
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
    startAutoplay();
  };

  const onClickCapture = (e) => {
    // If we were dragging, prevent the click from navigating
    if (dragRef.current.isDragging) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.isDragging = false;
    }
  };


  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  if (count === 0) return null;

  const realItems = items.map((child, i) => (
    <div key={`real-${i}`} className="cb-carousel-item">
      {child}
    </div>
  ));

  const trackItems = shouldLoop
    ? [
        ...items.map((child, i) => (
          <div key={`clone-before-${i}`} className="cb-carousel-item" aria-hidden="true">
            {child}
          </div>
        )),
        ...realItems,
        ...items.map((child, i) => (
          <div key={`clone-after-${i}`} className="cb-carousel-item" aria-hidden="true">
            {child}
          </div>
        )),
      ]
    : realItems;

  return (
    <div
      className={cn("cb-carousel-root", className)}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      {/* ── track ── */}
      <div
        ref={trackRef}
        className="cb-carousel-track"
        style={{ gap: `${gap}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {trackItems}
      </div>

      {/* ── arrows ── */}
      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="cb-carousel-arrow cb-carousel-arrow--prev"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="cb-carousel-arrow cb-carousel-arrow--next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* ── dots ── */}
      {showDots && count > 1 && (
        <div className="cb-carousel-dots" role="tablist" aria-label="Carousel navigation">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              type="button"
              aria-label={`Go to item ${i + 1}`}
              aria-selected={activeIndex === i}
              onClick={() => scrollToReal(i)}
              className={cn("cb-carousel-dot", activeIndex === i && "cb-carousel-dot--active")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
