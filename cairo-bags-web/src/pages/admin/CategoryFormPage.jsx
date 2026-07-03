import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useCatalogRefresh } from "../../hooks/useCatalogRefresh.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { CategoryForm } from "../../components/admin/index.js";
import { Button, Skeleton } from "../../components/ui/index.js";
import * as categoryService from "../../services/categoryService.js";
import { getCategoryId } from "../../utils/productHelpers.js";

function mapCategoryToForm(category) {
  const ar = category?.arabic ?? category?.Arabic ?? {};
  const en = category?.english ?? category?.English ?? {};
  return {
    parentCategoryId: category?.parentCategoryId ?? category?.ParentCategoryId ?? "",
    imageUrl: category?.imageUrl ?? category?.ImageUrl ?? "",
    sortOrder: category?.sortOrder ?? category?.SortOrder ?? 0,
    isActive: category?.isActive ?? category?.IsActive ?? true,
    nameAr: ar.name ?? ar.Name ?? "",
    nameEn: en.name ?? en.Name ?? "",
    slugAr: ar.slug ?? ar.Slug ?? "",
    slugEn: en.slug ?? en.Slug ?? "",
    descriptionAr: ar.description ?? ar.Description ?? "",
    descriptionEn: en.description ?? en.Description ?? "",
  };
}

export function CategoryFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();

  const title = isEdit
    ? locale === "ar"
      ? "تعديل تصنيف"
      : "Edit Category"
    : locale === "ar"
      ? "تصنيف جديد"
      : "New Category";
  usePageTitle(title);

  const [categories, setCategories] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryService
      .getCategories({ includeInactive: true })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCategories(isEdit ? list.filter((c) => getCategoryId(c) !== Number(id)) : list);
      })
      .catch(() => setCategories([]));
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit) {
      setInitialValues({});
      return;
    }
    setLoading(true);
    categoryService
      .getCategoryById(id)
      .then((data) => setInitialValues(mapCategoryToForm(data)))
      .catch((err) => {
        toastError(err.message);
        setInitialValues(null);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, toastError]);

  const reloadCategory = useCallback(() => {
    if (!isEdit) return;
    return categoryService
      .getCategoryById(id)
      .then((data) => setInitialValues(mapCategoryToForm(data)))
      .catch(() => {});
  }, [id, isEdit]);

  useCatalogRefresh(reloadCategory, {
    entity: "category",
    id: isEdit ? Number(id) : undefined,
    enabled: isEdit,
  });

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (isEdit) {
        await categoryService.updateCategory(id, payload);
        success(locale === "ar" ? "تم تحديث التصنيف" : "Category updated");
      } else {
        await categoryService.createCategory(payload);
        success(locale === "ar" ? "تم إنشاء التصنيف" : "Category created");
      }
      navigate("/admin/categories");
    } catch (err) {
      toastError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout
      activeKey="categories"
      title={title}
      breadcrumbItems={[
        { label: locale === "ar" ? "التصنيفات" : "Categories", href: "/admin/categories" },
        { label: title },
      ]}
      topbarActions={
        <Link to="/admin/categories">
          <Button variant="outline" size="sm">
            {locale === "ar" ? "رجوع" : "Back"}
          </Button>
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : initialValues === null ? (
        <p className="text-sm text-brand-muted">
          {locale === "ar" ? "التصنيف غير موجود" : "Category not found"}
        </p>
      ) : (
        <CategoryForm
          key={id ?? "new"}
          initialValues={initialValues}
          categories={categories}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </AdminLayout>
  );
}
