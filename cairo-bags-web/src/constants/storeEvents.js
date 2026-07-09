/** Strongly typed store sync event names (must match backend StoreUpdateEvents). */
export const STORE_EVENTS = {
  CategoryCreated: "CategoryCreated",
  CategoryUpdated: "CategoryUpdated",
  CategoryDeleted: "CategoryDeleted",
  ProductCreated: "ProductCreated",
  ProductUpdated: "ProductUpdated",
  ProductDeleted: "ProductDeleted",
  InventoryUpdated: "InventoryUpdated",
  ReviewCreated: "ReviewCreated",
  ReviewUpdated: "ReviewUpdated",
  ReviewDeleted: "ReviewDeleted",
  CouponCreated: "CouponCreated",
  CouponUpdated: "CouponUpdated",
  CouponDeleted: "CouponDeleted",
  BannerUpdated: "BannerUpdated",
  StoreSettingsUpdated: "StoreSettingsUpdated",
};

export const ALL_STORE_EVENTS = Object.values(STORE_EVENTS);
