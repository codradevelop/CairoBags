import { Link } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export function HeroSection({ className }) {
  const { locale } = useLocale();

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-brand-primary text-brand-secondary",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,98,0.15)_0%,_transparent_60%)]" />
      <div className="cb-container relative flex min-h-[70vh] flex-col items-center justify-center py-16 text-center md:min-h-[75vh] md:py-24">
        <p className="text-xs font-medium tracking-[0.35em] text-brand-accent uppercase">
          {locale === "ar" ? "مجموعة ٢٠٢٦" : "Collection 2026"}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight md:text-6xl">
          {locale === "ar" ? "فخامة القاهرة في كل قطعة" : "Cairo Luxury, Crafted to Last"}
        </h1>
        <p className="mt-5 max-w-xl text-sm text-brand-secondary/80 md:text-base">
          {locale === "ar"
            ? "اكتشف حقائب يدوية الصنع تجمع بين الأناقة الخالدة والجودة الاستثنائية"
            : "Discover handcrafted bags that blend timeless elegance with exceptional quality"}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/shop">
            <Button variant="accent" size="lg" className="h-12 min-w-[160px] px-6 text-base">
              {locale === "ar" ? "تسوق الآن" : "Shop Now"}
            </Button>
          </Link>
          <Link to="/shop?filter=new">
            <Button
              variant="outline"
              size="lg"
              className="h-12 min-w-[160px] px-6 text-base !border-brand-accent/80 !text-brand-accent hover:!border-brand-accent hover:!bg-brand-accent/10 hover:!text-brand-accent"
            >
              {locale === "ar" ? "وصل حديثاً" : "New Arrivals"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
