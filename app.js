const CONFIG = {
  razorpayKeyId: "YOUR_RAZORPAY_KEY_ID_HERE",
  googleSheetEndpoint: "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE",
  authToken: "TABC_SECURE_TOKEN_2026"
};

const SCHEDULE_CONFIG = {
  B2C: { cutoffDay: 5, cutoffHour: 22, cutoffMinute: 0, deliveryDay: 6, label: "Saturday Morning Drop" },
  B2B: { cutoffDay: 4, cutoffHour: 18, cutoffMinute: 0, deliveryDay: 5, label: "Friday Corporate Drop" }
};

let cachedProfile = null;
let currentMode = "B2C";
let currentB2bPayOption = "GATEWAY";
let currentStoreStatus = "OPEN";
let appliedCoupon = null;
let isCustomSplit = false;
let currentOrderDetails = null;

let availableLots = [
  { id: "LOT-01", name: "Ratnagiri Estate", process: "Anaerobic Naturals", notes: "Wild Raspberry, Stone Fruit &amp; Dark Cacao", pills: ["Fruity", "High Acidity", "Medium Roast"], acidity: 85, body: 70, remainingBottles: 120, isSoldOut: false },
  { id: "LOT-02", name: "Blueberry Estate", process: "Washed Lot", notes: "Orange Blossom, Jasmine &amp; Crisp Green Apple", pills: ["Floral", "Clean Crisp", "Light-Med Roast"], acidity: 75, body: 60, remainingBottles: 80, isSoldOut: false }
];

let availableB2cPacks = [
  { id: "B2C-01", name: "Single Bottle", bottles: 1, price: 240, badge: "" },
  { id: "B2C-02", name: "Duo Pack / Discovery Sampler", bottles: 2, price: 480, badge: "Discovery Flight" },
  { id: "B2C-03", name: "Weekend Pack", bottles: 4, price: 899, badge: "Popular" },
  { id: "B2C-04", name: "Mega Weekend", bottles: 6, price: 1200, badge: "Value" }
];

let availableB2bPacks = [
  { id: "B2B-01", name: "Team Pack", bottles: 10, price: 1800 },
  { id: "B2B-02", name: "Office Batch", bottles: 20, price: 3400 },
  { id: "B2B-03", name: "Floor Pack", bottles: 40, price: 6000 },
  { id: "B2B-04", name: "Townhall Bulk", bottles: 60, price: 8700 }
];

let availableCoupons = [
  { code: "FRESHDROP", type: "FLAT", value: 100, minOrder: 480, mode: "B2C" },
  { code: "OFFICE10", type: "PERCENT", value: 10, minOrder: 1800, mode: "B2B" },
  { code: "NCRFIRST", type: "PERCENT", value: 10, minOrder: 240, mode: "ALL" }
];

