import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { LandingPage } from "../../components/landing/LandingPage.jsx";
import { scrollToHomeSection } from "../../utils/homeNav.js";

export function HomePage() {
  const { locale } = useLocale();
  const location = useLocation();
  usePageTitle(locale === "ar" ? "الرئيسية" : "Home");

  useEffect(() => {
    const sectionId = location.hash.replace("#", "");
    if (!sectionId) return undefined;

    const timer = window.setTimeout(() => {
      scrollToHomeSection(sectionId);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <StoreLayout fullWidth contentClassName="!py-0" className="cb-landing-shell">
      <LandingPage />
    </StoreLayout>
  );
}
