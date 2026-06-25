import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { scrollToHomeSection } from "../../utils/homeNav.js";
import {
  HeroSection,
  CategoryGrid,
  FeaturedProducts,
  NewArrivals,
  WhyChooseSection,
  NewsletterSection,
} from "../../components/store/index.js";

export function HomePage() {
  const { locale } = useLocale();
  const location = useLocation();
  usePageTitle(locale === "ar" ? "الرئيسية" : "Home");

  useEffect(() => {
    const sectionId = location.hash.replace("#", "");
    if (!sectionId) return;

    const timer = window.setTimeout(() => {
      scrollToHomeSection(sectionId);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <StoreLayout fullWidth contentClassName="!py-0">
      <HeroSection />
      <div className="cb-container space-y-16 py-12 md:space-y-20 md:py-16">
        <section id="categories" className="scroll-mt-28">
          <CategoryGrid />
        </section>
        <section id="featured" className="scroll-mt-28">
          <FeaturedProducts />
        </section>
        <section id="new-arrivals" className="scroll-mt-28">
          <NewArrivals />
        </section>
        <WhyChooseSection />
        <NewsletterSection />
      </div>
    </StoreLayout>
  );
}
