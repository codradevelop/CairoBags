import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks image load state and handles cached images where onLoad may not fire.
 */
export function useResolvedImageLoad(imageUrl, resetKey) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
  }, [imageUrl, resetKey]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [imageUrl, resetKey]);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setLoaded(true), []);

  return { loaded, imgRef, handleLoad, handleError };
}
