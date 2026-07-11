import { useMemo } from "react";
import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { getCategoryId, getCategoryName } from "../../../utils/productHelpers.js";
import { cn } from "../../../utils/cn.js";

const PILL_LABELS_EN = ["All", "Tote Bags", "Shoulder Bags", "Crossbody", "Clutches", "Travel"];
const PILL_LABELS_AR = ["الكل", "حقائب يد", "حقائب كتف", "حقائب كروس", "حقائب سهرة", "سفر"];

function matchCategoryByPill(categories, pillIndex, locale) {
  if (pillIndex === 0) return "";
  const label = locale === "ar" ? PILL_LABELS_AR[pillIndex] : PILL_LABELS_EN[pillIndex];
  const enLabel = PILL_LABELS_EN[pillIndex];
  const match = categories.find((cat) => {
    const name = getCategoryName(cat, locale).toLowerCase();
    const nameEn = getCategoryName(cat, "en").toLowerCase();
    return name.includes(label.toLowerCase()) || nameEn.includes(enLabel.toLowerCase());
  });
  return match ? String(getCategoryId(match)) : "";
}

function ShopHeroScene() {
  return (
    <div className="cb-shop-hero-scene" aria-hidden="true">
      <div className="cb-shop-hero-scene-wall" />
      <div className="cb-shop-hero-scene-floor" />
      <div className="cb-shop-hero-arch">
        <div className="cb-shop-hero-arch-inner" />
      </div>
      <div className="cb-shop-hero-vase">
        <div className="cb-shop-hero-vase-neck" />
        <div className="cb-shop-hero-plant" />
      </div>
      <div className="cb-shop-hero-pedestal" />
      <div className="cb-shop-hero-podium" />
      <img
        src="/images/travelbags-set.jpg"
        alt=""
        className="cb-shop-hero-bag"
        loading="eager"
        decoding="async"
      />
      <div className="cb-shop-hero-scene-light" />
      <div className="cb-shop-hero-scene-glow-rim" />
    </div>
  );
}

export function ShopHero({
  categories = [],
  activeCategoryId = "",
  activeCategoryName = "",
  onCategorySelect,
  className,
}) {
  const { locale } = useLocale();

  const pills = useMemo(() => {
    const labels = locale === "ar" ? PILL_LABELS_AR : PILL_LABELS_EN;
    return labels.map((label, index) => ({
      label,
      categoryId: matchCategoryByPill(categories, index, locale),
      isAll: index === 0,
    }));
  }, [categories, locale]);

  const activePillIndex = useMemo(() => {
    if (!activeCategoryId) return 0;
    const idx = pills.findIndex((pill) => pill.categoryId === String(activeCategoryId));
    return idx >= 0 ? idx : 0;
  }, [activeCategoryId, pills]);

  return (
    <section className={cn("cb-shop-hero", className)}>
      <div className="cb-shop-hero-inner">
        <div className="cb-shop-hero-left">
          <p className="cb-shop-hero-label">
            {activeCategoryName
              ? locale === "ar"
                ? "المجموعة المختارة"
                : "Selected Collection"
              : locale === "ar"
                ? "المجموعة"
                : "Collection"}
          </p>
          <h1 className="cb-shop-hero-title">
            {activeCategoryName ||
              (locale === "ar" ? "تسوق المجموعة" : "Shop The Collection")}
          </h1>
          <p className="cb-shop-hero-subtitle">
            {activeCategoryName
              ? locale === "ar"
                ? `منتجات ${activeCategoryName} فقط`
                : `Showing ${activeCategoryName} products only`
              : locale === "ar"
                ? "اكتشفي الفخامة الخالدة، صُنعت من أجلك."
                : "Discover timeless luxury, crafted for you."}
          </p>
          <span className="cb-shop-hero-accent-line" aria-hidden="true" />

          {/* <div
            className="cb-shop-pills"
            role="tablist"
            aria-label={locale === "ar" ? "التصنيفات" : "Categories"}
          >
            {pills.map((pill, index) => {
              const active = activePillIndex === index;
              return (
                <button
                  key={pill.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={cn("cb-shop-pill", active && "cb-shop-pill-active")}
                  onClick={() => onCategorySelect?.(pill.isAll ? "" : pill.categoryId)}
                >
                  {pill.label}
                </button>
              );
            })}
          </div> */}
        </div>

        <ShopHeroScene />
      </div>
    </section>
  );
}
