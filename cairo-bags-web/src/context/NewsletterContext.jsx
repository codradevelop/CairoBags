import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as newsletterService from "../services/newsletterService.js";
import { normalizeError } from "../utils/normalizeError.js";
import {
  clearGuestNewsletterSubscription,
  getGuestNewsletterSubscription,
  setGuestNewsletterSubscription,
} from "../utils/newsletterStorage.js";
import { useAuth } from "./AuthContext.jsx";

const NewsletterContext = createContext(null);

function applyGuestSubscriptionState(setIsSubscribed, setLoaded, setLoading) {
  const guest = getGuestNewsletterSubscription();
  setIsSubscribed(Boolean(guest?.subscribed));
  setLoading(false);
  setLoaded(true);
}

export function NewsletterProvider({ children }) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loaded, setLoaded] = useState(true);
  const [loading, setLoading] = useState(false);
  const requestGenerationRef = useRef(0);

  const resetNewsletterState = useCallback(() => {
    requestGenerationRef.current += 1;
    applyGuestSubscriptionState(setIsSubscribed, setLoaded, setLoading);
  }, []);

  const loadSubscription = useCallback(async (generation) => {
    setIsSubscribed(false);
    setLoaded(false);
    setLoading(true);

    try {
      clearGuestNewsletterSubscription();
      const data = await newsletterService.getMyNewsletterStatus();

      if (generation !== requestGenerationRef.current) return;

      setIsSubscribed(Boolean(data?.isSubscribed));
    } catch (err) {
      if (generation !== requestGenerationRef.current) return;

      const normalized = normalizeError(err);
      if (!normalized.isCanceled) {
        setIsSubscribed(false);
      }
    } finally {
      if (generation !== requestGenerationRef.current) return;

      setLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      resetNewsletterState();
      return;
    }

    requestGenerationRef.current += 1;
    const generation = requestGenerationRef.current;

    loadSubscription(generation);

    return () => {
      requestGenerationRef.current += 1;
    };
  }, [user?.id, loadSubscription, resetNewsletterState]);

  const markSubscribed = useCallback(
    (email) => {
      setIsSubscribed(true);
      setLoading(false);
      setLoaded(true);
      if (!user?.id && email) {
        setGuestNewsletterSubscription(email);
      }
    },
    [user?.id]
  );

  const markUnsubscribed = useCallback(() => {
    resetNewsletterState();
    clearGuestNewsletterSubscription();
  }, [resetNewsletterState]);

  const refreshSubscriptionStatus = useCallback(() => {
    if (!user?.id) {
      resetNewsletterState();
      return Promise.resolve();
    }

    requestGenerationRef.current += 1;
    const generation = requestGenerationRef.current;
    return loadSubscription(generation);
  }, [user?.id, loadSubscription, resetNewsletterState]);

  const showLoadingSkeleton = Boolean(user?.id) && !loaded;

  const value = useMemo(
    () => ({
      isSubscribed,
      loaded,
      loading,
      showLoadingSkeleton,
      markSubscribed,
      markUnsubscribed,
      refreshSubscriptionStatus,
    }),
    [
      isSubscribed,
      loaded,
      loading,
      showLoadingSkeleton,
      markSubscribed,
      markUnsubscribed,
      refreshSubscriptionStatus,
    ]
  );

  return (
    <NewsletterContext.Provider value={value}>{children}</NewsletterContext.Provider>
  );
}

export function useNewsletter() {
  const context = useContext(NewsletterContext);
  if (!context) {
    throw new Error("useNewsletter must be used within NewsletterProvider");
  }
  return context;
}
