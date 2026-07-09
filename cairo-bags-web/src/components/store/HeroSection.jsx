import { Link } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

import heroBg from "../../assets/hero/hero-bg.png";
import heroProducts from "../../assets/hero/hero-products-cutout.png";
import backpackImg from "../../assets/hero/backpack.png";
import suitcaseImg from "../../assets/hero/suitcase.png";
import laptopBagImg from "../../assets/hero/laptop-bag.png";
import crossbodyImg from "../../assets/hero/crossbody.png";
import travelSetImg from "../../assets/hero/travel-set.png";

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.85, ease: EASE },
  }),
};

const fadeRight = {
  hidden: { opacity: 0, x: 48, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { delay: 0.2, duration: 1.1, ease: EASE },
  },
};

const FLOAT_DUST = [
  { left: "8%", top: "72%", size: 2, delay: 0 },
  { left: "14%", top: "58%", size: 1.5, delay: 1.2 },
  { left: "22%", top: "80%", size: 2, delay: 0.4 },
  { left: "32%", top: "65%", size: 1, delay: 2.1 },
  { left: "48%", top: "78%", size: 1.5, delay: 0.8 },
  { left: "58%", top: "55%", size: 2, delay: 1.6 },
  { left: "68%", top: "70%", size: 1, delay: 2.8 },
  { left: "76%", top: "48%", size: 1.5, delay: 0.2 },
  { left: "84%", top: "62%", size: 2, delay: 1.4 },
  { left: "92%", top: "38%", size: 1, delay: 2.4 },
  { left: "40%", top: "42%", size: 1.5, delay: 3.2 },
  { left: "55%", top: "32%", size: 1, delay: 1.9 },
];

