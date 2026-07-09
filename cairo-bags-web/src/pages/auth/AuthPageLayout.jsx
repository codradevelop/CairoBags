import { Header } from "../../components/layout/Header.jsx";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export function AuthPageLayout({ children, className, variant = "card" }) {
  const { locale } = useLocale();
  const isSliding = variant === "sliding";

  return (
    <div className="flex min-h-screen flex-col bg-brand-background">
      <Header />

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
