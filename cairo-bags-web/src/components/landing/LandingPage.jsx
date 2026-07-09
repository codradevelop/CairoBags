import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { FeaturedProducts, NewArrivals } from "../store/FeaturedProducts.jsx";
import { MouseGlow } from "../store/MouseGlow.jsx";
import { CollectionCards } from "./CollectionCards.jsx";
import { HomeStatistics } from "./HomeStatistics.jsx";

const EASE = [0.16, 1, 0.3, 1];

const MARQUEE = ["Premium Craft", "Travel Ready", "Cairo Heritage", "Luxury Materials", "Every Journey"];

function usePastHeroClass() {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const shell = document.querySelector(".cb-landing-shell");
    if (!sentinel || !shell) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        shell.classList.toggle("cb-land-past-hero", !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      shell.classList.remove("cb-land-past-hero");
    };
  }, []);

  return sentinelRef;
}

function useParallaxTilt() {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 18 });

  const onMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    },
    [mx, my]
  );

  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return { ref, rotateX, rotateY, onMove, onLeave };
}

function HeroParticles() {
  const particles = [
    { x: "12%", y: "18%", size: 3, delay: 0 },
    { x: "78%", y: "22%", size: 2, delay: 0.4 },
    { x: "85%", y: "62%", size: 4, delay: 0.8 },
    { x: "22%", y: "72%", size: 2, delay: 1.2 },
    { x: "55%", y: "8%", size: 2, delay: 0.6 },
    { x: "68%", y: "85%", size: 3, delay: 1.5 },
    { x: "38%", y: "45%", size: 2, delay: 0.2 },
    { x: "92%", y: "42%", size: 2, delay: 1.8 },
    { x: "48%", y: "28%", size: 2, delay: 2.1 },
    { x: "8%", y: "48%", size: 2, delay: 0.9 },
    { x: "72%", y: "12%", size: 2, delay: 1.4 },
  ];

  return (
    <div className="cb-land-emblem__dust" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="cb-land-emblem__dust-bit"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.9, 0.2], scale: [1, 1.4, 1] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

const HERO_ORBIT_LAYERS = {
  back: [
    { id: "b1", size: "132vmax", duration: 88, opacity: 0.068, dotCount: 3, dotDuration: 4.8 },
    { id: "b2", size: "118vmax", duration: 104, dashed: true, reverse: true, opacity: 0.052, dotCount: 2, dotDuration: 5.2 },
    { id: "b3", size: "104vmax", duration: 76, opacity: 0.046, dotCount: 2, dotDuration: 5.6, dotDelay: 1.1, hideTablet: true },
    { id: "b4", size: "92vmax", duration: 112, dashed: true, reverse: true, opacity: 0.038, dotCount: 2, dotDuration: 6, dotDelay: 0.5, hideTablet: true },
  ],
  mid: [
    { id: "m1", size: "78vmax", duration: 64, opacity: 0.078, dotCount: 3, dotDuration: 3.8 },
    { id: "m2", size: "66vmax", duration: 48, dashed: true, reverse: true, opacity: 0.068, dotCount: 2, dotDuration: 4.2 },
    { id: "m3", size: "56vmax", duration: 58, opacity: 0.072, dotCount: 2, dotDuration: 4.4, dotDelay: 0.7, hideTablet: true },
    { id: "m4", size: "48vmax", duration: 42, dashed: true, opacity: 0.062, dotCount: 2, dotDuration: 3.6, hideMobile: true },
  ],
  front: [
    { id: "f1", size: "40vmax", duration: 36, opacity: 0.095, dotCount: 2, dotDuration: 3.2 },
    { id: "f2", size: "34vmax", duration: 28, dashed: true, reverse: true, opacity: 0.085, dotCount: 2, dotDuration: 2.9 },
    { id: "f3", size: "28vmax", duration: 32, opacity: 0.09, dotCount: 2, dotDuration: 2.8, dotDelay: 0.5, dotSm: true },
  ],
};

const HERO_FIELD_PARTICLES = [
  { x: "5%", y: "18%", size: 2, duration: 9, delay: 0 },
  { x: "8%", y: "42%", size: 3, duration: 11, delay: 0.6 },
  { x: "11%", y: "68%", size: 2, duration: 10, delay: 1.4 },
  { x: "16%", y: "28%", size: 2, duration: 12, delay: 0.3 },
  { x: "20%", y: "52%", size: 3, duration: 9.5, delay: 1.8 },
  { x: "24%", y: "78%", size: 2, duration: 10.5, delay: 2.2 },
  { x: "30%", y: "14%", size: 2, duration: 11, delay: 0.9 },
  { x: "34%", y: "38%", size: 2, duration: 8.5, delay: 1.1 },
  { x: "38%", y: "62%", size: 3, duration: 13, delay: 2.6 },
  { x: "42%", y: "22%", size: 2, duration: 9, delay: 0.2 },
  { x: "48%", y: "48%", size: 2, duration: 10, delay: 1.6 },
  { x: "52%", y: "74%", size: 2, duration: 11.5, delay: 3 },
  { x: "58%", y: "32%", size: 2, duration: 8, delay: 0.7 },
  { x: "64%", y: "58%", size: 3, duration: 12, delay: 2 },
  { x: "72%", y: "20%", size: 2, duration: 9.5, delay: 1.2 },
  { x: "78%", y: "44%", size: 2, duration: 10, delay: 0.5 },
  { x: "84%", y: "66%", size: 2, duration: 11, delay: 2.8 },
  { x: "90%", y: "30%", size: 2, duration: 8.5, delay: 1.9 },
  { x: "94%", y: "80%", size: 2, duration: 12, delay: 3.4 },
];

function HeroOrbitRing({ ring, layer, reduceMotion }) {
  const dotCount = ring.dotCount ?? 0;

  return (
    <div
      className={[
        "cb-land-hero__orbit-wrap",
        `cb-land-hero__orbit-wrap--${layer}`,
        ring.dashed && "cb-land-hero__orbit-wrap--dashed",
        ring.reverse && "cb-land-hero__orbit-wrap--reverse",
        ring.hideTablet && "cb-land-hero__orbit-wrap--hide-tablet",
        ring.hideMobile && "cb-land-hero__orbit-wrap--hide-mobile",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--orbit-size": ring.size,
        "--orbit-duration": `${ring.duration}s`,
        "--orbit-opacity": ring.opacity,
        animationPlayState: reduceMotion ? "paused" : "running",
      }}
    >
      <div className="cb-land-hero__orbit-ring" />
      {Array.from({ length: dotCount }, (_, index) => (
        <div
          key={index}
          className="cb-land-hero__orbit-dot-arm"
          style={{ transform: `rotate(${(360 / dotCount) * index}deg)` }}
        >
          <motion.span
            className={[
              "cb-land-hero__orbit-dot",
              ring.dotSm && "cb-land-hero__orbit-dot--sm",
            ]
              .filter(Boolean)
              .join(" ")}
            animate={reduceMotion ? undefined : { opacity: [0.25, 0.85, 0.25], scale: [1, 1.25, 1] }}
            transition={{
              duration: ring.dotDuration ?? 3.5,
              repeat: Infinity,
              delay: (ring.dotDelay ?? 0) + index * 0.35,
              ease: "easeInOut",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function HeroOrbitalField() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="cb-land-hero__orbital-field" aria-hidden="true">
      <div className="cb-land-hero__orbital-glow" />
      <div className="cb-land-hero__orbital-center">
        <div className="cb-land-hero__orbital-layer cb-land-hero__orbital-layer--back">
          {HERO_ORBIT_LAYERS.back.map((ring) => (
            <HeroOrbitRing key={ring.id} ring={ring} layer="back" reduceMotion={reduceMotion} />
          ))}
        </div>
        <div className="cb-land-hero__orbital-layer cb-land-hero__orbital-layer--mid">
          {HERO_ORBIT_LAYERS.mid.map((ring) => (
            <HeroOrbitRing key={ring.id} ring={ring} layer="mid" reduceMotion={reduceMotion} />
          ))}
        </div>
        <div className="cb-land-hero__orbital-layer cb-land-hero__orbital-layer--front">
          {HERO_ORBIT_LAYERS.front.map((ring) => (
            <HeroOrbitRing key={ring.id} ring={ring} layer="front" reduceMotion={reduceMotion} />
          ))}
        </div>
      </div>
      <div className="cb-land-hero__field-particles">
        {HERO_FIELD_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="cb-land-hero__field-particle"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              animationPlayState: reduceMotion ? "paused" : "running",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function HeroEmblem() {
  return (
    <div className="cb-land-emblem" aria-hidden="true">
      <div className="cb-land-emblem__beam" />
      <HeroParticles />

      <svg className="cb-land-emblem__waves" viewBox="0 0 420 420" fill="none">
        <defs>
          <linearGradient id="cb-emblem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0d78c" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a8892a" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <motion.path
          d="M40 210c40-80 120-120 170-80s90 130 170 80"
          stroke="url(#cb-emblem-grad)"
          strokeWidth="1.2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: EASE }}
        />
        <motion.path
          d="M60 210c35-60 100-90 150-55s80 100 150 55"
          stroke="url(#cb-emblem-grad)"
          strokeWidth="0.8"
          opacity="0.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, delay: 0.3, ease: EASE }}
        />
        <motion.path
          d="M80 210c30-45 85-65 130-38s70 75 130 38"
          stroke="url(#cb-emblem-grad)"
          strokeWidth="0.6"
          opacity="0.35"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.8, delay: 0.5, ease: EASE }}
        />
      </svg>

      <div className="cb-land-emblem__orbit cb-land-emblem__orbit--1">
        <motion.span
          className="cb-land-emblem__orbit-dot"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="cb-land-emblem__orbit cb-land-emblem__orbit--2">
        <motion.span
          className="cb-land-emblem__orbit-dot cb-land-emblem__orbit-dot--sm"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.8, ease: "easeInOut" }}
        />
      </div>
      <div className="cb-land-emblem__orbit cb-land-emblem__orbit--3">
        <motion.span
          className="cb-land-emblem__orbit-dot cb-land-emblem__orbit-dot--lg"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 1.2, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="cb-land-emblem__seal"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="cb-land-emblem__seal-glow" />
        <span className="cb-land-emblem__monogram">CB</span>
        <span className="cb-land-emblem__sub">Est. Cairo</span>
      </motion.div>

      <div className="cb-land-emblem__ring cb-land-emblem__ring--1" />
      <div className="cb-land-emblem__ring cb-land-emblem__ring--2" />
    </div>
  );
}

function LandingHero() {
  const { locale } = useLocale();
  const { ref, rotateX, rotateY, onMove, onLeave } = useParallaxTilt();

  return (
    <section className="cb-land-hero" aria-label={locale === "ar" ? "الترحيب" : "Welcome"}>
      <div className="cb-land-hero__aurora" aria-hidden="true">
        <div className="cb-land-hero__orb cb-land-hero__orb--1" />
        <div className="cb-land-hero__orb cb-land-hero__orb--2" />
        <div className="cb-land-hero__orb cb-land-hero__orb--3" />
        <div className="cb-land-hero__veil" />
      </div>
      <HeroOrbitalField />
      <MouseGlow className="cb-land-hero__glow" />

      <div className="cb-land-hero__inner">
        <motion.div
          className="cb-land-hero__copy"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE }}
        >
          <motion.span
            className="cb-land-hero__eyebrow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: EASE }}
          >
            {locale === "ar" ? "تجربة VIP · مجموعة ٢٠٢٦" : "VIP Experience · Collection 2026"}
          </motion.span>

          <h1 className="cb-land-hero__title">
            <motion.span
              className="cb-land-hero__title-line"
              initial={{ opacity: 0, y: 60, clipPath: "inset(100% 0 0 0)" }}
              animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)" }}
              transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
            >
              Cairo Bags
            </motion.span>
            <motion.span
              className="cb-land-hero__title-line cb-land-hero__title-line--accent"
              initial={{ opacity: 0, y: 60, clipPath: "inset(100% 0 0 0)" }}
              animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)" }}
              transition={{ delay: 0.38, duration: 0.9, ease: EASE }}
            >
              {locale === "ar" ? "فخامة تُسافر معك" : "Luxury That Moves"}
            </motion.span>
          </h1>

          <motion.p
            className="cb-land-hero__desc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.8 }}
          >
            {locale === "ar"
              ? "تصاميم حصرية، خامات فاخرة، وتجربة تسوق premium — كل تفصيلة مصممة لتستحقك."
              : "Exclusive designs, refined materials, and a premium shopping experience — every detail crafted for you."}
          </motion.p>

          <motion.div
            className="cb-land-hero__actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7, ease: EASE }}
          >
            <Link to="/shop" className="cb-land-btn cb-land-btn--gold">
              {locale === "ar" ? "تسوق الآن" : "Shop Collection"}
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/shop#new-arrivals" className="cb-land-btn cb-land-btn--ghost">
              {locale === "ar" ? "اكتشف الجديد" : "Explore New"}
            </Link>
          </motion.div>

          <motion.div
            className="cb-land-hero__badges"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12, delayChildren: 0.85 } },
            }}
          >
            {[
              locale === "ar" ? "شحن سريع" : "Express Delivery",
              locale === "ar" ? "ضمان الجودة" : "Quality Guarantee",
              locale === "ar" ? "دعم VIP" : "VIP Support",
            ].map((label) => (
              <motion.span
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.92 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
                }}
              >
                {label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          ref={ref}
          className="cb-land-hero__visual"
          style={{ rotateX, rotateY, transformPerspective: 1200 }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          initial={{ opacity: 0, scale: 0.92, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 1.2, ease: EASE }}
        >
          <HeroEmblem />
        </motion.div>
      </div>
    </section>
  );
}

function LandingMarquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="cb-land-marquee" aria-hidden="true">
      <div className="cb-land-marquee__track">
        {items.map((t, i) => (
          <span key={`${t}-${i}`} className="cb-land-marquee__item">
            {t}
            <span className="cb-land-marquee__dot">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StoryMedallion() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="cb-land-story__medallion-wrap"
      animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        className="cb-land-story__medallion"
        whileHover={reduceMotion ? undefined : { scale: 1.07, y: -4 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        transition={{ type: "spring", stiffness: 420, damping: 16, mass: 0.7 }}
      >
        <span className="cb-land-story__medallion-glow" aria-hidden="true" />
        <span className="cb-land-story__medallion-ripple" aria-hidden="true" />
        <span className="cb-land-story__medallion-ripple cb-land-story__medallion-ripple--2" aria-hidden="true" />
        <span className="cb-land-story__medallion-shine" aria-hidden="true" />
        <span className="cb-land-story__medallion-text">CB</span>
      </motion.div>
    </motion.div>
  );
}

function LandingStory() {
  const { locale } = useLocale();
  const pillars = [
    {
      title: locale === "ar" ? "الحرفية" : "Craftsmanship",
      text: locale === "ar" ? "تفاصيل دقيقة في كل غرزة" : "Precision in every stitch",
    },
    {
      title: locale === "ar" ? "الخامات" : "Materials",
      text: locale === "ar" ? "جلد ونسيج premium" : "Premium leather & fabric",
    },
    {
      title: locale === "ar" ? "الخدمة" : "Service",
      text: locale === "ar" ? "دعم VIP على مدار الطلب" : "VIP support on demand",
    },
  ];

  return (
    <section className="cb-land-story">
      <div className="cb-land-container cb-land-story__grid">
        <motion.div
          className="cb-land-story__visual"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <div className="cb-land-story__art">
            <span className="cb-land-story__watermark">VIP</span>
            <motion.div
              className="cb-land-story__ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
              aria-hidden="true"
            />
            <div className="cb-land-story__lines" aria-hidden="true">
              <span /><span /><span />
            </div>
            <StoryMedallion />
            <p className="cb-land-story__since">{locale === "ar" ? "منذ القاهرة" : "From Cairo"}</p>
          </div>
        </motion.div>
        <motion.div
          className="cb-land-story__copy"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <span className="cb-land-section-head__tag">
            {locale === "ar" ? "قصتنا" : "Our Story"}
          </span>
          <h2 className="cb-land-section-head__title cb-land-section-head__title--left">
            {locale === "ar" ? "صُنعت للمسافر العصري" : "Built For The Modern Traveler"}
          </h2>
          <p>
            {locale === "ar"
              ? "كل قطعة في Cairo Bags تجمع بين جمال التصميم المصري ومعايير الجودة العالمية — تجربة premium تستحق كل جنيه."
              : "Every Cairo Bags piece blends Egyptian design heritage with world-class quality — a premium experience worth every moment."}
          </p>
          <div className="cb-land-story__pillars">
            {pillars.map((p) => (
              <div key={p.title} className="cb-land-story__pillar">
                <h4>{p.title}</h4>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LandingFeatured() {
  const { locale } = useLocale();
  return (
    <section className="cb-land-featured" id="features">
      <div className="cb-land-container">
        <FeaturedProducts
          title={locale === "ar" ? "قطع مميزة" : "Signature Pieces"}
          subtitle={locale === "ar" ? "الأكثر طلباً هذا الموسم" : "Most loved this season"}
        />
      </div>
    </section>
  );
}

function LandingNewArrivals() {
  return (
    <section className="cb-land-featured" id="new-arrivals">
      <div className="cb-land-container">
        <NewArrivals />
      </div>
    </section>
  );
}

export function LandingPage() {
  const sentinelRef = usePastHeroClass();

  return (
    <div className="cb-landing">
      <div className="cb-land-hero-wrapper">
        <LandingHero />
        <LandingMarquee />
        <div ref={sentinelRef} className="cb-land-hero__sentinel" aria-hidden="true" />
      </div>
      <div className="cb-land-light">
        <CollectionCards />
        <LandingStory />
        <HomeStatistics />
        <LandingFeatured />
        <LandingNewArrivals />
      </div>
    </div>
  );
}