function HeroBackground() {
  return (
    <div className="cb-hero__bg" aria-hidden="true">
      <img src={heroBg} alt="" className="cb-hero__bg-image" />
      <div className="cb-hero__bg-shade" />
      <div className="cb-hero__bg-vignette" />
      <div className="cb-hero__bg-dust">
        {FLOAT_DUST.map((p, i) => (
          <motion.span
            key={i}
            className="cb-hero__bg-particle"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            animate={{ opacity: [0.15, 0.55, 0.15], y: [0, -12, 0] }}
            transition={{ duration: 4 + p.delay, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
      </div>
    </div>
  );
}

function StatUsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StatStarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryBackpackIcon() {
  return (
    <svg className="cb-hero__category-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="4" y="8" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CategoryLuggageIcon() {
  return (
    <svg className="cb-hero__category-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="8" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 14v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CategoryLaptopIcon() {
  return (
    <svg className="cb-hero__category-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="6" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CategoryCrossbodyIcon() {
  return (
    <svg className="cb-hero__category-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 9V7a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CategoryTravelSetIcon() {
  return (
    <svg className="cb-hero__category-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="10" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="7" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="10" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function HeroShowcase({ locale }) {
  return (
    <motion.div
      className="cb-hero__showcase"
      variants={fadeRight}
      initial="hidden"
      animate="visible"
    >
      <div className="cb-hero__showcase-scene">
        <motion.img
          src={heroProducts}
          alt={locale === "ar" ? "مجموعة حقائب Cairo Bags الفاخرة" : "Cairo Bags premium collection"}
          className="cb-hero__showcase-img"
          width={3840}
          height={3075}
          fetchPriority="high"
          decoding="async"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="cb-hero__carousel-hint" aria-hidden="true">
        <span className="cb-hero__carousel-arrow">↑</span>
        <span className="cb-hero__carousel-dot cb-hero__carousel-dot--active" />
        <span className="cb-hero__carousel-dot" />
        <span className="cb-hero__carousel-dot" />
        <span className="cb-hero__carousel-arrow">↓</span>
      </div>
    </motion.div>
  );
}

function HeroCategoryStrip({ locale }) {
  const categories = useMemo(
    () => [
      {
        key: "backpacks",
        title: locale === "ar" ? "حقائب الظهر" : "Backpacks",
        desc:
          locale === "ar"
            ? "تنظيم ذكي وراحة يومية للسفر والعمل."
            : "Smart organization and everyday comfort for work and travel.",
        image: backpackImg,
        href: "/shop",
        Icon: CategoryBackpackIcon,
      },
      {
        key: "luggage",
        title: locale === "ar" ? "حقائب السفر" : "Travel Luggage",
        desc:
          locale === "ar"
            ? "متانة فاخرة لكل رحلة بعيدة."
            : "Premium durability engineered for every journey.",
        image: suitcaseImg,
        href: "/shop",
        Icon: CategoryLuggageIcon,
      },
      {
        key: "laptop",
        title: locale === "ar" ? "حقائب اللابتوب" : "Laptop Bags",
        desc:
          locale === "ar"
            ? "حماية أنيقة لأجهزتك المهنية."
            : "Elegant protection for your professional gear.",
        image: laptopBagImg,
        href: "/shop",
        Icon: CategoryLaptopIcon,
      },
      {
        key: "crossbody",
        title: locale === "ar" ? "حقائب كروس" : "Crossbody Bags",
        desc:
          locale === "ar"
            ? "أناقة عملية للتنقل اليومي."
            : "Hands-free style for effortless daily movement.",
        image: crossbodyImg,
        href: "/shop",
        Icon: CategoryCrossbodyIcon,
      },
      {
        key: "travel-sets",
        title: locale === "ar" ? "أطقم السفر" : "Travel Sets",
        desc:
          locale === "ar"
            ? "تنسيق متكامل لرحلاتك القادمة."
            : "Coordinated sets for your next adventure.",
        image: travelSetImg,
        href: "/shop",
        Icon: CategoryTravelSetIcon,
      },
    ],
    [locale]
  );

  return (
    <div className="cb-hero__categories">
      <div className="cb-hero__categories-grid">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.key}
            className="cb-hero__category-item"
            custom={0.55 + index * 0.08}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <Link to={cat.href} className="cb-hero__category-card">
              <div className="cb-hero__category-body">
                <cat.Icon />
                <h3 className="cb-hero__category-title">{cat.title}</h3>
                <p className="cb-hero__category-desc">{cat.desc}</p>
                <span className="cb-hero__category-link">
                  {locale === "ar" ? "تسوق الآن" : "Shop Now"}
                  <span aria-hidden="true">→</span>
                </span>
              </div>
              <div className="cb-hero__category-img-wrap" aria-hidden="true">
                <img src={cat.image} alt="" className="cb-hero__category-img" loading="lazy" decoding="async" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection({ className }) {
  const { locale } = useLocale();

  const stats = [
    {
      value: "500+",
      label: locale === "ar" ? "عميل سعيد" : "Happy Customers",
      Icon: StatUsersIcon,
    },
    {
      value: "50+",
      label: locale === "ar" ? "تصميم فاخر" : "Premium Designs",
      Icon: StatStarIcon,
    },
    {
      value: "100%",
      label: locale === "ar" ? "مواد عالية الجودة" : "Quality Materials",
      Icon: StatShieldIcon,
    },
  ];

  return (
    <section className={cn("cb-hero", className)} aria-label={locale === "ar" ? "القسم الرئيسي" : "Hero"}>
      <HeroBackground />

      <div className="cb-hero__inner">
        <div className="cb-hero__split">
          <div className="cb-hero__content">
            <motion.p
              className="cb-hero__label"
              custom={0.05}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <span className="cb-hero__label-line" aria-hidden="true" />
              {locale === "ar" ? "مجموعة ٢٠٢٦" : "Collection 2026"}
            </motion.p>

            <h1 className="cb-hero__title">
              <motion.span
                className="cb-hero__title-line cb-hero__title-line--gold"
                custom={0.12}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                Cairo Bags
              </motion.span>
              <motion.span
                className="cb-hero__title-line cb-hero__title-line--white"
                custom={0.18}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                {locale === "ar" ? "مصممة لـ" : "Crafted For"}
              </motion.span>
              <motion.span
                className="cb-hero__title-line cb-hero__title-line--white"
                custom={0.24}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                {locale === "ar" ? "كل رحلة" : "Every Journey"}
              </motion.span>
            </h1>

            <motion.p
              className="cb-hero__subtitle"
              custom={0.3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              {locale === "ar" ? (
                <>
                  حقائب ظهر وسفر ولابتوب وكروس فاخرة مصممة للحياة اليومية
                  <br />
                  وكل مغامرة.
                </>
              ) : (
                <>
                  Premium backpacks, travel luggage, laptop bags and crossbody bags
                  <br />
                  designed for everyday life and every adventure.
                </>
              )}
            </motion.p>

            <motion.div
              className="cb-hero__actions"
              custom={0.38}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <Link to="/shop" className="cb-hero__btn cb-hero__btn--primary">
                {locale === "ar" ? "تسوق الآن" : "Shop Now"}
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/shop" className="cb-hero__btn cb-hero__btn--secondary">
                {locale === "ar" ? "استكشف المجموعة" : "Explore Collection"}
              </Link>
            </motion.div>

            <motion.div
              className="cb-hero__stats"
              custom={0.5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="cb-hero__stat">
                  <div className="cb-hero__stat-icon">
                    <stat.Icon />
                  </div>
                  <div className="cb-hero__stat-text">
                    <p className="cb-hero__stat-value">{stat.value}</p>
                    <p className="cb-hero__stat-label">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <HeroShowcase locale={locale} />
        </div>

        <HeroCategoryStrip locale={locale} />
      </div>
    </section>
  );
}
