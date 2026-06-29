import { useEffect, useState } from "react";
import * as addressService from "../../services/addressService.js";
import * as governorateService from "../../services/governorateService.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { GovernorateSelect } from "./GovernorateSelect.jsx";
import { Button } from "../ui/Button.jsx";
import { Input, Label, FieldError, InputGroup } from "../ui/Input.jsx";
import { Card, CardBody, CardHeader } from "../ui/Card.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { ConfirmModal } from "../ui/Modal.jsx";
import { useToast } from "../ui/Toast.jsx";
import { cn } from "../../utils/cn.js";
import {
  findGovernorateByName,
  getShippingErrorMessage,
  resolveGovernorateFormValue,
} from "../../utils/shippingHelpers.js";

function getAddressId(address) {
  return address?.id ?? address?.Id;
}

function formatAddressLine(address, locale) {
  const line2 = address?.addressLine2 ?? address?.AddressLine2;
  const parts = [
    address?.addressLine1 ?? address?.AddressLine1,
    line2,
    address?.city ?? address?.City,
    address?.governorate ?? address?.Governorate,
  ].filter(Boolean);
  return parts.join(locale === "ar" ? "، " : ", ");
}

function addressToForm(address, governorates) {
  const governorate = address?.governorate ?? address?.Governorate ?? "";
  return {
    fullName: address?.fullName ?? address?.FullName ?? "",
    phoneNumber: address?.phoneNumber ?? address?.PhoneNumber ?? "",
    governorate: resolveGovernorateFormValue(governorates, governorate),
    city: address?.city ?? address?.City ?? "",
    addressLine1: address?.addressLine1 ?? address?.AddressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? address?.AddressLine2 ?? "",
    postalCode: address?.postalCode ?? address?.PostalCode ?? "",
    isDefault: Boolean(address?.isDefault ?? address?.IsDefault),
  };
}

const EMPTY_FORM = {
  fullName: "",
  phoneNumber: "",
  governorate: "",
  city: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  isDefault: true,
};

