import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { StatsCard, DataTable, CouponFormModal, CouponStatusBadge, CouponCodeCell, CouponCountdown } from "../../components/admin/index.js";
import { Button, ConfirmModal, Input, Select } from "../../components/ui/index.js";
import { AnimatedCounter } from "../../components/ui/animation.jsx";
import * as adminCouponService from "../../services/adminCouponService.js";
import { formatOrderDate } from "../../utils/orderHelpers.js";
import { paginateItems } from "../../utils/pagination.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import {
  computeCouponStatsFromList,
  computeCouponStatus,
  matchesCouponStatusFilter,
} from "../../constants/couponHelpers.js";
import { STORE_EVENTS } from "../../constants/storeEvents.js";
import { useStoreSync } from "../../hooks/useStoreSync.js";

export function CouponsPage() {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const title = locale === "ar" ? "أكواد الخصم" : "Coupons";
  usePageTitle(title);

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const listData = await adminCouponService.getCoupons({
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        sort,
      });
      setCoupons(Array.isArray(listData) ? listData : []);
    } catch (err) {
      toastError(err.message);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, sort, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useStoreSync(
    [STORE_EVENTS.CouponCreated, STORE_EVENTS.CouponUpdated, STORE_EVENTS.CouponDeleted],
    () => loadData()
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch, typeFilter, sort]);

  const computedStats = useMemo(() => computeCouponStatsFromList(coupons), [coupons]);

  const filteredCoupons = useMemo(
    () => coupons.filter((coupon) => matchesCouponStatusFilter(coupon, statusFilter)),
    [coupons, statusFilter]
  );

  const paged = useMemo(() => paginateItems(filteredCoupons, page, pageSize), [filteredCoupons, page]);

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      if (editingCoupon) {
        await adminCouponService.updateCoupon(editingCoupon.id ?? editingCoupon.Id, payload);
        success(locale === "ar" ? "تم تحديث الكود" : "Coupon updated");
      } else {
        await adminCouponService.createCoupon(payload);
        success(locale === "ar" ? "تم إنشاء الكود" : "Coupon created");
      }
      setModalOpen(false);
      setEditingCoupon(null);
      loadData();
    } catch (err) {
      toastError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await adminCouponService.deleteCoupon(deleteId);
      success(locale === "ar" ? "تم الحذف" : "Coupon deleted");
      setDeleteId(null);
      loadData();
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleToggleActive(row, activate) {
    try {
      const id = row.id ?? row.Id;
      if (activate) await adminCouponService.activateCoupon(id);
      else await adminCouponService.deactivateCoupon(id);
      loadData();
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleDuplicate(row) {
    try {
      await adminCouponService.duplicateCoupon(row.id ?? row.Id);
      success(locale === "ar" ? "تم نسخ الكود" : "Coupon duplicated");
      loadData();
    } catch (err) {
      toastError(err.message);
    }
  }

  const columns = [
    {
      key: "code",
      header: locale === "ar" ? "الكود" : "Coupon",
      render: (row) => (
        <CouponCodeCell
          code={row.code ?? row.Code}
          couponId={row.id ?? row.Id}
        />
      ),
    },
    {
      key: "discount",
      header: locale === "ar" ? "الخصم" : "Discount",
      render: (row) => row.discountLabel ?? row.DiscountLabel,
    },
    {
      key: "status",
      header: locale === "ar" ? "الحالة" : "Status",
      render: (row) => {
        const status = computeCouponStatus(row);
        return (
          <div className="flex min-w-[7.5rem] flex-col items-start gap-1.5">
            <CouponStatusBadge status={status} />
            <CouponCountdown coupon={row} status={status} variant="compact" />
          </div>
        );
      },
    },
    {
      key: "created",
      header: locale === "ar" ? "تاريخ الإنشاء" : "Created",
      render: (row) => formatOrderDate(row.createdAt ?? row.CreatedAt, locale),
    },
    {
      key: "start",
      header: locale === "ar" ? "البداية" : "Start",
      render: (row) => formatOrderDate(row.startDate ?? row.StartDate, locale),
    },
    {
      key: "end",
      header: locale === "ar" ? "الانتهاء" : "Expiration",
      render: (row) => formatOrderDate(row.endDate ?? row.EndDate, locale),
    },
    {
      key: "uses",
      header: locale === "ar" ? "الاستخدام" : "Uses",
      render: (row) => `${row.usageCount ?? row.UsageCount}${row.usageLimit ?? row.UsageLimit ? ` / ${row.usageLimit ?? row.UsageLimit}` : ""}`,
    },
    {
      key: "actions",
      header: locale === "ar" ? "إجراءات" : "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingCoupon(row);
              setModalOpen(true);
            }}
          >
            {locale === "ar" ? "تعديل" : "Edit"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(row, !(row.isActive ?? row.IsActive))}
          >
            {row.isActive ?? row.IsActive
              ? locale === "ar"
                ? "إيقاف"
                : "Deactivate"
              : locale === "ar"
                ? "تفعيل"
                : "Activate"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleDuplicate(row)}>
            {locale === "ar" ? "نسخ" : "Duplicate"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setDeleteId(row.id ?? row.Id)}>
            {locale === "ar" ? "حذف" : "Delete"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout activeKey="coupons" title={title}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          label={locale === "ar" ? "إجمالي الأكواد" : "Total Coupons"}
          value={<AnimatedCounter value={computedStats.totalCoupons} />}
          loading={loading && coupons.length === 0}
        />
        <StatsCard
          label={locale === "ar" ? "الأكواد النشطة" : "Active Coupons"}
          value={<AnimatedCounter value={computedStats.activeCoupons} />}
          loading={loading && coupons.length === 0}
        />
        <StatsCard
          label={locale === "ar" ? "منتهية" : "Expired Coupons"}
          value={<AnimatedCounter value={computedStats.expiredCoupons} />}
          loading={loading && coupons.length === 0}
        />
        <StatsCard
          label={locale === "ar" ? "مستخدمة" : "Used Coupons"}
          value={<AnimatedCounter value={computedStats.usedCoupons} />}
          loading={loading && coupons.length === 0}
        />
        <StatsCard
          label={locale === "ar" ? "نسبة الاستخدام" : "Usage %"}
          value={`${computedStats.usagePercent}%`}
          loading={loading && coupons.length === 0}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={locale === "ar" ? "بحث بالكود..." : "Search by code..."}
          />
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{locale === "ar" ? "كل الحالات" : "All statuses"}</option>
            <option value="active">{locale === "ar" ? "نشط" : "Active"}</option>
            <option value="inactive">{locale === "ar" ? "غير نشط" : "Inactive"}</option>
            <option value="scheduled">{locale === "ar" ? "مجدول" : "Scheduled"}</option>
            <option value="expired">{locale === "ar" ? "منتهي" : "Expired"}</option>
            <option value="maximum_uses_reached">
              {locale === "ar" ? "الحد الأقصى للاستخدام" : "Maximum Uses Reached"}
            </option>
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">{locale === "ar" ? "كل الأنواع" : "All types"}</option>
            <option value="percentage">{locale === "ar" ? "نسبة" : "Percentage"}</option>
            <option value="fixed">{locale === "ar" ? "مبلغ ثابت" : "Fixed Amount"}</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">{locale === "ar" ? "الأحدث" : "Newest"}</option>
            <option value="oldest">{locale === "ar" ? "الأقدم" : "Oldest"}</option>
            <option value="most_used">{locale === "ar" ? "الأكثر استخداماً" : "Most Used"}</option>
            <option value="expiring_soon">{locale === "ar" ? "ينتهي قريباً" : "Expiring Soon"}</option>
          </Select>
        </div>
        <Button
          type="button"
          variant="accent"
          onClick={() => {
            setEditingCoupon(null);
            setModalOpen(true);
          }}
        >
          {locale === "ar" ? "إنشاء كود" : "Create Coupon"}
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={filteredCoupons.length}
        onPageChange={setPage}
        getRowKey={(row) => row.id ?? row.Id}
        emptyMessage={locale === "ar" ? "لا توجد أكواد خصم" : "No coupons yet"}
      />

      <CouponFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCoupon(null);
        }}
        initialCoupon={editingCoupon}
        loading={submitting}
        onSubmit={handleCreate}
      />

      <ConfirmModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={locale === "ar" ? "حذف الكود" : "Delete Coupon"}
        description={locale === "ar" ? "هل أنت متأكد من حذف هذا الكود؟" : "Are you sure you want to delete this coupon?"}
      />
    </AdminLayout>
  );
}
