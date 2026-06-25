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

function mapVariantToForm(variant) {
  return {
    id: variant?.id ?? variant?.Id,
    colorNameAr: variant?.colorNameAr ?? variant?.ColorNameAr ?? "",
    colorNameEn: variant?.colorNameEn ?? variant?.ColorNameEn ?? "",
    sizeNameAr: variant?.sizeNameAr ?? variant?.SizeNameAr ?? "",
    sizeNameEn: variant?.sizeNameEn ?? variant?.SizeNameEn ?? "",
    sku: variant?.sku ?? variant?.Sku ?? "",
    price: variant?.price ?? variant?.Price ?? "",
    compareAtPrice: variant?.compareAtPrice ?? variant?.CompareAtPrice ?? "",
    status: variant?.status ?? variant?.Status ?? 1,
    isDefault: variant?.isDefault ?? variant?.IsDefault ?? false,
    quantity: variant?.quantityOnHand ?? variant?.QuantityOnHand ?? 0,
    lowStockThreshold: variant?.lowStockThreshold ?? variant?.LowStockThreshold ?? 5,
  };
}

function mapProductToForm(product) {
  const ar = product?.arabic ?? product?.Arabic ?? {};
  const en = product?.english ?? product?.English ?? {};
  const variants = getProductVariants(product);
  const images = getProductImages(product);

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
    imageUrl: getPrimaryImagePath(product) ?? "",
    variants: variants.length > 0 ? variants.map(mapVariantToForm) : [mapVariantToForm(null)],
    images:
      images.length > 0
        ? images.map((img, index) => ({
            id: img?.id ?? img?.Id,
            imageUrl: img?.imageUrl ?? img?.ImageUrl ?? "",
            fileName: "",
            isPrimary: img?.isPrimary ?? img?.IsPrimary ?? index === 0,
            uploading: false,
          }))
        : [],
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
