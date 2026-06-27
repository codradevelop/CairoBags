import { Link } from "react-router-dom";
import { useLocale } from "./LanguageSwitcher.jsx";

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/cairo.bags?igsh=MWxjMmNjYmZ5aHV0OA==" },
  { label: "Facebook", href: "https://www.facebook.com/share/18oTTG8XfA/" },
  { label: "TikTok", href: "https://www.tiktok.com/@cairo.bags1" },
  { label: "WhatsApp", href: "https://wa.me/201505259962" },
];

const columns = {
  shop: [
    { href: "/shop", en: "All Bags", ar: "كل الحقائب" },
    { href: "/#new-arrivals", en: "New Arrivals", ar: "وصل حديثاً" },
    { href: "/#categories", en: "Categories", ar: "التصنيفات" },
    { href: "/#features", en: "Featured", ar: "مميز" },
  ],
  support: [
    { href: "/contact", en: "Contact", ar: "تواصل معنا" },
    { href: "/shipping", en: "Shipping", ar: "الشحن" },
    { href: "/returns", en: "Returns", ar: "الاسترجاع" },
    { href: "/faq", en: "FAQ", ar: "الأسئلة الشائعة" },
  ],
  about: [
    { href: "/login", en: "Sign In", ar: "تسجيل الدخول" },
    { href: "/account/orders", en: "My Orders", ar: "طلباتي" },
    { href: "/wishlist", en: "Wishlist", ar: "المفضلة" },
    { href: "/account", en: "Profile", ar: "الملف الشخصي" },
  ],
};

function FooterCol({ title, links, locale }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a962]/70">{title}</h3>
      <ul className="mt-2.5 space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-sm text-white/55 transition-colors hover:text-[#e8d5a3]">
              {locale === "ar" ? link.ar : link.en}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShopFooter() {
  const { locale } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="cb-shop-footer">
      <div className="cb-shop-footer-inner">
        <div className="cb-shop-footer-newsletter">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a962]">
              {locale === "ar" ? "النشرة البريدية" : "Newsletter"}
            </p>
            <h3 className="mt-0.5 font-display text-lg font-light text-white/90">
              {locale === "ar" ? "انضم إلى عالم Cairo Bags" : "Join the Cairo Bags World"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-white/45">
              {locale === "ar"
                ? "عروض حصرية وإطلاقات جديدة — مباشرة إلى بريدك."
                : "Exclusive offers and new collection drops — straight to your inbox."}
            </p>
          </div>
          <Link
            to="/#newsletter"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[#c9a962]/40 px-7 text-xs font-medium text-[#c9a962] transition-colors hover:bg-[#c9a962]/10"
          >
            {locale === "ar" ? "اشترك الآن" : "Subscribe Now"}
          </Link>
        </div>

        <div className="cb-shop-footer-grid">
          <div>
            <Link to="/" className="font-display text-xl font-medium text-[#e8d5a3]">
              Cairo Bags
            </Link>
            <div className="mt-3 flex gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-xs text-white/40 hover:border-[#c9a962]/50 hover:text-[#c9a962]"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <FooterCol title={locale === "ar" ? "تسوق" : "Shop"} links={columns.shop} locale={locale} />
            <FooterCol
              title={locale === "ar" ? "خدمة العملاء" : "Customer Service"}
              links={columns.support}
              locale={locale}
            />
            <FooterCol title={locale === "ar" ? "حسابي" : "About Us"} links={columns.about} locale={locale} />
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a962]/70">
              {locale === "ar" ? "لماذا تثق بنا" : "Why Trust Us"}
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-sm text-white/55">
              {(locale === "ar"
                ? ["دفع آمن", "حرفية أصيلة", "تغليف فاخر", "توصيل سريع"]
                : ["Secure Checkout", "Authentic Craft", "Premium Packaging", "Fast Delivery"]
              ).map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[#c9a962]/80" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Visa", "Mastercard", "InstaPay", "Vodafone Cash"].map((m) => (
                <span
                  key={m}
                  className="rounded border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[9px] text-white/40"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="cb-shop-footer-bottom">
          <p>
            © {year} Cairo Bags. {locale === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-[#e8d5a3]">
              {locale === "ar" ? "الخصوصية" : "Privacy"}
            </a>
            <a href="/terms" className="hover:text-[#e8d5a3]">
              {locale === "ar" ? "الشروط" : "Terms"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
