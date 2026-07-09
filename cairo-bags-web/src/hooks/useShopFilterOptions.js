import { useCallback, useEffect, useMemo, useState } from "react";
import { useCatalogRefresh } from "./useCatalogRefresh.js";
import { fetchShopFilterOptions } from "../utils/shopFilterOptions.js";

export function useShopFilterOptions() {
  const [colors, setColors] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadColors = useCallback(async (options = {}) => {
    try {
      const nextColors = await fetchShopFilterOptions(options.force === true);
      setColors(nextColors);
    } catch {
      if (!options.background) {
        setColors([]);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setLoaded(false);
    loadColors();
  }, [loadColors]);

  useCatalogRefresh(
    () => loadColors({ force: true, background: true }),
    { entity: "product" }
  );

  return useMemo(
    () => ({
      colors,
      loaded,
      refreshColors: () => loadColors({ force: true, background: true }),
    }),
    [colors, loaded, loadColors]
  );
}
