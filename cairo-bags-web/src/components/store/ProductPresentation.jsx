import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";

const SIZE_CLASS = {
  card: "cb-pres--card",
  compact: "cb-pres--compact",
  thumb: "cb-pres--thumb",
  gallery: "cb-pres--gallery",
};

const PRIORITY_ABOVE_FOLD = 4;

export function isAboveFoldPriority(index) {
  return typeof index === "number" && index >= 0 && index < PRIORITY_ABOVE_FOLD;
}

export function FloatingRing({ className, style }) {
  return <span className={cn("cb-pres__orbit-ring", className)} style={style} aria-hidden="true" />;
}

export function LuxuryGlow({ className }) {
  return <span className={cn("cb-pres__aura", className)} aria-hidden="true" />;
}

export function GoldStand({ delay = 0, className, style }) {
  return (
    <div
      className={cn("cb-pres__platform", className)}
      aria-hidden="true"
      style={{ "--platform-delay": `${delay}s`, ...style }}
    >
      <span className="cb-pres__ripple" />
      <span className="cb-pres__ripple cb-pres__ripple--delay" />
      <span className="cb-pres__stand">
        <span className="cb-pres__stand-shine" />
      </span>
      <span className="cb-pres__glow" />
      <span className="cb-pres__shadow" />
    </div>
  );
}

export const LuxuryImageWrapper = forwardRef(function LuxuryImageWrapper(
  {
    children,
    floatDelay = 0,
    platformDelay = 0,
    className,
    stageClassName,
    liftClassName,
    productClassName,
    ProductWrapper = "div",
    productWrapperProps = {},
  },
  ref
) {
  const ProductEl = ProductWrapper;

  return (
    <div ref={ref} className={cn("cb-pres__stage", stageClassName)}>
      <div
        className={cn("cb-pres__float-wrap", className)}
        style={{
          "--float-delay": `${floatDelay}s`,
          "--platform-delay": `${platformDelay}s`,
        }}
      >
        <div className={cn("cb-pres__lift", liftClassName)}>
          <ProductEl
            className={cn("cb-pres__product", productClassName)}
            {...productWrapperProps}
          >
            <FloatingRing />
            <LuxuryGlow />
            <div className="cb-pres__media">{children}</div>
          </ProductEl>
        </div>
        <GoldStand delay={platformDelay} />
      </div>
    </div>
  );
});

export function ProductPresentation({
  src,
  alt = "",
  size = "card",
  floatDelay = 0,
  platformDelay = 0,
  interactive = false,
  priority = "low",
  className,
  imgClassName,
  loading,
  decoding = "async",
  imgRef,
  onLoad,
  onError,
  placeholder = "CB",
  overlay,
  children,
  secondarySrc,
  showSecondary = false,
}) {
  const isHigh = priority === "high";
  const imgLoading = loading ?? (isHigh ? "eager" : "lazy");
  const fetchPriority = isHigh ? "high" : "low";

  const media =
    children ??
    (src ? (
      <div className="cb-pres__images">
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={imgLoading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          onLoad={onLoad}
          onError={onError}
          className={cn(
            "cb-pres__img",
            imgClassName,
            secondarySrc && showSecondary && "opacity-0"
          )}
        />
        {secondarySrc ? (
          <img
            src={secondarySrc}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className={cn(
              "cb-pres__img cb-pres__img--secondary",
              showSecondary ? "opacity-100" : "opacity-0"
            )}
          />
        ) : null}
      </div>
    ) : (
      <span className="cb-pres__placeholder">{placeholder}</span>
    ));

  return (
    <div
      className={cn(
        "cb-pres cb-pres--product",
        SIZE_CLASS[size] ?? SIZE_CLASS.card,
        interactive && "cb-pres--interactive",
        className
      )}
    >
      <LuxuryImageWrapper floatDelay={floatDelay} platformDelay={platformDelay}>
        {media}
      </LuxuryImageWrapper>
      {overlay ? <div className="cb-pres__overlay absolute inset-0 z-20">{overlay}</div> : null}
    </div>
  );
}
