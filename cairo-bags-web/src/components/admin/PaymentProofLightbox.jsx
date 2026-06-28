import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";
import { DURATION } from "../ui/animation.jsx";
import { EASE_LUXURY } from "../ui/motion.jsx";

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;

function getTouchDistance(touches) {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export function PaymentProofLightbox({ imageUrl, alt, locale = "en", onClose }) {
  const [scale, setScale] = useState(1);
  const panelRef = useRef(null);
  const pinchStartRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const labels =
    locale === "ar"
      ? {
          close: "إغلاق",
          zoomIn: "تكبير",
          zoomOut: "تصغير",
          reset: "إعادة التكبير",
          download: "تحميل الصورة",
          viewer: "عارض إثبات الدفع",
        }
      : {
          close: "Close",
          zoomIn: "Zoom In",
          zoomOut: "Zoom Out",
          reset: "Reset Zoom",
          download: "Download Image",
          viewer: "Payment proof viewer",
        };

  const clampScale = useCallback((value) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value)), []);

  useEffect(() => {
    if (!imageUrl) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [imageUrl, onClose]);

  function handleZoomIn() {
    setScale((current) => clampScale(Number((current + SCALE_STEP).toFixed(2))));
  }

  function handleZoomOut() {
    setScale((current) => clampScale(Number((current - SCALE_STEP).toFixed(2))));
  }

  function handleResetZoom() {
    setScale(1);
  }

  function handleWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    setScale((current) => clampScale(Number((current + delta).toFixed(2))));
  }

  function handleTouchStart(event) {
    if (event.touches.length === 2) {
      pinchStartRef.current = {
        distance: getTouchDistance(event.touches),
        scale,
      };
    }
  }

  function handleTouchMove(event) {
    if (event.touches.length !== 2 || !pinchStartRef.current) return;
    event.preventDefault();
    const distance = getTouchDistance(event.touches);
    const ratio = distance / pinchStartRef.current.distance;
    setScale(clampScale(Number((pinchStartRef.current.scale * ratio).toFixed(2))));
  }

  function handleTouchEnd() {
    pinchStartRef.current = null;
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `payment-proof-${Date.now()}.jpg`;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (!imageUrl) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="payment-proof-lightbox"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReduced ? undefined : { opacity: 0 }}
        transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="presentation"
      >
        <button
          type="button"
          className="absolute inset-0 bg-brand-primary/75 backdrop-blur-md"
          aria-label={labels.close}
          onClick={onClose}
        />

        <motion.div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={labels.viewer}
          initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: DURATION.slow, ease: EASE_LUXURY }}
          className="relative z-[71] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-brand-border/80 bg-brand-surface/95 shadow-modal outline-none backdrop-blur-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/70 px-4 py-3 sm:px-5">
            <p className="text-sm font-medium text-brand-text">{labels.viewer}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" aria-label={labels.zoomOut} onClick={handleZoomOut}>
                −
              </Button>
              <Button type="button" variant="outline" size="sm" aria-label={labels.reset} onClick={handleResetZoom}>
                {labels.reset}
              </Button>
              <Button type="button" variant="outline" size="sm" aria-label={labels.zoomIn} onClick={handleZoomIn}>
                +
              </Button>
              <Button type="button" variant="accent" size="sm" onClick={handleDownload}>
                {labels.download}
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label={labels.close} onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>
            </div>
          </div>

          <div
            className="flex flex-1 items-center justify-center overflow-auto bg-brand-secondary/20 p-4 sm:p-6"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={imageUrl}
              alt={alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={cn(
                "max-h-[calc(92vh-7rem)] w-auto max-w-full origin-center rounded-lg border border-brand-border/70 bg-brand-surface object-contain shadow-soft transition-transform duration-200"
              )}
              style={{ transform: `scale(${scale})` }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
