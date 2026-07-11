import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import * as categoryService from "../../services/categoryService.js";
import { resolveCollectionShopHref } from "../../utils/collectionCategory.js";
import backpackImg from "../../assets/hero/collections/backpack.png";
import handbagImg from "../../assets/hero/collections/handbag.png";
import laptopBagImg from "../../assets/hero/collections/laptop-bag.png";
import crossbodyImg from "../../assets/hero/collections/crossbody.png";
import travelSetImg from "../../assets/hero/collections/travel-set.png";

const EASE = [0.22, 0.61, 0.36, 1];
const TILT_SPRING = { stiffness: 180, damping: 24, mass: 0.6 };
const MAGNET_SPRING = { stiffness: 120, damping: 20, mass: 0.8 };

const CATEGORY_ICONS = {
  backpack: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M16 18V14a8 8 0 0 1 16 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="10" y="18" width="28" height="26" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 26v8M20 30h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  handbag: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M20 18V14a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="14" y="18" width="20" height="22" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 26h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  laptop: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="10" y="14" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 36h36l-4-6H10l-4 6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  crossbody: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="14" y="20" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 20V10M18 12l6-4 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  travel: (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="22" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="26" y="18" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 30h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

function CollectionCard({ cat, index, featured = false, isAr }) {
  const cardRef = useRef(null);
  const stageRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), TILT_SPRING);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), TILT_SPRING);
  const rotateZ = useSpring(useTransform(mx, [-0.5, 0.5], [-2.2, 2.2]), TILT_SPRING);
  const magneticX = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), MAGNET_SPRING);
  const magneticY = useSpring(useTransform(my, [-0.5, 0.5], [-7, 7]), MAGNET_SPRING);

  const onMove = useCallback(
    (event) => {
      const stage = stageRef.current;
      const card = cardRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        mx.set((event.clientX - rect.left) / rect.width - 0.5);
        my.set((event.clientY - rect.top) / rect.height - 0.5);
      }
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--spot-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      }
    },
    [mx, my]
  );

  const onLeave = useCallback(() => {
    setHovered(false);
    mx.set(0);
    my.set(0);
    const card = cardRef.current;
    if (card) {
      card.style.setProperty("--spot-x", "50%");
      card.style.setProperty("--spot-y", "38%");
    }
  }, [mx, my]);

  return (
    <motion.article
      className={featured ? "cb-coll__cell cb-coll__cell--featured" : "cb-coll__cell"}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.08, duration: 0.7, ease: EASE }}
    >
      <Link
        ref={cardRef}
        to={cat.href}
        className="cb-coll__card"
        style={{
          "--float-delay": `${index * 0.85}s`,
          "--spot-x": "50%",
          "--spot-y": "38%",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <span className="cb-coll__card-ambient" aria-hidden="true" />
        <span className="cb-coll__card-spotlight" aria-hidden="true" />
        <div className="cb-coll__card-head">
          <span className="cb-coll__icon">{CATEGORY_ICONS[cat.iconKey]}</span>
          <span className="cb-coll__num" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="cb-coll__stage" ref={stageRef}>
          <div
            className="cb-coll__float-wrap"
            style={{ "--platform-delay": `${index * 0.75}s` }}
          >
            <div
              className={`cb-coll__product-lift cb-coll__product-lift--${cat.iconKey}${featured ? " cb-coll__product-lift--featured" : ""}`}
            >
              <motion.div
                className={`cb-coll__product cb-coll__product--${cat.iconKey}`}
                style={{
                  rotateX: hovered ? rotateX : 0,
                  rotateY: hovered ? rotateY : 0,
                  rotateZ: hovered ? rotateZ : 0,
                  x: hovered ? magneticX : 0,
                  y: hovered ? magneticY : 0,
                  transformStyle: "preserve-3d",
                }}
              >
                <span className="cb-coll__product-aura" aria-hidden="true" />
                <img
                  src={cat.image}
                  alt=""
                  className={`cb-coll__img cb-coll__img--${cat.iconKey}${featured ? " cb-coll__img--featured" : ""}`}
                  loading="lazy"
                  draggable={false}
                />
              </motion.div>
            </div>

            <div className={`cb-coll__platform cb-coll__platform--${cat.iconKey}`} aria-hidden="true">
              <span className="cb-coll__platform-ripple" />
              <span className="cb-coll__platform-ripple cb-coll__platform-ripple--delay" />
              <span className="cb-coll__platform-ring">
                <span className="cb-coll__platform-ring-shine" />
              </span>
              <span className="cb-coll__platform-glow" />
              <span className="cb-coll__platform-shadow" />
              <span className="cb-coll__platform-arrows">
                <svg viewBox="0 0 240 56" fill="none">
                  <defs>
                    <marker
                      id={`cb-plat-arrow-${index}`}
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0 0 L6 3 L0 6 Z" fill="currentColor" />
                    </marker>
                  </defs>
                  <path
                    d="M16 38 C40 14, 78 10, 118 24"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    markerEnd={`url(#cb-plat-arrow-${index})`}
                  />
                  <path
                    d="M224 18 C200 42, 162 46, 122 32"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    markerEnd={`url(#cb-plat-arrow-${index})`}
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="cb-coll__body">
          <h3 className="cb-coll__title-text">{cat.title}</h3>
          <p className="cb-coll__desc">{cat.desc}</p>
          <span className="cb-coll__explore">
            <span className="cb-coll__explore-text">{isAr ? "استكشف" : "EXPLORE"}</span>
            <span className="cb-coll__explore-arrow" aria-hidden="true">
              {isAr ? "←" : "→"}
            </span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export function CollectionCards() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const collections = useMemo(() => {
    const defs = [
      {
        iconKey: "backpack",
        matchKey: "backpack",
        titleEn: "Backpacks",
        titleAr: "حقائب الظهر",
        image: backpackImg,
        title: isAr ? "حقائب الظهر" : "Backpacks",
        desc: isAr ? "راحة يومية" : "Daily comfort",
        featured: true,
      },
      {
        iconKey: "handbag",
        matchKey: "handbag",
        titleEn: "Hand Bags",
        titleAr: "حقائب يد",
        image: handbagImg,
        title: isAr ? "حقائب يد" : "Hand Bags",
        desc: isAr ? "مقبض واحد للحمل اليومي" : "Single-handle daily carry",
      },
      {
        iconKey: "laptop",
        matchKey: "laptop",
        titleEn: "Laptop Bags",
        titleAr: "حقائب اللابتوب",
        image: laptopBagImg,
        title: isAr ? "حقائب اللابتوب" : "Laptop Bags",
        desc: isAr ? "أناقة عملية" : "Smart elegance",
      },
      {
        iconKey: "crossbody",
        matchKey: "crossbody",
        titleEn: "Crossbody",
        titleAr: "حقائب كروس",
        image: crossbodyImg,
        title: isAr ? "حقائب كروس" : "Crossbody",
        desc: isAr ? "خفيفة وأنيقة" : "Light & chic",
      },
      {
        iconKey: "travel",
        matchKey: "travel",
        titleEn: "Travel Sets",
        titleAr: "أطقم السفر",
        image: travelSetImg,
        title: isAr ? "أطقم السفر" : "Travel Sets",
        desc: isAr ? "مجموعات كاملة" : "Complete sets",
      },
    ];

    return defs.map((def) => ({
      ...def,
      href: resolveCollectionShopHref(categories, def.matchKey, {
        titleEn: def.titleEn,
        titleAr: def.titleAr,
      }),
    }));
  }, [categories, isAr]);

  const [featured, ...rest] = collections;

  return (
    <section className="cb-coll" id="categories">
      <div className="cb-land-container">
        <motion.header
          className="cb-coll__head"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="cb-coll__label">{isAr ? "المجموعات" : "Collections"}</span>
          <h2 className="cb-coll__title">{isAr ? "اختر عالمك" : "Choose Your World"}</h2>
        </motion.header>

        <div className="cb-coll__grid">
          <CollectionCard cat={featured} index={0} featured isAr={isAr} />
          <div className="cb-coll__aside">
            {rest.map((cat, i) => (
              <CollectionCard key={cat.iconKey} cat={cat} index={i + 1} isAr={isAr} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
