import { useEffect, useRef, useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import * as productImageService from "../../services/productImageService.js";
import { useAutoTranslate } from "../../hooks/useAutoTranslate.js";
import { useToast } from "../ui/Toast.jsx";
import { generateSlug } from "../../utils/slugHelper.js";
import { FileUpload } from "../ui/FileUpload.jsx";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  FieldError,
  Input,
  InputGroup,
  Label,
  Textarea,
} from "../ui/index.js";

const DEFAULT_VARIANT = {
  colorNameAr: "",
  colorNameEn: "",
  sizeNameAr: "",
  sizeNameEn: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  status: 1,
  isDefault: true,
  quantity: 0,
  lowStockThreshold: 5,
};

const EMPTY_PRODUCT = {
  categoryId: "",
  status: 1,
  compareAtPrice: "",
  isFeatured: false,
  isNewArrival: false,
  nameAr: "",
  nameEn: "",
  slugAr: "",
  slugEn: "",
  shortDescriptionAr: "",
  shortDescriptionEn: "",
  descriptionAr: "",
  descriptionEn: "",
  images: [],           // [{ id?, imageUrl, thumbnailUrl?, fileName, isPrimary, uploading, pendingFile? }]
  variants: [{ ...DEFAULT_VARIANT }],
};

const PRODUCT_EN_KEYS = [
  "nameEn",
  "slugEn",
  "shortDescriptionEn",
  "descriptionEn",
];

const PRODUCT_AR_TO_EN = [
  { ar: "nameAr", en: "nameEn", slugResult: false },
  { ar: "nameAr", en: "slugEn", slugResult: true },
  { ar: "slugAr", en: "slugEn", slugResult: true },
  { ar: "shortDescriptionAr", en: "shortDescriptionEn", slugResult: false },
  { ar: "descriptionAr", en: "descriptionEn", slugResult: false },
];

const VARIANT_AR_TO_EN = [
  { ar: "colorNameAr", en: "colorNameEn", slugResult: false },
  { ar: "sizeNameAr", en: "sizeNameEn", slugResult: false },
];

