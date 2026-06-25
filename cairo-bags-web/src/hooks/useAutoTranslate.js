import { useCallback, useEffect, useRef } from "react";
import { translateText, translateTexts } from "../services/translationService.js";
import { generateSlug } from "../utils/slugHelper.js";

const DEBOUNCE_MS = 400;

function applySlugTransform(translated, slugResult) {
  return slugResult ? generateSlug(translated) : translated;
}

/**
 * Auto-translate Arabic fields to English without overwriting manual English edits.
 *
 * @param {Object} options
 * @param {(enKey: string) => boolean} [options.isEnLocked] - Optional extra lock check.
 * @param {(message: string) => void} [options.onWarning]
 */
export function useAutoTranslate({ isEnLocked, onWarning } = {}) {
  const manualEnKeysRef = useRef(new Set());
  const debounceTimersRef = useRef(new Map());
  const abortControllersRef = useRef(new Map());
  const requestIdsRef = useRef(new Map());
  const pendingJobsRef = useRef(new Map());
  const lastSuccessfulArRef = useRef(new Map());
  const inFlightCountRef = useRef(0);
  const flushResolversRef = useRef([]);

  const notifyFlushProgress = useCallback(() => {
    if (inFlightCountRef.current === 0 && debounceTimersRef.current.size === 0) {
      const resolvers = flushResolversRef.current.splice(0);
      resolvers.forEach((resolve) => resolve());
    }
  }, []);

  const seedLockedEnglishFields = useCallback((initialValues = {}, enKeys = [], extraLockedKeys = []) => {
    const locked = new Set(extraLockedKeys);
    enKeys.forEach((enKey) => {
      const value = initialValues?.[enKey];
      if (value != null && String(value).trim()) {
        locked.add(enKey);
      }
    });
    manualEnKeysRef.current = locked;
    lastSuccessfulArRef.current = new Map();
    pendingJobsRef.current = new Map();
  }, []);

  const markEnglishManual = useCallback((enKey) => {
    if (!enKey) return;
    manualEnKeysRef.current.add(enKey);
    const timer = debounceTimersRef.current.get(enKey);
    if (timer) {
      clearTimeout(timer);
      debounceTimersRef.current.delete(enKey);
    }
    abortControllersRef.current.get(enKey)?.abort();
    abortControllersRef.current.delete(enKey);
    pendingJobsRef.current.delete(enKey);
    notifyFlushProgress();
  }, [notifyFlushProgress]);

  const unlockEnglishField = useCallback((enKey) => {
    if (!enKey) return;
    manualEnKeysRef.current.delete(enKey);
    lastSuccessfulArRef.current.delete(enKey);
  }, []);

  const handleEnglishChange = useCallback(
    (enKey, value, applyTranslation) => {
      const text = value ?? "";
      if (text.length >= 1) {
        markEnglishManual(enKey);
      } else {
        unlockEnglishField(enKey);
      }
      applyTranslation(enKey, text);
    },
    [markEnglishManual, unlockEnglishField]
  );

  const canAutoFill = useCallback(
    (enKey) => {
      if (manualEnKeysRef.current.has(enKey)) return false;
      if (isEnLocked?.(enKey)) return false;
      return true;
    },
    [isEnLocked]
  );

  const runTranslation = useCallback(
    async (job, { force = false } = {}) => {
      const { arText, enKey, applyTranslation, slugResult = false } = job;
      if (!canAutoFill(enKey)) return { ok: true, skipped: true };

      const trimmed = arText?.trim() ?? "";
      if (!trimmed) return { ok: true, skipped: true };

      if (!force && lastSuccessfulArRef.current.get(enKey) === trimmed) {
        return { ok: true, skipped: true };
      }

      abortControllersRef.current.get(enKey)?.abort();
      const controller = new AbortController();
      abortControllersRef.current.set(enKey, controller);

      const requestId = (requestIdsRef.current.get(enKey) ?? 0) + 1;
      requestIdsRef.current.set(enKey, requestId);

      inFlightCountRef.current += 1;
      let translated = null;
      try {
        translated = await translateText(trimmed, "ar", "en", { signal: controller.signal });
      } finally {
        inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
        abortControllersRef.current.delete(enKey);
        notifyFlushProgress();
      }

      if (controller.signal.aborted) return { ok: false, aborted: true };
      if (requestIdsRef.current.get(enKey) !== requestId) return { ok: false, stale: true };
      if (!canAutoFill(enKey)) return { ok: true, skipped: true };

      if (translated == null) {
        return { ok: false, failed: true };
      }

      const nextValue = applySlugTransform(translated, slugResult);
      job.applyTranslation(job.enKey, nextValue);
      lastSuccessfulArRef.current.set(enKey, trimmed);
      return { ok: true };
    },
    [canAutoFill, notifyFlushProgress]
  );

  const cancelAll = useCallback(() => {
    debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
    debounceTimersRef.current.clear();
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    pendingJobsRef.current.clear();
    notifyFlushProgress();
  }, [notifyFlushProgress]);

  useEffect(() => cancelAll, [cancelAll]);

  const queueTranslation = useCallback(
    ({ arText, enKey, applyTranslation, slugResult = false }) => {
      if (!canAutoFill(enKey)) return;

      const trimmed = arText?.trim() ?? "";
      const existingTimer = debounceTimersRef.current.get(enKey);
      if (existingTimer) clearTimeout(existingTimer);

      pendingJobsRef.current.set(enKey, { arText, enKey, applyTranslation, slugResult });

      if (!trimmed) {
        debounceTimersRef.current.delete(enKey);
        pendingJobsRef.current.delete(enKey);
        return;
      }

      if (lastSuccessfulArRef.current.get(enKey) === trimmed) return;

      const timer = setTimeout(async () => {
        debounceTimersRef.current.delete(enKey);
        const job = pendingJobsRef.current.get(enKey);
        if (!job || !canAutoFill(enKey)) return;

        const result = await runTranslation(job);
        if (result.failed) {
          onWarning?.("Translation is temporarily unavailable. You can continue editing.");
        }
      }, DEBOUNCE_MS);

      debounceTimersRef.current.set(enKey, timer);
    },
    [canAutoFill, onWarning, runTranslation]
  );

  const waitForPendingTranslations = useCallback(async () => {
    debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
    debounceTimersRef.current.clear();

    const jobs = [...pendingJobsRef.current.entries()].filter(([enKey]) => canAutoFill(enKey));
    let hadFailures = false;

    if (jobs.length > 0) {
      const uniqueTexts = [...new Set(jobs.map(([, job]) => job.arText?.trim()).filter(Boolean))];
      const batchController = new AbortController();

      inFlightCountRef.current += 1;
      let translations = new Map();
      try {
        translations = await translateTexts(uniqueTexts, "ar", "en", { signal: batchController.signal });
      } catch {
        hadFailures = true;
      } finally {
        inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
      }

      for (const [enKey, job] of jobs) {
        if (!canAutoFill(enKey)) continue;

        const trimmed = job.arText?.trim() ?? "";
        if (!trimmed) continue;

        if (lastSuccessfulArRef.current.get(enKey) === trimmed) continue;

        const translated = translations.get(trimmed);
        if (translated == null) {
          hadFailures = true;
          continue;
        }

        const nextValue = applySlugTransform(translated, job.slugResult);
        job.applyTranslation(job.enKey, nextValue);
        lastSuccessfulArRef.current.set(enKey, trimmed);
        pendingJobsRef.current.delete(enKey);
      }
    }

    if (inFlightCountRef.current > 0 || debounceTimersRef.current.size > 0) {
      await new Promise((resolve) => {
        flushResolversRef.current.push(resolve);
      });
    }

    if (hadFailures) {
      onWarning?.("Translation is temporarily unavailable. You can continue editing.");
    }

    return { hadFailures };
  }, [canAutoFill, onWarning]);

  const bindFieldPair = useCallback(
    ({ arKey, enKey, getArText, applyTranslation, slugResult = false }) => ({
      onArChange: (value) => {
        queueTranslation({
          arText: value,
          enKey,
          applyTranslation,
          slugResult,
        });
      },
      onEnChange: (value) => {
        handleEnglishChange(enKey, value, applyTranslation);
      },
      retranslateFromCurrentAr: () => {
        lastSuccessfulArRef.current.delete(enKey);
        queueTranslation({
          arText: getArText(arKey),
          enKey,
          applyTranslation,
          slugResult,
        });
      },
    }),
    [handleEnglishChange, queueTranslation]
  );

  const isTranslationPending = useCallback(() => {
    return debounceTimersRef.current.size > 0 || inFlightCountRef.current > 0;
  }, []);

  return {
    seedLockedEnglishFields,
    markEnglishManual,
    unlockEnglishField,
    handleEnglishChange,
    queueTranslation,
    bindFieldPair,
    waitForPendingTranslations,
    isTranslationPending,
    cancelAll,
  };
}
