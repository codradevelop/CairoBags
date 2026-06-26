import { Link } from "react-router-dom";
import { ScrollReveal } from "../ui/motion.jsx";
import { useLocale } from "./LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

const footerLinks = {
  shop: [
    { href: "/shop", labelEn: "All Bags", labelAr: "كل الحقائب" },
    { href: "/shop?filter=new", labelEn: "New Arrivals", labelAr: "وصل حديثاً" },
    { href: "/#categories", labelEn: "Categories", labelAr: "التصنيفات" },
    { href: "/#featured", labelEn: "Featured", labelAr: "مميز" },
  ],
  support: [
    { href: "/contact", labelEn: "Contact", labelAr: "تواصل معنا" },
    { href: "/shipping", labelEn: "Shipping", labelAr: "الشحن" },
    { href: "/returns", labelEn: "Returns", labelAr: "الاسترجاع" },
    { href: "/faq", labelEn: "FAQ", labelAr: "الأسئلة الشائعة" },
  ],
  account: [
    { href: "/login", labelEn: "Sign In", labelAr: "تسجيل الدخول" },
    { href: "/account/orders", labelEn: "My Orders", labelAr: "طلباتي" },
    { href: "/wishlist", labelEn: "Wishlist", labelAr: "المفضلة" },
    { href: "/account", labelEn: "Profile", labelAr: "الملف الشخصي" },
  ],
};

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/cairo.bags?igsh=MWxjMmNjYmZ5aHV0OA==",
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/18oTTG8XfA/",
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@cairo.bags1?is_from_webapp=1&sender_device=pc",
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.86a8.17 8.17 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/201505259962",
    external: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
];

const trustBadges = [
  { en: "Secure Checkout", ar: "دفع آمن" },
  { en: "Authentic Craft", ar: "حرفية أصيلة" },
  { en: "Premium Packaging", ar: "تغليف فاخر" },
  { en: "Fast Delivery", ar: "توصيل سريع" },
];

function FooterColumn({ title, links, locale }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-accent/70">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="cb-underline-reveal text-sm text-brand-secondary/60 transition-colors duration-300 hover:text-brand-accent-muted"
            >
              {locale === "ar" ? link.labelAr : link.labelEn}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ className }) {
  const { locale } = useLocale();
  const year = new Date().getFullYear();

  const titles = {
    shop: locale === "ar" ? "تسوق" : "Shop",
    support: locale === "ar" ? "خدمة العملاء" : "Customer Service",
    account: locale === "ar" ? "حسابي" : "About Us",
  };

  return (
    <footer className={cn("relative overflow-hidden bg-[#0d0d0d] text-brand-secondary", className)}>
      <div className="cb-container-wide relative max-w-[1280px]">
        <ScrollReveal className="border-b border-white/[0.06] py-8 md:py-9">
          <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:justify-between lg:text-start">
            <div className="max-w-lg">
              <p className="text-[10px] font-medium tracking-[0.2em] text-brand-accent uppercase">
                {locale === "ar" ? "النشرة البريدية" : "Newsletter"}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-light text-brand-secondary md:text-2xl">
                {locale === "ar" ? "انضم إلى عالم Cairo Bags" : "Join the Cairo Bags World"}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-brand-secondary/50">
                {locale === "ar"
                  ? "عروض حصرية وإطلاقات جديدة — مباشرة إلى بريدك."
                  : "Exclusive offers and new collection drops — straight to your inbox."}
              </p>
            </div>
            <Link
              to="/#newsletter"
              className="inline-flex h-10 items-center justify-center rounded-full border border-brand-accent/40 px-7 text-xs font-medium tracking-wide text-brand-accent transition-all duration-300 hover:border-brand-accent hover:bg-brand-accent/10"
            >
              {locale === "ar" ? "اشترك الآن" : "Subscribe Now"}
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 py-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-6 lg:py-9">
          <ScrollReveal className="lg:col-span-4">
            <Link
              to="/"
              className="cb-text-gradient-gold font-display text-xl font-medium"
              style={{ letterSpacing: "-0.03em" }}
            >
              Cairo Bags
            </Link>
            <div className="mt-4 flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  {...(social.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-brand-secondary/45 transition-all duration-300 hover:border-brand-accent/50 hover:text-brand-accent"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 lg:gap-6">
            <FooterColumn title={titles.shop} links={footerLinks.shop} locale={locale} />
            <FooterColumn title={titles.support} links={footerLinks.support} locale={locale} />
            <FooterColumn title={titles.account} links={footerLinks.account} locale={locale} />
          </div>

          <ScrollReveal className="lg:col-span-3">
            <h3 className="text-[10px] font-semibold tracking-[0.18em] uppercase text-brand-accent/70">
              {locale === "ar" ? "لماذا تثق بنا" : "Why Trust Us"}
            </h3>
            <ul className="mt-3 space-y-2">
              {trustBadges.map((badge) => (
                <li
                  key={badge.en}
                  className="flex items-center gap-2 text-sm text-brand-secondary/55"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-brand-accent/80" />
                  {locale === "ar" ? badge.ar : badge.en}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {["Visa", "Mastercard", "InstaPay", "Vodafone Cash"].map((method) => (
                <span
                  key={method}
                  className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium tracking-wide text-brand-secondary/40"
                >
                  {method}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] py-5 sm:flex-row">
          <p className="text-[11px] text-brand-secondary/35">
            © {year} Cairo Bags. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <div className="flex gap-5 text-[11px] text-brand-secondary/35">
            <a href="/privacy" className="transition-colors hover:text-brand-accent-muted">
              {locale === "ar" ? "الخصوصية" : "Privacy"}
            </a>
            <a href="/terms" className="transition-colors hover:text-brand-accent-muted">
              {locale === "ar" ? "الشروط" : "Terms"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
