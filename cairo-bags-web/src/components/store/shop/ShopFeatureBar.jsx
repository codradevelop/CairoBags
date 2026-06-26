import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { cn } from "../../../utils/cn.js";

function ShieldIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 3 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M6 3h12l4 7-10 11L2 10l4-7Z" strokeLinejoin="round" />
      <path d="M2 10h20M12 3v18" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 7v6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 17a8 8 0 0 0-14.9-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 7h11v8H3V7Z" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v2h-7v-5Z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

const FEATURES = {
  en: [
    { icon: ShieldIcon, title: "Secure Checkout", desc: "100% Protected" },
    { icon: DiamondIcon, title: "Premium Quality", desc: "Finest Materials" },
    { icon: ReturnIcon, title: "Easy Returns", desc: "14-Day Returns" },
    { icon: TruckIcon, title: "Fast Delivery", desc: "2–3 Business Days" },
  ],
  ar: [
    { icon: ShieldIcon, title: "دفع آمن", desc: "محمي 100%" },
    { icon: DiamondIcon, title: "جودة فاخرة", desc: "أجود الخامات" },
    { icon: ReturnIcon, title: "إرجاع سهل", desc: "إرجاع خلال 14 يوم" },
    { icon: TruckIcon, title: "توصيل سريع", desc: "2–3 أيام عمل" },
  ],
};

export function ShopFeatureBar({ className }) {
  const { locale } = useLocale();
  const items = locale === "ar" ? FEATURES.ar : FEATURES.en;

  return (
    <section className={cn("cb-shop-feature-bar", className)} aria-label={locale === "ar" ? "مزايا التسوق" : "Shopping benefits"}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="cb-shop-feature-item">
            <span className="cb-shop-feature-icon">
              <Icon />
            </span>
            <div>
              <p className="cb-shop-feature-title">{item.title}</p>
              <p className="cb-shop-feature-desc">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
