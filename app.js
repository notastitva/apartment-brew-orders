// ====================================================================
// THE APARTMENT BREW CO. — FRONTEND CONTROLLER (app.js)
// ====================================================================

const CONFIG = {
  razorpayKeyId: "YOUR_RAZORPAY_KEY_ID_HERE",
  googleSheetEndpoint: "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE",
  authToken: "TABC_SECURE_TOKEN_2026"
};

const SCHEDULE_CONFIG = {
  B2C: { cutoffDay: 5, cutoffHour: 22, deliveryDay: 6, label: "Saturday Drop", window: "Morning (8:00 AM – 11:00 AM)" },
  B2B: { cutoffDay: 4, cutoffHour: 18, deliveryDay: 5, label: "Friday Drop", window: "" }
};

let cachedProfile = null;
let currentMode = "B2C";
let currentStoreStatus = "OPEN";
let availableLots = [];
let appliedCoupon = null;
let dynamicLotSplits = {};

function getActiveSchedule(mode) {
  const cfg = SCHEDULE_CONFIG[mode];
  const now = new Date();
  let deliveryDate = new Date();
  let daysToCutoff = (cfg.cutoffDay - now.getDay() + 7) % 7;
  if (daysToCutoff === 0 && now.getHours() >= cfg.cutoffHour) daysToCutoff = 7;
  deliveryDate.setDate(now.getDate() + daysToCutoff + (cfg.deliveryDay - cfg.cutoffDay));
  return { date: deliveryDate, config: cfg };
}

function calculateSubtotal() {
  const qtyInput = document.getElementById("packQty");
  const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
  const active = currentMode === "B2C" ? selectedB2cPack : selectedB2bPack;
  return (active?.unitPrice || 0) * qty;
}

function applyCoupon(code) {
  // Logic for PERCENT/FLAT discounts and spend thresholds based on mode
  updateTotal();
}

function calculateTotal() {
  const subtotal = calculateSubtotal();
  if (!appliedCoupon) return subtotal;
  let discount = appliedCoupon.type === "PERCENT" ? (subtotal * appliedCoupon.value) / 100 : appliedCoupon.value;
  return Math.max(0, subtotal - discount);
}

function renderLots(lots) {
  availableLots = lots;
  const lotGrid = document.getElementById("lotGrid");
  if (!lotGrid) return;
  let html = "";
  lots.forEach(lot => {
    const isSoldOut = lot.isSoldOut || lot.remainingBottles === 0;
    html += `<div class="lot-card ${isSoldOut ? "sold-out" : ""}" onclick="${isSoldOut ? "" : `selectLot('${lot.name}')`}">`;
    if (isSoldOut) html += `<div class="badge">Sold Out</div>`;
    html += `<div>${lot.name}</div></div>`;
  });
  lotGrid.innerHTML = html;
}

function adjustDynamicSplit(lotId, delta) {
  const total = getTotalBottles();
  // Rebalance logic for scalable N-lot splitting
  renderDynamicSplitterUI();
}

function renderDynamicSplitterUI() {
  // Render dynamic steppers and multi-segment color bars
}

function updateDeliveryWindowOptions(clusters) {
  // Disable full windows and show remaining tallies for B2B tech parks
}

function showView(view) {
  const orderView = document.getElementById("orderFormView");
  const trackerView = document.getElementById("trackerView");
  if (view === "ORDER") { orderView.style.display = "block"; trackerView.style.display = "none"; }
  else { orderView.style.display = "none"; trackerView.style.display = "block"; }
}

async function lookupOrderStatus(orderId) {
  const res = await fetch(`${CONFIG.googleSheetEndpoint}?action=trackOrder&orderId=${orderId}`);
  const data = await res.json();
  renderOrderTimeline(data.order);
}

function renderOrderTimeline(order) {
  const steps = ["Pre-Ordered", "Brewing", "Dispatched", "Delivered"];
  // Render 4-step delivery timeline UI
}

function setSyncStatus(status) {
  const el = document.getElementById("syncIndicator");
  if (el) el.className = `sync-${status}`;
}

async function fetchLiveConfig(isManualRetry = false) {
  setSyncStatus("loading");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(CONFIG.googleSheetEndpoint, { signal: controller.signal });
    const data = await res.json();
    localStorage.setItem("tabc_live_config", JSON.stringify(data));
    applyConfigToUI(data);
    setSyncStatus("synced");
  } catch (e) {
    setSyncStatus("offline");
    const cached = JSON.parse(localStorage.getItem("tabc_live_config"));
    if (cached) applyConfigToUI(cached);
  } finally { clearTimeout(timeoutId); }
}