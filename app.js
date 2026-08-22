// ====================================================================
// THE APARTMENT BREW CO. — FRONTEND CONTROLLER (app.js)
// ====================================================================

const CONFIG = {
  razorpayKeyId: "rzp_test_TRVab1bUUwOVN5", // Replace with your active Key ID (rzp_live_...)
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbz9kw-PDrwGXaNeHzvgfuOZsQ5A52tKXk-WN2np30ohE12xekUSK7x-bAp_kN_epmig/exec", // Replace with Apps Script Web App URL ending in /exec
  authToken: "TABC_SECURE_TOKEN_2026" // Shared auth token matching Code.gs
};

let cachedProfile = null;

let currentMode = "B2C";
let currentB2bPayOption = "GATEWAY";

let availableCoupons = [
  { code: "FRESHDROP", type: "FLAT", value: 100, minOrder: 480, mode: "B2C" },
  { code: "OFFICE10", type: "PERCENT", value: 10, minOrder: 1800, mode: "B2B" },
  { code: "NCRFIRST", type: "PERCENT", value: 10, minOrder: 240, mode: "ALL" }
];
let appliedCoupon = null; // { code, type, value, discount }
let currentStoreStatus = "OPEN";

// Default Dynamic State (Overridden by live Google Sheets Menu & Config)
let availableLots = [
  { id: "LOT-01", name: "Ratnagiri Estate", process: "Anaerobic Naturals", notes: "Wild Raspberry, Stone Fruit & Dark Cacao", pills: ["Fruity", "High Acidity", "Medium Roast"], acidity: 85, body: 70 },
  { id: "LOT-02", name: "Blueberry Estate", process: "Washed Lot", notes: "Orange Blossom, Jasmine & Crisp Green Apple", pills: ["Floral", "Clean Crisp", "Light-Med Roast"], acidity: 75, body: 60 }
];

let availableB2cPacks = [
  { id: "B2C-01", name: "Single Bottle", bottles: 1, price: 240, badge: "" },
  { id: "B2C-02", name: "Duo Pack / Discovery Sampler", bottles: 2, price: 480, badge: "Discovery Flight" },
  { id: "B2C-03", name: "Weekend Pack", bottles: 4, price: 899, badge: "Popular" },
  { id: "B2C-04", name: "Mega Week", bottles: 6, price: 1200, badge: "Value" }
];

let availableB2bPacks = [
  { id: "B2B-01", name: "Team Pack", bottles: 10, price: 1800 },
  { id: "B2B-02", name: "Office Batch", bottles: 20, price: 3400 },
  { id: "B2B-03", name: "Floor Pack", bottles: 40, price: 6000 },
  { id: "B2B-04", name: "Townhall Bulk", bottles: 60, price: 8700 }
];

