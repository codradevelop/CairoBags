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
import { SectionDivider, FloatingBackground } from "../../components/store/SectionDivider.jsx";

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
      <div className="relative">
        <FloatingBackground />
        <div className="cb-container-wide relative space-y-0">
          <section id="categories" className="cb-section-tight scroll-mt-28">
            <CategoryGrid />
          </section>
          <SectionDivider />
          <section id="features" className="cb-section-tight scroll-mt-28">
            <FeaturedProducts />
          </section>
          <SectionDivider />
          <section id="new-arrivals" className="cb-section-tight scroll-mt-28">
            <NewArrivals />
          </section>
          <SectionDivider label={locale === "ar" ? "القيمة" : "Values"} />
          <section className="cb-section-tight">
            <WhyChooseSection />
          </section>
          <SectionDivider />
          <section id="newsletter" className="cb-section-tight scroll-mt-28 pb-16 md:pb-20">
            <NewsletterSection />
          </section>
        </div>
      </div>
    </StoreLayout>
  );
}
