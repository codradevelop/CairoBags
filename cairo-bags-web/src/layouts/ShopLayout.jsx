import { StoreLayout } from "./StoreLayout.jsx";

export function ShopLayout({ children }) {
  return (
    <StoreLayout fullWidth contentClassName="!py-0" className="cb-shop-page">
      {children}
    </StoreLayout>
  );
}