let selectedBean = "Ratnagiri Estate (Anaerobic Naturals)";
let isCustomSplit = false;
let customSplit = { lot1: 2, lot2: 2 };
let selectedB2cPack = { name: "Weekend Pack", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack", bottles: 10, unitPrice: 1800 };
let currentOrderDetails = null;

// Dynamic Date Calculations
function getUpcomingFridayFormatted() {
  const d = new Date();
  let days = (5 - d.getDay() + 7) % 7;
  if (days === 0 && d.getHours() >= 12) days = 7;
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getUpcomingSaturdayFormatted() {
  const d = new Date();
  let days = (6 - d.getDay() + 7) % 7;
  if (days === 0 && d.getHours() >= 10) days = 7;
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// --------------------------------------------------------------------
// Dynamic Menu & Config Rendering (Data-Driven from Google Sheets)
// --------------------------------------------------------------------
function renderLots(lots) {
  if (!Array.isArray(lots) || lots.length === 0) return;
  availableLots = lots;
  
  const lotGrid = document.getElementById('lotGrid');
  if (!lotGrid) return;
  
  let html = '';
  lots.forEach((lot, idx) => {
    const fullName = `${lot.name} (${lot.process})`;
    const isFirstActive = idx === 0 && !isCustomSplit;
    const pillsHtml = (lot.pills || []).map(p => `<span class="flavor-pill">${p}</span>`).join('');

    html += `
      <div class="lot-card ${isFirstActive ? 'active' : ''}" onclick="selectLot('${fullName}', this)">
        <div class="lot-header">
          <span class="lot-name">${lot.name}</span>
          <span class="lot-tag">${lot.process}</span>
        </div>
        <div class="lot-notes">${lot.notes}</div>
        <div class="flavor-pills">${pillsHtml}</div>
        <div class="sensory-meters">
          <div class="meter-row">
            <span>Acidity</span>
            <div class="meter-bar"><div class="meter-fill" style="width: ${lot.acidity || 75}%;"></div></div>
          </div>
          <div class="meter-row">
            <span>Body</span>
            <div class="meter-bar"><div class="meter-fill" style="width: ${lot.body || 65}%;"></div></div>
          </div>
        </div>
      </div>`;
  });

  // Append Custom Ratio Split Card if multiple lots are active
  if (lots.length >= 2) {
    html += `
      <div class="lot-card ${isCustomSplit ? 'active' : ''}" onclick="selectLot('Discovery Flight / Custom Split (Build Your Own Batch)', this)">
        <div class="lot-header">
          <span class="lot-name">Discovery Flight / Custom Split</span>
          <span class="lot-tag">Sampler Split</span>
        </div>
        <div class="lot-notes">&#127915; Sample both harvests (1x ${lots[0].name} + 1x ${lots[1].name}) or customize your exact split</div>
        <div class="flavor-pills">
          <span class="flavor-pill">Tasting Flight</span>
          <span class="flavor-pill">1:1 Discovery</span>
        </div>
      </div>`;

    // Update Splitter UI labels
    const l1Name = document.getElementById('splitLot1Name');
    const l1Sub = document.getElementById('splitLot1Sub');
    const l2Name = document.getElementById('splitLot2Name');
    const l2Sub = document.getElementById('splitLot2Sub');

    if (l1Name) l1Name.textContent = lots[0].name;
    if (l1Sub) l1Sub.textContent = lots[0].process;
    if (l2Name) l2Name.textContent = lots[1].name;
    if (l2Sub) l2Sub.textContent = lots[1].process;
  }

  lotGrid.innerHTML = html;

  if (!isCustomSplit && lots[0]) {
    selectedBean = `${lots[0].name} (${lots[0].process})`;
  }
}

function renderPacks(b2cPacks, b2bPacks) {
  if (Array.isArray(b2cPacks) && b2cPacks.length > 0) {
    availableB2cPacks = b2cPacks;
    const b2cGrid = document.getElementById('b2cPacks');
    if (b2cGrid) {
      let b2cHtml = '';
      b2cPacks.forEach((p, idx) => {
        const isDefault = p.name === selectedB2cPack.name || (idx === 2 && !selectedB2cPack.name);
        const badgeHtml = p.badge ? `<div class="pack-badge">${p.badge}</div>` : '';
        const perBottle = p.bottles > 1 ? ` (@ ₹${Math.round(p.price / p.bottles)})` : '';
        
        b2cHtml += `
          <div class="pack-option ${isDefault ? 'active' : ''}" onclick="selectB2cPack('${p.name}', ${p.bottles}, ${p.price}, this)">
            ${badgeHtml}
            <div class="pack-name">${p.name}</div>
            <div class="pack-price">₹${p.price.toLocaleString('en-IN')}</div>
            <div class="pack-desc">${p.bottles}x 250ml${perBottle}</div>
          </div>`;

        if (isDefault) {
          selectedB2cPack = { name: p.name, bottles: p.bottles, unitPrice: p.price };
        }
      });
      b2cGrid.innerHTML = b2cHtml;
    }
  }

  if (Array.isArray(b2bPacks) && b2bPacks.length > 0) {
    availableB2bPacks = b2bPacks;
    const b2bGrid = document.getElementById('b2bPacks');
    if (b2bGrid) {
      let b2bHtml = '';
      b2bPacks.forEach((p, idx) => {
        const isDefault = p.name === selectedB2bPack.name || (idx === 0 && !selectedB2bPack.name);
        const perBottle = ` (₹${Math.round(p.price / p.bottles)}/ea)`;
        
        b2bHtml += `
          <div class="pack-option ${isDefault ? 'active' : ''}" onclick="selectB2bPack('${p.name}', ${p.bottles}, ${p.price}, this)">
            <div class="pack-name">${p.name}</div>
            <div class="pack-price">₹${p.price.toLocaleString('en-IN')}</div>
            <div class="pack-desc">${p.bottles}x 250ml${perBottle}</div>
          </div>`;

        if (isDefault) {
          selectedB2bPack = { name: p.name, bottles: p.bottles, unitPrice: p.price };
        }
      });
      b2bGrid.innerHTML = b2bHtml;
    }
  }

function recalculateCouponDiscount(subtotal) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.type === &apos;PERCENT&apos;) {
    return Math.round((subtotal * appliedCoupon.value) / 100);
  } else {
    return Math.min(appliedCoupon.value, subtotal);
  }
}

function applyCoupon() {
  const inputEl = document.getElementById(&apos;couponInput&apos;);
  const statusEl = document.getElementById(&apos;couponStatus&apos;);
  const btnRemove = document.getElementById(&apos;btnRemoveCoupon&apos;);
  const btnApply = document.getElementById(&apos;btnApplyCoupon&apos;);
  if (!inputEl) return;

  const rawCode = inputEl.value.trim().toUpperCase();
  inputEl.value = rawCode;

  if (!rawCode) {
    if (statusEl) {
      statusEl.textContent = &apos;Please enter a coupon code.&apos;;
      statusEl.className = &apos;coupon-status coupon-invalid&apos;;
      statusEl.style.display = &apos;block&apos;;
    }
    return;
  }

  const subtotal = calculateSubtotal();
  const coupon = availableCoupons.find(c =&gt; c.code.toUpperCase() === rawCode);

  if (!coupon) {
    if (statusEl) {
      statusEl.textContent = `✕ Coupon &quot;${rawCode}&quot; is not valid.`;
      statusEl.className = &apos;coupon-status coupon-invalid&apos;;
      statusEl.style.display = &apos;block&apos;;
    }
    appliedCoupon = null;
    if (btnRemove) btnRemove.style.display = &apos;none&apos;;
    if (btnApply) btnApply.style.display = &apos;inline-block&apos;;
    updateTotal();
    return;
  }

  const couponMode = (coupon.mode || &apos;ALL&apos;).toUpperCase();
  if (couponMode !== &apos;ALL&apos; &amp;&amp; couponMode !== currentMode) {
    const targetMode = couponMode === &apos;B2C&apos; ? &apos;individual pre-orders (B2C)&apos; : &apos;corporate office drops (B2B)&apos;;
    if (statusEl) {
      statusEl.textContent = `✕ Coupon &quot;${coupon.code}&quot; is valid only for ${targetMode}.`;
      statusEl.className = &apos;coupon-status coupon-invalid&apos;;
      statusEl.style.display = &apos;block&apos;;
    }
    appliedCoupon = null;
    if (btnRemove) btnRemove.style.display = &apos;none&apos;;
    if (btnApply) btnApply.style.display = &apos;inline-block&apos;;
    updateTotal();
    return;
  }

  const minOrder = parseFloat(coupon.minOrder) || 0;
  if (subtotal &lt; minOrder) {
    if (statusEl) {
      statusEl.textContent = `✕ Minimum order of ₹${minOrder.toLocaleString(&apos;en-IN&apos;)} required for coupon &quot;${coupon.code}&quot;. (Current subtotal: ₹${subtotal.toLocaleString(&apos;en-IN&apos;)})`;
      statusEl.className = &apos;coupon-status coupon-invalid&apos;;
      statusEl.style.display = &apos;block&apos;;
    }
    appliedCoupon = null;
    if (btnRemove) btnRemove.style.display = &apos;none&apos;;
    if (btnApply) btnApply.style.display = &apos;inline-block&apos;;
    updateTotal();
    return;
  }

  const discountVal = coupon.type === &apos;PERCENT&apos; ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal);

  appliedCoupon = { code: coupon.code, type: coupon.type, value: coupon.value, discount: discountVal };

  if (statusEl) {
    const desc = coupon.type === &apos;PERCENT&apos; ? `${coupon.value}% off` : `₹${coupon.value} off`;
    statusEl.textContent = `✓ Coupon &quot;${coupon.code}&quot; applied! (${desc}, saving ₹${discountVal.toLocaleString(&apos;en-IN&apos;)})`;
    statusEl.className = &apos;coupon-status coupon-valid&apos;;
    statusEl.style.display = &apos;block&apos;;
  }

  if (btnApply) btnApply.style.display = &apos;none&apos;;
  if (btnRemove) btnRemove.style.display = &apos;inline-block&apos;;

  updateTotal();
}

function removeCoupon() {
  appliedCoupon = null;
  const inputEl = document.getElementById(&apos;couponInput&apos;);
  const statusEl = document.getElementById(&apos;couponStatus&apos;);
  const btnRemove = document.getElementById(&apos;btnRemoveCoupon&apos;);
  const btnApply = document.getElementById(&apos;btnApplyCoupon&apos;);
  if (inputEl) inputEl.value = &apos;&apos;;
  if (statusEl) { statusEl.textContent = &apos;&apos;; statusEl.style.display = &apos;none&apos;; }
  if (btnRemove) btnRemove.style.display = &apos;none&apos;;
  if (btnApply) btnApply.style.display = &apos;inline-block&apos;;
  updateTotal();
}
}

