// ====================================================================
// THE APARTMENT BREW CO. — FRONTEND CONTROLLER (app.js)
// ====================================================================

const CONFIG = {
  razorpayKeyId: "rzp_test_TRVab1bUUwOVN5", // Replace with your active Key ID (rzp_live_...)
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbx7nE2uQV08Ev4UYt8FFkmVZMGMpksvhIjljALGSbXYmc1FEv_1nh34BoR99mdTHic/exec", // Replace with Apps Script Web App URL ending in /exec
  authToken: "TABC_SECURE_TOKEN_2026" // Shared auth token matching Code.gs
};

let cachedProfile = null;

let currentMode = "B2C";
let currentB2bPayOption = "GATEWAY";
let selectedBean = "Ratnagiri Estate (Anaerobic Naturals)";
let isCustomSplit = false;
let customSplit = { ratnagiri: 2, thogarihunkal: 2 };
let selectedB2cPack = { name: "Weekend Pack", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack (10x 250ml)", bottles: 10, unitPrice: 1800 };
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

// Live Config & Scarcity Capacity Fetcher from Google Sheets (Menu & Config)
function fetchLiveConfig() {
  if (!CONFIG.googleSheetEndpoint || CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) return;

  fetch(CONFIG.googleSheetEndpoint)
    .then(res => res.json())
    .then(data => {
      if (data && data.status === 'success') {
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
      // B2C Saturday Drop: Cutoff is Friday 10:00 PM
      let daysUntilFri = (5 - now.getDay() + 7) % 7;
      if (daysUntilFri === 0 && now.getHours() >= 22) daysUntilFri = 7;
      target.setDate(now.getDate() + daysUntilFri);
      target.setHours(22, 0, 0, 0);
    } else {
      // B2B Friday Drop: Cutoff is Thursday 6:00 PM
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
}

// Visual Lot Selection & Custom Splitter Toggle
function selectLot(lotName, element) {
  document.querySelectorAll('#lotGrid .lot-card').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');

  const customSplitter = document.getElementById('customSplitter');

  if (lotName && lotName.includes('Custom Ratio Split')) {
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

  if (ratBar) ratBar.style.width = `${ratPercent}%`;
  if (thogBar) thogBar.style.width = `${thogPercent}%`;
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

function calculateTotal() {
  const qtyInput = document.getElementById('packQty');
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  return (active && active.unitPrice ? active.unitPrice : 0) * qty;
}

function updateTotal() {
  const total = calculateTotal();
  const formatted = `₹${total.toLocaleString('en-IN')}`;

  const totalDisplay = document.getElementById('totalAmountDisplay');
  const btnAmount = document.getElementById('btnAmount');
  const btnText = document.getElementById('btnText');

  if (totalDisplay) totalDisplay.textContent = formatted;
  if (btnAmount) btnAmount.textContent = formatted;

  if (btnText) {
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

  const coffeeLotDisplay = isCustomSplit 
    ? `Custom Split (${customSplit.ratnagiri}x Ratnagiri Estate + ${customSplit.thogarihunkal}x Thogarihunkal Estate)`
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
    notes: `Payment ID: ${paymentId} | Mode: ${currentMode} | Instruction: ${dropInstructions}`
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
}

document.addEventListener('DOMContentLoaded', () => {
  switchMode('B2C');
  startCutoffCountdown();
  checkSavedProfile();
  fetchLiveConfig();
});
