import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { ProductForm } from "../../components/admin/index.js";
import { Button, Skeleton } from "../../components/ui/index.js";
import * as productService from "../../services/productService.js";
import * as categoryService from "../../services/categoryService.js";
import {
  getPrimaryImagePath,
  getProductImages,
  getProductVariants,
} from "../../utils/productHelpers.js";

function mapProductToForm(product) {
  const ar = product?.arabic ?? product?.Arabic ?? {};
  const en = product?.english ?? product?.English ?? {};
  const variants = getProductVariants(product);
  const defaultVariant = variants.find((v) => v.isDefault ?? v.IsDefault) ?? variants[0] ?? {};
  const images = getProductImages(product);
  const primary = images.find((img) => img.isPrimary ?? img.IsPrimary) ?? images[0];

  return {
    categoryId: product?.categoryId ?? product?.CategoryId ?? "",
    status: product?.status ?? product?.Status ?? 1,
    compareAtPrice: product?.compareAtPrice ?? product?.CompareAtPrice ?? "",
    isFeatured: product?.isFeatured ?? product?.IsFeatured ?? false,
    isNewArrival: product?.isNewArrival ?? product?.IsNewArrival ?? false,
    nameAr: ar.name ?? ar.Name ?? "",
    nameEn: en.name ?? en.Name ?? "",
    slugAr: ar.slug ?? ar.Slug ?? "",
    slugEn: en.slug ?? en.Slug ?? "",
    shortDescriptionAr: ar.shortDescription ?? ar.ShortDescription ?? "",
    shortDescriptionEn: en.shortDescription ?? en.ShortDescription ?? "",
    descriptionAr: ar.description ?? ar.Description ?? "",
    descriptionEn: en.description ?? en.Description ?? "",
    imageUrl: primary?.imageUrl ?? primary?.ImageUrl ?? getPrimaryImagePath(product) ?? "",
    variants: [
      {
        id: defaultVariant.id ?? defaultVariant.Id,
        colorNameAr: defaultVariant.colorNameAr ?? defaultVariant.ColorNameAr ?? "",
        colorNameEn: defaultVariant.colorNameEn ?? defaultVariant.ColorNameEn ?? "",
        sku: defaultVariant.sku ?? defaultVariant.Sku ?? "",
        price: defaultVariant.price ?? defaultVariant.Price ?? "",
        compareAtPrice: defaultVariant.compareAtPrice ?? defaultVariant.CompareAtPrice ?? "",
        status: defaultVariant.status ?? defaultVariant.Status ?? 1,
        quantity: defaultVariant.quantityOnHand ?? defaultVariant.QuantityOnHand ?? 0,
        lowStockThreshold:
          defaultVariant.lowStockThreshold ?? defaultVariant.LowStockThreshold ?? 5,
      },
    ],
  };
}

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();

  const title = isEdit
    ? locale === "ar"
      ? "تعديل منتج"
      : "Edit Product"
    : locale === "ar"
      ? "منتج جديد"
      : "New Product";
  usePageTitle(title);

  const [categories, setCategories] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryService
      .getCategories({ includeInactive: true })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setInitialValues({});
      return;
    }
    setLoading(true);
    productService
      .getProductById(id, { includeDraft: true })
      .then((data) => setInitialValues(mapProductToForm(data)))
      .catch((err) => {
        toastError(err.message);
        setInitialValues(null);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, toastError]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      if (isEdit) {
        await productService.updateProduct(id, payload);
        success(locale === "ar" ? "تم تحديث المنتج" : "Product updated");
      } else {
        await productService.createProduct(payload);
        success(locale === "ar" ? "تم إنشاء المنتج" : "Product created");
      }
      navigate("/admin/products");
    } catch (err) {
      toastError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout
      activeKey="products"
      title={title}
      breadcrumbItems={[
        { label: locale === "ar" ? "المنتجات" : "Products", href: "/admin/products" },
        { label: title },
      ]}
      topbarActions={
        <Link to="/admin/products">
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
          {locale === "ar" ? "المنتج غير موجود" : "Product not found"}
        </p>
      ) : (
        <ProductForm
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
