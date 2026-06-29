import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { STORE_EVENTS } from "../../constants/storeEvents.js";
import { useStoreSync } from "../../hooks/useStoreSync.js";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Skeleton,
} from "../../components/ui/index.js";
import * as systemSettingsService from "../../services/systemSettingsService.js";

export function SettingsPage() {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const title = locale === "ar" ? "الإعدادات" : "Settings";
  usePageTitle(title);

  const [settings, setSettings] = useState({
    maintenanceMode: false,
    betaFeatures: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(() => {
    setLoading(true);
    return systemSettingsService
      .getSystemSettings()
      .then((data) =>
        setSettings({
          maintenanceMode: data?.maintenanceMode ?? data?.MaintenanceMode ?? false,
          betaFeatures: data?.betaFeatures ?? data?.BetaFeatures ?? false,
        })
      )
      .catch((err) => toastError(err.message))
      .finally(() => setLoading(false));
  }, [toastError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useStoreSync([STORE_EVENTS.StoreSettingsUpdated], () => loadSettings());

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await systemSettingsService.updateSystemSettings(settings);
      success(locale === "ar" ? "تم حفظ الإعدادات" : "Settings saved");
    } catch (err) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout activeKey="settings" title={title}>
      {loading ? (
        <Skeleton className="h-48 w-full max-w-xl rounded-lg" />
      ) : (
        <form onSubmit={handleSave} className="max-w-xl">
          <Card variant="default" padding="lg">
            <CardHeader
              title={locale === "ar" ? "إعدادات النظام" : "System Settings"}
              subtitle={
                locale === "ar"
                  ? "التحكم في وضع الصيانة والميزات التجريبية"
                  : "Control maintenance mode and beta features"
              }
            />
            <CardBody className="space-y-4">
              <label className="flex items-start gap-3 rounded-lg border border-brand-border p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                  }
                />
                <span>
                  <span className="block font-medium text-brand-text">
                    {locale === "ar" ? "وضع الصيانة" : "Maintenance mode"}
                  </span>
                  <span className="text-sm text-brand-muted">
                    {locale === "ar"
                      ? "إيقاف المتجر مؤقتاً للزوار"
                      : "Temporarily disable the storefront for visitors"}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-brand-border p-4">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.betaFeatures}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, betaFeatures: e.target.checked }))
                  }
                />
                <span>
                  <span className="block font-medium text-brand-text">
                    {locale === "ar" ? "الميزات التجريبية" : "Beta features"}
                  </span>
                  <span className="text-sm text-brand-muted">
                    {locale === "ar"
                      ? "تفعيل الميزات قيد التطوير"
                      : "Enable features under development"}
                  </span>
                </span>
              </label>
            </CardBody>
            <CardFooter>
              <Button type="submit" variant="accent" loading={saving}>
                {locale === "ar" ? "حفظ الإعدادات" : "Save settings"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </AdminLayout>
  );
}