function variantEnKey(index, field) {
  return `variant:${index}:${field}`;
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function mapUploadedImage(dto) {
  return {
    id: dto?.id ?? dto?.Id,
    imageUrl: dto?.imageUrl ?? dto?.ImageUrl ?? "",
    thumbnailUrl: dto?.thumbnailUrl ?? dto?.ThumbnailUrl ?? "",
  };
}

export function ProductForm({ productId, initialValues, categories = [], onSubmit, submitting }) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const { error: toastError } = useToast();

  const [form, setForm] = useState(() => {
    const merged = { ...EMPTY_PRODUCT, ...initialValues };
    // Normalise variants
    merged.variants = (merged.variants ?? [{ ...DEFAULT_VARIANT }]).map((v) => ({
      ...DEFAULT_VARIANT,
      ...v,
    }));
    // Normalise images: accept existing imageUrl string or images array
    if (!merged.images || merged.images.length === 0) {
      merged.images = merged.imageUrl
        ? [{ imageUrl: merged.imageUrl, fileName: "", isPrimary: true, uploading: false }]
        : [];
    }
    return merged;
  });
  const [errors, setErrors] = useState({});
  const [waitingTranslation, setWaitingTranslation] = useState(false);
  const formRef = useRef(form);

  const { seedLockedEnglishFields, handleEnglishChange, queueTranslation, waitForPendingTranslations } =
    useAutoTranslate({
      onWarning: (message) => toastError(message),
    });

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    const merged = { ...EMPTY_PRODUCT, ...initialValues };
    const extraLocked = [];
    (merged.variants ?? []).forEach((variant, index) => {
      if (variant?.colorNameEn?.trim()) extraLocked.push(variantEnKey(index, "colorNameEn"));
      if (variant?.sizeNameEn?.trim()) extraLocked.push(variantEnKey(index, "sizeNameEn"));
    });
    seedLockedEnglishFields(merged, PRODUCT_EN_KEYS, extraLocked);
  }, [initialValues, seedLockedEnglishFields]);

  // ── Field helpers ─────────────────────────────────────────────────────────

  function applyEnglishField(enKey, value) {
    setForm((prev) => {
      const next = { ...prev, [enKey]: value };
      formRef.current = next;
      return next;
    });
  }

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameAr" && !prev.slugAr) next.slugAr = generateSlug(value);
      return next;
    });

    PRODUCT_AR_TO_EN.filter((item) => item.ar === key).forEach((pair) => {
      queueTranslation({
        arText: value,
        enKey: pair.en,
        slugResult: pair.slugResult,
        applyTranslation: applyEnglishField,
      });
    });
  }

  function updateEnglishField(key, value) {
    handleEnglishChange(key, value, applyEnglishField);
  }

  function updateVariant(index, key, value) {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [key]: value };
      return { ...prev, variants };
    });

    const pair = VARIANT_AR_TO_EN.find((item) => item.ar === key);
    if (pair) {
      const enKey = variantEnKey(index, pair.en);
      queueTranslation({
        arText: value,
        enKey,
        slugResult: pair.slugResult,
        applyTranslation: (_enKey, translated) => {
          setForm((prev) => {
            const variants = [...prev.variants];
            variants[index] = { ...variants[index], [pair.en]: translated };
            const next = { ...prev, variants };
            formRef.current = next;
            return next;
          });
        },
      });
    }
  }

  function updateVariantEnglish(index, key, value) {
    const enKey = variantEnKey(index, key);
    handleEnglishChange(enKey, value, (_field, nextValue) => {
      setForm((prev) => {
        const variants = [...prev.variants];
        variants[index] = { ...variants[index], [key]: nextValue };
        const next = { ...prev, variants };
        formRef.current = next;
        return next;
      });
    });
  }

  function addVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...DEFAULT_VARIANT, isDefault: false }],
    }));
  }

  function removeVariant(index) {
    setForm((prev) => {
      const variants = prev.variants.filter((_, i) => i !== index);
      if (variants.length > 0 && !variants.some((v) => v.isDefault)) {
        variants[0] = { ...variants[0], isDefault: true };
      }
      return { ...prev, variants };
    });
  }

  // ── Image helpers ─────────────────────────────────────────────────────────

  function addImageSlot() {
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { imageUrl: "", fileName: "", isPrimary: prev.images.length === 0, uploading: false },
      ],
    }));
  }

  function removeImageSlot(index) {
    setForm((prev) => {
      const removed = prev.images[index];
      if (removed?.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.imageUrl);
      }
      let images = prev.images.filter((_, i) => i !== index);
      // If removed primary, make first one primary
      if (images.length > 0 && !images.some((img) => img.isPrimary)) {
        images[0] = { ...images[0], isPrimary: true };
      }
      return { ...prev, images };
    });
  }

  function setImagePrimary(index) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  }

  async function handleImageChange(index, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setForm((prev) => {
      const images = [...prev.images];
      const previous = images[index];
      if (previous?.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previous.imageUrl);
      }
      images[index] = { ...images[index], fileName: file.name, uploading: Boolean(productId), pendingFile: productId ? undefined : file };
      if (!productId) {
        images[index].imageUrl = URL.createObjectURL(file);
      }
      return { ...prev, images };
    });

    if (!productId) return;

    try {
      const currentImage = formRef.current.images[index];
      const uploaded = mapUploadedImage(
        await productImageService.uploadProductImage(productId, file, {
          isPrimary: Boolean(currentImage?.isPrimary),
          sortOrder: index,
        })
      );
      setForm((prev) => {
        const images = [...prev.images];
        images[index] = {
          ...images[index],
          id: uploaded.id,
          imageUrl: uploaded.imageUrl,
          thumbnailUrl: uploaded.thumbnailUrl,
          uploading: false,
          pendingFile: undefined,
        };
        return { ...prev, images };
      });
    } catch (err) {
      toastError(err.message);
      setForm((prev) => {
        const images = [...prev.images];
        images[index] = {
          ...images[index],
          imageUrl: "",
          fileName: "",
          uploading: false,
          pendingFile: undefined,
        };
        return { ...prev, images };
      });
    }
  }

  const anyUploading = form.images.some((img) => img.uploading);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate() {
    const next = {};
    if (!form.categoryId) next.categoryId = isAr ? "مطلوب" : "Required";
    if (!form.nameAr.trim()) next.nameAr = isAr ? "مطلوب" : "Required";
    if (!form.nameEn.trim()) next.nameEn = isAr ? "مطلوب" : "Required";
    if (!form.slugAr.trim()) next.slugAr = isAr ? "مطلوب" : "Required";
    if (!form.slugEn.trim()) next.slugEn = isAr ? "مطلوب" : "Required";
    form.variants.forEach((v, i) => {
      if (!v.sku?.trim()) next[`variant_${i}_sku`] = isAr ? "SKU مطلوب" : "SKU required";
      if (!v.price || Number(v.price) <= 0) next[`variant_${i}_price`] = isAr ? "السعر مطلوب" : "Price required";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setWaitingTranslation(true);
    try {
      await waitForPendingTranslations();
    } finally {
      setWaitingTranslation(false);
    }

    const current = formRef.current;

    const pendingUploads = current.images
      .filter((img) => img.pendingFile)
      .map((img, i) => ({
        file: img.pendingFile,
        isPrimary: img.isPrimary,
        sortOrder: i,
      }));

    const payload = {
      categoryId: Number(current.categoryId),
      status: Number(current.status),
      compareAtPrice: current.compareAtPrice ? Number(current.compareAtPrice) : null,
      isFeatured: Boolean(current.isFeatured),
      isNewArrival: Boolean(current.isNewArrival),
      nameAr: current.nameAr.trim(),
      nameEn: current.nameEn.trim(),
      slugAr: current.slugAr.trim(),
      slugEn: current.slugEn.trim(),
      shortDescriptionAr: current.shortDescriptionAr?.trim() || null,
      shortDescriptionEn: current.shortDescriptionEn?.trim() || null,
      descriptionAr: current.descriptionAr?.trim() || null,
      descriptionEn: current.descriptionEn?.trim() || null,
      variants: current.variants.map((v) => ({
        id: v.id ?? undefined,
        colorNameAr: v.colorNameAr?.trim() || current.nameAr,
        colorNameEn: v.colorNameEn?.trim() || current.nameEn,
        sizeNameAr: v.sizeNameAr?.trim() || "",
        sizeNameEn: v.sizeNameEn?.trim() || "",
        sku: v.sku.trim(),
        price: Number(v.price) || 0,
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        status: Number(v.status) || 1,
        isDefault: Boolean(v.isDefault),
        quantity: Number(v.quantity) || 0,
        lowStockThreshold: Number(v.lowStockThreshold) || 5,
      })),
      images: productId
        ? current.images
            .filter((img) => img.id && img.imageUrl)
            .map((img, i) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              thumbnailUrl: img.thumbnailUrl || undefined,
              isPrimary: img.isPrimary,
              sortOrder: i,
            }))
        : [],
    };

    await onSubmit(payload, { pendingUploads });
  }

  // ── Labels ────────────────────────────────────────────────────────────────

  const t = {
    category: isAr ? "التصنيف" : "Category",
    select: isAr ? "اختر" : "Select",
    status: isAr ? "الحالة" : "Status",
    draft: isAr ? "مسودة" : "Draft",
    active: isAr ? "نشط" : "Active",
    archived: isAr ? "مؤرشف" : "Archived",
    nameAr: isAr ? "الاسم (عربي)" : "Name (Arabic)",
    nameEn: isAr ? "الاسم (إنجليزي)" : "Name (English)",
    slugAr: isAr ? "الرابط (عربي)" : "Slug (Arabic)",
    slugEn: isAr ? "الرابط (إنجليزي)" : "Slug (English)",
    shortDescAr: isAr ? "وصف قصير (عربي)" : "Short description (Arabic)",
    shortDescEn: isAr ? "وصف قصير (إنجليزي)" : "Short description (English)",
    descAr: isAr ? "الوصف (عربي)" : "Description (Arabic)",
    descEn: isAr ? "الوصف (إنجليزي)" : "Description (English)",
    images: isAr ? "صور المنتج" : "Product images",
    imagesHint: isAr ? "انقر على النجمة لتعيين الصورة الرئيسية" : "Click the star to set the primary image",
    addImage: isAr ? "إضافة صورة" : "Add image",
    removeImage: isAr ? "حذف الصورة" : "Remove image",
    setPrimary: isAr ? "الصورة الرئيسية" : "Primary",
    featured: isAr ? "مميز" : "Featured",
    newArrival: isAr ? "وصل حديثاً" : "New arrival",
    variants: isAr ? "المتغيرات (ألوان / مقاسات)" : "Variants (Colors / Sizes)",
    variantNum: (n) => (isAr ? `متغير ${n}` : `Variant ${n}`),
    colorAr: isAr ? "اللون (عربي)" : "Color (Arabic)",
    colorEn: isAr ? "اللون (إنجليزي)" : "Color (English)",
    sizeAr: isAr ? "المقاس (عربي)" : "Size (Arabic)",
    sizeEn: isAr ? "المقاس (إنجليزي)" : "Size (English)",
    sku: "SKU",
    price: isAr ? "السعر" : "Price",
    comparePrice: isAr ? "السعر قبل الخصم" : "Compare-at price",
    quantity: isAr ? "الكمية" : "Quantity",
    lowStock: isAr ? "حد المخزون المنخفض" : "Low stock threshold",
    removeVariant: isAr ? "حذف المتغير" : "Remove variant",
    addVariant: isAr ? "إضافة متغير" : "Add variant",
    save: isAr ? "حفظ المنتج" : "Save product",
    variantStatus: isAr ? "الحالة" : "Status",
    imageNum: (n) => (isAr ? `صورة ${n}` : `Image ${n}`),
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="default" padding="lg">
        <CardBody className="grid gap-4 md:grid-cols-2">

          {/* Category */}
          <InputGroup>
            <Label required>{t.category}</Label>
            <select
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
            >
              <option value="">{t.select}</option>
              {categories.map((cat) => (
                <option key={cat.id ?? cat.Id} value={cat.id ?? cat.Id}>
                  {cat.english?.name ?? cat.English?.Name}
                </option>
              ))}
            </select>
            <FieldError>{errors.categoryId}</FieldError>
          </InputGroup>

          {/* Status */}
          <InputGroup>
            <Label>{t.status}</Label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
            >
              <option value={0}>{t.draft}</option>
              <option value={1}>{t.active}</option>
              <option value={2}>{t.archived}</option>
            </select>
          </InputGroup>

          {/* Names */}
          <InputGroup>
            <Label required>{t.nameAr}</Label>
            <Input value={form.nameAr} onChange={(e) => updateField("nameAr", e.target.value)} dir="rtl" />
            <FieldError>{errors.nameAr}</FieldError>
          </InputGroup>
          <InputGroup>
            <Label required>{t.nameEn}</Label>
            <Input value={form.nameEn} onChange={(e) => updateEnglishField("nameEn", e.target.value)} />
            <FieldError>{errors.nameEn}</FieldError>
          </InputGroup>

          {/* Slugs */}
          <InputGroup>
            <Label required>{t.slugAr}</Label>
            <Input value={form.slugAr} onChange={(e) => updateField("slugAr", e.target.value)} dir="rtl" />
            <FieldError>{errors.slugAr}</FieldError>
          </InputGroup>
          <InputGroup>
            <Label required>{t.slugEn}</Label>
            <Input value={form.slugEn} onChange={(e) => updateEnglishField("slugEn", e.target.value)} />
            <FieldError>{errors.slugEn}</FieldError>
          </InputGroup>

          {/* Descriptions */}
          <InputGroup className="md:col-span-2">
            <Label>{t.shortDescAr}</Label>
            <Textarea value={form.shortDescriptionAr} onChange={(e) => updateField("shortDescriptionAr", e.target.value)} dir="rtl" />
          </InputGroup>
          <InputGroup className="md:col-span-2">
            <Label>{t.shortDescEn}</Label>
            <Textarea value={form.shortDescriptionEn} onChange={(e) => updateEnglishField("shortDescriptionEn", e.target.value)} />
          </InputGroup>
          <InputGroup className="md:col-span-2">
            <Label>{t.descAr}</Label>
            <Textarea value={form.descriptionAr} onChange={(e) => updateField("descriptionAr", e.target.value)} dir="rtl" />
          </InputGroup>
          <InputGroup className="md:col-span-2">
            <Label>{t.descEn}</Label>
            <Textarea value={form.descriptionEn} onChange={(e) => updateEnglishField("descriptionEn", e.target.value)} />
          </InputGroup>

          {/* ── Product images ─────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <Label>{t.images}</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addImageSlot} className="gap-1.5">
                <PlusIcon />
                {t.addImage}
              </Button>
            </div>
            <p className="mb-3 text-xs text-brand-muted">{t.imagesHint}</p>

            <div className="space-y-3">
              {form.images.length === 0 ? (
                <button
                  type="button"
                  onClick={addImageSlot}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-border py-6 text-sm text-brand-muted transition-colors hover:border-brand-accent hover:text-brand-accent"
                >
                  <PlusIcon />
                  {t.addImage}
                </button>
              ) : (
                form.images.map((img, index) => (
                  <div key={index} className="relative">
                    <FileUpload
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e)}
                      disabled={img.uploading}
                      loading={img.uploading}
                      previewUrl={img.imageUrl || null}
                      fileName={img.fileName}
                    />
                    {/* Controls row */}
                    <div className="mt-1.5 flex items-center gap-2 ps-1">
                      <span className="text-xs text-brand-muted">{t.imageNum(index + 1)}</span>
                      <button
                        type="button"
                        onClick={() => setImagePrimary(index)}
                        title={t.setPrimary}
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                          img.isPrimary
                            ? "bg-brand-accent/15 text-brand-accent"
                            : "text-brand-muted hover:text-brand-accent"
                        }`}
                      >
                        <StarIcon filled={img.isPrimary} />
                        {t.setPrimary}
                      </button>
                      {form.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageSlot(index)}
                          className="ms-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-brand-muted transition-colors hover:text-red-600"
                          title={t.removeImage}
                        >
                          <TrashIcon />
                          {t.removeImage}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {form.images.length > 0 && (
              <button
                type="button"
                onClick={addImageSlot}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-border py-3 text-sm text-brand-muted transition-colors hover:border-brand-accent hover:text-brand-accent"
              >
                <PlusIcon />
                {t.addImage}
              </button>
            )}
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField("isFeatured", e.target.checked)} />
              {t.featured}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isNewArrival} onChange={(e) => updateField("isNewArrival", e.target.checked)} />
              {t.newArrival}
            </label>
          </div>

          {/* ── Variants section ─────────────────────────────────────── */}
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-brand-text">{t.variants}</p>
              <Button type="button" variant="ghost" size="sm" onClick={addVariant} className="gap-1.5">
                <PlusIcon />
                {t.addVariant}
              </Button>
            </div>

            <div className="space-y-4">
              {form.variants.map((variant, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-brand-border bg-brand-secondary/30 p-4"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-accent">
                      {t.variantNum(index + 1)}
                      {index === 0 && (
                        <span className="ms-2 rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs text-brand-accent">
                          {isAr ? "الافتراضي" : "Default"}
                        </span>
                      )}
                    </span>
                    {form.variants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                        className="gap-1 text-red-600 hover:text-red-700"
                        aria-label={t.removeVariant}
                      >
                        <TrashIcon />
                        {t.removeVariant}
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InputGroup>
                      <Label>{t.colorAr}</Label>
                      <Input value={variant.colorNameAr} onChange={(e) => updateVariant(index, "colorNameAr", e.target.value)} placeholder={isAr ? "مثال: أسود" : "e.g. أسود"} dir="rtl" />
                    </InputGroup>
                    <InputGroup>
                      <Label>{t.colorEn}</Label>
                      <Input value={variant.colorNameEn} onChange={(e) => updateVariantEnglish(index, "colorNameEn", e.target.value)} placeholder="e.g. Black" />
                    </InputGroup>
                    <InputGroup>
                      <Label>{t.sizeAr}</Label>
                      <Input value={variant.sizeNameAr} onChange={(e) => updateVariant(index, "sizeNameAr", e.target.value)} placeholder={isAr ? "مثال: صغير، M، 40" : "e.g. صغير"} dir="rtl" />
                    </InputGroup>
                    <InputGroup>
                      <Label>{t.sizeEn}</Label>
                      <Input value={variant.sizeNameEn} onChange={(e) => updateVariantEnglish(index, "sizeNameEn", e.target.value)} placeholder="e.g. Small, M, 40" />
                    </InputGroup>
                    <InputGroup>
                      <Label required>{t.sku}</Label>
                      <Input value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} placeholder="CB-001-BLK-S" />
                      <FieldError>{errors[`variant_${index}_sku`]}</FieldError>
                    </InputGroup>
                    <InputGroup>
                      <Label required>{t.price}</Label>
                      <Input type="number" min="0" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, "price", e.target.value)} placeholder="0.00" />
                      <FieldError>{errors[`variant_${index}_price`]}</FieldError>
                    </InputGroup>
                    <InputGroup>
                      <Label>{t.comparePrice}</Label>
                      <Input type="number" min="0" step="0.01" value={variant.compareAtPrice} onChange={(e) => updateVariant(index, "compareAtPrice", e.target.value)} placeholder="0.00" />
                    </InputGroup>
                    <InputGroup>
                      <Label>{t.quantity}</Label>
                      <Input type="number" min="0" value={variant.quantity} onChange={(e) => updateVariant(index, "quantity", e.target.value)} />
                    </InputGroup>
                    <InputGroup>
                      <Label>{t.lowStock}</Label>
                      <Input type="number" min="0" value={variant.lowStockThreshold} onChange={(e) => updateVariant(index, "lowStockThreshold", e.target.value)} />
                    </InputGroup>
                    <InputGroup>
                      <Label>{t.variantStatus}</Label>
                      <select
                        value={variant.status}
                        onChange={(e) => updateVariant(index, "status", e.target.value)}
                        className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
                      >
                        <option value={0}>{t.draft}</option>
                        <option value={1}>{t.active}</option>
                        <option value={2}>{t.archived}</option>
                      </select>
                    </InputGroup>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-border py-3 text-sm text-brand-muted transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              <PlusIcon />
              {t.addVariant}
            </button>
          </div>
        </CardBody>

        <CardFooter>
          <Button type="submit" variant="accent" loading={submitting || anyUploading || waitingTranslation}>
            {t.save}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