function applyStoreStatus(status) {
  currentStoreStatus = (status || 'OPEN').toUpperCase();
  const banner = document.getElementById('storeStatusBanner');
  const payBtn = document.getElementById('payNowBtn');
  const btnText = document.getElementById('btnText');
  
  if (currentStoreStatus === 'PAUSED') {
    if (banner) {
      banner.textContent = '⚠️ Pre-orders are currently paused by the roastery. Batch in preparation.';
      banner.style.display = 'block';
    }
    if (payBtn) payBtn.disabled = true;
    if (btnText) btnText.innerHTML = '🚫 Pre-Orders Temporarily Paused';
  } else if (currentStoreStatus === 'SOLD_OUT') {
    if (banner) {
      banner.textContent = '⚡ Batch Capacity Reached (Sold Out). Next drop opens Monday.';
      banner.style.display = 'block';
    }
    if (payBtn) payBtn.disabled = true;
    if (btnText) btnText.innerHTML = '🚫 Sold Out for This Drop';
  } else {
    if (banner) banner.style.display = 'none';
    if (payBtn) payBtn.disabled = false;
    updateTotal();
  }
}

function applyConfigToUI(data) {
  if (!data) return;
  
  const cap = data.batchCapacity || 60;
  const resCount = data.reservedBottles || 0;
  const scarcityText = document.getElementById('scarcityText');
  const scarcityFill = document.getElementById('scarcityFill');
  
  if (scarcityText) {
    scarcityText.textContent = `${resCount} / ${cap} Bottles Reserved`;
  }
  if (scarcityFill) {
    const pct = Math.min(Math.round((resCount / cap) * 100), 100);
    scarcityFill.style.transform = `scaleX(${pct / 100})`;
  }
  
  if (data.lots) renderLots(data.lots);
  if (data.b2cPacks || data.b2bPacks) renderPacks(data.b2cPacks, data.b2bPacks);

  if (Array.isArray(data.coupons) &amp;&amp; data.coupons.length &gt; 0) {
    availableCoupons = data.coupons;
  }
  if (data.storeStatus) applyStoreStatus(data.storeStatus);
  
  updateTotal();
  if (isCustomSplit) rebalanceSplitter();
}

function fetchLiveConfig() {
  try {
    const cached = JSON.parse(localStorage.getItem('tabc_live_config'));
    if (cached) {
      applyConfigToUI(cached);
    }
  } catch (e) {}
  
  if (!CONFIG.googleSheetEndpoint || CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) return;
  
  fetch(CONFIG.googleSheetEndpoint)
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'success') {
        localStorage.setItem('tabc_live_config', JSON.stringify(data));
        applyConfigToUI(data);
      }
    })
    .catch(() => {});
}

// Live Countdown Timer for Pre-Order Cutoff
function startCutoffCountdown() {
  function updateTimer() {
    const timerEl = document.getElementById('countdownTimer');
    if (!timerEl) return;
  
    const now = new Date();
    const isB2c = currentMode === "B2C";
    const target = new Date();
  
    if (isB2c) {
      let daysUntilFri = (5 - now.getDay() + 7) % 7;
      if (daysUntilFri === 0 && now.getHours() >= 22) daysUntilFri = 7;
      target.setDate(now.getDate() + daysUntilFri);
      target.setHours(22, 0, 0, 0);
    } else {
      let daysUntilThu = (4 - now.getDay() + 7) % 7;
      if (daysUntilThu === 0 && now.getHours() >= 18) daysUntilThu = 7;
      target.setDate(now.getDate() + daysUntilThu);
      target.setHours(18, 0, 0, 0);
    }
  
    const diff = target - now;
    if (diff <= 0) {
      timerEl.textContent = "⚡ Cutoff reached for next batch. Orders queue for following drop.";
      return;
    }
  
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
  
    const cutoffLabel = isB2c ? "Saturday Drop Cutoff" : "Friday Drop Cutoff";
    timerEl.textContent = `⏱️ ${cutoffLabel} closes in ${hours}h ${mins}m ${secs}s`;
  }
  
  updateTimer();
  setInterval(updateTimer, 1000);
}

// Switch between B2C & B2B Modes
function switchMode(mode) {
  currentMode = mode;
  const isB2c = mode === 'B2C';
  
  const tabB2c = document.getElementById('tabB2c');
  const tabB2b = document.getElementById('tabB2b');
  const dropBanner = document.getElementById('dropBanner');
  const packSubtext = document.getElementById('packSubtext');
  const b2cPacks = document.getElementById('b2cPacks');
  const b2bPacks = document.getElementById('b2bPacks');
  const b2bFields = document.getElementById('b2bFields');
  const b2cCityGroup = document.getElementById('b2cCityGroup');
  const b2bPaymentChoiceGroup = document.getElementById('b2bPaymentChoiceGroup');
  const labelName = document.getElementById('labelName');
  const labelEmail = document.getElementById('labelEmail');
  const labelAddress = document.getElementById('labelAddress');
  
  if (tabB2c) tabB2c.classList.toggle('active', isB2c);
  if (tabB2b) tabB2b.classList.toggle('active', !isB2c);
  
  if (dropBanner) {
    dropBanner.innerHTML = isB2c 
      ? `<span>⚡</span> Next Fresh Drop: ${getUpcomingSaturdayFormatted()} (Morning)` 
      : `<span>⚡</span> Next Office Drop: ${getUpcomingFridayFormatted()} (Friday Delivery)`;
  }
  
  if (packSubtext) packSubtext.textContent = isB2c ? 'Saturday Drop' : 'Friday Office Drop (Cutoff: Thu 6 PM)';
  if (b2cPacks) b2cPacks.style.display = isB2c ? 'grid' : 'none';
  if (b2bPacks) b2bPacks.style.display = isB2c ? 'none' : 'grid';
  if (b2bFields) b2bFields.style.display = isB2c ? 'none' : 'block';
  if (b2cCityGroup) b2cCityGroup.style.display = isB2c ? 'flex' : 'none';
  if (b2bPaymentChoiceGroup) b2bPaymentChoiceGroup.style.display = isB2c ? 'none' : 'block';
  
  if (labelName) labelName.textContent = isB2c ? 'Your Name *' : 'Contact Person Name & Role *';
  if (labelEmail) labelEmail.textContent = isB2c ? 'Email Address *' : 'Work Email *';
  if (labelAddress) labelAddress.textContent = isB2c ? 'Delivery Address (Building, Flat, Society) *' : 'Building / Tower / Floor Details *';
  
  if (isB2c) currentB2bPayOption = 'GATEWAY';
  
  updateTotal();
  if (isCustomSplit) rebalanceSplitter();

  if (appliedCoupon) {
    const coupon = availableCoupons.find(c =&gt; c.code.toUpperCase() === appliedCoupon.code);
    const couponMode = coupon ? (coupon.mode || &apos;ALL&apos;).toUpperCase() : &apos;ALL&apos;;
    if (couponMode !== &apos;ALL&apos; &amp;&amp; couponMode !== mode) {
      removeCoupon();
    }
  }
}

