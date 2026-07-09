const GUEST_NEWSLETTER_KEY = "cairobags_newsletter_guest";

export function getGuestNewsletterSubscription() {
  try {
    const raw = localStorage.getItem(GUEST_NEWSLETTER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.subscribed) return null;
    return {
      subscribed: true,
      email: typeof parsed.email === "string" ? parsed.email : "",
    };
  } catch {
    return null;
  }
}

export function setGuestNewsletterSubscription(email) {
  try {
    localStorage.setItem(
      GUEST_NEWSLETTER_KEY,
      JSON.stringify({
        subscribed: true,
        email: email?.trim() ?? "",
      })
    );
  } catch {
    /* storage unavailable */
  }
}

export function clearGuestNewsletterSubscription() {
  try {
    localStorage.removeItem(GUEST_NEWSLETTER_KEY);
  } catch {
    /* storage unavailable */
  }
}
