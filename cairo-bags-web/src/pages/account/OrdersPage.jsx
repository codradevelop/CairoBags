import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountLayout } from "../../layouts/AccountLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import * as orderService from "../../services/orderService.js";
import { OrderCard, EmptyOrders } from "../../components/account/index.js";
import { ORDER_STATUS_FILTER_OPTIONS } from "../../constants/orderStatusLabels.js";
import { getOrderNumber, getOrderStatus } from "../../utils/orderHelpers.js";
import { Button, Input, Skeleton } from "../../components/ui/index.js";

export function OrdersPage() {
  const { locale } = useLocale();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const title = locale === "ar" ? "طلباتي" : "My Orders";
  usePageTitle(title);

  const loadOrders = useCallback(() => {
    setLoading(true);
    orderService
      .getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleReviewSaved = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const number = getOrderNumber(order).toLowerCase();
      const status = getOrderStatus(order);
      const matchesSearch = !search.trim() || number.includes(search.trim().toLowerCase());
      const matchesStatus = !statusFilter || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <AccountLayout activeKey="orders" title={title}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label htmlFor="order-search" className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "بحث برقم الطلب" : "Search by order number"}
          </label>
          <Input
            id="order-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "ar" ? "مثال: CB-2026-0001" : "e.g. CB-2026-0001"}
          />
        </div>
        <div className="w-full lg:w-56">
          <label htmlFor="order-status" className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "الحالة" : "Status"}
          </label>
          <select
            id="order-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm text-brand-text focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <option value="">{locale === "ar" ? "الكل" : "All"}</option>
            {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {locale === "ar" ? option.labelAr : option.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <p className="text-sm text-red-700">{error.message}</p>
      ) : null}

      {!loading && !error && filteredOrders.length === 0 ? <EmptyOrders /> : null}

      {!loading && !error && filteredOrders.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-brand-muted">
            {locale === "ar"
              ? `${filteredOrders.length} طلب`
              : `${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}`}
          </p>
          {filteredOrders.map((order) => (
            <OrderCard key={order.orderId ?? order.OrderId} order={order} onReviewSaved={handleReviewSaved} />
          ))}
        </div>
      ) : null}

      {!loading && orders.length > 0 && filteredOrders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-brand-muted">
            {locale === "ar" ? "لا توجد نتائج مطابقة" : "No matching orders"}
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => { setSearch(""); setStatusFilter(""); }}>
            {locale === "ar" ? "مسح التصفية" : "Clear filters"}
          </Button>
        </div>
      ) : null}
    </AccountLayout>
  );
}
