import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { StatsCard, DataTable, CouponStatusBadge, CopyCouponCodeButton, CouponCountdown } from "../../components/admin/index.js";
import { Button, Input, Select } from "../../components/ui/index.js";
import { AnimatedCounter } from "../../components/ui/animation.jsx";
import * as adminCouponService from "../../services/adminCouponService.js";
import { formatOrderDate } from "../../utils/orderHelpers.js";
import { formatPrice } from "../../utils/productHelpers.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useComputedCouponStatus } from "../../hooks/useComputedCouponStatus.js";

function UsageProgressBar({ percent, used, limit }) {
  const color =
    percent >= 90 ? "bg-red-500" : percent >= 60 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-brand-muted">
          {used} / {limit ?? "∞"} Used
        </span>
        <span className="font-medium text-brand-text">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-brand-secondary">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

function SimpleBarChart({ points = [] }) {
  const max = Math.max(...points.map((p) => p.count ?? p.Count ?? 0), 1);
  return (
    <div className="flex h-40 items-end gap-2">
      {points.map((point) => {
        const count = point.count ?? point.Count ?? 0;
        const height = `${Math.max(8, (count / max) * 100)}%`;
        return (
          <div key={point.label ?? point.Label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-brand-accent/70 transition-all duration-500"
                style={{ height }}
                title={String(count)}
              />
            </div>
            <span className="text-[10px] text-brand-muted">{point.label ?? point.Label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CouponDetailsPage() {
  const { id } = useParams();
  const { locale } = useLocale();
  const { error: toastError } = useToast();
  const [coupon, setCoupon] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const debouncedSearch = useDebouncedValue(search, 300);
  const pageSize = 10;

  const title = coupon?.code ?? coupon?.Code ?? (locale === "ar" ? "تفاصيل الكود" : "Coupon Details");
  usePageTitle(title);
  const computedStatus = useComputedCouponStatus(coupon);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, history] = await Promise.all([
        adminCouponService.getCouponById(id),
        adminCouponService.getCouponUsage(id, {
          search: debouncedSearch || undefined,
          orderStatus: orderStatus || undefined,
          sort,
          page,
          pageSize,
        }),
      ]);
      setCoupon(detail);
      setUsage(history);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, debouncedSearch, orderStatus, sort, page, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const usageColumns = [
    {
      key: "customer",
      header: locale === "ar" ? "العميل" : "Customer",
      render: (row) => row.customerName ?? row.CustomerName,
    },
    {
      key: "email",
      header: locale === "ar" ? "البريد" : "Email",
      render: (row) => row.customerEmail ?? row.CustomerEmail,
    },
    {
      key: "order",
      header: locale === "ar" ? "رقم الطلب" : "Order Number",
      render: (row) => (
        <Link to={`/admin/orders/${row.orderId ?? row.OrderId}`} className="text-brand-accent hover:underline">
          {row.orderNumber ?? row.OrderNumber}
        </Link>
      ),
    },
    {
      key: "discount",
      header: locale === "ar" ? "الخصم" : "Discount",
      render: (row) => formatPrice(row.discountApplied ?? row.DiscountApplied, locale),
    },
    {
      key: "total",
      header: locale === "ar" ? "المبلغ النهائي" : "Final Paid",
      render: (row) => formatPrice(row.finalPaidAmount ?? row.FinalPaidAmount, locale),
    },
    {
      key: "status",
      header: locale === "ar" ? "حالة الطلب" : "Order Status",
      render: (row) => row.orderStatus ?? row.OrderStatus,
    },
    {
      key: "date",
      header: locale === "ar" ? "تاريخ الاستخدام" : "Redeemed At",
      render: (row) => formatOrderDate(row.redeemedAt ?? row.RedeemedAt, locale),
    },
    {
      key: "action",
      header: "",
      render: (row) => (
        <Link to={`/admin/orders/${row.orderId ?? row.OrderId}`}>
          <Button type="button" size="sm" variant="outline">
            {locale === "ar" ? "عرض الطلب" : "View Order"}
          </Button>
        </Link>
      ),
    },
  ];

  if (loading && !coupon) {
    return (
      <AdminLayout activeKey="coupons" title={title}>
        <p className="text-brand-muted">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </AdminLayout>
    );
  }

  if (!coupon) {
    return (
      <AdminLayout activeKey="coupons" title={title}>
        <p className="text-brand-muted">{locale === "ar" ? "الكود غير موجود" : "Coupon not found"}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeKey="coupons" title={title}>
      <div className="mb-6">
        <Link to="/admin/coupons" className="text-sm text-brand-accent hover:underline">
          ← {locale === "ar" ? "العودة للأكواد" : "Back to Coupons"}
        </Link>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                {locale === "ar" ? "كود الخصم" : "Coupon Code"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="font-display text-3xl font-medium text-brand-text">
                  {coupon.code ?? coupon.Code}
                </h2>
                <CopyCouponCodeButton code={coupon.code ?? coupon.Code} className="h-8 w-8" />
              </div>
              <p className="mt-2 text-sm text-brand-muted">{coupon.discountLabel ?? coupon.DiscountLabel}</p>
              <CouponCountdown coupon={coupon} status={computedStatus} />
            </div>
            <CouponStatusBadge status={computedStatus} />
          </div>

          <div className="mt-6">
            <UsageProgressBar
              percent={coupon.usageProgressPercent ?? coupon.UsageProgressPercent ?? 0}
              used={coupon.usageCount ?? coupon.UsageCount ?? 0}
              limit={coupon.usageLimit ?? coupon.UsageLimit}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
            <p><span className="text-brand-muted">{locale === "ar" ? "تاريخ الإنشاء:" : "Created:"}</span> {formatOrderDate(coupon.createdAt ?? coupon.CreatedAt, locale)}</p>
            <p><span className="text-brand-muted">{locale === "ar" ? "البداية:" : "Start:"}</span> {formatOrderDate(coupon.startDate ?? coupon.StartDate, locale)}</p>
            <p><span className="text-brand-muted">{locale === "ar" ? "الانتهاء:" : "Expiration:"}</span> {formatOrderDate(coupon.endDate ?? coupon.EndDate, locale)}</p>
            <p><span className="text-brand-muted">{locale === "ar" ? "الحد لكل عميل:" : "Per Customer:"}</span> {coupon.perCustomerUsageLimit ?? coupon.PerCustomerUsageLimit}</p>
          </div>
        </div>

        <div className="space-y-4">
          <StatsCard
            label={locale === "ar" ? "إجمالي التوفير" : "Total Savings"}
            value={formatPrice(coupon.totalSavingsGenerated ?? coupon.TotalSavingsGenerated ?? 0, locale)}
          />
          <StatsCard
            label={locale === "ar" ? "الإيرادات" : "Revenue Generated"}
            value={formatPrice(coupon.revenueGenerated ?? coupon.RevenueGenerated ?? 0, locale)}
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard label={locale === "ar" ? "إجمالي الاستخدام" : "Total Redemptions"} value={<AnimatedCounter value={usage?.totalRedemptions ?? usage?.TotalRedemptions ?? 0} />} />
        <StatsCard label={locale === "ar" ? "عملاء فريدون" : "Unique Customers"} value={<AnimatedCounter value={usage?.uniqueCustomers ?? usage?.UniqueCustomers ?? 0} />} />
        <StatsCard label={locale === "ar" ? "متوسط الخصم" : "Average Discount"} value={formatPrice(usage?.averageDiscount ?? usage?.AverageDiscount ?? 0, locale)} />
        <StatsCard label={locale === "ar" ? "إجمالي التوفير" : "Total Savings"} value={formatPrice(usage?.totalSavings ?? usage?.TotalSavings ?? 0, locale)} />
        <StatsCard label={locale === "ar" ? "الإيرادات" : "Revenue Generated"} value={formatPrice(usage?.revenueGenerated ?? usage?.RevenueGenerated ?? 0, locale)} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="font-display text-lg font-medium">{locale === "ar" ? "الاستخدام عبر الزمن" : "Coupon Usage Over Time"}</h3>
          <div className="mt-4">
            <SimpleBarChart points={coupon.usageOverTime ?? coupon.UsageOverTime ?? []} />
          </div>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="font-display text-lg font-medium">{locale === "ar" ? "أفضل العملاء" : "Top Customers"}</h3>
          <ul className="mt-4 space-y-3">
            {(coupon.topCustomers ?? coupon.TopCustomers ?? []).map((customer) => (
              <li key={customer.userId ?? customer.UserId} className="flex items-center justify-between text-sm">
                <span>{customer.customerName ?? customer.CustomerName}</span>
                <span className="text-brand-muted">
                  {customer.usageCount ?? customer.UsageCount} {locale === "ar" ? "مرة" : "uses"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h3 className="font-display text-xl font-medium">{locale === "ar" ? "سجل الاستخدام" : "Usage History"}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={locale === "ar" ? "بحث..." : "Search..."} />
            <Select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
              <option value="">{locale === "ar" ? "كل الحالات" : "All statuses"}</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">{locale === "ar" ? "الأحدث" : "Newest"}</option>
              <option value="oldest">{locale === "ar" ? "الأقدم" : "Oldest"}</option>
              <option value="highest_discount">{locale === "ar" ? "أعلى خصم" : "Highest Discount"}</option>
              <option value="lowest_discount">{locale === "ar" ? "أقل خصم" : "Lowest Discount"}</option>
            </Select>
          </div>
        </div>

        <DataTable
          columns={usageColumns}
          rows={usage?.items ?? usage?.Items ?? []}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalItems={usage?.totalItems ?? usage?.TotalItems ?? 0}
          onPageChange={setPage}
          getRowKey={(row) => row.orderId ?? row.OrderId}
          emptyMessage={locale === "ar" ? "لا يوجد استخدام بعد" : "No redemptions yet"}
        />
      </div>
    </AdminLayout>
  );
}
