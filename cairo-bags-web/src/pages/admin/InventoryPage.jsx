import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../layouts/AdminLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { DataTable, InventoryAdjustmentModal } from "../../components/admin/index.js";
import {
  ADMIN_COL,
  AdminTableActions,
  AdminTableText,
  dataColumnShell,
} from "../../components/admin/adminTableConfig.jsx";
import { Badge, Button, Input } from "../../components/ui/index.js";
import * as inventoryService from "../../services/inventoryService.js";
import { paginateItems } from "../../utils/pagination.js";

function getProductVariantId(item) {
  return item?.productVariantId ?? item?.ProductVariantId;
}

function getInventoryProductName(item, locale) {
  if (!item) return "";
  return locale === "ar"
    ? item.productNameAr ?? item.ProductNameAr ?? item.productNameEn ?? item.ProductNameEn ?? ""
    : item.productNameEn ?? item.ProductNameEn ?? item.productNameAr ?? item.ProductNameAr ?? "";
}

function getInventoryColorName(item, locale) {
  if (!item) return "";
  return locale === "ar"
    ? item.colorNameAr ?? item.ColorNameAr ?? item.colorNameEn ?? item.ColorNameEn ?? ""
    : item.colorNameEn ?? item.ColorNameEn ?? item.colorNameAr ?? item.ColorNameAr ?? "";
}

export function InventoryPage() {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const title = locale === "ar" ? "المخزون" : "Inventory";
  usePageTitle(title);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("adjust");
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 10;

  function loadInventory() {
    setLoading(true);
    const request = lowStockOnly
      ? inventoryService.getLowStockInventory()
      : inventoryService.getInventoryList();
    request
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        toastError(err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadInventory();
  }, [lowStockOnly]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const sku = (item.sku ?? item.Sku ?? "").toLowerCase();
      const nameEn = (item.productNameEn ?? item.ProductNameEn ?? "").toLowerCase();
      const nameAr = (item.productNameAr ?? item.ProductNameAr ?? "").toLowerCase();
      return sku.includes(q) || nameEn.includes(q) || nameAr.includes(q);
    });
  }, [items, search]);

  const paged = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search, lowStockOnly]);

  function openModal(item, mode) {
    setSelectedItem(item);
    setModalMode(mode);
    setModalOpen(true);
  }

  async function handleInventoryAction(payload) {
    const productVariantId = getProductVariantId(selectedItem);
    if (!productVariantId) {
      toastError(locale === "ar" ? "معرّف المتغير غير متوفر" : "Product variant id is missing");
      return;
    }
    setSubmitting(true);
    try {
      if (modalMode === "adjust") {
        await inventoryService.adjustStock(productVariantId, payload);
      } else if (modalMode === "reserve") {
        await inventoryService.reserveStock(productVariantId, payload);
      } else {
        await inventoryService.releaseStock(productVariantId, payload);
      }
      success(locale === "ar" ? "تم تحديث المخزون" : "Inventory updated");
      setModalOpen(false);
      loadInventory();
    } catch (err) {
      toastError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      key: "product",
      header: locale === "ar" ? "المنتج" : "Product",
      align: "center",
      headerClassName: `${ADMIN_COL.qty} px-4`,
      cellClassName: `${ADMIN_COL.qty} px-4`,
      ...dataColumnShell,
      render: (row) => (
        <AdminTableText
          title={getInventoryProductName(row, locale) || "—"}
          subtitle={getInventoryColorName(row, locale) || undefined}
        />
      ),
    },
    {
      key: "sku",
      header: "SKU",
      align: "center",
      headerClassName: `${ADMIN_COL.sku} px-4`,
      cellClassName: `${ADMIN_COL.sku} px-4 font-mono text-xs text-brand-muted`,
      render: (row) => row.sku ?? row.Sku ?? "—",
    },
    {
      key: "onHand",
      header: locale === "ar" ? "المتوفر" : "On Hand",
      align: "center",
      headerClassName: `${ADMIN_COL.qty} px-4`,
      cellClassName: `${ADMIN_COL.qty} px-4`,
      render: (row) => row.quantityOnHand ?? row.QuantityOnHand ?? 0,
    },
    {
      key: "reserved",
      header: locale === "ar" ? "محجوز" : "Reserved",
      align: "center",
      headerClassName: `${ADMIN_COL.qty} px-4`,
      cellClassName: `${ADMIN_COL.qty} px-4 text-brand-muted`,
      render: (row) => row.quantityReserved ?? row.QuantityReserved ?? 0,
    },
    {
      key: "available",
      header: locale === "ar" ? "متاح" : "Available",
      align: "center",
      headerClassName: `${ADMIN_COL.qty} px-4`,
      cellClassName: `${ADMIN_COL.qty} px-4 font-medium`,
      render: (row) => row.availableStock ?? row.AvailableStock ?? 0,
    },
    {
      key: "status",
      header: locale === "ar" ? "الحالة" : "Status",
      align: "center",
      headerClassName: `${ADMIN_COL.status} px-4`,
      cellClassName: `${ADMIN_COL.status} px-4`,
      render: (row) => {
        const isLow = row.isLowStock ?? row.IsLowStock;
        return (
          <Badge variant={isLow ? "warning" : "success"} size="sm">
            {isLow
              ? locale === "ar"
                ? "منخفض"
                : "Low"
              : locale === "ar"
                ? "طبيعي"
                : "OK"}
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
          <Button type="button" variant="outline" size="sm" onClick={() => openModal(row, "adjust")}>
            {locale === "ar" ? "تعديل" : "Adjust"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => openModal(row, "reserve")}>
            {locale === "ar" ? "حجز" : "Reserve"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => openModal(row, "release")}>
            {locale === "ar" ? "إطلاق" : "Release"}
          </Button>
        </AdminTableActions>
      ),
    },
  ];

  return (
    <AdminLayout activeKey="inventory" title={title}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-brand-text">
            {locale === "ar" ? "بحث" : "Search"}
          </label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "ar" ? "SKU أو اسم المنتج" : "SKU or product name"}
          />
        </div>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          {locale === "ar" ? "مخزون منخفض فقط" : "Low stock only"}
        </label>
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
        getRowKey={(row) => getProductVariantId(row) ?? row.inventoryId ?? row.InventoryId}
        emptyMessage={locale === "ar" ? "لا توجد سجلات مخزون" : "No inventory records"}
      />

      <InventoryAdjustmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedItem}
        mode={modalMode}
        onSubmit={handleInventoryAction}
        loading={submitting}
      />
    </AdminLayout>
  );
}
