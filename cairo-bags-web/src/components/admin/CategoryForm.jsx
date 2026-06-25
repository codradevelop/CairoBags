import { useEffect, useRef, useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import * as fileService from "../../services/fileService.js";
import { useAutoTranslate } from "../../hooks/useAutoTranslate.js";
import { useToast } from "../ui/Toast.jsx";
import { generateSlug } from "../../utils/slugHelper.js";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  FieldError,
  FileUpload,
  Input,
  InputGroup,
  Label,
  Textarea,
} from "../ui/index.js";

const EMPTY_CATEGORY = {
  parentCategoryId: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
  nameAr: "",
  nameEn: "",
  slugAr: "",
  slugEn: "",
  descriptionAr: "",
  descriptionEn: "",
};

const EN_FIELD_KEYS = ["nameEn", "slugEn", "descriptionEn"];

const AR_TO_EN_PAIRS = [
  { ar: "nameAr", en: "nameEn", slugResult: false },
  { ar: "nameAr", en: "slugEn", slugResult: true },
  { ar: "slugAr", en: "slugEn", slugResult: true },
  { ar: "descriptionAr", en: "descriptionEn", slugResult: false },
];

export function CategoryForm({ initialValues, categories = [], onSubmit, submitting }) {
  const { locale } = useLocale();
  const { error: toastError } = useToast();
  const [form, setForm] = useState({ ...EMPTY_CATEGORY, ...initialValues });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
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
    seedLockedEnglishFields({ ...EMPTY_CATEGORY, ...initialValues }, EN_FIELD_KEYS);
  }, [initialValues, seedLockedEnglishFields]);

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
      if (key === "nameAr" && !prev.slugAr) {
        next.slugAr = generateSlug(value);
      }
      return next;
    });

    AR_TO_EN_PAIRS.filter((item) => item.ar === key).forEach((pair) => {
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

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setUploading(true);
    try {
      const { imageUrl } = await fileService.uploadImageAndGetUrl(file);
      updateField("imageUrl", imageUrl);
    } finally {
      setUploading(false);
    }
  }

  function validate() {
    const next = {};
    if (!form.nameAr.trim()) next.nameAr = locale === "ar" ? "مطلوب" : "Required";
    if (!form.nameEn.trim()) next.nameEn = locale === "ar" ? "مطلوب" : "Required";
    if (!form.slugAr.trim()) next.slugAr = locale === "ar" ? "مطلوب" : "Required";
    if (!form.slugEn.trim()) next.slugEn = locale === "ar" ? "مطلوب" : "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

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
    await onSubmit({
      parentCategoryId: current.parentCategoryId ? Number(current.parentCategoryId) : null,
      imageUrl: current.imageUrl || null,
      sortOrder: Number(current.sortOrder) || 0,
      isActive: Boolean(current.isActive),
      nameAr: current.nameAr.trim(),
      nameEn: current.nameEn.trim(),
      slugAr: current.slugAr.trim(),
      slugEn: current.slugEn.trim(),
      descriptionAr: current.descriptionAr?.trim() || null,
      descriptionEn: current.descriptionEn?.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card variant="default" padding="lg">
        <CardBody className="grid gap-4 md:grid-cols-2">
          <InputGroup>
            <Label required>{locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
            <Input value={form.nameAr} onChange={(e) => updateField("nameAr", e.target.value)} dir="rtl" />
            <FieldError>{errors.nameAr}</FieldError>
          </InputGroup>
          <InputGroup>
            <Label required>{locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
            <Input value={form.nameEn} onChange={(e) => updateEnglishField("nameEn", e.target.value)} />
            <FieldError>{errors.nameEn}</FieldError>
          </InputGroup>
          <InputGroup>
            <Label required>{locale === "ar" ? "الرابط (عربي)" : "Slug (Arabic)"}</Label>
            <Input value={form.slugAr} onChange={(e) => updateField("slugAr", e.target.value)} dir="rtl" />
            <FieldError>{errors.slugAr}</FieldError>
          </InputGroup>
          <InputGroup>
            <Label required>{locale === "ar" ? "الرابط (إنجليزي)" : "Slug (English)"}</Label>
            <Input value={form.slugEn} onChange={(e) => updateEnglishField("slugEn", e.target.value)} />
            <FieldError>{errors.slugEn}</FieldError>
          </InputGroup>
          <InputGroup>
            <Label>{locale === "ar" ? "التصنيف الأب" : "Parent category"}</Label>
            <select
              value={form.parentCategoryId}
              onChange={(e) => updateField("parentCategoryId", e.target.value)}
              className="h-11 w-full rounded-md border border-brand-border bg-brand-surface px-3 text-sm"
            >
              <option value="">{locale === "ar" ? "بدون" : "None"}</option>
              {categories.map((cat) => (
                <option key={cat.id ?? cat.Id} value={cat.id ?? cat.Id}>
                  {cat.english?.name ?? cat.English?.Name ?? cat.arabic?.name ?? cat.Arabic?.Name}
                </option>
              ))}
            </select>
          </InputGroup>
          <InputGroup>
            <Label>{locale === "ar" ? "الترتيب" : "Sort order"}</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => updateField("sortOrder", e.target.value)}
            />
          </InputGroup>
          <InputGroup className="md:col-span-2">
            <Label>{locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
            <Textarea value={form.descriptionAr} onChange={(e) => updateField("descriptionAr", e.target.value)} dir="rtl" />
          </InputGroup>
          <InputGroup className="md:col-span-2">
            <Label>{locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
            <Textarea value={form.descriptionEn} onChange={(e) => updateEnglishField("descriptionEn", e.target.value)} />
          </InputGroup>
          <InputGroup className="md:col-span-2">
            <Label>{locale === "ar" ? "صورة التصنيف" : "Category image"}</Label>
            <FileUpload
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              loading={uploading}
              previewUrl={form.imageUrl || null}
              fileName={selectedFileName}
            />
          </InputGroup>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
            />
            {locale === "ar" ? "نشط" : "Active"}
          </label>
        </CardBody>
        <CardFooter>
          <Button type="submit" variant="accent" loading={submitting || uploading || waitingTranslation}>
            {locale === "ar" ? "حفظ" : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