// Visual Lot Selection & Custom Splitter Toggle
function selectLot(lotName, element) {
  document.querySelectorAll('#lotGrid .lot-card').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');
  
  const customSplitter = document.getElementById('customSplitter');
  
  if (lotName && (lotName.includes('Custom Ratio Split') || lotName.includes('Discovery Flight'))) {
    isCustomSplit = true;
    if (customSplitter) customSplitter.style.display = 'block';
    rebalanceSplitter();
  } else {
    isCustomSplit = false;
    selectedBean = lotName;
    if (customSplitter) customSplitter.style.display = 'none';
  }
}

// Custom Ratio Splitter Logic
function getTotalBottles() {
  const qtyInput = document.getElementById('packQty');
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  return (active && active.bottles ? active.bottles : 1) * qty;
}

function rebalanceSplitter() {
  const total = getTotalBottles();
  const prevSum = (customSplit.lot1 || 0) + (customSplit.lot2 || 0);

  if (prevSum > 0 && prevSum !== total) {
    const ratio = customSplit.lot1 / prevSum;
    const newLot1 = Math.round(ratio * total);
    customSplit.lot1 = newLot1;
    customSplit.lot2 = total - newLot1;
  } else if (prevSum === 0 || prevSum !== total) {
    const half = Math.floor(total / 2);
    customSplit.lot1 = half;
    customSplit.lot2 = total - half;
  }
  renderSplitterUI();
}

function adjustSplit(lotKey, delta) {
  const total = getTotalBottles();
  if (lotKey === 'lot1') {
    let newL1 = customSplit.lot1 + delta;
    if (newL1 >= 0 && newL1 <= total) {
      customSplit.lot1 = newL1;
      customSplit.lot2 = total - newL1;
    }
  } else {
    let newL2 = customSplit.lot2 + delta;
    if (newL2 >= 0 && newL2 <= total) {
      customSplit.lot2 = newL2;
      customSplit.lot1 = total - newL2;
    }
  }
  renderSplitterUI();
}

function renderSplitterUI() {
  const total = getTotalBottles();
  const alloc = customSplit.lot1 + customSplit.lot2;
  const qtyInput = document.getElementById('packQty');
  const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  const lot1Name = availableLots[0] ? availableLots[0].name : "Lot 1";
  const lot2Name = availableLots[1] ? availableLots[1].name : "Lot 2";

  const allocEl = document.getElementById('allocCount');
  const targetEl = document.getElementById('targetCount');
  const l1Count = document.getElementById('splitLot1Count');
  const l2Count = document.getElementById('splitLot2Count');
  const bar1 = document.getElementById('ratioBarLot1');
  const bar2 = document.getElementById('ratioBarLot2');
  const tallyEl = document.getElementById('tallyStatus');

  if (allocEl) allocEl.textContent = alloc;
  if (targetEl) targetEl.textContent = total;
  if (l1Count) l1Count.textContent = customSplit.lot1;
  if (l2Count) l2Count.textContent = customSplit.lot2;

  if (tallyEl) {
    if (customSplit.lot1 === customSplit.lot2) {
      tallyEl.textContent = `✨ Balanced Discovery Flight: ${customSplit.lot1}x ${lot1Name} + ${customSplit.lot2}x ${lot2Name} (${qty}x ${activePack.name})`;
    } else {
      tallyEl.textContent = `🎯 Custom Flight: ${customSplit.lot1}x ${lot1Name} + ${customSplit.lot2}x ${lot2Name} (Total ${total} bottles across ${qty} pack${qty > 1 ? 's' : ''})`;
    }
  }

  const l1Percent = total > 0 ? (customSplit.lot1 / total) * 100 : 50;
  const l2Percent = total > 0 ? (customSplit.lot2 / total) * 100 : 50;

  if (bar1) bar1.style.width = `${l1Percent}%`;
  if (bar2) bar2.style.width = `${l2Percent}%`;
}

// Pack Selection Handlers
function selectB2cPack(name, bottles, price, el) {
  document.querySelectorAll('#b2cPacks .pack-option').forEach(e => e.classList.remove('active'));
  if (el) el.classList.add('active');
  selectedB2cPack = { name, bottles, unitPrice: price };
  updateTotal();
  if (isCustomSplit) rebalanceSplitter();
}

function selectB2bPack(name, bottles, price, el) {
  document.querySelectorAll('#b2bPacks .pack-option').forEach(e => e.classList.remove('active'));
  if (el) el.classList.add('active');
  selectedB2bPack = { name, bottles, unitPrice: price };
  updateTotal();
  if (isCustomSplit) rebalanceSplitter();
}

function setB2bPayOption(option) {
  currentB2bPayOption = option;
  const payOptionGateway = document.getElementById('payOptionGateway');
  const payOptionInvoice = document.getElementById('payOptionInvoice');
  
  if (payOptionGateway) payOptionGateway.classList.toggle('active', option === 'GATEWAY');
  if (payOptionInvoice) payOptionInvoice.classList.toggle('active', option === 'INVOICE');
  updateTotal();
}


function calculateSubtotal() {
  const qtyInput = document.getElementById(&apos;packQty&apos;);
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty &lt; 1) qty = 1;
  const active = currentMode === &apos;B2C&apos; ? selectedB2cPack : selectedB2bPack;
  return (active &amp;&amp; active.unitPrice ? active.unitPrice : 0) * qty;
}

function calculateTotal() {
  const subtotal = calculateSubtotal();
  if (appliedCoupon) {
    const discount = recalculateCouponDiscount(subtotal);
    appliedCoupon.discount = discount;
    return Math.max(0, subtotal - discount);
  }
  return subtotal;
}
  const qtyInput = document.getElementById('packQty');
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  return (active && active.unitPrice ? active.unitPrice : 0) * qty;
}


