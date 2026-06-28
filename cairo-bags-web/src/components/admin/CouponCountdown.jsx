import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useCouponCountdown } from "../../hooks/useCouponCountdown.js";
import { cn } from "../../utils/cn.js";

const LABELS = {
  en: {
    ends_in: "Ends in:",
    starts_in: "Starts in:",
    expired_ago: "Expired",
    ago: "Ago",
    day: "Day",
    days: "Days",
    hour: "Hour",
    hours: "Hours",
    minute: "Minute",
    minutes: "Minutes",
  },
  ar: {
    ends_in: "ينتهي خلال:",
    starts_in: "يبدأ خلال:",
    expired_ago: "انتهى منذ",
    ago: "",
    day: "يوم",
    days: "أيام",
    hour: "ساعة",
    hours: "ساعات",
    minute: "دقيقة",
    minutes: "دقائق",
  },
};

function formatUnit(value, singular, plural, locale) {
  const label = value === 1 ? singular : plural;
  return locale === "ar" ? `${value} ${label}` : `${value} ${label}`;
}

function CountdownUnit({ value, singular, plural, accent = "default" }) {
  const accentClasses =
    accent === "scheduled"
      ? "border-amber-200/70 bg-amber-50/80 text-amber-900"
      : accent === "expired"
        ? "border-red-200/70 bg-red-50/80 text-red-800"
        : "border-brand-accent/25 bg-brand-accent/8 text-brand-text";

  return (
    <span
      className={cn(
        "inline-flex min-w-[4.5rem] flex-col items-center justify-center rounded-lg border px-2.5 py-1.5",
        "shadow-[0_2px_10px_-6px_rgba(201,169,98,0.35)] transition-transform duration-300 hover:-translate-y-0.5",
        accentClasses
      )}
    >
      <span className="font-display text-base font-semibold leading-none tabular-nums">{value}</span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] opacity-80">
        {value === 1 ? singular : plural}
      </span>
    </span>
  );
}

function formatExpiredAgo(parts, labels, locale) {
  if (parts.days > 0) {
    return `${labels.expired_ago} ${formatUnit(parts.days, labels.day, labels.days, locale)}${labels.ago ? ` ${labels.ago}` : ""}`;
  }
  if (parts.hours > 0) {
    return `${labels.expired_ago} ${formatUnit(parts.hours, labels.hour, labels.hours, locale)}${labels.ago ? ` ${labels.ago}` : ""}`;
  }
  return `${labels.expired_ago} ${formatUnit(Math.max(parts.minutes, 1), labels.minute, labels.minutes, locale)}${labels.ago ? ` ${labels.ago}` : ""}`;
}

function CompactCountdownText({ snapshot, locale, labels }) {
  const { parts } = snapshot;

  if (snapshot.kind === "expired_ago") {
    return formatExpiredAgo(parts, labels, locale);
  }

  const units = [];
  if (parts.days > 0) {
    units.push(formatUnit(parts.days, labels.day, labels.days, locale));
  }
  if (parts.hours > 0 || parts.days > 0) {
    units.push(formatUnit(parts.hours, labels.hour, labels.hours, locale));
  }
  if (snapshot.kind === "ends_in" || parts.days === 0) {
    units.push(formatUnit(parts.minutes, labels.minute, labels.minutes, locale));
  }

  const prefix = snapshot.kind === "ends_in" ? labels.ends_in : labels.starts_in;
  return `${prefix} ${units.join(" · ")}`;
}

export function CouponCountdown({ coupon, status, variant = "default", className }) {
  const { locale } = useLocale();
  const snapshot = useCouponCountdown(coupon, status);
  const labels = locale === "ar" ? LABELS.ar : LABELS.en;

  if (!snapshot) return null;

  const accent =
    snapshot.kind === "starts_in" ? "scheduled" : snapshot.kind === "expired_ago" ? "expired" : "default";

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "text-[11px] font-medium leading-snug",
          snapshot.kind === "expired_ago"
            ? "text-red-700/90"
            : snapshot.kind === "starts_in"
              ? "text-amber-800/90"
              : "text-brand-muted",
          className
        )}
        aria-live="polite"
      >
        <CompactCountdownText snapshot={snapshot} locale={locale} labels={labels} />
      </p>
    );
  }

  const heading =
    snapshot.kind === "ends_in"
      ? labels.ends_in
      : snapshot.kind === "starts_in"
        ? labels.starts_in
        : null;

  if (snapshot.kind === "expired_ago") {
    return (
      <div className={cn("mt-4", className)} aria-live="polite">
        <p className="font-display text-lg font-medium text-red-800">
          {formatExpiredAgo(snapshot.parts, labels, locale)}
        </p>
      </div>
    );
  }

  const showMinutes = snapshot.kind === "ends_in" || snapshot.parts.days === 0;

  return (
    <div className={cn("mt-4", className)} aria-live="polite">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
        {heading}
      </p>
      <div className="flex flex-wrap gap-2">
        {snapshot.parts.days > 0 ? (
          <CountdownUnit
            value={snapshot.parts.days}
            singular={labels.day}
            plural={labels.days}
            accent={accent}
          />
        ) : null}
        <CountdownUnit
          value={snapshot.parts.hours}
          singular={labels.hour}
          plural={labels.hours}
          accent={accent}
        />
        {showMinutes ? (
          <CountdownUnit
            value={snapshot.parts.minutes}
            singular={labels.minute}
            plural={labels.minutes}
            accent={accent}
          />
        ) : null}
      </div>
    </div>
  );
}
