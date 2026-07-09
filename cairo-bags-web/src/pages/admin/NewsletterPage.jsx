import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { StatsCard, DataTable } from "../../components/admin/index.js";
import { Button, Input, Select } from "../../components/ui/index.js";
import { AnimatedCounter } from "../../components/ui/animation.jsx";
import * as adminNewsletterService from "../../services/adminNewsletterService.js";
import { formatOrderDate } from "../../utils/orderHelpers.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function NewsletterPage() {
  const { locale } = useLocale();
  const { error: toastError } = useToast();
  const title = locale === "ar" ? "النشرة البريدية" : "Newsletter";
  usePageTitle(title);

  const [stats, setStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const pageSize = 20;

  const loadStats = useCallback(async () => {
    try {
      const data = await adminNewsletterService.getNewsletterStats();
      setStats(data);
    } catch (err) {
      toastError(err.message);
    }
  }, [toastError]);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminNewsletterService.getNewsletterSubscribers({
        search: debouncedSearch || undefined,
        isSubscribed: statusFilter === "" ? undefined : statusFilter === "active",
        page,
        pageSize,
      });
      setSubscribers(Array.isArray(data?.items) ? data.items : []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      toastError(err.message);
      setSubscribers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, pageSize, toastError]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const columns = [
    {
      key: "email",
      header: locale === "ar" ? "البريد" : "Email",
      render: (row) => row.email ?? row.Email,
    },
    {
      key: "status",
      header: locale === "ar" ? "الحالة" : "Status",
      align: "center",
      render: (row) => {
        const active = row.isSubscribed ?? row.IsSubscribed;
        return (
          <span className={active ? "text-emerald-700" : "text-brand-muted"}>
            {active
              ? locale === "ar"
                ? "مشترك"
                : "Subscribed"
              : locale === "ar"
                ? "ملغي"
                : "Unsubscribed"}
          </span>
        );
      },
    },
    {
      key: "subscribedAt",
      header: locale === "ar" ? "تاريخ الاشتراك" : "Subscribed",
      align: "center",
      render: (row) => formatOrderDate(row.subscribedAt ?? row.SubscribedAt, locale),
    },
    {
      key: "language",
      header: locale === "ar" ? "اللغة" : "Language",
      align: "center",
      render: (row) => (row.language ?? row.Language ?? "en").toUpperCase(),
    },
    {
      key: "lastEmail",
      header: locale === "ar" ? "آخر بريد" : "Last Email",
      align: "center",
      render: (row) => {
        const value = row.lastEmailSentAt ?? row.LastEmailSentAt;
        return value ? formatOrderDate(value, locale) : "—";
      },
    },
  ];

  async function handleExport(format) {
    setExporting(true);
    try {
      const params = {
        search: debouncedSearch || undefined,
        isSubscribed: statusFilter === "" ? undefined : statusFilter === "active",
      };
      const blob =
        format === "excel"
          ? await adminNewsletterService.exportNewsletterExcel(params)
          : await adminNewsletterService.exportNewsletterCsv(params);
      const ext = format === "excel" ? "xls" : "csv";
      downloadBlob(blob, `newsletter-subscribers.${ext}`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminLayout activeKey="newsletter" title={title}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label={locale === "ar" ? "إجمالي المشتركين" : "Total Subscribers"}
          value={<AnimatedCounter value={stats?.totalSubscribers ?? 0} />}
        />
        <StatsCard
          label={locale === "ar" ? "مشتركون اليوم" : "Subscribed Today"}
          value={<AnimatedCounter value={stats?.subscribedToday ?? 0} />}
        />
        <StatsCard
          label={locale === "ar" ? "ملغي الاشتراك" : "Unsubscribed"}
          value={<AnimatedCounter value={stats?.unsubscribed ?? 0} />}
        />
        <StatsCard
          label={locale === "ar" ? "رسائل مرسلة" : "Emails Sent"}
          value={<AnimatedCounter value={stats?.emailsSent ?? 0} />}
        />
      </div>

      {stats?.lastCampaign ? (
        <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            {locale === "ar" ? "آخر حملة" : "Last Campaign"}
          </p>
          <p className="mt-2 text-sm text-brand-text">
            {stats.lastCampaign.productName ?? `Product #${stats.lastCampaign.productId}`}
            {" · "}
            {formatOrderDate(stats.lastCampaign.sentAt, locale)}
            {" · "}
            {stats.lastCampaign.recipientCount}{" "}
            {locale === "ar" ? "مستلم" : "recipients"}
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "ar" ? "بحث بالبريد..." : "Search email..."}
            className="w-full sm:w-72"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="">{locale === "ar" ? "كل الحالات" : "All statuses"}</option>
            <option value="active">{locale === "ar" ? "مشترك" : "Subscribed"}</option>
            <option value="inactive">{locale === "ar" ? "ملغي" : "Unsubscribed"}</option>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={exporting} onClick={() => handleExport("csv")}>
            {locale === "ar" ? "تصدير CSV" : "Export CSV"}
          </Button>
          <Button variant="outline" disabled={exporting} onClick={() => handleExport("excel")}>
            {locale === "ar" ? "تصدير Excel" : "Export Excel"}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={subscribers}
          loading={loading}
          emptyMessage={locale === "ar" ? "لا يوجد مشتركون" : "No subscribers found"}
        />
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-brand-muted">
            {locale === "ar" ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {locale === "ar" ? "السابق" : "Previous"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {locale === "ar" ? "التالي" : "Next"}
            </Button>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