function updateTotal() {
  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const formattedTotal = `₹${total.toLocaleString(&apos;en-IN&apos;)}`;
  const formattedSubtotal = `₹${subtotal.toLocaleString(&apos;en-IN&apos;)}`;

  const totalDisplay = document.getElementById(&apos;totalAmountDisplay&apos;);
  const subtotalDisplay = document.getElementById(&apos;subtotalDisplay&apos;);
  const discountDisplay = document.getElementById(&apos;discountDisplay&apos;);
  const discountLabel = document.getElementById(&apos;discountLabel&apos;);
  const summaryBreakdown = document.getElementById(&apos;summaryBreakdown&apos;);
  const btnAmount = document.getElementById(&apos;btnAmount&apos;);
  const btnText = document.getElementById(&apos;btnText&apos;);
  const statusEl = document.getElementById(&apos;couponStatus&apos;);

  if (appliedCoupon) {
    const coupon = availableCoupons.find(c =&gt; c.code.toUpperCase() === appliedCoupon.code);
    const minOrder = coupon ? (parseFloat(coupon.minOrder) || 0) : 0;
    if (subtotal &lt; minOrder) {
      if (statusEl) {
        statusEl.textContent = `⚠️ Subtotal dropped below ₹${minOrder} minimum. Coupon removed.`;
        statusEl.className = &apos;coupon-status coupon-invalid&apos;;
        statusEl.style.display = &apos;block&apos;;
      }
      appliedCoupon = null;
      const btnRemove = document.getElementById(&apos;btnRemoveCoupon&apos;);
      const btnApply = document.getElementById(&apos;btnApplyCoupon&apos;);
      if (btnRemove) btnRemove.style.display = &apos;none&apos;;
      if (btnApply) btnApply.style.display = &apos;inline-block&apos;;
    }
  }

  if (summaryBreakdown) {
    if (appliedCoupon &amp;&amp; appliedCoupon.discount &gt; 0) {
      summaryBreakdown.style.display = &apos;flex&apos;;
      if (subtotalDisplay) subtotalDisplay.textContent = formattedSubtotal;
      if (discountDisplay) discountDisplay.textContent = `-₹${appliedCoupon.discount.toLocaleString(&apos;en-IN&apos;)}`;
      if (discountLabel) discountLabel.textContent = `Promo Discount (${appliedCoupon.code}):`;
    } else {
      summaryBreakdown.style.display = &apos;none&apos;;
    }
  }

  if (totalDisplay) totalDisplay.textContent = formattedTotal;
  if (btnAmount) btnAmount.textContent = formattedTotal;

  if (btnText &amp;&amp; currentStoreStatus === &apos;OPEN&apos;) {
    if (currentMode === &apos;B2B&apos; &amp;&amp; currentB2bPayOption === &apos;INVOICE&apos;) {
      btnText.innerHTML = `📄 Request Corporate Invoice (&lt;span id=&quot;btnAmount&quot;&gt;${formattedTotal}&lt;/span&gt;)`;
    } else {
      btnText.innerHTML = `💳 Pay &amp; Confirm Pre-Order (&lt;span id=&quot;btnAmount&quot;&gt;${formattedTotal}&lt;/span&gt;)`;
    }
  }

  if (isCustomSplit) rebalanceSplitter();
}
  const total = calculateTotal();
  const formatted = `₹${total.toLocaleString('en-IN')}`;
  
  const totalDisplay = document.getElementById('totalAmountDisplay');
  const btnAmount = document.getElementById('btnAmount');
  const btnText = document.getElementById('btnText');
  
  if (totalDisplay) totalDisplay.textContent = formatted;
  if (btnAmount) btnAmount.textContent = formatted;
  
  if (btnText && currentStoreStatus === 'OPEN') {
    if (currentMode === 'B2B' && currentB2bPayOption === 'INVOICE') {
      btnText.innerHTML = `📄 Request Corporate Invoice (<span id="btnAmount">${formatted}</span>)`;
    } else {
      btnText.innerHTML = `💳 Pay & Confirm Pre-Order (<span id="btnAmount">${formatted}</span>)`;
    }
  }
  
  if (isCustomSplit) rebalanceSplitter();
}

// 1-Click Returning Customer localStorage Manager
function checkSavedProfile() {
  const savedBar = document.getElementById('savedProfileBar');
  const savedText = document.getElementById('savedProfileText');
  
  if (cachedProfile && cachedProfile.name) {
    if (savedBar) savedBar.style.display = 'flex';
    if (savedText) savedText.textContent = `👋 Welcome back, ${cachedProfile.name}! Autofill your details?`;
    return;
  }
  
  try {
    const raw = localStorage.getItem('tabc_customer_profile');
    if (raw) {
      cachedProfile = JSON.parse(raw);
      if (cachedProfile && cachedProfile.name) {
        if (savedBar) savedBar.style.display = 'flex';
        if (savedText) savedText.textContent = `👋 Welcome back, ${cachedProfile.name}! Autofill your details?`;
      }
    }
  } catch (e) {}
}

function applySavedProfile() {
  try {
    const profile = cachedProfile || JSON.parse(localStorage.getItem('tabc_customer_profile' || '{}'));
    if (profile && profile.name) {
      const nameInput = document.getElementById('custName');
      const emailInput = document.getElementById('custEmail');
      const phoneInput = document.getElementById('custPhone');
      const pinInput = document.getElementById('custPincode');
      const addrInput = document.getElementById('custAddress');
      const compInput = document.getElementById('custCompany');
      const gstinInput = document.getElementById('custGstin');

      if (profile.name && nameInput) nameInput.value = profile.name;
      if (profile.email && emailInput) emailInput.value = profile.email;
      if (profile.phone && phoneInput) phoneInput.value = profile.phone;
      if (profile.pin && pinInput) {
        pinInput.value = profile.pin;
        validatePincodeField();
      }
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
      company: data.company !== 'N/A' ? data.company : '',
      gstin: data.gstin !== 'N/A' ? data.gstin : ''
    };
    cachedProfile = profile;
    localStorage.setItem('tabc_customer_profile', JSON.stringify(profile));
  } catch (e) {}
}

// Interactive Serving Guide Toggle
function toggleGuide() {
  const body = document.getElementById('guideBody');
  const arrow = document.getElementById('guideArrow');
  if (!body) return;

  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

// Real-Time Form Validations
function setFieldState(inputEl, errorEl, isValid) {
  if (!inputEl) return isValid;
  if (isValid) {
    inputEl.classList.remove('input-invalid');
    inputEl.classList.add('input-valid');
    if (errorEl) errorEl.style.display = 'none';
  } else {
    inputEl.classList.add('input-invalid');
    inputEl.classList.remove('input-valid');
    if (errorEl) errorEl.style.display = 'block';
  }
  return isValid;
}

function validateField(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return true;
  const val = el.value.trim();
  let errEl = null;

  if (fieldId === 'custName') {
    errEl = document.getElementById('errName');
    return setFieldState(el, errEl, val.length >= 2);
  } else if (fieldId === 'custCompany') {
    errEl = document.getElementById('errCompany');
    return setFieldState(el, errEl, currentMode !== 'B2B' || val.length >= 2);
  } else if (fieldId === 'custAddress') {
    errEl = document.getElementById('errAddress');
    return setFieldState(el, errEl, val.length >= 5);
  }
  return true;
}

function validateEmailField() {
  const el = document.getElementById('custEmail');
  const errEl = document.getElementById('errEmail');
  if (!el) return true;
  const val = el.value.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-\\]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return setFieldState(el, errEl, emailRegex.test(val));
}

function validatePhoneField() {
  const el = document.getElementById('custPhone');
  const errEl = document.getElementById('errPhone');
  if (!el) return true;
  let val = el.value.replace(/[^0-9]/g, '');
  el.value = val;
  const phoneRegex = /^[6-9]\d{9}$/;
  return setFieldState(el, errEl, phoneRegex.test(val));
}