function AddressForm({
  mode,
  form,
  setForm,
  fieldErrors,
  governorates,
  saving,
  onSubmit,
  onCancel,
  locale,
}) {
  const title =
    mode === "edit"
      ? locale === "ar"
        ? "تعديل العنوان"
        : "Edit Address"
      : locale === "ar"
        ? "عنوان جديد"
        : "New Address";

  const submitLabel =
    mode === "edit"
      ? locale === "ar"
        ? "حفظ التعديلات"
        : "Save Changes"
      : locale === "ar"
        ? "حفظ العنوان"
        : "Save Address";

  return (
    <Card variant="bordered" padding="md">
      <CardHeader title={title} />
      <form onSubmit={onSubmit}>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <InputGroup className="sm:col-span-2">
            <Label required>{locale === "ar" ? "الاسم الكامل" : "Full name"}</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              variant={fieldErrors.fullName ? "error" : "default"}
            />
            <FieldError>{fieldErrors.fullName}</FieldError>
          </InputGroup>
          <InputGroup>
            <Label required>{locale === "ar" ? "الهاتف" : "Phone"}</Label>
            <Input
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              variant={fieldErrors.phoneNumber ? "error" : "default"}
            />
            <FieldError>{fieldErrors.phoneNumber}</FieldError>
          </InputGroup>
          <GovernorateSelect
            governorates={governorates}
            value={form.governorate}
            onChange={(governorate) => setForm({ ...form, governorate })}
            error={fieldErrors.governorate}
          />
          <InputGroup>
            <Label required>{locale === "ar" ? "المدينة" : "City"}</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              variant={fieldErrors.city ? "error" : "default"}
            />
            <FieldError>{fieldErrors.city}</FieldError>
          </InputGroup>
          <InputGroup className="sm:col-span-2">
            <Label required>{locale === "ar" ? "العنوان" : "Address line"}</Label>
            <Input
              value={form.addressLine1}
              onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              variant={fieldErrors.addressLine1 ? "error" : "default"}
            />
            <FieldError>{fieldErrors.addressLine1}</FieldError>
          </InputGroup>
          <InputGroup className="sm:col-span-2">
            <Label>{locale === "ar" ? "تفاصيل إضافية" : "Address line 2"}</Label>
            <Input
              value={form.addressLine2}
              onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            />
          </InputGroup>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <Button type="submit" variant="accent" loading={saving}>
              {submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}

export function ShippingAddressSelector({
  value,
  onChange,
  className,
}) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const { success: toastSuccess } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAddresses({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [data, govData] = await Promise.all([
        addressService.getShippingAddresses(),
        governorateService.getGovernorates(),
      ]);
      const list = Array.isArray(data) ? data : [];
      const govList = Array.isArray(govData) ? govData : [];
      setGovernorates(govList);
      setAddresses(list);
      if (!value && list.length > 0 && !formMode) {
        const defaultAddr = list.find((a) => a.isDefault ?? a.IsDefault) ?? list[0];
        onChange(getAddressId(defaultAddr), defaultAddr);
      }
      return list;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (user?.name && formMode === "create" && !form.fullName) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name || user.userName || "",
        phoneNumber: user.phoneNumber || "",
      }));
    }
  }, [user, formMode, form.fullName]);

  function closeForm() {
    setFormMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setError(null);
  }

  function openCreateForm() {
    setFormMode("create");
    setEditingId(null);
    setForm({ ...EMPTY_FORM, fullName: user?.name || user?.userName || "", phoneNumber: user?.phoneNumber || "" });
    setFieldErrors({});
    setError(null);
  }

  function openEditForm(address) {
    setFormMode("edit");
    setEditingId(getAddressId(address));
    setForm(addressToForm(address, governorates));
    setFieldErrors({});
    setError(null);
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = locale === "ar" ? "مطلوب" : "Required";
    if (!form.phoneNumber.trim()) nextErrors.phoneNumber = locale === "ar" ? "مطلوب" : "Required";
    if (!form.governorate.trim()) {
      nextErrors.governorate = getShippingErrorMessage("governorate_required", locale);
    } else if (!findGovernorateByName(governorates, form.governorate.trim())) {
      nextErrors.governorate = getShippingErrorMessage("shipping_unavailable", locale);
    }
    if (!form.city.trim()) nextErrors.city = locale === "ar" ? "مطلوب" : "Required";
    if (!form.addressLine1.trim()) nextErrors.addressLine1 = locale === "ar" ? "مطلوب" : "Required";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload() {
    return {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      governorate: form.governorate.trim(),
      city: form.city.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || null,
      postalCode: form.postalCode.trim() || null,
      isDefault: form.isDefault,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      let saved;

      if (formMode === "edit" && editingId) {
        saved = await addressService.updateShippingAddress(editingId, payload);
      } else {
        saved = await addressService.createShippingAddress(payload);
      }

      await loadAddresses({ silent: true });
      onChange(getAddressId(saved), saved);
      closeForm();
    } catch (err) {
      const code = err?.code ?? err?.errorCode;
      if (code === "shipping_unavailable" || code === "governorate_invalid") {
        setFieldErrors((prev) => ({
          ...prev,
          governorate: getShippingErrorMessage(code, locale, err?.message),
        }));
      } else {
        setError(err);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const id = getAddressId(deleteTarget);
    const wasSelected = value === id;

    setDeleting(true);
    setError(null);
    try {
      await addressService.deleteShippingAddress(id);
      if (editingId === id) closeForm();
      setDeleteTarget(null);

      const list = await loadAddresses({ silent: true });
      if (wasSelected) {
        const next = list.find((a) => a.isDefault ?? a.IsDefault) ?? list[0];
        if (next) {
          onChange(getAddressId(next), next);
        } else {
          onChange(null, null);
        }
      }
      toastSuccess(
        locale === "ar" ? "تم حذف العنوان بنجاح" : "Address deleted successfully"
      );
    } catch (err) {
      setError(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className={cn("flex justify-center py-8", className)}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-medium text-brand-text">
          {locale === "ar" ? "عنوان الشحن" : "Shipping Address"}
        </h3>
        {!formMode ? (
          <Button type="button" variant="outline" size="sm" onClick={openCreateForm}>
            {locale === "ar" ? "عنوان جديد" : "New Address"}
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={closeForm}>
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </Button>
        )}
      </div>

      {error && !formMode ? (
        <p className="text-sm text-red-700">{error.message}</p>
      ) : null}

      {!formMode && addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => {
            const id = getAddressId(address);
            const selected = value === id;
            const governorateName = address?.governorate ?? address?.Governorate;
            const hasValidGovernorate = Boolean(findGovernorateByName(governorates, governorateName));
            return (
              <div
                key={id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  selected
                    ? "border-brand-accent bg-brand-accent/5"
                    : "border-brand-border hover:border-brand-muted"
                )}
              >
                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    name="shipping-address"
                    className="sr-only"
                    checked={selected}
                    onChange={() => onChange(id, address)}
                  />
                  <p className="font-medium text-brand-text">
                    {address.fullName ?? address.FullName}
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">
                    {address.phoneNumber ?? address.PhoneNumber}
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">{formatAddressLine(address, locale)}</p>
                  {!hasValidGovernorate ? (
                    <p className="mt-2 text-xs text-amber-700">
                      {getShippingErrorMessage("shipping_unavailable", locale)}
                    </p>
                  ) : null}
                </label>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(address)}
                  >
                    {locale === "ar" ? "تعديل" : "Edit"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget(address)}
                  >
                    {locale === "ar" ? "حذف" : "Delete"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : !formMode ? (
        <Card variant="flat" padding="md">
          <CardBody className="text-center text-sm text-brand-muted">
            {locale === "ar" ? "أضف عنوان شحن للمتابعة" : "Add a shipping address to continue"}
          </CardBody>
        </Card>
      ) : null}

      {formMode ? (
        <AddressForm
          mode={formMode}
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          governorates={governorates}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          locale={locale}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={locale === "ar" ? "حذف العنوان" : "Delete Address"}
        message={
          deleteTarget
            ? locale === "ar"
              ? `هل تريد حذف عنوان "${deleteTarget.fullName ?? deleteTarget.FullName}"؟`
              : `Delete address for "${deleteTarget.fullName ?? deleteTarget.FullName}"?`
            : ""
        }
        confirmLabel={locale === "ar" ? "حذف" : "Delete"}
        cancelLabel={locale === "ar" ? "إلغاء" : "Cancel"}
        variant="danger"
      />
    </div>
  );
}
