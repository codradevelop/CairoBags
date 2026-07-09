import { useCallback, useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Skeleton } from "../ui/index.js";
import { getHomeStatistics } from "../../services/statisticsService.js";
import {
  ensureStatisticsHubConnected,
  subscribeStatisticsUpdates,
} from "../../services/statisticsHub.js";

const EASE = [0.16, 1, 0.3, 1];
const INITIAL_COUNTER_DURATION = 1.8;
const REALTIME_COUNTER_DURATION = 0.7;

const STAT_KEYS = [
  { key: "registeredCustomers", pascalKey: "RegisteredCustomers", suffix: "+" },
  { key: "premiumProducts", pascalKey: "PremiumProducts", suffix: "+" },
  { key: "completedOrders", pascalKey: "CompletedOrders", suffix: "+" },
  { key: "customerSatisfaction", pascalKey: "CustomerSatisfaction", suffix: "%" },
];

function readStatValue(data, camelKey, pascalKey) {
  if (!data) return 0;
  const value = data[camelKey] ?? data[pascalKey];
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatStatValue(value) {
  return value.toLocaleString("en-US");
}

function StatValue({
  statKey,
  value,
  previousValue,
  suffix,
  loading,
  error,
  inView,
  delay = 0,
}) {
  if (loading) {
    return <Skeleton className="cb-land-stat__skeleton" aria-hidden="true" />;
  }

  if (error) {
    return <span className="cb-land-stat__fallback">--</span>;
  }

  if (!inView) {
    return <span className="cb-land-stat__placeholder">0{suffix}</span>;
  }

  const hasPrevious = previousValue !== null && previousValue !== undefined;
  const changed = hasPrevious && previousValue !== value;
  const start = changed ? previousValue : 0;
  const duration = changed ? REALTIME_COUNTER_DURATION : INITIAL_COUNTER_DURATION;

  if (hasPrevious && !changed) {
    return (
      <>
        {formatStatValue(value)}
        {suffix}
      </>
    );
  }

  return (
    <>
      <CountUp
        key={`${statKey}-${start}-${value}-${duration}`}
        start={start}
        end={value}
        duration={duration}
        delay={delay}
        separator=","
        useEasing
        easingFn={(t, b, c, d) => {
          const progress = t / d;
          const eased = 1 - (1 - progress) ** 3;
          return c * eased + b;
        }}
        preserveValue
      />
      {suffix}
    </>
  );
}

export function HomeStatistics() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const [statistics, setStatistics] = useState(null);
  const [previousStatistics, setPreviousStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

  const applyStatisticsUpdate = useCallback((data) => {
    setStatistics((current) => {
      if (current) {
        setPreviousStatistics(current);
      }
      return data;
    });
    setError(false);
    setLoading(false);
  }, []);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await getHomeStatistics();
      setPreviousStatistics(null);
      setStatistics(data);
    } catch {
      setStatistics(null);
      setPreviousStatistics(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  useEffect(() => {
    const unsubscribe = subscribeStatisticsUpdates(applyStatisticsUpdate);
    ensureStatisticsHubConnected().catch(() => {});
    return unsubscribe;
  }, [applyStatisticsUpdate]);

  const items = useMemo(
    () =>
      STAT_KEYS.map((stat) => ({
        ...stat,
        value: readStatValue(statistics, stat.key, stat.pascalKey),
        previousValue: previousStatistics
          ? readStatValue(previousStatistics, stat.key, stat.pascalKey)
          : null,
        label:
          stat.key === "registeredCustomers"
            ? isAr
              ? "عميل مسجل"
              : "Registered Customers"
            : stat.key === "premiumProducts"
              ? isAr
                ? "منتج مميز"
                : "Premium Products"
              : stat.key === "completedOrders"
                ? isAr
                  ? "طلب مكتمل"
                  : "Completed Orders"
                : isAr
                  ? "رضا العملاء"
                  : "Customer Satisfaction",
      })),
    [isAr, previousStatistics, statistics]
  );

  return (
    <section className="cb-land-stats" ref={ref} aria-busy={loading} aria-live="polite">
      <div className="cb-land-container cb-land-stats__row">
        {items.map((item, index) => (
          <motion.div
            key={item.key}
            className="cb-land-stat"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6, ease: EASE }}
          >
            <p className="cb-land-stat__value">
              <StatValue
                statKey={item.key}
                value={item.value}
                previousValue={item.previousValue}
                suffix={item.suffix}
                loading={loading}
                error={error}
                inView={inView}
                delay={index * 0.08}
              />
            </p>
            <p className="cb-land-stat__label">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