function validatePincodeField() {
  const el = document.getElementById('custPincode');
  const errEl = document.getElementById('errPincode');
  const statusEl = document.getElementById('pinStatus');
  if (!el) return true;

  let val = el.value.replace(/[^0-9]/g, '');
  el.value = val;

  if (val.length < 6) {
    if (statusEl) statusEl.textContent = '';
    return setFieldState(el, errEl, false);
  }

  const isNcr = /^(11[0-9]{4}|122[0-9]{3}|121[0-9]{3}|201[0-9]{3})$/.test(val);
  if (isNcr) {
    if (statusEl) {
      statusEl.textContent = '✓ Serviceable across Delhi NCR';
      statusEl.className = 'pin-status pin-valid';
    }
    return setFieldState(el, errEl, true);
  } else {
    if (statusEl) {
      statusEl.textContent = '✕ Serviceable only in Delhi NCR (11xxxx, 122xxx, 121xxx, 201xxx)';
      statusEl.className = 'pin-status pin-invalid';
    }
    return setFieldState(el, errEl, false);
  }
}

function validateGstinField() {
  const el = document.getElementById('custGstin');
  const errEl = document.getElementById('errGstin');
  if (!el) return true;
  const val = el.value.trim().toUpperCase();
  el.value = val;

  if (!val) {
    el.classList.remove('input-invalid');
    if (errEl) errEl.style.display = 'none';
    return true;
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return setFieldState(el, errEl, gstinRegex.test(val));
}

function validateAllInputs() {
  const isNameValid = validateField('custName');
  const isEmailValid = validateEmailField();
  const isPhoneValid = validatePhoneField();
  const isAddressValid = validateField('custAddress');
  const isPinValid = validatePincodeField();
  const isCompanyValid = currentMode === 'B2B' ? validateField('custCompany') : true;
  const isGstinValid = currentMode === 'B2B' ? validateGstinField() : true;

  const qtyInput = document.getElementById('packQty');
  const qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  const isQtyValid = !isNaN(qty) && qty >= 1;
  const errQty = document.getElementById('errQty');
  setFieldState(qtyInput, errQty, isQtyValid);

  return isNameValid && isEmailValid && isPhoneValid && isAddressValid && isPinValid && isCompanyValid && isGstinValid && isQtyValid;
}

// Payment & Submission Handling
function handlePayClick() {
  if (currentStoreStatus === 'PAUSED' || currentStoreStatus === 'SOLD_OUT') {
    alert('Pre-orders are currently closed for this drop.');
    return;
  }

  if (!validateAllInputs()) {
    alert('Please correct the highlighted fields before placing your order.');
    return;
  }

  if (currentMode === 'B2B' && currentB2bPayOption === 'INVOICE') {
    const invId = "INV-REQ-" + Math.floor(100000 + Math.random() * 900000);
    handleOrderSuccess(invId, 'Corporate Invoice Requested (Net Terms)');
    return;
  }

  const total = calculateTotal();
  const name = (document.getElementById('custName')?.value || '').trim();
  const email = (document.getElementById('custEmail')?.value || '').trim();
  const phone = (document.getElementById('custPhone')?.value || '').trim();
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;

  if (CONFIG.razorpayKeyId && !CONFIG.razorpayKeyId.includes("YOUR_RAZORPAY")) {
    const options = {
      key: CONFIG.razorpayKeyId,
      amount: total * 100,
      currency: "INR",
      name: "The Apartment Brew Co.",
      description: `${currentMode === 'B2B' ? 'Office Drop' : 'Pre-Order'}: ${activePack.name}`,
      prefill: { name: name, email: email, contact: phone },
      theme: { color: "#d4a373" },
      handler: function (response) { handleOrderSuccess(response.razorpay_payment_id, "Paid via Gateway"); }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      alert('Payment was not completed: ' + (response.error.description || 'Please try again.'));
    });
    rzp.open();
  } else {
    const demoPayId = "pay_demo_" + Math.random().toString(36).substring(2, 9);
    handleOrderSuccess(demoPayId, "Paid via Gateway (Demo)");
  }
}


