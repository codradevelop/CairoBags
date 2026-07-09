import { chromium } from "playwright";
import { readFileSync } from "fs";

const ctx = JSON.parse(
  readFileSync("C:/Users/Eslam/Desktop/CairoBags-main/cairooo/CairoBags/scripts/e2e-context.json", "utf8")
);

const report = {};
const pass = (k, d) => { report[k] = { ok: true, detail: d }; };
const fail = (k, d) => { report[k] = { ok: false, detail: d }; };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const consoleErrors = [];
const failedRequests = [];

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("response", (res) => {
  const url = res.url();
  if (url.includes("/FileStorage/") && res.status() !== 200) {
    failedRequests.push(`${res.status()} ${url}`);
  }
});

const slug = ctx.slug;

try {
  // Establish guest session (same as frontend localStorage)
  await page.goto(`${ctx.web}/shop`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const sessionId = `e2e-${Date.now()}`;
  await page.evaluate((id) => localStorage.setItem("guestSessionId", id), sessionId);
  const sessionHeaders = { "X-Session-Id": sessionId };

  // Shop
  await page.goto(`${ctx.web}/shop`, { waitUntil: "networkidle", timeout: 60000 });
  const shopImg = page.locator(`img[src*="${ctx.productId}/main"]`).first();
  await shopImg.waitFor({ state: "visible", timeout: 15000 });
  const shopSrc = await shopImg.getAttribute("src");
  if (shopSrc?.includes("main_600") || shopSrc?.includes("/main.")) pass("Shop", `Image visible: ${shopSrc}`);
  else fail("Shop", `Unexpected src: ${shopSrc}`);

  // Product details — gallery main
  await page.goto(`${ctx.web}/products/${encodeURIComponent(slug)}`, { waitUntil: "networkidle", timeout: 60000 });
  const galleryImg = page.locator("img").filter({ has: page.locator("xpath=..") }).first();
  await page.waitForTimeout(1500);
  const gallerySrcs = await page.locator("img[src*='/FileStorage/products/']").all();
  const galleryUrls = [];
  for (const img of gallerySrcs) galleryUrls.push(await img.getAttribute("src"));
  const usesMain = galleryUrls.some((u) => u?.includes(`/products/${ctx.productId}/main.`) && !u.includes("_600") && !u.includes("_300"));
  if (usesMain) pass("Product Details", `Gallery uses main: ${galleryUrls.find((u) => u?.includes("/main."))}`);
  else fail("Product Details", `Gallery urls: ${galleryUrls.join(", ")}`);

  // Ensure cart has item via API with guest session
  await page.request.post(`${ctx.base}/api/cart/items`, {
    data: { productVariantId: ctx.variantId, quantity: 1 },
    headers: { "Content-Type": "application/json", ...sessionHeaders },
  });

  // Cart — verify via API JSON then browser
  const cartApi = await page.request.get(`${ctx.base}/api/cart`, { headers: sessionHeaders });
  const cartData = await cartApi.json();
  const cartImagePath = cartData?.items?.[0]?.imageUrl ?? cartData?.Items?.[0]?.ImageUrl ?? "";
  if (cartImagePath.includes("main_300")) {
    pass("Cart", `API imageUrl uses main_300: ${cartImagePath}`);
  } else {
    fail("Cart", `API imageUrl: ${cartImagePath || "empty"}`);
  }

  await page.goto(`${ctx.web}/cart`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const cartImgs = await page.locator("img[src*='/FileStorage/']").all();
  const cartSrcs = [];
  for (const img of cartImgs) cartSrcs.push(await img.getAttribute("src"));
  const cartUses300 = cartSrcs.some((u) => u?.includes("main_300"));
  if (cartUses300) pass("Cart UI", `Rendered main_300: ${cartSrcs.find((u) => u?.includes("main_300"))}`);
  else if (cartSrcs.length) fail("Cart UI", `Unexpected cart src: ${cartSrcs[0]}`);
  else fail("Cart UI", "No cart images in DOM");

  // Wishlist — login then toggle
  const email = `e2e${Date.now()}@test.local`;
  const password = "E2eTest123!";
  const userName = `e2euser${Date.now()}`;
  const regRes = await page.request.post(`${ctx.base}/api/Account/register`, {
    data: { email, password, userName, phoneNumber: "01000000000" },
    headers: { "Content-Type": "application/json" },
  });
  if (!regRes.ok()) {
    fail("Wishlist", `Register failed: ${regRes.status()} ${await regRes.text()}`);
  } else {
  const loginRes = await page.request.post(`${ctx.base}/api/Account/LogIn`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  const loginText = await loginRes.text();
  let loginJson = {};
  try { loginJson = JSON.parse(loginText); } catch { /* */ }
  const token = loginJson?.token ?? loginJson?.accessToken ?? loginJson?.AccessToken;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  await page.request.post(`${ctx.base}/api/wishlist/${ctx.productId}`, { headers: authHeaders });
  const wishApi = await page.request.get(`${ctx.base}/api/wishlist`, { headers: authHeaders });
  const wishData = await wishApi.json();
  const wishItems = wishData?.items ?? wishData?.Items ?? wishData ?? [];
  const wishList = Array.isArray(wishItems) ? wishItems : [];
  const wishImagePath = wishList[0]?.primaryImage ?? wishList[0]?.PrimaryImage ?? "";
  if (wishImagePath.includes("main_300")) {
    pass("Wishlist", `API primaryImage uses main_300: ${wishImagePath}`);
    await page.evaluate(({ token, user }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }, { token, user: { id: loginJson.id, email: loginJson.email, role: ["Customer"] } });
    await page.goto(`${ctx.web}/wishlist`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    const wishImgs = await page.locator("img[src*='/FileStorage/']").all();
    const wishSrcs = [];
    for (const img of wishImgs) wishSrcs.push(await img.getAttribute("src"));
    const wishUses300 = wishSrcs.some((u) => u?.includes("main_300"));
    if (wishUses300) pass("Wishlist UI", `Rendered main_300: ${wishSrcs.find((u) => u?.includes("main_300"))}`);
    else if (wishSrcs.length) fail("Wishlist UI", `Unexpected wishlist src: ${wishSrcs[0]}`);
    else fail("Wishlist UI", "No wishlist images in DOM");
  } else {
    fail("Wishlist", `API primaryImage: ${wishImagePath || JSON.stringify(wishList).slice(0, 200)}`);
  }
  }

  if (failedRequests.length === 0) pass("No Broken Images", "No non-200 FileStorage responses");
  else fail("No Broken Images", failedRequests.join("; "));

  if (consoleErrors.length === 0) pass("Console", "No console errors");
  else fail("Console", consoleErrors.slice(0, 5).join(" | "));
} catch (e) {
  fail("Browser", e.message);
} finally {
  await browser.close();
}

import { writeFileSync } from "fs";
writeFileSync(
  "C:/Users/Eslam/Desktop/CairoBags-main/cairooo/CairoBags/scripts/e2e-browser-report.json",
  JSON.stringify(report, null, 2)
);
for (const [k, v] of Object.entries(report)) {
  console.log(`${k}: ${v.ok ? "PASS" : "FAIL"} — ${v.detail}`);
}
