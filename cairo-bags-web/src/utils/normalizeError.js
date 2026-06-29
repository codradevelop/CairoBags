/**
 * Normalize axios and network errors into a consistent shape for UI layers.
 */
export function normalizeError(error) {
  if (!error) {
    return {
      status: null,
      code: null,
      message: "Unknown error",
      details: null,
      isNetworkError: true,
      isAuthError: false,
      isCanceled: false,
      raw: error,
    };
  }

  const isCanceled =
    error.code === "ERR_CANCELED" ||
    error.name === "CanceledError" ||
    error.message === "canceled";

  if (isCanceled) {
    return {
      status: null,
      code: "canceled",
      message: "Request canceled",
      details: null,
      isNetworkError: false,
      isAuthError: false,
      isCanceled: true,
      raw: error,
    };
  }

  if (!error.response) {
    return {
      status: null,
      code: null,
      message: error.message || "Network error",
      details: null,
      isNetworkError: true,
      isAuthError: false,
      isCanceled: false,
      raw: error,
    };
  }

  const { status, data } = error.response;

  let apiMessage = null;
  if (typeof data === "string" && data.trim()) {
    apiMessage = data.trim();
  } else if (data && typeof data === "object") {
    apiMessage =
      data.message ||
      data.title ||
      data.error ||
      (Array.isArray(data) ? data.join(", ") : null);
  }

  const message =
    apiMessage ||
    (status === 401
      ? "Invalid credentials"
      : status === 403
        ? "Access denied"
        : null) ||
    error.message ||
    "Request failed";

  return {
    status,
    code: data?.code ?? null,
    message,
    details: data?.errors ?? data ?? null,
    isNetworkError: false,
    isAuthError: status === 401 || status === 403,
    isCanceled: false,
    raw: error,
  };
}

export async function handleServiceCall(promise) {
  try {
    return await promise;
  } catch (error) {
    throw normalizeError(error);
  }
}
