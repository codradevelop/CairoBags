import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useCatalogRefresh } from "../../hooks/useCatalogRefresh.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import {
  StatsCard,
  DashboardCharts,
  LatestReviewsWidget,
  RecentOrdersTable,
  SalesChart,
} from "../../components/admin/index.js";
import { Card, CardBody, CardHeader } from "../../components/ui/index.js";
import * as productService from "../../services/productService.js";
import * as categoryService from "../../services/categoryService.js";
import * as adminOrderService from "../../services/adminOrderService.js";
import * as adminPaymentService from "../../services/adminPaymentService.js";
import * as inventoryService from "../../services/inventoryService.js";
import { ORDER_STATUS } from "../../constants/orderStatus.js";

const PENDING_ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.AWAITING_PAYMENT,
  ORDER_STATUS.PAYMENT_PROOF_SUBMITTED,
  ORDER_STATUS.PAYMENT_UNDER_REVIEW,
  ORDER_STATUS.PROCESSING,
];

export function DashboardPage() {
  const { locale } = useLocale();
  const title = locale === "ar" ? "لوحة التحكم" : "Dashboard";
  usePageTitle(title);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const refreshCatalogCounts = useCallback(async () => {
    try {
      const [productData, categoryData] = await Promise.all([
        productService.getProducts({ includeDraft: true }),
        categoryService.getCategories({ includeInactive: true }),
      ]);
      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch {
      /* keep existing counts on refresh failure */
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestConfig = { signal: controller.signal };

    setLoading(true);
    Promise.all([
      productService.getProducts({ includeDraft: true }, requestConfig),
      categoryService.getCategories({ includeInactive: true }, requestConfig),
      adminOrderService.getAdminOrders({}, requestConfig),
      adminPaymentService.getPendingPayments(requestConfig),
      inventoryService.getLowStockInventory(requestConfig),
    ])
      .then(([productData, categoryData, orderData, paymentData, lowStockData]) => {
        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setOrders(Array.isArray(orderData) ? orderData : []);
        setPendingPayments(Array.isArray(paymentData) ? paymentData : []);
        setLowStock(Array.isArray(lowStockData) ? lowStockData : []);
      })
      .catch((err) => {
        if (err?.isCanceled || err?.code === "canceled") return;
        setProducts([]);
        setCategories([]);
        setOrders([]);
        setPendingPayments([]);
        setLowStock([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  useCatalogRefresh(refreshCatalogCounts, { entity: "product" });
  useCatalogRefresh(refreshCatalogCounts, { entity: "category" });

  const pendingOrdersCount = useMemo(
    () =>
      orders.filter((o) =>
        PENDING_ORDER_STATUSES.includes(o.orderStatus ?? o.OrderStatus)
      ).length,
    [orders]
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? b.CreatedAt) - new Date(a.createdAt ?? a.CreatedAt)
        )
        .slice(0, 5),
    [orders]
  );

  return (
    <AdminLayout activeKey="dashboard" title={title}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          label={locale === "ar" ? "المنتجات" : "Products"}
          value={products.length}
          loading={loading}
        />
        <StatsCard
          label={locale === "ar" ? "التصنيفات" : "Categories"}
          value={categories.length}
          loading={loading}
        />
        <StatsCard
          label={locale === "ar" ? "طلبات معلقة" : "Pending Orders"}
          value={pendingOrdersCount}
          loading={loading}
        />
        <StatsCard
          label={locale === "ar" ? "مدفوعات معلقة" : "Pending Payments"}
          value={pendingPayments.length}
          loading={loading}
        />
        <StatsCard
          label={locale === "ar" ? "مخزون منخفض" : "Low Stock"}
          value={lowStock.length}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCharts orders={orders} />
        <SalesChart orders={orders} loading={loading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card variant="default" padding="md">
          <CardHeader title={locale === "ar" ? "أحدث الطلبات" : "Recent Orders"} />
          <CardBody>
            <RecentOrdersTable orders={recentOrders} loading={loading} />
          </CardBody>
        </Card>
        <LatestReviewsWidget />
      </div>
    </AdminLayout>
  );
}