async function handleOrderSuccess(paymentId, statusText) {
  const name = (document.getElementById(&apos;custName&apos;)?..value || &apos;&apos;).trim();
  const email = (document.getElementById(&apos;custEmail&apos;)?..value || &apos;&apos;).trim();
  const phone = (document.getElementById(&apos;custPhone&apos;)?..value || &apos;&apos;).trim();
  const pin = (document.getElementById(&apos;custPincode&apos;)?..value || &apos;&apos;).trim();
  const qty = parseInt(document.getElementById(&apos;packQty&apos;)?..value, 10) || 1;
  const subtotal = calculateSubtotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const couponCode = appliedCoupon ? appliedCoupon.code : &apos;NONE&apos;;
  const total = calculateTotal();
  const activePack = currentMode === &apos;B2C&apos; ? selectedB2cPack : selectedB2bPack;
  const dropInstructions = document.getElementById(&apos;dropInstructions&apos;)?..value || &apos;Deliver directly to door / desk&apos;;

  const isB2c = currentMode === &apos;B2C&apos;;
  const orderId = isB2c ? &quot;TABC-&quot; + Math.floor(100000 + Math.random() * 900000) : &quot;TABC-B2B-&quot; + Math.floor(100000 + Math.random() * 900000);
  const dropDate = isB2c ? getUpcomingSaturdayFormatted() : getUpcomingFridayFormatted();
  const location = isB2c ? (document.getElementById(&apos;custCity&apos;)?..value || &apos;&apos;) : (document.getElementById(&apos;b2bTechPark&apos;)?..value || &apos;&apos;);
  const deliveryWindow = isB2c ? &quot;Saturday Morning (8:00 AM – 11:00 AM)&quot; : (document.getElementById(&apos;b2bDeliveryWindow&apos;)?..value || &apos;&apos;);
  const company = isB2c ? &quot;N/A&quot; : ((document.getElementById(&apos;custCompany&apos;)?..value || &apos;&apos;).trim() || &quot;N/A&quot;);
  const gstin = isB2c ? &quot;N/A&quot; : ((document.getElementById(&apos;custGstin&apos;)?..value || &apos;&apos;).trim() || &quot;N/A&quot;);
  const buildingFloor = (document.getElementById(&apos;custAddress&apos;)?..value || &apos;&apos;).trim();
  const paymentMode = isB2c ? &quot;Razorpay Gateway&quot; : (currentB2bPayOption === &apos;INVOICE&apos; ? &quot;Corporate Invoice (Net Terms)&quot; : &quot;Razorpay Gateway&quot;);

  const lot1Name = availableLots[0] ? availableLots[0].name : &quot;Lot 1&quot;;
  const lot2Name = availableLots[1] ? availableLots[1].name : &quot;Lot 2&quot;;

  const coffeeLotDisplay = isCustomSplit ? `Discovery Flight / Custom Split (${customSplit.lot1}x ${lot1Name} + ${customSplit.lot2}x ${lot2Name})` : selectedBean;

  const orderPayload = {
    authToken: CONFIG.authToken,
    botTrap: &quot;&quot;,
    orderType: currentMode,
    targetSheet: isB2c ? &apos;Sheet1&apos; : &apos;B2B Orders&apos;,
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
    subtotalAmount: subtotal,
    couponCode: couponCode,
    discountAmount: discount,
    totalAmount: total,
    paymentMode: paymentMode,
    paymentStatus: `${statusText} (${paymentId})`,
    deliveryStatus: &apos;Pre-Ordered&apos;,
    notes: (isB2c ? `Payment ID: ${paymentId}` : (currentB2bPayOption === &apos;INVOICE&apos; ? `Invoice Ref: ${paymentId} (Net Terms)` : `Payment ID: ${paymentId}`)) + (discount &gt; 0 ? ` | Coupon: ${couponCode} (-₹${discount})` : &apos;&apos;)
  };

  currentOrderDetails = orderPayload;
  saveCustomerProfile(orderPayload);

  if (CONFIG.googleSheetEndpoint &amp;&amp; !CONFIG.googleSheetEndpoint.includes(&quot;YOUR_GOOGLE_APPS&quot;)) {
    fetch(CONFIG.googleSheetEndpoint, { method: &quot;POST&quot;, mode: &quot;no-cors&quot;, headers: { &quot;Content-Type&quot;: &quot;text/plain;charset=utf-8&quot; }, body: JSON.stringify(orderPayload) }).catch(() =&gt; {
      try {
        const pending = JSON.parse(localStorage.getItem(&apos;tabc_pending_orders&apos;) || &quot;[]&quot;);
        pending.push(orderPayload);
        localStorage.setItem(&apos;tabc_pending_orders&apos;, JSON.stringify(pending));
      } catch (e) {}
    });
  }

  const rOrderId = document.getElementById(&apos;rOrderId&apos;);
  const rOrderType = document.getElementById(&apos;rOrderType&apos;);
  const rCompanyRow = document.getElementById(&apos;rCompanyRow&apos;);
  const rCompany = document.getElementById(&apos;rCompany&apos;);
  const rWindowRow = document.getElementById(&apos;rWindowRow&apos;);
  const rWindow = document.getElementById(&apos;rWindow&apos;);
  const rPayId = document.getElementById(&apos;rPayId&apos;);
  const rDropDate = document.getElementById(&apos;rDropDate&apos;);
  const rName = document.getElementById(&apos;rName&apos;);
  const rEmail = document.getElementById(&apos;rEmail&apos;);
  const rBean = document.getElementById(&apos;rBean&apos;);
  const rPack = document.getElementById(&apos;rPack&apos;);
  const rTotal = document.getElementById(&apos;rTotal&apos;);
  const rSubtotalRow = document.getElementById(&apos;rSubtotalRow&apos;);
  const rSubtotal = document.getElementById(&apos;rSubtotal&apos;);
  const rDiscountRow = document.getElementById(&apos;rDiscountRow&apos;);
  const rDiscount = document.getElementById(&apos;rDiscount&apos;);

  if (rOrderId) rOrderId.textContent = orderId;
  if (rOrderType) rOrderType.textContent = isB2c ? &apos;Individual Pre-Order (Sat Drop)&apos; : &apos;Corporate Office Drop (Fri Drop)&apos;;
  if (rCompanyRow) rCompanyRow.style.display = isB2c ? &apos;none&apos; : &apos;flex&apos;;
  if (!isB2c &amp;&amp; rCompany) rCompany.textContent = company;
  if (rWindowRow) rWindowRow.style.display = &apos;flex&apos;;
  if (rWindow) rWindow.textContent = deliveryWindow;

  if (rPayId) rPayId.textContent = paymentId;
  if (rDropDate) rDropDate.textContent = dropDate;
  if (rName) rName.textContent = name;
  if (rEmail) rEmail.textContent = email;
  if (rBean) rBean.textContent = coffeeLotDisplay;
  if (rPack) rPack.textContent = `${activePack.name} x ${qty} (${activePack.bottles * qty} bottles)`;
  if (rTotal) rTotal.textContent = `₹${total.toLocaleString(&apos;en-IN&apos;)}`;

  if (discount &gt; 0) {
    if (rSubtotalRow) rSubtotalRow.style.display = &apos;flex&apos;;
    if (rSubtotal) rSubtotal.textContent = `₹${subtotal.toLocaleString(&apos;en-IN&apos;)}`;
    if (rDiscountRow) rDiscountRow.style.display = &apos;flex&apos;;
    if (rDiscount) rDiscount.textContent = `-₹${discount.toLocaleString(&apos;en-IN&apos;)} (${couponCode})`;
  } else {
    if (rSubtotalRow) rSubtotalRow.style.display = &apos;none&apos;;
    if (rDiscountRow) rDiscountRow.style.display = &apos;none&apos;;
  }

  const orderFormView = document.getElementById(&apos;orderFormView&apos;);
  const confirmationView = document.getElementById(&apos;confirmationView&apos;);
  if (orderFormView) orderFormView.style.display = &apos;none&apos;;
  if (confirmationView) confirmationView.style.display = &apos;block&apos;;
  window.scrollTo({ top: 0, behavior: &apos;smooth&apos; });
}
  const name = (document.getElementById('custName')?.value || '').trim();
  const email = (document.getElementById('custEmail')?.value || '').trim();
  const phone = (document.getElementById('custPhone')?.value || '').trim();
  const pin = (document.getElementById('custPincode')?.value || '').trim();
  const qty = parseInt(document.getElementById('packQty')?.value, 10) || 1;
  const total = calculateTotal();
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  const dropInstructions = document.getElementById('dropInstructions')?.value || 'Deliver directly to door / desk';

  const isB2c = currentMode === 'B2C';
  const orderId = isB2c ? "TABC-" + Math.floor(100000 + Math.random() * 900000) : "TABC-B2B-" + Math.floor(100000 + Math.random() * 900000);
  const dropDate = isB2c ? getUpcomingSaturdayFormatted() : getUpcomingFridayFormatted();
  const location = isB2c ? (document.getElementById('custCity')?.value || '') : (document.getElementById('b2bTechPark')?.value || '');
  const deliveryWindow = isB2c ? "Saturday Morning (8:00 AM – 11:00 AM)" : (document.getElementById('b2bDeliveryWindow')?.value || '');
  const company = isB2c ? "N/A" : ((document.getElementById('custCompany')?.value || '').trim() || "N/A");
  const gstin = isB2c ? "N/A" : ((document.getElementById('custGstin')?.value || '').trim() || "N/A");
  const buildingFloor = (document.getElementById('custAddress')?.value || '').trim();
  const paymentMode = isB2c ? "Razorpay Gateway" : (currentB2bPayOption === 'INVOICE' ? "Corporate Invoice (Net Terms)" : "Razorpay Gateway");

  const lot1Name = availableLots[0] ? availableLots[0].name : "Lot 1";
  const lot2Name = availableLots[1] ? availableLots[1].name : "Lot 2";

  const coffeeLotDisplay = isCustomSplit 
    ? `Discovery Flight / Custom Split (${customSplit.lot1}x ${lot1Name} + ${customSplit.lot2}x ${lot2Name})`
    : selectedBean;

  const orderPayload = {
    authToken: CONFIG.authToken,
    botTrap: "",
    orderType: currentMode,
    targetSheet: isB2c ? 'Sheet1' : 'B2B Orders',
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
    paymentStatus: `${statusText} (${paymentId})`,
    deliveryStatus: 'Pre-Ordered',

    notes: isB2c ? `Payment ID: ${paymentId}` : (currentB2bPayOption === 'INVOICE' ? `Invoice Ref: ${paymentId} (Net Terms)` : `Payment ID: ${paymentId}`)
  };

  currentOrderDetails = orderPayload;
  saveCustomerProfile(orderPayload);

  if (CONFIG.googleSheetEndpoint && !CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    fetch(CONFIG.googleSheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(orderPayload)
    }).catch(() => {
      try {
        const pending = JSON.parse(localStorage.getItem('tabc_pending_orders') || "[]");
        pending.push(orderPayload);
        localStorage.setItem('tabc_pending_orders', JSON.stringify(pending));
      } catch (e) {}
    });
  }

  const rOrderId = document.getElementById('rOrderId');
  const rOrderType = document.getElementById('rOrderType');
  const rCompanyRow = document.getElementById('rCompanyRow');
  const rCompany = document.getElementById('rCompany');
  const rWindowRow = document.getElementById('rWindowRow');
  const rWindow = document.getElementById('rWindow');
  const rPayId = document.getElementById('rPayId');
  const rDropDate = document.getElementById('rDropDate');
  const rName = document.getElementById('rName');
  const rEmail = document.getElementById('rEmail');
  const rBean = document.getElementById('rBean');
  const rPack = document.getElementById('rPack');
  const rTotal = document.getElementById('rTotal');

  if (rOrderId) rOrderId.textContent = orderId;
  if (rOrderType) rOrderType.textContent = isB2c ? 'Individual Pre-Order (Sat Drop)' : 'Corporate Office Drop (Fri Drop)';
  if (rCompanyRow) rCompanyRow.style.display = isB2c ? 'none' : 'flex';
  if (!isB2c && rCompany) rCompany.textContent = company;
  if (rWindowRow) rWindowRow.style.display = 'flex';
  if (rWindow) rWindow.textContent = deliveryWindow;

  if (rPayId) rPayId.textContent = paymentId;
  if (rDropDate) rDropDate.textContent = dropDate;
  if (rName) rName.textContent = name;
  if (rEmail) rEmail.textContent = email;
  if (rBean) rBean.textContent = coffeeLotDisplay;
  if (rPack) rPack.textContent = `${activePack.name} x ${qty} (${activePack.bottles * qty} bottles)`;
  if (rTotal) rTotal.textContent = `₹${total.toLocaleString('en-IN')}`;

  const orderFormView = document.getElementById('orderFormView');
  const confirmationView = document.getElementById('confirmationView');

  if (orderFormView) orderFormView.style.display = 'none';
  if (confirmationView) confirmationView.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('online', () => {
  try {
    const pending = JSON.parse(localStorage.getItem('tabc_pending_orders') || "[]");
    if (pending.length > 0 && CONFIG.googleSheetEndpoint && !CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
      pending.forEach((order, idx) => {
        fetch(CONFIG.googleSheetEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(order)
        }).then(() => {
          pending.splice(idx, 1);
          localStorage.setItem('tabc_pending_orders', JSON.stringify(pending));
        }).catch(() => {});
      });
    }
  } catch (e) {}
});

