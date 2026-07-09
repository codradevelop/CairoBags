import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { DataTable, StatusBadge } from "../../components/admin/index.js";
import { Button, Input } from "../../components/ui/index.js";
import * as adminOrderService from "../../services/adminOrderService.js";
import {
  formatOrderDate,
  getOrderId,
  getOrderNumber,
  getOrderStatus,
  getPaymentStatus,
} from "../../utils/orderHelpers.js";
import { formatPrice } from "../../utils/productHelpers.js";
import { paginateItems } from "../../utils/pagination.js";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  PAYMENT_STATUS_META,
} from "../../constants/orderStatusLabels.js";

export function OrdersPage() {
  const { locale } = useLocale();
  const { error: toastError } = useToast();
  const title = locale === "ar" ? "الطلبات" : "Orders";
  usePageTitle(title);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    const params = {};
    if (appliedSearch) params.orderNumber = appliedSearch;
    if (statusFilter) params.orderStatus = statusFilter;
    if (paymentFilter) params.paymentStatus = paymentFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    adminOrderService
      .getAdminOrders(params, { signal: controller.signal })
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err.isCanceled) return;
        toastError(err.message);
        setOrders([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [statusFilter, paymentFilter, startDate, endDate, appliedSearch]);

  const paged = useMemo(
    () => paginateItems(orders, page, pageSize),
    [orders, page]
  );

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, statusFilter, paymentFilter, startDate, endDate]);

  const paymentFilterOptions = Object.entries(PAYMENT_STATUS_META).map(([value, meta]) => ({
    value,
    label: locale === "ar" ? meta.labelAr : meta.labelEn,
  }));

  const columns = [
    {
      key: "orderNumber",
      header: locale === "ar" ? "رقم الطلب" : "Order",
      align: "center",
      render: (row) => (
        <Link
          to={`/admin/orders/${getOrderId(row)}`}
          className="font-medium text-brand-accent hover:text-brand-primary"
        >
          {getOrderNumber(row)}
        </Link>
      ),
    },
    {
      key: "customer",
      header: locale === "ar" ? "العميل" : "Customer",
      align: "center",
      render: (row) => row.customerName ?? row.CustomerName ?? "—",
    },
    {
      key: "status",
      header: locale === "ar" ? "الحالة" : "Status",
      align: "center",
      render: (row) => (
        <div className="flex w-full items-center justify-center">
          <StatusBadge
            status={getOrderStatus(row)}
            paymentStatus={getPaymentStatus(row)}
          />
        </div>
      ),
    },
    {
      key: "total",
      header: locale === "ar" ? "الإجمالي" : "Total",
      align: "center",
      render: (row) => formatPrice(row.totalAmount ?? row.TotalAmount, locale),
    },
    {
      key: "date",
      header: locale === "ar" ? "التاريخ" : "Date",
      align: "center",
      render: (row) => formatOrderDate(row.createdAt ?? row.CreatedAt, locale),
    },
    {
      key: "actions",
      header: locale === "ar" ? "إجراءات" : "Actions",
      align: "center",
      render: (row) => (
        <Link to={`/admin/orders/${getOrderId(row)}`}>
          <Button variant="outline" size="sm">
            {locale === "ar" ? "عرض" : "View"}
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AdminLayout activeKey="orders" title={title}>
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "بحث برقم الطلب" : "Search order number"}
          </label>
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="CB-2026-0001"
            />
            <Button type="button" variant="outline" onClick={() => setAppliedSearch(search.trim())}>
              {locale === "ar" ? "بحث" : "Search"}
            </Button>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "حالة الطلب" : "Order status"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
          >
            <option value="">{locale === "ar" ? "الكل" : "All"}</option>
            {ORDER_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {locale === "ar" ? opt.labelAr : opt.labelEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "حالة الدفع" : "Payment status"}
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
          >
            <option value="">{locale === "ar" ? "الكل" : "All"}</option>
            {paymentFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "من تاريخ" : "From"}
          </label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "إلى تاريخ" : "To"}
          </label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={orders.length}
        onPageChange={setPage}
        getRowKey={(row) => getOrderId(row)}
        emptyMessage={locale === "ar" ? "لا توجد طلبات" : "No orders found"}
      />
    </AdminLayout>
  );
}
