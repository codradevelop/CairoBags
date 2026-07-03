export function buildProductQueryParams(filters = {}) {
  const params = {};

  if (filters.categoryId) params.CategoryId = Number(filters.categoryId);
  if (filters.minPrice !== "" && filters.minPrice != null) {
    params.MinPrice = Number(filters.minPrice);
  }
  if (filters.maxPrice !== "" && filters.maxPrice != null) {
    params.MaxPrice = Number(filters.maxPrice);
  }
  if (filters.inStock === true || filters.inStock === "true") {
    params.InStock = true;
  }
  if (filters.searchTerm?.trim()) {
    params.SearchTerm = filters.searchTerm.trim();
  }
  // color is applied client-side after fetch

  return params;
}

export function parseShopFilters(searchParams) {
  return {
    categoryId: searchParams.get("categoryId") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    inStock: searchParams.get("inStock") === "true",
    searchTerm: searchParams.get("q") ?? searchParams.get("searchTerm") ?? "",
    color: searchParams.get("color") ?? "",
  };
}

export function filtersToSearchParams(filters) {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.inStock === true) params.set("inStock", "true");
  if (filters.searchTerm) params.set("q", filters.searchTerm);
  if (filters.color) params.set("color", filters.color);
  return params;
}
