import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as wishlistService from "../services/wishlistService.js";
import {
  normalizeWishlistCountResponse,
  normalizeWishlistResponse,
  normalizeWishlistToggleResponse,
} from "../utils/wishlistHelpers.js";
import { normalizeError } from "../utils/normalizeError.js";
import { assertStoreShoppingAllowed } from "../utils/storePermissions.js";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const productIds = useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items]
  );

  const resetWishlist = useCallback(() => {
    setItems([]);
    setCount(0);
    setError(null);
  }, []);

  const loadWishlist = useCallback(async (config = {}) => {
    if (!isAuthenticated) {
      resetWishlist();
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const data = normalizeWishlistResponse(await wishlistService.getWishlist(config));
      setItems(data.items);
      setCount(data.count);
      return data;
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.isCanceled) return null;
      setError(normalized);
      throw normalized;
    } finally {
      if (!config.signal?.aborted) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, resetWishlist]);

  const refreshCount = useCallback(async (config = {}) => {
    if (!isAuthenticated) {
      resetWishlist();
      return 0;
    }

    try {
      const data = normalizeWishlistCountResponse(await wishlistService.getWishlistCount(config));
      setCount(data.count);
      return data.count;
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.isCanceled) return count;
      setError(normalized);
      throw normalized;
    }
  }, [count, isAuthenticated, resetWishlist]);

  const toggleWishlist = useCallback(
    async (productId) => {
      assertStoreShoppingAllowed(user);
      if (!isAuthenticated) {
        const authError = normalizeError({ response: { status: 401, data: { message: "Authentication is required." } } });
        throw authError;
      }

      setError(null);
      try {
        const data = normalizeWishlistToggleResponse(
          await wishlistService.toggleWishlist(productId)
        );

        setCount(data.wishlistCount);

        if (data.isInWishlist) {
          await loadWishlist();
        } else {
          setItems((current) => current.filter((item) => item.productId !== productId));
        }

        return data;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      }
    },
    [isAuthenticated, loadWishlist, user]
  );

  const remove = useCallback(
    async (productId) => {
      assertStoreShoppingAllowed(user);
      if (!isAuthenticated) {
        const authError = normalizeError({ response: { status: 401, data: { message: "Authentication is required." } } });
        throw authError;
      }

      setError(null);
      try {
        const data = normalizeWishlistToggleResponse(
          await wishlistService.removeWishlistItem(productId)
        );

        setCount(data.wishlistCount);
        setItems((current) => current.filter((item) => item.productId !== productId));
        return data;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      }
    },
    [isAuthenticated, user]
  );

  const isInWishlist = useCallback(
    (productId) => productIds.has(Number(productId)),
    [productIds]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (!isAuthenticated) {
      resetWishlist();
      return () => controller.abort();
    }

    setLoading(true);
    Promise.all([
      wishlistService.getWishlist({ signal: controller.signal }),
      wishlistService.getWishlistCount({ signal: controller.signal }),
    ])
      .then(([listData, countData]) => {
        const list = normalizeWishlistResponse(listData);
        const countResult = normalizeWishlistCountResponse(countData);
        setItems(list.items);
        setCount(countResult.count || list.count);
        setError(null);
      })
      .catch((err) => {
        const normalized = normalizeError(err);
        if (normalized.isCanceled) return;
        setError(normalized);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [isAuthenticated, resetWishlist]);

  const value = useMemo(
    () => ({
      items,
      count,
      loading,
      error,
      productIds,
      loadWishlist,
      toggleWishlist,
      remove,
      refreshCount,
      isInWishlist,
    }),
    [
      items,
      count,
      loading,
      error,
      productIds,
      loadWishlist,
      toggleWishlist,
      remove,
      refreshCount,
      isInWishlist,
    ]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
