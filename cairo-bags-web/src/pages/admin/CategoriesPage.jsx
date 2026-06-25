import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
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
import { Badge, Button, ConfirmModal, Input } from "../../components/ui/index.js";
import * as categoryService from "../../services/categoryService.js";
import { getCategoryId, getCategoryImageUrl, getCategoryName } from "../../utils/productHelpers.js";
import { paginateItems } from "../../utils/pagination.js";

export function CategoriesPage() {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const title = locale === "ar" ? "التصنيفات" : "Categories";
  usePageTitle(title);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  function loadCategories() {
    setLoading(true);
    categoryService
      .getCategories({ includeInactive: true })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => {
        toastError(err.message);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filtered = useMemo(() => {
    return categories.filter((cat) => {
      const name = getCategoryName(cat, locale).toLowerCase();
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || name.includes(q);
      const isActive = cat.isActive ?? cat.IsActive;
      const matchesActive =
        activeFilter === "" ||
        (activeFilter === "active" && isActive) ||
        (activeFilter === "inactive" && !isActive);
      return matchesSearch && matchesActive;
    });
  }, [categories, search, activeFilter, locale]);

  const paged = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search, activeFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoryService.deleteCategory(getCategoryId(deleteTarget));
      success(locale === "ar" ? "تم حذف التصنيف" : "Category deleted");
      setDeleteTarget(null);
      loadCategories();
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "image",
      header: "",
      ...imageColumnShell,
      render: (row) => {
        const name = getCategoryName(row, locale);
        return (
          <AdminTableImage
            src={getCategoryImageUrl(row)}
            alt={name}
            rounded="full"
          />
        );
      },
    },
    {
      key: "name",
      header: locale === "ar" ? "التصنيف" : "Category",
      ...dataColumnShell,
      render: (row) => <AdminTableText title={getCategoryName(row, locale)} />,
    },
    {
      key: "sort",
      header: locale === "ar" ? "الترتيب" : "Sort",
      align: "center",
      headerClassName: `${ADMIN_COL.sort} px-4`,
      cellClassName: `${ADMIN_COL.sort} px-4 text-brand-muted`,
      render: (row) => row.sortOrder ?? row.SortOrder ?? 0,
    },
    {
      key: "status",
      header: locale === "ar" ? "الحالة" : "Status",
      align: "center",
      headerClassName: `${ADMIN_COL.status} px-4`,
      cellClassName: `${ADMIN_COL.status} px-4`,
      render: (row) => {
        const active = row.isActive ?? row.IsActive;
        return (
          <Badge variant={active ? "success" : "outline"} size="sm">
            {active
              ? locale === "ar"
                ? "نشط"
                : "Active"
              : locale === "ar"
                ? "غير نشط"
                : "Inactive"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: locale === "ar" ? "إجراءات" : "Actions",
      align: "center",
      headerClassName: `${ADMIN_COL.actions} px-4`,
      cellClassName: `${ADMIN_COL.actions} px-4`,
      render: (row) => (
        <AdminTableActions>
          <Link to={`/admin/categories/${getCategoryId(row)}/edit`}>
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
      activeKey="categories"
      title={title}
      topbarActions={
        <Link to="/admin/categories/new">
          <Button variant="accent" size="sm">
            {locale === "ar" ? "إضافة تصنيف" : "Add Category"}
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
            placeholder={locale === "ar" ? "اسم التصنيف" : "Category name"}
          />
        </div>
        <div className="w-full lg:w-48">
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "الحالة" : "Status"}
          </label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
          >
            <option value="">{locale === "ar" ? "الكل" : "All"}</option>
            <option value="active">{locale === "ar" ? "نشط" : "Active"}</option>
            <option value="inactive">{locale === "ar" ? "غير نشط" : "Inactive"}</option>
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
        getRowKey={(row) => getCategoryId(row)}
        emptyMessage={locale === "ar" ? "لا توجد تصنيفات" : "No categories found"}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={locale === "ar" ? "حذف التصنيف" : "Delete Category"}
        message={
          deleteTarget
            ? locale === "ar"
              ? `هل تريد حذف "${getCategoryName(deleteTarget, locale)}"؟`
              : `Delete "${getCategoryName(deleteTarget, locale)}"?`
            : ""
        }
        confirmLabel={locale === "ar" ? "حذف" : "Delete"}
        variant="danger"
      />
    </AdminLayout>
  );
}