let selectedBean = "Ratnagiri Estate (Anaerobic Naturals)";
let dynamicLotSplits = { "LOT-01": 2, "LOT-02": 2 };
let customSplit = { lot1: 2, lot2: 2 };
let selectedB2cPack = { name: "Weekend Pack", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack", bottles: 10, unitPrice: 1800 };

function getActiveSchedule(mode) {
  const cfg = SCHEDULE_CONFIG[mode] || SCHEDULE_CONFIG.B2C;
  const now = new Date();
  let daysUntilCutoff = (cfg.cutoffDay - now.getDay() + 7) % 7;
  let cutoff = new Date(now);
  cutoff.setDate(now.getDate() + daysUntilCutoff);
  cutoff.setHours(cfg.cutoffHour, cfg.cutoffMinute, 0, 0);

  if (now.getTime() >= cutoff.getTime()) {
    cutoff.setDate(cutoff.getDate() + 7);
  }

  let delivery = new Date(cutoff);
  let daysFromCutoffToDelivery = (cfg.deliveryDay - cfg.cutoffDay + 7) % 7;
  if (daysFromCutoffToDelivery === 0) daysFromCutoffToDelivery = 7;
  delivery.setDate(cutoff.getDate() + daysFromCutoffToDelivery);

  return {
    cutoffDate: cutoff,
    deliveryDate: delivery,
    timeRemainingMs: Math.max(0, cutoff.getTime() - now.getTime())
  };
}

function getUpcomingFridayFormatted() {
  return getActiveSchedule("B2B").deliveryDate.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

function getUpcomingSaturdayFormatted() {
  return getActiveSchedule("B2C").deliveryDate.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

function startCutoffCountdown() {
  function updateTimer() {
    const timerEl = document.getElementById("countdownTimer");
    if (!timerEl) return;

    const schedule = getActiveSchedule(currentMode);
    const diff = schedule.timeRemainingMs;

    if (diff <= 0) {
      timerEl.textContent = "Cutoff reached for current batch. Orders queue for next drop.";
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    const label = currentMode === "B2C" ? "Saturday Drop Cutoff" : "Thursday 6 PM Cutoff";

    timerEl.textContent = "⏱️ " + label + " closes in " + hours + "h " + mins + "m " + secs + "s";
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

function showView(viewId) {
  const orderView = document.getElementById("orderFormView");
  const trackerView = document.getElementById("orderTrackerView");
  const navPreOrder = document.getElementById("navPreOrder");
  const navTracker = document.getElementById("navTracker");

  if (viewId === "orderFormView" || viewId === "ORDER") {
    if (orderView) orderView.style.display = "block";
    if (trackerView) trackerView.style.display = "none";
    if (navPreOrder) navPreOrder.classList.add("active");
    if (navTracker) navTracker.classList.remove("active");
  } else {
    if (orderView) orderView.style.display = "none";
    if (trackerView) trackerView.style.display = "block";
    if (navPreOrder) navPreOrder.classList.remove("active");
    if (navTracker) navTracker.classList.add("active");
  }
}

function switchMode(mode) {
  currentMode = mode;
  const isB2c = mode === "B2C";

  const tabB2c = document.getElementById("tabB2c");
  const tabB2b = document.getElementById("tabB2b");
  const dropBanner = document.getElementById("dropBanner");
  const packSubtext = document.getElementById("packSubtext");
  const b2cPacks = document.getElementById("b2cPacks");
  const b2bPacks = document.getElementById("b2bPacks");
  const b2bFields = document.getElementById("b2bFields");
  const b2cCityGroup = document.getElementById("b2cCityGroup");
  const b2bPaymentChoiceGroup = document.getElementById("b2bPaymentChoiceGroup");
  const labelName = document.getElementById("labelName");
  const labelEmail = document.getElementById("labelEmail");
  const labelAddress = document.getElementById("labelAddress");

  if (tabB2c) tabB2c.classList.toggle("active", isB2c);
  if (tabB2b) tabB2b.classList.toggle("active", !isB2c);

  if (dropBanner) {
    dropBanner.innerHTML = isB2c
      ? "⚡ Next Fresh Drop: " + getUpcomingSaturdayFormatted() + " (Morning)"
      : "⚡ Next Office Drop: " + getUpcomingFridayFormatted() + " (Friday Delivery)";
  }

  if (packSubtext) packSubtext.textContent = isB2c ? "Saturday Drop" : "Friday Office Drop (Cutoff: Thu 6 PM)";
  if (b2cPacks) b2cPacks.style.display = isB2c ? "grid" : "none";
  if (b2bPacks) b2bPacks.style.display = isB2c ? "none" : "grid";
  if (b2bFields) b2bFields.style.display = isB2c ? "none" : "block";
  if (b2cCityGroup) b2cCityGroup.style.display = isB2c ? "flex" : "none";
  if (b2bPaymentChoiceGroup) b2bPaymentChoiceGroup.style.display = isB2c ? "none" : "block";

  if (labelName) labelName.textContent = isB2c ? "Your Name *" : "Contact Person Name &amp; Role *";
  if (labelEmail) labelEmail.textContent = isB2c ? "Email Address *" : "Work Email *";
  if (labelAddress) labelAddress.textContent = isB2c ? "Delivery Address (Building, Flat, Society) *" : "Building / Tower / Floor Details *";

  if (isB2c) currentB2bPayOption = "GATEWAY";

  appliedCoupon = null;
  const couponInput = document.getElementById("couponCodeInput");
  const couponStatus = document.getElementById("couponStatus");
  if (couponInput) couponInput.value = "";
  if (couponStatus) {
    couponStatus.textContent = "";
    couponStatus.style.display = "none";
  }

  updateTotal();
  if (isCustomSplit) rebalanceSplitter();
}

function setB2bPayOption(option) {
  currentB2bPayOption = option;
  const payOptionGateway = document.getElementById("payOptionGateway");
  const payOptionInvoice = document.getElementById("payOptionInvoice");
  if (payOptionGateway) payOptionGateway.classList.toggle("active", option === "GATEWAY");
  if (payOptionInvoice) payOptionInvoice.classList.toggle("active", option === "INVOICE");
  updateTotal();
}

function renderLots(lots) {
  if (!Array.isArray(lots) || lots.length === 0) return;
  availableLots = lots;
  const lotGrid = document.getElementById("lotGrid");
  if (!lotGrid) return;

  let html = "";
  lots.forEach((lot, idx) => {
    const isSoldOut = lot.isSoldOut || (lot.remainingBottles <= 0);
    const isFirstActive = idx === 0 && !isCustomSplit && !isSoldOut;
    const cardClass = "lot-card" + (isSoldOut ? " sold-out" : "") + (isFirstActive ? " active" : "");
    const pillsHtml = (lot.pills || []).map(p => "<span class=\"flavor-pill\">" + p + "</span>").join("");
    const stockNote = isSoldOut 
      ? "<span class=\"sold-out-badge\">SOLD OUT</span>" 
      : "<span class=\"stock-badge\">" + (lot.remainingBottles || 120) + " bottles available</span>";

    const clickHandler = isSoldOut ? "" : "selectLot(&quot;" + lot.name + " (" + lot.process + ")&quot;, this)";

    html += "<div class=\"" + cardClass + "\" onclick=\"" + clickHandler + "\">";
    html += "<div class=\"lot-header\"><span class=\"lot-name\">" + lot.name + "</span><span class=\"lot-tag\">" + lot.process + "</span></div>";
    html += "<div class=\"lot-notes\">" + lot.notes + "</div>";
    html += "<div class=\"flavor-pills\">" + pillsHtml + "</div>";
    html += "<div class=\"sensory-meters\">";
    html += "<div class=\"meter-row\"><span>Acidity</span><div class=\"meter-bar\"><div class=\"meter-fill\" style=\"width: " + (lot.acidity || 75) + "%;\"></div></div></div>";
    html += "<div class=\"meter-row\"><span>Body</span><div class=\"meter-bar\"><div class=\"meter-fill\" style=\"width: " + (lot.body || 65) + "%;\"></div></div></div>";
    html += "</div>";
    html += "<div style=\"margin-top: 6px; text-align: right;\">" + stockNote + "</div>";
    html += "</div>";
  });

  if (lots.length >= 2) {
    const splitClass = "lot-card" + (isCustomSplit ? " active" : "");
    html += "<div class=\"" + splitClass + "\" onclick=\"selectLot(&quot;Discovery Flight / Custom Split (Build Your Own Batch)&quot;, this)\">";
    html += "<div class=\"lot-header\"><span class=\"lot-name\">Discovery Flight / Custom Split</span><span class=\"lot-tag\">Sampler Split</span></div>";
    html += "<div class=\"lot-notes\">Sample multiple harvests across your pack size or customize your split</div>";
    html += "<div class=\"flavor-pills\"><span class=\"flavor-pill\">Tasting Flight</span><span class=\"flavor-pill\">Custom Split</span></div>";
    html += "</div>";
  }

  lotGrid.innerHTML = html;

  if (!isCustomSplit && lots[0] && !lots[0].isSoldOut) {
    selectedBean = lots[0].name + " (" + lots[0].process + ")";
  }
}

function selectLot(lotName, element) {
  document.querySelectorAll("#lotGrid .lot-card").forEach(el => el.classList.remove("active"));
  if (element) element.classList.add("active");

  const customSplitter = document.getElementById("customSplitter");

  if (lotName && (lotName.includes("Custom Ratio Split") || lotName.includes("Discovery Flight") || lotName.includes("Build Your Own Batch"))) {
    isCustomSplit = true;
    if (customSplitter) customSplitter.style.display = "block";
    initializeDynamicSplitter();
  } else {
    isCustomSplit = false;
    selectedBean = lotName;
    if (customSplitter) customSplitter.style.display = "none";
  }
}

function getTotalBottles() {
  const qtyInput = document.getElementById("packQty");
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = currentMode === "B2C" ? selectedB2cPack : selectedB2bPack;
  return (active && active.bottles ? active.bottles : 1) * qty;
}

function initializeDynamicSplitter() {
  const total = getTotalBottles();
  const activeLots = availableLots.filter(l => !l.isSoldOut);
  const n = activeLots.length;
  if (n === 0) return;

  const base = Math.floor(total / n);
  let rem = total % n;

  dynamicLotSplits = {};
  activeLots.forEach((lot, i) => {
    dynamicLotSplits[lot.id] = base + (i < rem ? 1 : 0);
  });

  if (activeLots.length >= 2) {
    customSplit.lot1 = dynamicLotSplits[activeLots[0].id] || 0;
    customSplit.lot2 = dynamicLotSplits[activeLots[1].id] || 0;
  }

  renderDynamicSplitterUI();
}

function adjustDynamicSplit(lotId, delta) {
  const total = getTotalBottles();
  const current = dynamicLotSplits[lotId] || 0;
  if (current + delta < 0) return;

  const otherLotIds = Object.keys(dynamicLotSplits).filter(id => id !== lotId);
  const donor = otherLotIds.find(id => (dynamicLotSplits[id] || 0) - delta >= 0);

  if (donor) {
    dynamicLotSplits[lotId] = (dynamicLotSplits[lotId] || 0) + delta;
    dynamicLotSplits[donor] = (dynamicLotSplits[donor] || 0) - delta;
    renderDynamicSplitterUI();
  }
}

function adjustSplit(lotKey, delta) {
  const activeLots = availableLots.filter(l => !l.isSoldOut);
  if (activeLots.length < 2) return;
  const targetId = lotKey === "lot1" ? activeLots[0].id : activeLots[1].id;
  adjustDynamicSplit(targetId, delta);
}

function rebalanceSplitter() {
  initializeDynamicSplitter();
}

function renderDynamicSplitterUI() {
  const total = getTotalBottles();
  const allocEl = document.getElementById("allocCount");
  const targetEl = document.getElementById("targetCount");
  const controls = document.getElementById("dynamicSplitterControls");
  const ratioBar = document.getElementById("dynamicRatioBar");
  const tallyStatus = document.getElementById("tallyStatus");
  const LOT_COLORS = ["#e76f51", "#2a9d8f", "#e9c46a", "#f4a261", "#457b9d"];

  let allocatedSum = 0;
  Object.values(dynamicLotSplits).forEach(v => { allocatedSum += v; });

  if (allocEl) allocEl.textContent = allocatedSum;
  if (targetEl) targetEl.textContent = total;

  const l1Count = document.getElementById("splitLot1Count");
  const l2Count = document.getElementById("splitLot2Count");
  const activeLots = availableLots.filter(l => !l.isSoldOut);

  if (activeLots.length >= 2) {
    if (l1Count) l1Count.textContent = dynamicLotSplits[activeLots[0].id] || 0;
    if (l2Count) l2Count.textContent = dynamicLotSplits[activeLots[1].id] || 0;
  }

  if (controls) {
    let controlsHtml = "";
    activeLots.forEach((lot) => {
      const count = dynamicLotSplits[lot.id] || 0;
      controlsHtml += "<div class=\"splitter-row\" style=\"margin-top:6px;\">";
      controlsHtml += "<div class=\"splitter-lot-info\"><span class=\"splitter-lot-name\">" + lot.name + "</span><span class=\"splitter-lot-sub\">" + lot.process + "</span></div>";
      controlsHtml += "<div class=\"qty-stepper\">";
      controlsHtml += "<button type=\"button\" class=\"stepper-btn\" onclick=\"adjustDynamicSplit(&quot;" + lot.id + "&quot;, -1)\">&ndash;</button>";
      controlsHtml += "<span class=\"stepper-val\">" + count + "</span>";
      controlsHtml += "<button type=\"button\" class=\"stepper-btn\" onclick=\"adjustDynamicSplit(&quot;" + lot.id + "&quot;, 1)\">+</button>";
      controlsHtml += "</div></div>";
    });
    controls.innerHTML = controlsHtml;
  }

  if (ratioBar) {
    let barHtml = "";
    activeLots.forEach((lot, idx) => {
      const count = dynamicLotSplits[lot.id] || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;
      const color = LOT_COLORS[idx % LOT_COLORS.length];
      barHtml += "<div class=\"ratio-segment\" style=\"width:" + pct + "%; background-color:" + color + ";\"></div>";
    });
    ratioBar.innerHTML = barHtml;
  }

  if (tallyStatus) {
    const splitDescriptions = activeLots.map(lot => (dynamicLotSplits[lot.id] || 0) + "x " + lot.name);
    tallyStatus.textContent = "Custom Split: " + splitDescriptions.join(" + ") + " (Total " + total + " bottles)";
  }
}

function renderPacks(b2cPacks, b2bPacks) {
  if (Array.isArray(b2cPacks) && b2cPacks.length > 0) {
    availableB2cPacks = b2cPacks;
    const b2cGrid = document.getElementById("b2cPacks");
    if (b2cGrid) {
      let b2cHtml = "";
      b2cPacks.forEach((p, idx) => {
        const isDefault = p.name === selectedB2cPack.name || (idx === 2 && !selectedB2cPack.name);
        const badgeHtml = p.badge ? "<div class=\"pack-badge\">" + p.badge + "</div>" : "";
        const perBottle = p.bottles > 1 ? " (@ ₹" + Math.round(p.price / p.bottles) + ")" : "";

        b2cHtml += "<div class=\"pack-option" + (isDefault ? " active" : "") + "\" onclick=\"selectB2cPack(&quot;" + p.name + "&quot;, " + p.bottles + ", " + p.price + ", this)\">";
        b2cHtml += badgeHtml + "<div class=\"pack-name\">" + p.name + "</div>";
        b2cHtml += "<div class=\"pack-price\">₹" + p.price.toLocaleString("en-IN") + "</div>";
        b2cHtml += "<div class=\"pack-desc\">" + p.bottles + "x 250ml" + perBottle + "</div></div>";

        if (isDefault) selectedB2cPack = { name: p.name, bottles: p.bottles, unitPrice: p.price };
      });
      b2cGrid.innerHTML = b2cHtml;
    }
  }

  if (Array.isArray(b2bPacks) && b2bPacks.length > 0) {
    availableB2bPacks = b2bPacks;
    const b2bGrid = document.getElementById("b2bPacks");
    if (b2bGrid) {
      let b2bHtml = "";
      b2bPacks.forEach((p, idx) => {
        const isDefault = p.name === selectedB2bPack.name || (idx === 0 && !selectedB2bPack.name);
        const perBottle = " (₹" + Math.round(p.price / p.bottles) + "/ea)";

        b2bHtml += "<div class=\"pack-option" + (isDefault ? " active" : "") + "\" onclick=\"selectB2bPack(&quot;" + p.name + "&quot;, " + p.bottles + ", " + p.price + ", this)\">";
        b2bHtml += "<div class=\"pack-name\">" + p.name + "</div>";
        b2bHtml += "<div class=\"pack-price\">₹" + p.price.toLocaleString("en-IN") + "</div>";
        b2bHtml += "<div class=\"pack-desc\">" + p.bottles + "x 250ml" + perBottle + "</div></div>";

        if (isDefault) selectedB2bPack = { name: p.name, bottles: p.bottles, unitPrice: p.price };
      });
      b2bGrid.innerHTML = b2bHtml;
    }
  }
}

function selectB2cPack(name, bottles, price, el) {
  document.querySelectorAll("#b2cPacks .pack-option").forEach(e => e.classList.remove("active"));
  if (el) el.classList.add("active");
  selectedB2cPack = { name, bottles, unitPrice: price };
  updateTotal();
  if (isCustomSplit) rebalanceSplitter();
}

function selectB2bPack(name, bottles, price, el) {
  document.querySelectorAll("#b2bPacks .pack-option").forEach(e => e.classList.remove("active"));
  if (el) el.classList.add("active");
  selectedB2bPack = { name, bottles, unitPrice: price };
  updateTotal();
  if (isCustomSplit) rebalanceSplitter();
}

function calculateSubtotal() {
  const qtyInput = document.getElementById("packQty");
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = currentMode === "B2C" ? selectedB2cPack : selectedB2bPack;
  return (active && active.unitPrice ? active.unitPrice : 0) * qty;
}

function calculateTotal() {
  const subtotal = calculateSubtotal();
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  return Math.max(0, subtotal - discount);
}

function applyCoupon() {
  const input = document.getElementById("couponCodeInput");
  const statusEl = document.getElementById("couponStatus");
  const code = (input ? input.value : "").trim().toUpperCase();

  if (!code) {
    if (statusEl) {
      statusEl.textContent = "Please enter a coupon code.";
      statusEl.style.display = "block";
      statusEl.style.color = "var(--error-light)";
    }
    return;
  }

  const subtotal = calculateSubtotal();
  const matched = availableCoupons.find(c => c.code === code);

  if (!matched) {
    if (statusEl) {
      statusEl.textContent = "Invalid coupon code.";
      statusEl.style.display = "block";
      statusEl.style.color = "var(--error-light)";
    }
    appliedCoupon = null;
    updateTotal();
    return;
  }

  if (matched.mode !== "ALL" && matched.mode !== currentMode) {
    if (statusEl) {
      statusEl.textContent = "Valid only for " + matched.mode + " orders.";
      statusEl.style.display = "block";
      statusEl.style.color = "var(--error-light)";
    }
    appliedCoupon = null;
    updateTotal();
    return;
  }

  if (subtotal < matched.minOrder) {
    if (statusEl) {
      statusEl.textContent = "Minimum order of ₹" + matched.minOrder + " required for " + code;
      statusEl.style.display = "block";
      statusEl.style.color = "var(--error-light)";
    }
    appliedCoupon = null;
    updateTotal();
    return;
  }

  let discount = 0;
  if (matched.type === "PERCENT") {
    discount = Math.round((subtotal * matched.value) / 100);
  } else {
    discount = matched.value;
  }
  discount = Math.min(discount, subtotal);

  appliedCoupon = {
    code: matched.code,
    type: matched.type,
    value: matched.value,
    discountAmount: discount
  };

  if (statusEl) {
    statusEl.textContent = "✓ Coupon applied! Saved ₹" + discount;
    statusEl.style.display = "block";
    statusEl.style.color = "var(--success-light)";
  }
  updateTotal();
}

function updateTotal() {
  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const subtotalEl = document.getElementById("subtotalDisplay");
  const discountLine = document.getElementById("discountLine");
  const discountAmountEl = document.getElementById("discountAmountDisplay");
  const totalDisplay = document.getElementById("totalAmountDisplay");
  const btnAmount = document.getElementById("btnAmount");
  const btnText = document.getElementById("btnText");

  if (subtotalEl) subtotalEl.textContent = "₹" + subtotal.toLocaleString("en-IN");

  if (appliedCoupon && appliedCoupon.discountAmount > 0) {
    if (discountLine) discountLine.style.display = "flex";
    if (discountAmountEl) discountAmountEl.textContent = "-₹" + appliedCoupon.discountAmount.toLocaleString("en-IN");
  } else {
    if (discountLine) discountLine.style.display = "none";
  }

  const formattedTotal = "₹" + total.toLocaleString("en-IN");
  if (totalDisplay) totalDisplay.textContent = formattedTotal;
  if (btnAmount) btnAmount.textContent = formattedTotal;

  if (btnText && currentStoreStatus === "OPEN") {
    if (currentMode === "B2B" && currentB2bPayOption === "INVOICE") {
      btnText.innerHTML = "📄 Request Corporate Invoice (<span id=\"btnAmount\">" + formattedTotal + "</span>)";
    } else {
      btnText.innerHTML = "💳 Pay &amp; Confirm Pre-Order (<span id=\"btnAmount\">" + formattedTotal + "</span>)";
    }
  }

  if (isCustomSplit) renderDynamicSplitterUI();
}

function checkSavedProfile() {
  const savedBar = document.getElementById("savedProfileBar");
  const savedText = document.getElementById("savedProfileText");

  try {
    const raw = localStorage.getItem("tabc_customer_profile");
    if (raw) {
      cachedProfile = JSON.parse(raw);
      if (cachedProfile && cachedProfile.name) {
        if (savedBar) savedBar.style.display = "flex";
        if (savedText) savedText.textContent = "👋 Welcome back, " + cachedProfile.name + "! Autofill your details?";
      }
    }
  } catch (e) {}
}

function applySavedProfile() {
  try {
    const profile = cachedProfile || JSON.parse(localStorage.getItem("tabc_customer_profile") || "{}");
    if (profile && profile.name) {
      const nameInput = document.getElementById("custName");
      const emailInput = document.getElementById("custEmail");
      const phoneInput = document.getElementById("custPhone");
      const pinInput = document.getElementById("custPincode");
      const addrInput = document.getElementById("custAddress");
      const compInput = document.getElementById("custCompany");
      const gstinInput = document.getElementById("custGstin");

      if (profile.name && nameInput) nameInput.value = profile.name;
      if (profile.email && emailInput) emailInput.value = profile.email;
      if (profile.phone && phoneInput) phoneInput.value = profile.phone;
      if (profile.pin && pinInput) { pinInput.value = profile.pin; validatePincodeField(); }
      if (profile.address && addrInput) addrInput.value = profile.address;
      if (profile.company && compInput) compInput.value = profile.company;
      if (profile.gstin && gstinInput) gstinInput.value = profile.gstin;

      validateAllInputs();
    }
  } catch (e) {}
}

function saveCustomerProfile(data) {
  try {
    const profile = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      pin: data.pinCode,
      address: data.buildingFloor,
      company: data.company !== "N/A" ? data.company : "",
      gstin: data.gstin !== "N/A" ? data.gstin : ""
    };
    cachedProfile = profile;
    localStorage.setItem("tabc_customer_profile", JSON.stringify(profile));
  } catch (e) {}
}

function setFieldState(inputEl, errorEl, isValid) {
  if (!inputEl) return isValid;
  if (isValid) {
    inputEl.classList.remove("input-invalid");
    inputEl.classList.add("input-valid");
    if (errorEl) errorEl.style.display = "none";
  } else {
    inputEl.classList.add("input-invalid");
    inputEl.classList.remove("input-valid");
    if (errorEl) errorEl.style.display = "block";
  }
  return isValid;
}

function validateField(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return true;
  const val = el.value.trim();
  let errEl = null;

  if (fieldId === "custName") {
    errEl = document.getElementById("errName");
    return setFieldState(el, errEl, val.length >= 2);
  } else if (fieldId === "custCompany") {
    errEl = document.getElementById("errCompany");
    return setFieldState(el, errEl, currentMode !== "B2B" || val.length >= 2);
  } else if (fieldId === "custAddress") {
    errEl = document.getElementById("errAddress");
    return setFieldState(el, errEl, val.length >= 5);
  }
  return true;
}

function validateEmailField() {
  const el = document.getElementById("custEmail");
  const errEl = document.getElementById("errEmail");
  if (!el) return true;
  const val = el.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return setFieldState(el, errEl, emailRegex.test(val));
}

function validatePhoneField() {
  const el = document.getElementById("custPhone");
  const errEl = document.getElementById("errPhone");
  if (!el) return true;
  let val = el.value.replace(/[^0-9]/g, "");
  el.value = val;
  const phoneRegex = /^[6-9]\d{9}$/;
  return setFieldState(el, errEl, phoneRegex.test(val));
}

function validatePincodeField() {
  const el = document.getElementById("custPincode");
  const errEl = document.getElementById("errPincode");
  const statusEl = document.getElementById("pinStatus");
  if (!el) return true;

  let val = el.value.replace(/[^0-9]/g, "");
  el.value = val;

  if (val.length < 6) {
    if (statusEl) statusEl.textContent = "";
    return setFieldState(el, errEl, false);
  }

  const isNcr = /^(11\d{4}|122\d{3}|121\d{3}|201\d{3})$/.test(val);
  if (isNcr) {
    if (statusEl) {
      statusEl.textContent = "✓ Serviceable across Delhi NCR";
      statusEl.className = "pin-status pin-valid";
    }
    return setFieldState(el, errEl, true);
  } else {
    if (statusEl) {
      statusEl.textContent = "✕ Serviceable only in Delhi NCR (11xxxx, 122xxx, 121xxx, 201xxx)";
      statusEl.className = "pin-status pin-invalid";
    }
    return setFieldState(el, errEl, false);
  }
}

function validateGstinField() {
  const el = document.getElementById("custGstin");
  const errEl = document.getElementById("errGstin");
  if (!el) return true;
  const val = el.value.trim().toUpperCase();
  el.value = val;

  if (!val) {
    el.classList.remove("input-invalid");
    if (errEl) errEl.style.display = "none";
    return true;
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return setFieldState(el, errEl, gstinRegex.test(val));
}

function validateAllInputs() {
  const isNameValid = validateField("custName");
  const isEmailValid = validateEmailField();
  const isPhoneValid = validatePhoneField();
  const isAddressValid = validateField("custAddress");
  const isPinValid = validatePincodeField();
  const isCompanyValid = currentMode === "B2B" ? validateField("custCompany") : true;
  const isGstinValid = currentMode === "B2B" ? validateGstinField() : true;

  const qtyInput = document.getElementById("packQty");
  const qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  const isQtyValid = !isNaN(qty) && qty >= 1;
  const errQty = document.getElementById("errQty");
  setFieldState(qtyInput, errQty, isQtyValid);

  return isNameValid && isEmailValid && isPhoneValid && isAddressValid && isPinValid && isCompanyValid && isGstinValid && isQtyValid;
}

function handlePayClick() {
  if (currentStoreStatus === "PAUSED" || currentStoreStatus === "SOLD_OUT") {
    alert("Pre-orders are currently closed for this drop.");
    return;
  }

  if (!validateAllInputs()) {
    alert("Please fill in all required delivery fields.");
    return;
  }

  if (currentMode === "B2B" && currentB2bPayOption === "INVOICE") {
    const invId = "INV-REQ-" + Math.floor(100000 + Math.random() * 900000);
    handleOrderSuccess(invId, "Corporate Invoice Requested (Net Terms)");
    return;
  }

  const total = calculateTotal();
  const name = (document.getElementById("custName")?.value || "").trim();
  const email = (document.getElementById("custEmail")?.value || "").trim();
  const phone = (document.getElementById("custPhone")?.value || "").trim();
  const activePack = currentMode === "B2C" ? selectedB2cPack : selectedB2bPack;

  if (CONFIG.razorpayKeyId && !CONFIG.razorpayKeyId.includes("YOUR_RAZORPAY")) {
    const options = {
      key: CONFIG.razorpayKeyId,
      amount: total * 100,
      currency: "INR",
      name: "The Apartment Brew Co.",
      description: (currentMode === "B2B" ? "Office Drop: " : "Pre-Order: ") + activePack.name,
      prefill: { name: name, email: email, contact: phone },
      theme: { color: "#d4a373" },
      handler: function (response) { handleOrderSuccess(response.razorpay_payment_id, "Paid via Gateway"); }
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function (response) {
      alert("Payment was not completed: " + (response.error.description || "Please try again."));
    });
    rzp.open();
  } else {
    const demoPayId = "pay_demo_" + Math.random().toString(36).substring(2, 9);
    handleOrderSuccess(demoPayId, "Paid via Gateway (Demo)");
  }
}

async function handleOrderSuccess(paymentId, statusText) {
  const name = (document.getElementById("custName")?.value || "").trim();
  const email = (document.getElementById("custEmail")?.value || "").trim();
  const phone = (document.getElementById("custPhone")?.value || "").trim();
  const pin = (document.getElementById("custPincode")?.value || "").trim();
  const qty = parseInt(document.getElementById("packQty")?.value, 10) || 1;
  const total = calculateTotal();
  const activePack = currentMode === "B2C" ? selectedB2cPack : selectedB2bPack;
  const dropInstructions = document.getElementById("dropInstructions")?.value || "Deliver directly to door / desk";

  const isB2c = currentMode === "B2C";
  const orderId = isB2c ? "TABC-" + Math.floor(100000 + Math.random() * 900000) : "TABC-B2B-" + Math.floor(100000 + Math.random() * 900000);
  const dropDate = isB2c ? getUpcomingSaturdayFormatted() : getUpcomingFridayFormatted();
  const location = isB2c ? (document.getElementById("custCity")?.value || "") : (document.getElementById("b2bTechPark")?.value || "");
  const deliveryWindow = isB2c ? "Saturday Morning (8:00 AM – 11:00 AM)" : (document.getElementById("b2bDeliveryWindow")?.value || "");
  const company = isB2c ? "N/A" : ((document.getElementById("custCompany")?.value || "").trim() || "N/A");
  const gstin = isB2c ? "N/A" : ((document.getElementById("custGstin")?.value || "").trim() || "N/A");
  const buildingFloor = (document.getElementById("custAddress")?.value || "").trim();
  const paymentMode = isB2c ? "Razorpay Gateway" : (currentB2bPayOption === "INVOICE" ? "Corporate Invoice (Net Terms)" : "Razorpay Gateway");

  const activeLots = availableLots.filter(l => !l.isSoldOut);
  const splitDetails = activeLots.map(l => (dynamicLotSplits[l.id] || 0) + "x " + l.name).join(" + ");
  const coffeeLotDisplay = isCustomSplit ? "Discovery Flight / Custom Split (" + splitDetails + ")" : selectedBean;

  const orderPayload = {
    authToken: CONFIG.authToken,
    botTrap: "",
    orderType: currentMode,
    targetSheet: isB2c ? "Sheet1" : "B2B Orders",
    orderId: orderId,
    company: company,
    name: name,
    email: email,
    phone: phone,
    gstin: gstin,
    techPark: location,
    buildingFloor: buildingFloor,
    dropInstructions: dropInstructions,
    pinCode: pin,
    deliveryWindow: deliveryWindow,
    dropDate: dropDate,
    bean: coffeeLotDisplay,
    pack: activePack.name,
    quantity: qty,
    bottles: activePack.bottles * qty,
    totalAmount: total,
    paymentMode: paymentMode,
    paymentStatus: statusText + " (" + paymentId + ")",
    deliveryStatus: "Pre-Ordered",
    appliedCoupon: appliedCoupon,
    notes: "Payment ID: " + paymentId
  };

  currentOrderDetails = orderPayload;
  saveCustomerProfile(orderPayload);

  if (CONFIG.googleSheetEndpoint && !CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    fetch(CONFIG.googleSheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(orderPayload)
    }).catch(() => {});
  }

  const rOrderId = document.getElementById("rOrderId");
  const rOrderType = document.getElementById("rOrderType");
  const rCompanyRow = document.getElementById("rCompanyRow");
  const rCompany = document.getElementById("rCompany");
  const rWindowRow = document.getElementById("rWindowRow");
  const rWindow = document.getElementById("rWindow");
  const rPayId = document.getElementById("rPayId");
  const rDropDate = document.getElementById("rDropDate");
  const rName = document.getElementById("rName");
  const rEmail = document.getElementById("rEmail");
  const rBean = document.getElementById("rBean");
  const rPack = document.getElementById("rPack");
  const rTotal = document.getElementById("rTotal");

  if (rOrderId) rOrderId.textContent = orderId;
  if (rOrderType) rOrderType.textContent = isB2c ? "Individual Pre-Order (Sat Drop)" : "Corporate Office Drop (Fri Drop)";
  if (rCompanyRow) rCompanyRow.style.display = isB2c ? "none" : "flex";
  if (!isB2c && rCompany) rCompany.textContent = company;
  if (rWindowRow) rWindowRow.style.display = "flex";
  if (rWindow) rWindow.textContent = deliveryWindow;
  if (rPayId) rPayId.textContent = paymentId;
  if (rDropDate) rDropDate.textContent = dropDate;
  if (rName) rName.textContent = name;
  if (rEmail) rEmail.textContent = email;
  if (rBean) rBean.textContent = coffeeLotDisplay;
  if (rPack) rPack.textContent = activePack.name + " x " + qty + " (" + (activePack.bottles * qty) + " bottles)";
  if (rTotal) rTotal.textContent = "₹" + total.toLocaleString("en-IN");

  const orderFormView = document.getElementById("orderFormView");
  const confirmationView = document.getElementById("confirmationView");
  if (orderFormView) orderView.style.display = "none";
  if (confirmationView) confirmationView.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function addToGoogleCalendar() {
  if (!currentOrderDetails) return;
  const d = currentOrderDetails;
  const title = encodeURIComponent("The Apartment Brew Co. Drop: " + d.orderId);
  const details = encodeURIComponent("Fresh Flash-Brew Specialty Coffee Drop\\nOrder ID: " + d.orderId + "\\nLot: " + d.bean + "\\nSelection: " + d.pack + "\\nInstruction: " + d.dropInstructions + "\\nTotal: ₹" + d.totalAmount);
  const location = encodeURIComponent(d.buildingFloor + ", " + d.techPark + " (PIN: " + d.pinCode + ")");
  const gcalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title + "&details=" + details + "&location=" + location;
  window.open(gcalUrl, "_blank");
}

function sendWhatsAppReceipt() {
  if (!currentOrderDetails) return;
  const d = currentOrderDetails;
  const message = "*ORDER &amp; DELIVERY CONFIRMATION - THE APARTMENT BREW CO.*\\n" +
                  "Order ID: " + d.orderId + "\\n" +
                  "Delivery Date: " + d.dropDate + " (" + d.deliveryWindow + ")\\n" +
                  "Customer: " + d.name + " (" + d.phone + ")\\n" +
                  "Coffee Lot: " + d.bean + "\\n" +
                  "Selection: " + d.pack + " (" + d.bottles + " bottles)\\n" +
                  "Total Paid: ₹" + d.totalAmount + "\\n" +
                  "Freshness Note: Please refrigerate upon arrival and consume within 48 hours!";

  let cleanPhone = d.phone.replace(/[^0-9]/g, "");
  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
  const whatsappUrl = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(message);
  window.open(whatsappUrl, "_blank");
}

function resetForm() {
  const orderFormView = document.getElementById("orderFormView");
  const confirmationView = document.getElementById("confirmationView");
  if (orderFormView) orderFormView.style.display = "block";
  if (confirmationView) confirmationView.style.display = "none";

  const fields = ["custName", "custEmail", "custPhone", "custAddress", "custPincode", "custCompany", "custGstin"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const pinStatus = document.getElementById("pinStatus");
  if (pinStatus) pinStatus.textContent = "";

  document.querySelectorAll("input, textarea").forEach(el => el.classList.remove("input-valid", "input-invalid"));
  document.querySelectorAll(".field-error").forEach(el => el.style.display = "none";);
  checkSavedProfile();
}

function toggleGuide() {
  const body = document.getElementById("guideBody");
  const arrow = document.getElementById("guideArrow");
  if (!body) return;
  const isOpen = body.style.display === "block";
  body.style.display = isOpen ? "none" : "block";
  if (arrow) arrow.textContent = isOpen ? "▼" : "▲";
}

async function trackOrder() {
  const input = document.getElementById("trackInput");
  const resultsContainer = document.getElementById("trackerResults");
  const query = (input ? input.value : "").trim();

  if (!query) {
    if (resultsContainer) resultsContainer.innerHTML = '<div style="color:var(--error-light); padding:10px; text-align:center;">Please enter your Order ID or 10-digit mobile number.</div>';
    return;
  }

  if (resultsContainer) resultsContainer.innerHTML = '<div style="color:var(--info-blue); padding:12px; text-align:center;">Searching live order logs...</div>';

  if (!CONFIG.googleSheetEndpoint || CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div style="background:var(--card-inner); border:1px solid var(--card-border); border-radius:8px; padding:14px; margin-top:10px;">' +
        '<div style="font-weight:700; color:var(--accent);">' + query.toUpperCase() + '</div>' +
        '<div style="font-size:0.8rem; margin:6px 0; color:var(--text-muted);">Status: <span style="color:var(--success-light); font-weight:700;">Pre-Ordered</span></div>' +
        '<div style="font-size:0.75rem; color:var(--text-muted);">Batch scheduled for fresh roast &amp; chilled delivery.</div></div>';
    }
    return;
  }

  try {
    const res = await fetch(CONFIG.googleSheetEndpoint + "?action=trackOrder&amp;query=" + encodeURIComponent(query));
    const data = await res.json();

    if (data && data.status === "success" && Array.isArray(data.orders) && data.orders.length > 0) {
      let html = "";
      const STATUS_STEPS = ["Pre-Ordered", "Brewing", "Dispatched", "Delivered"];

      data.orders.forEach(order => {
        const curIdx = STATUS_STEPS.indexOf(order.deliveryStatus || "Pre-Ordered");
        let stepsHtml = '<div style="display:flex; justify-content:space-between; margin:14px 0;">';
        STATUS_STEPS.forEach((step, idx) => {
          const isDone = idx <= (curIdx === -1 ? 0 : curIdx);
          const color = isDone ? "var(--success-light)" : "var(--text-muted)";
          stepsHtml += '<div style="text-align:center; font-size:0.72rem; color:' + color + ';">' + (isDone ? "✓ " : "") + step + '</div>';
        });
        stepsHtml += '</div>';

        html += '<div style="background:var(--card-inner); border:1px solid var(--card-border); border-radius:10px; padding:14px; margin-top:10px;">';
        html += '<div style="display:flex; justify-content:space-between; font-weight:700;"><span style="color:var(--accent);">' + order.orderId + '</span><span style="color:var(--info-blue);">' + (order.deliveryStatus || "Pre-Ordered") + '</span></div>';
        html += stepsHtml;
        html += '<div style="font-size:0.78rem; color:var(--text-muted); line-height:1.4;">';
        html += '<div><strong>Delivery Date:</strong> ' + order.deliveryDate + '</div>';
        html += '<div><strong>Selection:</strong> ' + order.selection + ' (' + order.bottles + ' bottles)</div>';
        html += '<div><strong>Total:</strong> ₹' + order.totalAmount + '</div>';
        html += '</div></div>';
      });
      resultsContainer.innerHTML = html;
    } else {
      resultsContainer.innerHTML = '<div style="color:var(--error-light); padding:10px; text-align:center;">No matching order found for "' + query + '".</div>';
    }
  } catch (err) {
    resultsContainer.innerHTML = '<div style="color:var(--error-light); padding:10px; text-align:center;">Unable to fetch order status. Please try again.</div>';
  }
}

function setSyncStatus(state, message) {
  const pill = document.getElementById("syncStatusPill");
  const dot = document.getElementById("syncDot");
  const text = document.getElementById("syncStatusText");
  const retryBtn = document.getElementById("syncRetryBtn");
  if (!pill || !dot || !text) return;

  pill.style.display = "inline-flex";
  text.textContent = message;

  if (state === "loading") {
    dot.style.background = "var(--info-blue)";
    if (retryBtn) retryBtn.style.display = "none";
  } else if (state === "error" || state === "offline") {
    dot.style.background = "var(--error-light)";
    if (retryBtn) retryBtn.style.display = "inline-block";
  } else if (state === "synced") {
    dot.style.background = "var(--success-light)";
    if (retryBtn) retryBtn.style.display = "none";
    setTimeout(() => { pill.style.display = "none"; }, 3500);
  }
}

function retrySync() {
  fetchLiveConfig(true);
}

function applyStoreStatus(status) {
  currentStoreStatus = (status || "OPEN").toUpperCase();
  const banner = document.getElementById("storeStatusBanner");
  const payBtn = document.getElementById("payNowBtn");
  const btnText = document.getElementById("btnText");

  if (currentStoreStatus === "PAUSED") {
    if (banner) {
      banner.textContent = "Pre-orders are currently paused by the roastery. Batch in preparation.";
      banner.style.display = "block";
    }
    if (payBtn) payBtn.disabled = true;
    if (btnText) btnText.innerHTML = "Pre-Orders Temporarily Paused";
  } else if (currentStoreStatus === "SOLD_OUT") {
    if (banner) {
      banner.textContent = "Batch Capacity Reached (Sold Out). Next drop opens Monday.";
      banner.style.display = "block";
    }
    if (payBtn) payBtn.disabled = true;
    if (btnText) btnText.innerHTML = "Sold Out for This Drop";
  } else {
    if (banner) banner.style.display = "none";
    if (payBtn) payBtn.disabled = false;
    updateTotal();
  }
}

function updateDeliveryWindowOptions(clusters) {
  const parkSelect = document.getElementById("b2bTechPark");
  const windowSelect = document.getElementById("b2bDeliveryWindow");
  if (!parkSelect || !windowSelect || !Array.isArray(clusters)) return;

  const selectedPark = parkSelect.value;
  Array.from(windowSelect.options).forEach(opt => {
    const winText = opt.value;
    const match = clusters.find(c => c.techPark === selectedPark && c.deliveryWindow === winText);

    if (match && match.isFull) {
      opt.textContent = winText + " [CAPACITY FULL]";
      opt.disabled = true;
    } else {
      opt.textContent = winText;
      opt.disabled = false;
    }
  });
}

function applyConfigToUI(data) {
  if (!data) return;

  const cap = data.batchCapacity || 200;
  const resCount = data.reservedBottles || 0;
  const scarcityText = document.getElementById("scarcityText");
  const scarcityFill = document.getElementById("scarcityFill");

  if (scarcityText) scarcityText.textContent = resCount + " / " + cap + " Bottles Reserved";
  if (scarcityFill) {
    const pct = Math.min(Math.round((resCount / cap) * 100), 100);
    scarcityFill.style.transform = "scaleX(" + (pct / 100) + ")";
  }

  if (data.lots) renderLots(data.lots);
  if (data.b2cPacks || data.b2bPacks) renderPacks(data.b2cPacks, data.b2bPacks);
  if (data.coupons) availableCoupons = data.coupons;
  if (data.storeStatus) applyStoreStatus(data.storeStatus);
  if (data.deliveryClusters) updateDeliveryWindowOptions(data.deliveryClusters);

  updateTotal();
  if (isCustomSplit) rebalanceSplitter();
}

function fetchLiveConfig(isManualRetry = false) {
  try {
    const cached = JSON.parse(localStorage.getItem("tabc_live_config"));
    if (cached) applyConfigToUI(cached);
  } catch (e) {}

  if (!CONFIG.googleSheetEndpoint || CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    return;
  }

  setSyncStatus("loading", "Connecting to roastery inventory...");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  fetch(CONFIG.googleSheetEndpoint, { signal: controller.signal })
    .then(res => res.json())
    .then(data => {
      clearTimeout(timeoutId);
      if (data && data.status === "success") {
        localStorage.setItem("tabc_live_config", JSON.stringify(data));
        applyConfigToUI(data);
        setSyncStatus("synced", "Live batch data synced");
      }
    })
    .catch(() => {
      clearTimeout(timeoutId);
      setSyncStatus("offline", "Showing offline batch data");
    });
}

function initApp() {
  renderLots(availableLots);
  renderPacks(availableB2cPacks, availableB2bPacks);
  switchMode("B2C");
  startCutoffCountdown();
  checkSavedProfile();
  applyConfigToUI({ batchCapacity: 200, reservedBottles: 0 });
  fetchLiveConfig();
  setInterval(() => fetchLiveConfig(), 45000);
}


if (document.readyState !== "loading") {

  initApp();

} else {

  document.addEventListener("DOMContentLoaded", initApp);

}


