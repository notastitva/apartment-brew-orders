// ====================================================================
// THE APARTMENT BREW CO. — DYNAMIC FRONTEND CONTROLLER (app.js)
// ====================================================================

const CONFIG = {
  razorpayKeyId: "rzp_test_TRVab1bUUwOVN5", // Replace with your active Key ID (rzp_live_...)
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbx7nE2uQV08Ev4UYt8FFkmVZMGMpksvhIjljALGSbXYmc1FEv_1nh34BoR99mdTHic/exec", // Replace with Apps Script Web App URL ending in /exec
  authToken: "TABC_SECURE_TOKEN_2026" // Shared auth token matching Code.gs
};

// Built-In Resilient Default Fallbacks (Zero Downtime if Offline)
const DEFAULT_CONFIG = {
  storeStatus: "OPEN",
  batchCapacity: 50,
  reservedBottles: 38,
  announcementBanner: "⚡ Fresh Overnight Flash-Brew Drop",
  lots: [
    {
      id: "LOT-01",
      name: "Ratnagiri Estate",
      tag: "Anaerobic Naturals",
      notes: "Wild Raspberry, Stone Fruit & Dark Cacao",
      pills: ["Fruity", "High Acidity", "Medium Roast"],
      acidity: 85,
      body: 70,
      active: true
    },
    {
      id: "LOT-02",
      name: "Thogarihunkal Estate",
      tag: "Washed Lot",
      notes: "Orange Blossom, Jasmine & Crisp Green Apple",
      pills: ["Floral", "Clean Crisp", "Light-Med Roast"],
      acidity: 75,
      body: 60,
      active: true
    }
  ],
  b2cPacks: [
    { id: "B2C-01", name: "Single Bottle", bottles: 1, price: 240, badge: "", active: true },
    { id: "B2C-02", name: "Duo Pack", bottles: 2, price: 480, badge: "MOQ", active: true },
    { id: "B2C-03", name: "Weekend Pack", bottles: 4, price: 899, badge: "Popular", active: true },
    { id: "B2C-04", name: "Mega Weekend", bottles: 6, price: 1200, badge: "Value", active: true }
  ],
  b2bPacks: [
    { id: "B2B-01", name: "Team Pack (10x 250ml)", bottles: 10, price: 1800, active: true },
    { id: "B2B-02", name: "Office Batch (20x 250ml)", bottles: 20, price: 3400, active: true },
    { id: "B2B-03", name: "Floor Pack (40x 250ml)", bottles: 40, price: 6000, active: true },
    { id: "B2B-04", name: "Townhall Bulk (60x 250ml)", bottles: 60, price: 8700, active: true }
  ]
};

let liveConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
let currentMode = "B2C";
let currentB2bPayOption = "GATEWAY";
let selectedBean = "Ratnagiri Estate (Anaerobic Naturals)";
let isCustomSplit = false;
let customSplit = { ratnagiri: 2, thogarihunkal: 2 };
let selectedB2cPack = { name: "Weekend Pack", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack (10x 250ml)", bottles: 10, unitPrice: 1800 };
let appliedCoupon = null;
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

// Fetch Dynamic Configuration from Google Sheets
async function fetchLiveConfig() {
  if (!CONFIG.googleSheetEndpoint || CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    renderUIFromConfig(DEFAULT_CONFIG);
    return;
  }

  try {
    const res = await fetch(CONFIG.googleSheetEndpoint + '?action=getConfig', { method: 'GET' });
    const json = await res.json();
    if (json && json.status === 'success' && json.data) {
      liveConfig = json.data;
      renderUIFromConfig(liveConfig);
    } else {
      renderUIFromConfig(DEFAULT_CONFIG);
    }
  } catch (err) {
    console.log("Using cached menu config", err);
    renderUIFromConfig(DEFAULT_CONFIG);
  }
}

function renderUIFromConfig(config) {
  // 1. Scarcity & Capacity
  const capacity = config.batchCapacity || 50;
  const reserved = config.reservedBottles || 0;
  const scarcityText = document.getElementById('scarcityText');
  const scarcityFill = document.getElementById('scarcityFill');
  if (scarcityText) scarcityText.textContent = reserved + ' / ' + capacity + ' Bottles Reserved';
  if (scarcityFill) {
    const percent = Math.min(100, Math.round((reserved / capacity) * 100));
    scarcityFill.style.width = percent + '%';
  }

  // 2. Announcement Banner
  const dropBanner = document.getElementById('dropBanner');
  if (dropBanner && config.announcementBanner) {
    const dropDateText = currentMode === 'B2C' ? getUpcomingSaturdayFormatted() : getUpcomingFridayFormatted();
    dropBanner.innerHTML = '<span>&#9889;</span> ' + config.announcementBanner + ': ' + dropDateText;
  }

  // 3. Store Status
  const status = config.storeStatus || "OPEN";
  const storeBanner = document.getElementById('storeStatusBanner');
  const payBtn = document.getElementById('payNowBtn');
  if (status === 'SOLD_OUT') {
    if (storeBanner) {
      storeBanner.style.display = 'block';
      storeBanner.textContent = '⚡ Current batch is completely sold out! Next pre-orders open Monday.';
    }
    if (payBtn) payBtn.disabled = true;
  } else if (status === 'PAUSED') {
    if (storeBanner) {
      storeBanner.style.display = 'block';
      storeBanner.textContent = '⏸ Pre-orders are temporarily paused for kitchen batch roasting.';
    }
    if (payBtn) payBtn.disabled = true;
  } else {
    if (storeBanner) storeBanner.style.display = 'none';
    if (payBtn) payBtn.disabled = false;
  }

  // 4. Render Lots
  renderLotGrid(config.lots || DEFAULT_CONFIG.lots);

  // 5. Render Packs
  renderPackGrids(config.b2cPacks || DEFAULT_CONFIG.b2cPacks, config.b2bPacks || DEFAULT_CONFIG.b2bPacks);
}

function renderLotGrid(lots) {
  const lotGrid = document.getElementById('lotGrid');
  if (!lotGrid) return;
  lotGrid.innerHTML = '';

  let isFirst = true;
  lots.forEach(lot => {
    if (!lot.active) return;
    const card = document.createElement('div');
    card.className = 'lot-card' + (isFirst ? ' active' : '');
    if (isFirst) {
      selectedBean = lot.name + ' (' + lot.tag + ')';
      isFirst = false;
    }

    const pillsHtml = (lot.pills || []).map(p => '<span class="flavor-pill">' + p + '</span>').join('');
    
    card.innerHTML = `
      <div class="lot-header">
        <span class="lot-name">${lot.name}</span>
        <span class="lot-tag">${lot.tag}</span>
      </div>
      <div class="lot-notes">&#127827; ${lot.notes}</div>
      <div class="flavor-pills">${pillsHtml}</div>
      <div class="sensory-meters">
        <div class="meter-row">
          <span>Acidity</span>
          <div class="meter-bar"><div class="meter-fill" style="width: ${lot.acidity}%;"></div></div>
        </div>
        <div class="meter-row">
          <span>Body</span>
          <div class="meter-bar"><div class="meter-fill" style="width: ${lot.body}%;"></div></div>
        </div>
      </div>
    `;

    card.onclick = function() { selectLot(lot.name + ' (' + lot.tag + ')', card); };
    lotGrid.appendChild(card);
  });

  // Append Custom Split Lot Card
  const splitCard = document.createElement('div');
  splitCard.className = 'lot-card';
  splitCard.innerHTML = `
    <div class="lot-header">
      <span class="lot-name">Custom Ratio Split</span>
      <span class="lot-tag">Mix & Match</span>
    </div>
    <div class="lot-notes">&#127915; Customize your exact bottle ratio between available single-estate lots</div>
    <div class="flavor-pills"><span class="flavor-pill">Personalized Flight</span></div>
  `;
  splitCard.onclick = function() { selectLot('Custom Ratio Split (Build Your Own Batch)', splitCard); };
  lotGrid.appendChild(splitCard);
}

function renderPackGrids(b2cPacks, b2bPacks) {
  const b2cGrid = document.getElementById('b2cPacks');
  const b2bGrid = document.getElementById('b2bPacks');

  if (b2cGrid) {
    b2cGrid.innerHTML = '';
    let firstB2c = true;
    b2cPacks.forEach(pack => {
      if (!pack.active) return;
      const el = document.createElement('div');
      el.className = 'pack-option' + (firstB2c ? ' active' : '');
      if (firstB2c) {
        selectedB2cPack = { name: pack.name, bottles: pack.bottles, unitPrice: pack.price };
        firstB2c = false;
      }
      
      const badgeHtml = pack.badge ? '<div class="pack-badge">' + pack.badge + '</div>' : '';
      el.innerHTML = badgeHtml + `
        <div class="pack-name">${pack.name}</div>
        <div class="pack-price">&#8377;${pack.price.toLocaleString('en-IN')}</div>
        <div class="pack-desc">${pack.bottles}x 250ml</div>
      `;
      el.onclick = function() { selectB2cPack(pack.name, pack.bottles, pack.price, el); };
      b2cGrid.appendChild(el);
    });
  }

  if (b2bGrid) {
    b2bGrid.innerHTML = '';
    let firstB2b = true;
    b2bPacks.forEach(pack => {
      if (!pack.active) return;
      const el = document.createElement('div');
      el.className = 'pack-option' + (firstB2b ? ' active' : '');
      if (firstB2b) {
        selectedB2bPack = { name: pack.name, bottles: pack.bottles, unitPrice: pack.price };
        firstB2b = false;
      }
      el.innerHTML = `
        <div class="pack-name">${pack.name}</div>
        <div class="pack-price">&#8377;${pack.price.toLocaleString('en-IN')}</div>
        <div class="pack-desc">${pack.bottles}x 250ml (&#8377;${Math.round(pack.price / pack.bottles)}/ea)</div>
      `;
      el.onclick = function() { selectB2bPack(pack.name, pack.bottles, pack.price, el); };
      b2bGrid.appendChild(el);
    });
  }

  updateTotal();
}

// Live Countdown Timer for Pre-Order Cutoff
function startCutoffCountdown() {
  function updateTimer() {
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
    const timerEl = document.getElementById('countdownTimer');
    if (!timerEl) return;

    if (diff <= 0) {
      timerEl.textContent = "Cutoff reached for next batch. Orders queue for following drop.";
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const cutoffLabel = isB2c ? "Saturday Drop Cutoff" : "Friday Drop Cutoff";
    timerEl.textContent = cutoffLabel + " closes in " + hours + "h " + mins + "m " + secs + "s";
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// Switch between B2C & B2B Modes
function switchMode(mode) {
  currentMode = mode;
  const tabB2c = document.getElementById('tabB2c');
  const tabB2b = document.getElementById('tabB2b');
  if (tabB2c) tabB2c.classList.toggle('active', mode === 'B2C');
  if (tabB2b) tabB2b.classList.toggle('active', mode === 'B2B');

  const isB2c = mode === 'B2C';
  const dropBanner = document.getElementById('dropBanner');
  if (dropBanner) {
    dropBanner.innerHTML = isB2c 
      ? "<span>&#9889;</span> Next Fresh Drop: " + getUpcomingSaturdayFormatted() + " (Morning)" 
      : "<span>&#9889;</span> Next Office Drop: " + getUpcomingFridayFormatted() + " (Friday Delivery)";
  }
  
  const packSubtext = document.getElementById('packSubtext');
  if (packSubtext) packSubtext.textContent = isB2c ? 'Saturday Drop' : 'Friday Office Drop (Cutoff: Thu 6 PM)';
  
  const b2cPacks = document.getElementById('b2cPacks');
  if (b2cPacks) b2cPacks.style.display = isB2c ? 'grid' : 'none';
  
  const b2bPacks = document.getElementById('b2bPacks');
  if (b2bPacks) b2bPacks.style.display = isB2c ? 'none' : 'grid';
  
  const b2bFields = document.getElementById('b2bFields');
  if (b2bFields) b2bFields.style.display = isB2c ? 'none' : 'block';
  
  const b2cCityGroup = document.getElementById('b2cCityGroup');
  if (b2cCityGroup) b2cCityGroup.style.display = isB2c ? 'flex' : 'none';
  
  const b2bPaymentChoiceGroup = document.getElementById('b2bPaymentChoiceGroup');
  if (b2bPaymentChoiceGroup) b2bPaymentChoiceGroup.style.display = isB2c ? 'none' : 'block';
  
  const labelName = document.getElementById('labelName');
  if (labelName) labelName.textContent = isB2c ? 'Your Name *' : 'Contact Person Name & Role *';
  
  const labelEmail = document.getElementById('labelEmail');
  if (labelEmail) labelEmail.textContent = isB2c ? 'Email Address *' : 'Work Email *';
  
  const labelAddress = document.getElementById('labelAddress');
  if (labelAddress) labelAddress.textContent = isB2c ? 'Delivery Address (Building, Flat, Society) *' : 'Building / Tower / Floor Details *';

  if (isB2c) currentB2bPayOption = 'GATEWAY';
  updateTotal();
  rebalanceSplitter();
}

// Visual Lot Selection & Custom Splitter Toggle
function selectLot(lotName, element) {
  document.querySelectorAll('#lotGrid .lot-card').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');
  
  const customSplitter = document.getElementById('customSplitter');
  if (lotName.includes('Custom Ratio Split')) {
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
  return active.bottles * qty;
}

function rebalanceSplitter() {
  const total = getTotalBottles();
  const half = Math.floor(total / 2);
  customSplit.ratnagiri = half;
  customSplit.thogarihunkal = total - half;
  renderSplitterUI();
}

function adjustSplit(lot, delta) {
  const total = getTotalBottles();
  if (lot === 'ratnagiri') {
    let newRat = customSplit.ratnagiri + delta;
    if (newRat >= 0 && newRat <= total) {
      customSplit.ratnagiri = newRat;
      customSplit.thogarihunkal = total - newRat;
    }
  } else {
    let newThog = customSplit.thogarihunkal + delta;
    if (newThog >= 0 && newThog <= total) {
      customSplit.thogarihunkal = newThog;
      customSplit.ratnagiri = total - newThog;
    }
  }
  renderSplitterUI();
}

function renderSplitterUI() {
  const total = getTotalBottles();
  const alloc = customSplit.ratnagiri + customSplit.thogarihunkal;
  
  const allocEl = document.getElementById('allocCount');
  const targetEl = document.getElementById('targetCount');
  const ratEl = document.getElementById('splitRatnagiri');
  const thogEl = document.getElementById('splitThogarihunkal');
  const ratBar = document.getElementById('ratioBarRatnagiri');
  const thogBar = document.getElementById('ratioBarThogarihunkal');

  if (allocEl) allocEl.textContent = alloc;
  if (targetEl) targetEl.textContent = total;
  if (ratEl) ratEl.textContent = customSplit.ratnagiri;
  if (thogEl) thogEl.textContent = customSplit.thogarihunkal;

  const ratPercent = total > 0 ? (customSplit.ratnagiri / total) * 100 : 50;
  const thogPercent = total > 0 ? (customSplit.thogarihunkal / total) * 100 : 50;

  if (ratBar) ratBar.style.width = ratPercent + "%";
  if (thogBar) thogBar.style.width = thogPercent + "%";
}

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

function calculateBaseTotal() {
  const qtyInput = document.getElementById('packQty');
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  return active.unitPrice * qty;
}

function calculateFinalTotal() {
  const base = calculateBaseTotal();
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  return Math.max(0, base - discount);
}

function updateTotal() {
  const baseTotal = calculateBaseTotal();
  const finalTotal = calculateFinalTotal();
  
  const formatted = "₹" + finalTotal.toLocaleString('en-IN');
  const totalAmountDisplay = document.getElementById('totalAmountDisplay');
  const btnAmount = document.getElementById('btnAmount');
  if (totalAmountDisplay) totalAmountDisplay.textContent = formatted;
  if (btnAmount) btnAmount.textContent = formatted;

  const discountRow = document.getElementById('discountRow');
  const discountDisplay = document.getElementById('discountDisplay');
  if (appliedCoupon && appliedCoupon.discountAmount > 0) {
    if (discountRow) discountRow.style.display = 'flex';
    if (discountDisplay) discountDisplay.textContent = '- ₹' + appliedCoupon.discountAmount;
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  const btnText = document.getElementById('btnText');
  if (btnText) {
    if (currentMode === 'B2B' && currentB2bPayOption === 'INVOICE') {
      btnText.innerHTML = "<span>&#128196;</span> Request Corporate Invoice (<span id=\"btnAmount\">" + formatted + "</span>)";
    } else {
      btnText.innerHTML = "<span>&#128179;</span> Pay & Confirm Pre-Order (<span id=\"btnAmount\">" + formatted + "</span>)";
    }
  }

  if (isCustomSplit) rebalanceSplitter();
}

// Dynamic Coupon Validator
async function applyCoupon() {
  const input = document.getElementById('couponInput');
  const msgEl = document.getElementById('couponMsg');
  if (!input || !msgEl) return;
  const code = input.value.trim().toUpperCase();

  if (!code) {
    msgEl.textContent = 'Please enter a coupon code.';
    msgEl.className = 'coupon-msg coupon-error';
    return;
  }

  const baseTotal = calculateBaseTotal();

  if (!CONFIG.googleSheetEndpoint || CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    // Local Fallback Check
    if (code === 'FRESHDROP' && baseTotal >= 480) {
      appliedCoupon = { code: 'FRESHDROP', discountAmount: 100 };
      msgEl.textContent = 'Coupon FRESHDROP applied! Saved ₹100.';
      msgEl.className = 'coupon-msg coupon-success';
    } else if (code === 'NCRFIRST' && baseTotal >= 240) {
      const disc = Math.round(baseTotal * 0.10);
      appliedCoupon = { code: 'NCRFIRST', discountAmount: disc };
      msgEl.textContent = `Coupon NCRFIRST applied! Saved ₹${disc} (10%).`;
      msgEl.className = 'coupon-msg coupon-success';
    } else {
      appliedCoupon = null;
      msgEl.textContent = 'Invalid or expired coupon code.';
      msgEl.className = 'coupon-msg coupon-error';
    }
    updateTotal();
    return;
  }

  try {
    msgEl.textContent = 'Verifying coupon...';
    msgEl.className = 'coupon-msg';
    const res = await fetch(`${CONFIG.googleSheetEndpoint}?action=validateCoupon&code=${encodeURIComponent(code)}&total=${baseTotal}`);
    const json = await res.json();

    if (json.valid) {
      appliedCoupon = { code: json.code, discountAmount: json.discountAmount };
      msgEl.textContent = json.message;
      msgEl.className = 'coupon-msg coupon-success';
    } else {
      appliedCoupon = null;
      msgEl.textContent = json.message || 'Invalid coupon code.';
      msgEl.className = 'coupon-msg coupon-error';
    }
  } catch (e) {
    msgEl.textContent = 'Could not verify coupon. Please try again.';
    msgEl.className = 'coupon-msg coupon-error';
  }
  updateTotal();
}

function checkSavedProfile() {
  try {
    const raw = localStorage.getItem('tabc_customer_profile');
    if (raw) {
      const profile = JSON.parse(raw);
      if (profile && profile.name) {
        const bar = document.getElementById('savedProfileBar');
        const text = document.getElementById('savedProfileText');
        if (bar) bar.style.display = 'flex';
        if (text) text.textContent = "Welcome back, " + profile.name + "! Autofill your details?";
      }
    }
  } catch (e) {
    console.log("localStorage not available", e);
  }
}

function applySavedProfile() {
  try {
    const raw = localStorage.getItem('tabc_customer_profile');
    if (raw) {
      const p = JSON.parse(raw);
      if (p.name && document.getElementById('custName')) document.getElementById('custName').value = p.name;
      if (p.email && document.getElementById('custEmail')) document.getElementById('custEmail').value = p.email;
      if (p.phone && document.getElementById('custPhone')) document.getElementById('custPhone').value = p.phone;
      if (p.pin && document.getElementById('custPincode')) {
        document.getElementById('custPincode').value = p.pin;
        validatePincodeField();
      }
      if (p.address && document.getElementById('custAddress')) document.getElementById('custAddress').value = p.address;
      if (p.company && document.getElementById('custCompany')) document.getElementById('custCompany').value = p.company;
      if (p.gstin && document.getElementById('custGstin')) document.getElementById('custGstin').value = p.gstin;
      validateAllInputs();
    }
  } catch (e) {
    console.log("Error loading profile", e);
  }
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
    localStorage.setItem('tabc_customer_profile', JSON.stringify(profile));
  } catch (e) {
    console.log("Error saving profile", e);
  }
}

function toggleGuide() {
  const body = document.getElementById('guideBody');
  const arrow = document.getElementById('guideArrow');
  if (!body) return;
  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

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
  if (!el) return true;
  const errEl = document.getElementById('errEmail');
  const val = el.value.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-\]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return setFieldState(el, errEl, emailRegex.test(val));
}

function validatePhoneField() {
  const el = document.getElementById('custPhone');
  if (!el) return true;
  const errEl = document.getElementById('errPhone');
  let val = el.value.replace(/[^0-9]/g, '');
  el.value = val;
  const phoneRegex = /^[6-9]\d{9}$/;
  return setFieldState(el, errEl, phoneRegex.test(val));
}

function validatePincodeField() {
  const el = document.getElementById('custPincode');
  if (!el) return true;
  const errEl = document.getElementById('errPincode');
  const statusEl = document.getElementById('pinStatus');
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
  if (!el) return true;
  const errEl = document.getElementById('errGstin');
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

function handlePayClick() {
  if (!validateAllInputs()) {
    alert('Please correct the highlighted fields before placing your order.');
    return;
  }

  if (currentMode === 'B2B' && currentB2bPayOption === 'INVOICE') {
    const invId = "INV-REQ-" + Math.floor(100000 + Math.random() * 900000);
    handleOrderSuccess(invId, 'Corporate Invoice Requested (Net Terms)');
    return;
  }

  const total = calculateFinalTotal();
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;

  if (CONFIG.razorpayKeyId && !CONFIG.razorpayKeyId.includes("YOUR_RAZORPAY")) {
    const options = {
      key: CONFIG.razorpayKeyId,
      amount: total * 100,
      currency: "INR",
      name: "The Apartment Brew Co.",
      description: (currentMode === 'B2B' ? 'Office Drop' : 'Pre-Order') + ': ' + activePack.name,
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
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const pin = document.getElementById('custPincode').value.trim();
  const qty = parseInt(document.getElementById('packQty').value, 10) || 1;
  const total = calculateFinalTotal();
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  const dropInstructions = document.getElementById('dropInstructions') ? document.getElementById('dropInstructions').value : 'Deliver directly to door / desk';

  const isB2c = currentMode === 'B2C';
  const orderId = isB2c ? "TABC-" + Math.floor(100000 + Math.random() * 900000) : "TABC-B2B-" + Math.floor(100000 + Math.random() * 900000);
  const dropDate = isB2c ? getUpcomingSaturdayFormatted() : getUpcomingFridayFormatted();
  const location = isB2c ? document.getElementById('custCity').value : document.getElementById('b2bTechPark').value;
  const deliveryWindow = isB2c ? "Saturday Morning (8:00 AM – 11:00 AM)" : document.getElementById('b2bDeliveryWindow').value;
  const company = isB2c ? "N/A" : document.getElementById('custCompany').value.trim();
  const gstin = isB2c ? "N/A" : (document.getElementById('custGstin').value.trim() || "N/A");
  const buildingFloor = document.getElementById('custAddress').value.trim();
  const paymentMode = isB2c ? "Razorpay Gateway" : (currentB2bPayOption === 'INVOICE' ? "Corporate Invoice (Net Terms)" : "Razorpay Gateway");

  const coffeeLotDisplay = isCustomSplit 
    ? "Custom Split (" + customSplit.ratnagiri + "x Ratnagiri Estate + " + customSplit.thogarihunkal + "x Thogarihunkal Estate)"
    : selectedBean;

  const couponNote = appliedCoupon ? ` | Coupon: ${appliedCoupon.code} (-₹${appliedCoupon.discountAmount})` : '';

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
    paymentStatus: statusText + " (" + paymentId + ")",
    deliveryStatus: 'Pre-Ordered',
    notes: "Payment ID: " + paymentId + " | Mode: " + currentMode + " | Instruction: " + dropInstructions + couponNote
  };

  currentOrderDetails = orderPayload;
  saveCustomerProfile(orderPayload);

  if (CONFIG.googleSheetEndpoint && !CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    fetch(CONFIG.googleSheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(orderPayload)
    }).catch(console.error);
  }

  document.getElementById('rOrderId').textContent = orderId;
  document.getElementById('rOrderType').textContent = isB2c ? 'Individual Pre-Order (Sat Drop)' : 'Corporate Office Drop (Fri Drop)';
  document.getElementById('rCompanyRow').style.display = isB2c ? 'none' : 'flex';
  if (!isB2c) document.getElementById('rCompany').textContent = company;
  document.getElementById('rWindowRow').style.display = 'flex';
  document.getElementById('rWindow').textContent = deliveryWindow;

  document.getElementById('rPayId').textContent = paymentId;
  document.getElementById('rDropDate').textContent = dropDate;
  document.getElementById('rName').textContent = name;
  document.getElementById('rEmail').textContent = email;
  document.getElementById('rBean').textContent = coffeeLotDisplay;
  document.getElementById('rPack').textContent = activePack.name + " x " + qty + " (" + (activePack.bottles * qty) + " bottles)";
  document.getElementById('rTotal').textContent = "₹" + total.toLocaleString('en-IN');

  document.getElementById('orderFormView').style.display = 'none';
  document.getElementById('confirmationView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addToGoogleCalendar() {
  if (!currentOrderDetails) return;
  const d = currentOrderDetails;
  const title = encodeURIComponent("The Apartment Brew Co. Drop: " + d.orderId);
  const details = encodeURIComponent("Fresh Flash-Brew Specialty Coffee Drop\nOrder ID: " + d.orderId + "\nLot: " + d.bean + "\nSelection: " + d.pack + "\nInstruction: " + d.dropInstructions + "\nTotal: ₹" + d.totalAmount + "\n\nNote: Please refrigerate upon delivery and enjoy within 48 hours for peak flavor!");
  const location = encodeURIComponent(d.buildingFloor + ", " + d.techPark + " (PIN: " + d.pinCode + ")");
  const gcalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title + "&details=" + details + "&location=" + location;
  window.open(gcalUrl, '_blank');
}

function sendWhatsAppReceipt() {
  if (!currentOrderDetails) return;
  const d = currentOrderDetails;

  const message = "*ORDER & DELIVERY CONFIRMATION — THE APARTMENT BREW CO.*\n" +
                  "------------------------------------\n" +
                  "*Order ID:* " + d.orderId + "\n" +
                  "*Delivery Date:* " + d.dropDate + " (" + d.deliveryWindow + ")\n" +
                  "*Customer:* " + d.name + " (" + d.phone + ")\n" +
                  "*Delivery Address:* " + d.buildingFloor + ", " + d.techPark + "\n" +
                  "*Drop Note:* " + d.dropInstructions + "\n" +
                  "------------------------------------\n" +
                  "*Coffee Lot:* " + d.bean + "\n" +
                  "*Selection:* " + d.pack + "\n" +
                  "*Total Bottles:* " + d.bottles + "x 250ml\n" +
                  "*Total Paid:* ₹" + d.totalAmount + " (" + d.paymentStatus + ")\n" +
                  "------------------------------------\n" +
                  "_Freshness Reminder: Extracted hot and flash-chilled with zero preservatives. Please refrigerate and consume within 48 hours!_";

  let cleanPhone = d.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
  const whatsappUrl = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(message);
  window.open(whatsappUrl, '_blank');
}

function resetForm() {
  document.getElementById('orderFormView').style.display = 'block';
  document.getElementById('confirmationView').style.display = 'none';
  document.getElementById('custName').value = '';
  document.getElementById('custEmail').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custAddress').value = '';
  document.getElementById('custPincode').value = '';
  document.getElementById('custCompany').value = '';
  document.getElementById('custGstin').value = '';
  document.getElementById('pinStatus').textContent = '';
  if (document.getElementById('couponInput')) document.getElementById('couponInput').value = '';
  if (document.getElementById('couponMsg')) document.getElementById('couponMsg').textContent = '';
  appliedCoupon = null;
  document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('input-valid', 'input-invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
  checkSavedProfile();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  switchMode('B2C');
  startCutoffCountdown();
  checkSavedProfile();
  fetchLiveConfig();
});
