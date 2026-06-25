import vodafoneLogo from "../../assets/payment/vodafone-cash.svg";
import orangeLogo from "../../assets/payment/orange-money.svg";
import etisalatLogo from "../../assets/payment/etisalat-cash.svg";
import wePayLogo from "../../assets/payment/we-pay.svg";
import { cn } from "../../utils/cn.js";

export const MOBILE_WALLET_BRANDS = [
  { id: "vodafone", label: "Vodafone Cash", logo: vodafoneLogo },
  { id: "orange", label: "Orange Money", logo: orangeLogo },
  { id: "etisalat", label: "Etisalat Cash", logo: etisalatLogo },
  { id: "we", label: "WE Pay", logo: wePayLogo },
];

export function WalletBrandLogos({ className }) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5",
        className
      )}
    >
      {MOBILE_WALLET_BRANDS.map((brand) => (
        <div key={brand.id} className="flex flex-col items-center gap-2.5">
          <div
            className={cn(
              "flex aspect-square w-full max-w-[7.5rem] items-center justify-center overflow-hidden rounded-2xl",
              "shadow-[0_8px_24px_-10px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition-transform duration-200 hover:scale-[1.02]",
              "sm:max-w-[8.5rem]"
            )}
          >
            <img
              src={brand.logo}
              alt={brand.label}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="text-center text-xs font-semibold text-brand-muted sm:text-sm">
            {brand.label}
          </span>
        </div>
      ))}
    </div>
  );
}
