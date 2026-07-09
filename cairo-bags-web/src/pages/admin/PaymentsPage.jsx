import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { DataTable, PaymentReviewModal, StatusBadge } from "../../components/admin/index.js";
import { Button } from "../../components/ui/index.js";
import * as adminPaymentService from "../../services/adminPaymentService.js";
import { formatOrderDate } from "../../utils/orderHelpers.js";
import { formatPrice } from "../../utils/productHelpers.js";
import { paginateItems } from "../../utils/pagination.js";

export function PaymentsPage() {
  const { locale } = useLocale();
  const { error: toastError } = useToast();
  const title = locale === "ar" ? "المدفوعات" : "Payments";
  usePageTitle(title);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reviewId, setReviewId] = useState(null);

  const pageSize = 10;

  function loadPayments() {
    setLoading(true);
    adminPaymentService
      .getPendingPayments()
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch((err) => {
        toastError(err.message);
        setPayments([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const paged = useMemo(
    () => paginateItems(payments, page, pageSize),
    [payments, page]
  );

  const columns = [
    {
      key: "order",
      header: locale === "ar" ? "الطلب" : "Order",
      align: "center",
      render: (row) => row.orderNumber ?? row.OrderNumber,
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
            paymentStatus={row.paymentStatus ?? row.PaymentStatus}
          />
        </div>
      ),
    },
    {
      key: "amount",
      header: locale === "ar" ? "المبلغ" : "Amount",
      align: "center",
      render: (row) => formatPrice(row.amount ?? row.Amount, locale),
    },
    {
      key: "date",
      header: locale === "ar" ? "التاريخ" : "Date",
      align: "center",
      render: (row) => formatOrderDate(row.submittedAt ?? row.SubmittedAt ?? row.createdAt ?? row.CreatedAt, locale),
    },
    {
      key: "actions",
      header: locale === "ar" ? "إجراءات" : "Actions",
      align: "center",
      render: (row) => (
        <Button
          type="button"
          variant="accent"
          size="sm"
          onClick={() => setReviewId(row.paymentId ?? row.PaymentId)}
        >
          {locale === "ar" ? "مراجعة" : "Review"}
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout activeKey="payments" title={title}>
      <DataTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={payments.length}
        onPageChange={setPage}
        getRowKey={(row) => row.paymentId ?? row.PaymentId}
        emptyMessage={locale === "ar" ? "لا توجد مدفوعات معلقة" : "No pending payments"}
      />

      <PaymentReviewModal
        open={Boolean(reviewId)}
        paymentId={reviewId}
        onClose={() => setReviewId(null)}
        onReviewed={loadPayments}
      />
    </AdminLayout>
  );
}
