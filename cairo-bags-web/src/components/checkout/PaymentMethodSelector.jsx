import { PAYMENT_METHOD_OPTIONS } from "../../constants/paymentMethodOptions.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { InstaPayDetails } from "./InstaPayDetails.jsx";
import { MobileWalletDetails } from "./MobileWalletDetails.jsx";
import { cn } from "../../utils/cn.js";

function PaymentAccordion({ open, children }) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}

export function PaymentMethodSelector({ value, onChange, className }) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div className={cn("space-y-5", className)}>
      <h3 className="font-display text-lg font-semibold text-brand-text">
        {isAr ? "طريقة الدفع" : "Payment Method"}
      </h3>

      <div className="space-y-3.5">
        {PAYMENT_METHOD_OPTIONS.map((method) => {
          const selected = value === method.value;
          const label = isAr ? method.labelAr : method.labelEn;
          const description = isAr ? method.descriptionAr : method.descriptionEn;

          return (
            <div key={method.value}>
              <label
                className={cn(
                  "flex cursor-pointer gap-3.5 rounded-2xl border p-4 transition-all duration-250 sm:p-5",
                  selected
                    ? "border-brand-accent/60 bg-brand-accent/5 shadow-[0_6px_28px_-10px_rgba(201,169,98,0.5)]"
                    : "border-brand-border hover:border-brand-accent/35 hover:shadow-sm"
                )}
              >
                <input
                  type="radio"
                  name="payment-method"
                  className="mt-1 accent-brand-accent"
                  checked={selected}
                  onChange={() => onChange(method.value)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {method.recommended ? (
                      <span className="text-brand-accent" aria-hidden="true">
                        ★
                      </span>
                    ) : null}
                    <p className="font-display text-base font-semibold text-brand-text sm:text-lg">
                      {label}
                    </p>
                    {method.recommended ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          "border-brand-accent/40 bg-brand-accent/12 text-brand-accent"
                        )}
                      >
                        {isAr ? "موصى به" : "Recommended"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">{description}</p>
                </div>
              </label>

              {method.isInstaPay ? (
                <PaymentAccordion open={selected}>
                  <InstaPayDetails />
                </PaymentAccordion>
              ) : null}

              {method.isMobileWallet ? (
                <PaymentAccordion open={selected}>
                  <MobileWalletDetails />
                </PaymentAccordion>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
