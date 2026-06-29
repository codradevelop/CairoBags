import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { getProductRatingStats } from "../utils/reviewHelpers.js";
import { publishReviewChange } from "../utils/reviewEvents.js";
import { STORE_EVENTS } from "../constants/storeEvents.js";
import { useStoreSync } from "../hooks/useStoreSync.js";

const ProductRatingContext = createContext(null);

export function ProductRatingProvider({ children }) {
  const [overrides, setOverrides] = useState(() => new Map());

  const setProductRating = useCallback((productId, stats) => {
    if (!productId || !stats) return;
    const id = Number(productId);
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, stats);
      return next;
    });
    publishReviewChange({ productId: id, stats });
  }, []);

  useStoreSync(
    [STORE_EVENTS.ReviewCreated, STORE_EVENTS.ReviewUpdated, STORE_EVENTS.ReviewDeleted],
    (payload) => {
      const productId = payload?.productId ?? payload?.ProductId;
      if (!productId) return;
      const averageRating = payload?.averageRating ?? payload?.AverageRating;
      const reviewCount = payload?.reviewCount ?? payload?.ReviewCount;
      if (averageRating == null && reviewCount == null) return;
      setProductRating(productId, {
        averageRating: averageRating ?? 0,
        reviewCount: reviewCount ?? 0,
      });
    }
  );

  const getRatingForProduct = useCallback(
    (product) => {
      const productId = Number(product?.id ?? product?.Id ?? product?.productId ?? product?.ProductId);
      if (productId && overrides.has(productId)) {
        return overrides.get(productId);
      }
      return getProductRatingStats(product);
    },
    [overrides]
  );

  const value = useMemo(
    () => ({ setProductRating, getRatingForProduct }),
    [setProductRating, getRatingForProduct]
  );

  return (
    <ProductRatingContext.Provider value={value}>{children}</ProductRatingContext.Provider>
  );
}

export function useProductRatings() {
  const context = useContext(ProductRatingContext);
  if (!context) {
    throw new Error("useProductRatings must be used within ProductRatingProvider");
  }
  return context;
}

export function useProductRating(product) {
  const { getRatingForProduct } = useProductRatings();
  return getRatingForProduct(product);
}
