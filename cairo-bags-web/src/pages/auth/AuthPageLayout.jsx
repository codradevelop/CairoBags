import { Link } from "react-router-dom";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { LanguageSwitcher } from "../../components/layout/LanguageSwitcher.jsx";
import { ThemeSwitcher } from "../../components/layout/ThemeSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export function AuthPageLayout({ children, className, variant = "card" }) {
  const { locale } = useLocale();
  const isSliding = variant === "sliding";

  return (
    <div className="min-h-screen bg-brand-background">
      <header className="border-b border-brand-border/60 bg-brand-background/90 backdrop-blur-sm">
        <div className="cb-container flex min-h-16 items-center justify-between py-3">
          <Link
            to="/"
            className="font-display text-xl font-semibold tracking-[0.12em] text-brand-primary uppercase"
          >
            Cairo Bags
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "cb-container flex flex-1 flex-col items-center justify-center py-10 md:py-16",
          className
        )}
      >
        <div className={cn("w-full", isSliding ? "max-w-[850px]" : "max-w-md")}>
          <div className="mb-8 text-center">
            <p className="text-xs font-medium tracking-[0.25em] text-brand-accent uppercase">
              {locale === "ar" ? "مجموعة القاهرة" : "Cairo Collection"}
            </p>
          </div>
          {children}
        </div>
      </main>

      <footer className="border-t border-brand-border/60 py-6">
        <p className="text-center text-xs tracking-wide text-brand-muted">
          © {new Date().getFullYear()} Cairo Bags
        </p>
      </footer>
    </div>
  );
}
