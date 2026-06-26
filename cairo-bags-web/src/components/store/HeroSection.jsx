import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Button } from "../ui/Button.jsx";
import { AnimatedCounter } from "../ui/animation.jsx";
import { EASE_LUXURY } from "../ui/motion.jsx";
import { MouseGlow } from "./MouseGlow.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

function HeroVisual({ locale, visualY }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div style={prefersReduced ? undefined : { y: visualY }} className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
      <motion.div
        className="absolute inset-[8%] rounded-[2rem] border border-brand-accent/20 bg-gradient-to-br from-brand-secondary/40 via-brand-surface/10 to-transparent"
        animate={prefersReduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#1a1814]"
        style={{
          boxShadow: "0 32px 80px -24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(201,169,98,0.22) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(234,228,216,0.08) 0%, transparent 45%), linear-gradient(165deg, #1a1814 0%, #0d0d0b 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-[10px] font-medium tracking-luxury text-brand-accent uppercase">
            {locale === "ar" ? "تصميم مصري" : "Egyptian Design"}
          </p>
          <div
            className="mt-6 font-display text-6xl font-light text-brand-accent/90 md:text-7xl"
            style={{ letterSpacing: "-0.04em" }}
            aria-hidden="true"
          >
            CB
          </div>
          <div className="mt-8 h-px w-16 bg-gradient-to-r from-transparent via-brand-accent to-transparent" />
          <p className="mt-6 max-w-[14rem] text-xs leading-relaxed text-brand-secondary/50">
            {locale === "ar"
              ? "حرفية فاخرة — جلد طبيعي — تفاصيل دقيقة"
              : "Premium leather — meticulous detail — timeless craft"}
          </p>
        </div>
        <div className="cb-grain pointer-events-none absolute inset-0 opacity-60" />
      </motion.div>
      <motion.div
        className="absolute -end-4 top-1/4 hidden h-20 w-20 rounded-full border border-brand-accent/30 bg-brand-accent/5 backdrop-blur-sm lg:block"
        animate={prefersReduced ? undefined : { y: [0, 14, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute -start-3 bottom-1/4 hidden h-14 w-14 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm lg:block"
        animate={prefersReduced ? undefined : { y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </motion.div>
  );
}

export function HeroSection({ className }) {
  const { locale } = useLocale();
  const ref = useRef(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : 72]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : 48]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, prefersReduced ? 1 : 0.96]);

  const stats = [
    { value: "500+", label: locale === "ar" ? "عميلة سعيدة" : "Happy Clients" },
    { value: "50+", label: locale === "ar" ? "تصميم حصري" : "Exclusive Designs" },
    { value: "100%", label: locale === "ar" ? "جلد طبيعي" : "Genuine Leather" },
  ];

  return (
    <section
      ref={ref}
      className={cn("relative overflow-hidden bg-brand-primary text-brand-secondary", className)}
    >
      <MouseGlow />
      <motion.div
        style={prefersReduced ? undefined : { y: bgY }}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(201,169,98,0.14)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(234,228,216,0.05)_0%,transparent_50%)]" />
        <div className="absolute start-[12%] top-[18%] h-40 w-40 rounded-full bg-brand-accent/[0.06] blur-3xl" />
        <div className="absolute end-[8%] bottom-[22%] h-56 w-56 rounded-full bg-white/[0.03] blur-3xl" />
      </motion.div>
      <div className="cb-grain pointer-events-none absolute inset-0" />

      <div className="cb-container-wide relative">
        <div className="grid min-h-[min(88vh,920px)] items-center gap-10 py-16 md:gap-12 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <motion.div
            style={prefersReduced ? undefined : { y: contentY, opacity, scale }}
            className="order-2 text-center lg:order-1 lg:text-start"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE_LUXURY }}
              className="text-[10px] font-medium tracking-luxury text-brand-accent uppercase sm:text-xs"
            >
              {locale === "ar" ? "مجموعة ٢٠٢٦" : "Collection 2026"}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: EASE_LUXURY }}
              className="cb-section-heading-xl mt-4 max-w-xl text-brand-secondary lg:mt-5"
            >
              {locale === "ar" ? (
                <>
                  فخامة القاهرة
                  <span className="block text-brand-accent">في كل قطعة</span>
                </>
              ) : (
                <>
                  Cairo Luxury,
                  <span className="block text-brand-accent">Crafted to Last</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: EASE_LUXURY }}
              className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-brand-secondary/65 md:text-base lg:mx-0"
            >
              {locale === "ar"
                ? "اكتشف حقائب يدوية الصنع تجمع بين الأناقة الخالدة والجودة الاستثنائية — مصممة للمرأة العصرية."
                : "Discover handcrafted bags that blend timeless elegance with exceptional quality — designed for the modern woman."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: EASE_LUXURY }}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Link to="/shop">
                <Button variant="accent" size="lg" className="h-12 min-w-[168px] rounded-full px-8">
                  {locale === "ar" ? "تسوق الآن" : "Shop Now"}
                </Button>
              </Link>
              <Link to="/shop?filter=new">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 min-w-[168px] rounded-full border-brand-accent/50 !text-brand-accent hover:!border-brand-accent hover:!bg-brand-accent/10"
                >
                  {locale === "ar" ? "وصل حديثاً" : "New Arrivals"}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: EASE_LUXURY }}
              className="mt-12 hidden items-center gap-8 border-t border-white/10 pt-8 lg:flex"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-light text-brand-accent">
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="mt-1 text-[10px] tracking-wide text-brand-secondary/45 uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE_LUXURY }}
            className="order-1 lg:order-2"
          >
            <HeroVisual locale={locale} visualY={visualY} />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-brand-background via-brand-background/80 to-transparent" />
    </section>
  );
}
