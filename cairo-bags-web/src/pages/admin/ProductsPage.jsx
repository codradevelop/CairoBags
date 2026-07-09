import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useCatalogRefresh } from "../../hooks/useCatalogRefresh.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { DataTable } from "../../components/admin/index.js";
import {
  ADMIN_COL,
  AdminTableActions,
  AdminTableImage,
  AdminTableText,
  dataColumnShell,
  imageColumnShell,
} from "../../components/admin/adminTableConfig.jsx";
import { Button, ConfirmModal, Input } from "../../components/ui/index.js";
import * as productService from "../../services/productService.js";
import {
  formatPrice,
  getProductId,
  getProductImageUrl,
  getProductName,
  getProductShortDescription,
} from "../../utils/productHelpers.js";
import { paginateItems } from "../../utils/pagination.js";

const STATUS_LABELS = {
  0: { en: "Draft", ar: "مسودة" },
  1: { en: "Active", ar: "نشط" },
  2: { en: "Archived", ar: "مؤرشف" },
};

export function ProductsPage() {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const title = locale === "ar" ? "المنتجات" : "Products";
  usePageTitle(title);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  const loadProducts = useCallback((options = {}) => {
    const background = options?.background === true;
    if (!background) setLoading(true);
    return productService
      .getProducts({ includeDraft: true })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (!background) toastError(err.message);
        if (!background) setProducts([]);
      })
      .finally(() => {
        if (!background) setLoading(false);
      });
  }, [toastError]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useCatalogRefresh(loadProducts, { entity: "product" });

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const name = getProductName(product, locale).toLowerCase();
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || name.includes(q);
      const status = product.status ?? product.Status;
      const matchesStatus = statusFilter === "" || String(status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter, locale]);

  const paged = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productService.deleteProduct(getProductId(deleteTarget));
      success(locale === "ar" ? "تم حذف المنتج" : "Product deleted");
      setDeleteTarget(null);
      loadProducts();
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "image",
      header: locale === "ar" ? "الصورة" : "Image",
      align: "center",
      headerClassName: `${ADMIN_COL.status} px-4`,
      cellClassName: `${ADMIN_COL.status} px-4`,
      ...imageColumnShell,
      render: (row) => {
        const name = getProductName(row, locale);
        return (
          <AdminTableImage src={getProductImageUrl(row)} alt={name} />
        );
      },
    },
    {
      key: "product",
      header: locale === "ar" ? "المنتج" : "Product",
      align: "center",
      headerClassName: `${ADMIN_COL.status} px-4`,
      cellClassName: `${ADMIN_COL.status} px-4`,
      ...dataColumnShell,
      render: (row) => (
        <AdminTableText
          title={getProductName(row, locale)}
          subtitle={getProductShortDescription(row, locale) || undefined}
        />
      ),
    },
    {
      key: "status",
      header: locale === "ar" ? "الحالة" : "Status",
      align: "center",
      headerClassName: `${ADMIN_COL.status} px-4`,
      cellClassName: `${ADMIN_COL.status} px-4`,
      render: (row) => {
        const status = row.status ?? row.Status ?? 1;
        const label = STATUS_LABELS[status];
        return label ? (locale === "ar" ? label.ar : label.en) : status;
      },
    },
    {
      key: "price",
      header: locale === "ar" ? "السعر" : "Price",
      align: "center",
      headerClassName: `${ADMIN_COL.price} px-4`,
      cellClassName: `${ADMIN_COL.price} px-4 text-brand-muted`,
      render: (row) => formatPrice(row.lowestPrice ?? row.LowestPrice, locale),
    },
    {
      key: "stock",
      header: locale === "ar" ? "المخزون" : "Stock",
      align: "center",
      headerClassName: `${ADMIN_COL.stock} px-4`,
      cellClassName: `${ADMIN_COL.stock} px-4`,
      render: (row) =>
        row.isInStock ?? row.IsInStock
          ? locale === "ar"
            ? "متوفر"
            : "In stock"
          : locale === "ar"
            ? "نفد"
            : "Out",
    },
    {
      key: "actions",
      header: locale === "ar" ? "إجراءات" : "Actions",
      align: "center",
      headerClassName: `${ADMIN_COL.actions} px-4`,
      cellClassName: `${ADMIN_COL.actions} px-4`,
      render: (row) => (
        <AdminTableActions>
          <Link to={`/admin/products/${getProductId(row)}/edit`}>
            <Button variant="outline" size="sm">
              {locale === "ar" ? "تعديل" : "Edit"}
            </Button>
          </Link>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget(row)}
          >
            {locale === "ar" ? "حذف" : "Delete"}
          </Button>
        </AdminTableActions>
      ),
    },
  ];

  return (
    <AdminLayout
      activeKey="products"
      title={title}
      topbarActions={
        <Link to="/admin/products/new">
          <Button variant="accent" size="sm">
            {locale === "ar" ? "إضافة منتج" : "Add Product"}
          </Button>
        </Link>
      }
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "بحث" : "Search"}
          </label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "ar" ? "اسم المنتج" : "Product name"}
          />
        </div>
        <div className="w-full lg:w-48">
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "الحالة" : "Status"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
          >
            <option value="">{locale === "ar" ? "الكل" : "All"}</option>
            <option value="0">{locale === "ar" ? "مسودة" : "Draft"}</option>
            <option value="1">{locale === "ar" ? "نشط" : "Active"}</option>
            <option value="2">{locale === "ar" ? "مؤرشف" : "Archived"}</option>
          </select>
        </div>
      </div>

      <DataTable
        showIndex
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
        getRowKey={(row) => getProductId(row)}
        emptyMessage={locale === "ar" ? "لا توجد منتجات" : "No products found"}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={locale === "ar" ? "حذف المنتج" : "Delete Product"}
        message={
          deleteTarget
            ? locale === "ar"
              ? `هل تريد حذف "${getProductName(deleteTarget, locale)}"؟`
              : `Delete "${getProductName(deleteTarget, locale)}"?`
            : ""
        }
        confirmLabel={locale === "ar" ? "حذف" : "Delete"}
        variant="danger"
      />
    </AdminLayout>
  );
}