function addToGoogleCalendar() {
  if (!currentOrderDetails) return;

  const d = currentOrderDetails;
  const title = encodeURIComponent(`The Apartment Brew Co. Drop: ${d.orderId}`);
  const details = encodeURIComponent(`Fresh Flash-Brew Specialty Coffee Drop\nOrder ID: ${d.orderId}\nLot: ${d.bean}\nSelection: ${d.pack}\nInstruction: ${d.dropInstructions}\nTotal: ₹${d.totalAmount}\n\nNote: Please refrigerate upon delivery and enjoy within 48 hours for peak flavor!`);
  const location = encodeURIComponent(`${d.buildingFloor}, ${d.techPark} (PIN: ${d.pinCode})`);

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  window.open(gcalUrl, '_blank');
}

function sendWhatsAppReceipt() {
  if (!currentOrderDetails) return;
  const d = currentOrderDetails;

  const message = `*☕ ORDER & DELIVERY CONFIRMATION — THE APARTMENT BREW CO.*\n` +
                  `------------------------------------\n` +
                  `*Order ID:* ${d.orderId}\n` +
                  `*Delivery Date:* ${d.dropDate} (${d.deliveryWindow})\n` +
                  `*Customer:* ${d.name} (${d.phone})\n` +
                  `*Delivery Address:* ${d.buildingFloor}, ${d.techPark}\n` +
                  `*Drop Note:* ${d.dropInstructions}\n` +
                  `------------------------------------\n` +
                  `*Coffee Lot:* ${d.bean}\n` +
                  `*Selection:* ${d.pack}\n` +
                  `*Total Bottles:* ${d.bottles}x 250ml\n` +
                  `*Total Paid:* ₹${d.totalAmount} (${d.paymentStatus})\n` +
                  `------------------------------------\n` +
                  `_Freshness Reminder: Extracted hot and flash-chilled with zero preservatives. Please refrigerate and consume within 48 hours!_`;

  let cleanPhone = d.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

function resetForm() {
  const orderFormView = document.getElementById('orderFormView');
  const confirmationView = document.getElementById('confirmationView');
  if (orderFormView) orderFormView.style.display = 'block';
  if (confirmationView) confirmationView.style.display = 'none';

  const fields = ['custName', 'custEmail', 'custPhone', 'custAddress', 'custPincode', 'custCompany', 'custGstin'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const pinStatus = document.getElementById('pinStatus');
  if (pinStatus) pinStatus.textContent = '';

  document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('input-valid', 'input-invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
  checkSavedProfile();

  removeCoupon();
}

document.addEventListener('DOMContentLoaded', () => {
  renderLots(availableLots);
  renderPacks(availableB2cPacks, availableB2bPacks);
  switchMode('B2C');
  startCutoffCountdown();
  checkSavedProfile();
  fetchLiveConfig();
  setInterval(fetchLiveConfig, 60000);
});