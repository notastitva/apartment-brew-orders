// ====================================================================
// THE APARTMENT BREW CO. — FRONTEND LOGIC (app.js)
// ====================================================================

const CONFIG = {
  razorpayKeyId: "rzp_test_TRVab1bUUwOVN5", // Replace with your active Live Key ID (rzp_live_...)
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbx7nE2uQV08Ev4UYt8FFkmVZMGMpksvhIjljALGSbXYmc1FEv_1nh34BoR99mdTHic/exec", // Replace with your Apps Script Web App URL ending in /exec
  authToken: "TABC_SECURE_TOKEN_2026" // Shared auth token matching Code.gs
};

let currentMode = "B2C";
let currentB2bPayOption = "GATEWAY";

let selectedB2cPack = { name: "Weekend Pack (4x 250ml)", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack (10x 250ml)", bottles: 10, unitPrice: 1800 };

// Dynamic Friday calculation for B2B
function getUpcomingFridayFormatted() {
  const d = new Date();
  let days = (5 - d.getDay() + 7) % 7;
  if (days === 0 && d.getHours() >= 12) days = 7;
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Dynamic Saturday calculation for B2C
function getUpcomingSaturdayFormatted() {
  const d = new Date();
  let days = (6 - d.getDay() + 7) % 7;
  if (days === 0 && d.getHours() >= 10) days = 7;
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('tabB2c').classList.toggle('active', mode === 'B2C');
  document.getElementById('tabB2b').classList.toggle('active', mode === 'B2B');

  const isB2c = mode === 'B2C';
  document.getElementById('dropBanner').textContent = isB2c ? `Next Fresh Drop: ${getUpcomingSaturdayFormatted()} (Morning)` : `Next Office Drop: ${getUpcomingFridayFormatted()} (Friday Delivery)`;
  document.getElementById('packSubtext').textContent = isB2c ? 'Saturday Drop' : 'Friday Office Drop (Cutoff: Thu 6 PM)';
  document.getElementById('b2cPacks').style.display = isB2c ? 'grid' : 'none';
  document.getElementById('b2bPacks').style.display = isB2c ? 'none' : 'grid';
  document.getElementById('b2bFields').style.display = isB2c ? 'none' : 'block';
  document.getElementById('b2cCityGroup').style.display = isB2c ? 'flex' : 'none';
  document.getElementById('b2bPaymentChoiceGroup').style.display = isB2c ? 'none' : 'block';
  document.getElementById('labelName').textContent = isB2c ? 'Your Name *' : 'Contact Person Name & Role *';
  document.getElementById('labelEmail').textContent = isB2c ? 'Email Address *' : 'Work Email *';
  document.getElementById('labelAddress').textContent = isB2c ? 'Delivery Address (Building, Flat, Society) *' : 'Building / Tower / Floor Details *';
  
  if (isB2c) currentB2bPayOption = 'GATEWAY';
  updateTotal();
}

function selectB2cPack(name, bottles, price, el) {
  document.querySelectorAll('#b2cPacks .pack-option').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  selectedB2cPack = { name, bottles, unitPrice: price };
  updateTotal();
}

function selectB2bPack(name, bottles, price, el) {
  document.querySelectorAll('#b2bPacks .pack-option').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  selectedB2bPack = { name, bottles, unitPrice: price };
  updateTotal();
}

function setB2bPayOption(option) {
  currentB2bPayOption = option;
  updateTotal();
}

function calculateTotal() {
  const qtyInput = document.getElementById('packQty');
  let qty = parseInt(qtyInput.value, 10);
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  return active.unitPrice * qty;
}

function updateTotal() {
  const total = calculateTotal();
  const formatted = `₹${total.toLocaleString('en-IN')}`;
  document.getElementById('totalAmountDisplay').textContent = formatted;
  document.getElementById('btnAmount').textContent = formatted;

  const btnText = document.getElementById('btnText');
  if (currentMode === 'B2B' && currentB2bPayOption === 'INVOICE') {
    btnText.innerHTML = `📄 Request Corporate Invoice (<span id="btnAmount">${formatted}</span>)`;
  } else {
    btnText.innerHTML = `💳 Pay & Confirm Pre-Order (<span id="btnAmount">${formatted}</span>)`;
  }
}

// ==========================================
// Real-Time Form Validation Checks
// ==========================================
function setFieldState(inputEl, errorEl, isValid) {
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
  const val = el.value.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return setFieldState(el, errEl, emailRegex.test(val));
}

function validatePhoneField() {
  const el = document.getElementById('custPhone');
  const errEl = document.getElementById('errPhone');
  let val = el.value.replace(/[^0-9]/g, '');
  el.value = val;
  const phoneRegex = /^[6-9]\d{9}$/;
  return setFieldState(el, errEl, phoneRegex.test(val));
}

function validatePincodeField() {
  const el = document.getElementById('custPincode');
  const errEl = document.getElementById('errPincode');
  const statusEl = document.getElementById('pinStatus');
  let val = el.value.replace(/[^0-9]/g, '');
  el.value = val;

  if (val.length < 6) {
    statusEl.textContent = '';
    return setFieldState(el, errEl, false);
  }

  const isNcr = /^(11[0-9]{4}|122[0-9]{3}|121[0-9]{3}|201[0-9]{3})$/.test(val);
  if (isNcr) {
    statusEl.textContent = '✓ Serviceable across Delhi NCR';
    statusEl.className = 'pin-status pin-valid';
    return setFieldState(el, errEl, true);
  } else {
    statusEl.textContent = '✕ Serviceable only in Delhi NCR (11xxxx, 122xxx, 121xxx, 201xxx)';
    statusEl.className = 'pin-status pin-invalid';
    return setFieldState(el, errEl, false);
  }
}

function validateGstinField() {
  const el = document.getElementById('custGstin');
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
  const qty = parseInt(qtyInput.value, 10);
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

  // Razorpay Gateway Flow
  const total = calculateTotal();
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;

  const options = {
    key: CONFIG.razorpayKeyId,
    amount: total * 100,
    currency: "INR",
    name: "The Apartment Brew Co.",
    description: `${currentMode === 'B2B' ? 'Office Drop' : 'Pre-Order'}: ${activePack.name}`,
    prefill: {
      name: name,
      email: email,
      contact: phone
    },
    theme: {
      color: "#d4a373"
    },
    handler: function (response) {
      handleOrderSuccess(response.razorpay_payment_id, "Paid via Gateway");
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function (response) {
    alert('Payment was not completed: ' + (response.error.description || 'Please try again.'));
  });
  rzp.open();
}

async function handleOrderSuccess(paymentId, statusText) {
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const pin = document.getElementById('custPincode').value.trim();
  const bean = document.getElementById('coffeeOrigin').value;
  const qty = parseInt(document.getElementById('packQty').value, 10) || 1;
  const total = calculateTotal();
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;

  const isB2c = currentMode === 'B2C';
  const orderId = isB2c ? "TABC-" + Math.floor(100000 + Math.random() * 900000) : "TABC-B2B-" + Math.floor(100000 + Math.random() * 900000);
  const dropDate = isB2c ? getUpcomingSaturdayFormatted() : getUpcomingFridayFormatted();
  const location = isB2c ? document.getElementById('custCity').value : document.getElementById('b2bTechPark').value;
  const deliveryWindow = isB2c ? "Saturday Morning (8:00 AM – 11:00 AM)" : document.getElementById('b2bDeliveryWindow').value;
  const company = isB2c ? "N/A" : document.getElementById('custCompany').value.trim();
  const gstin = isB2c ? "N/A" : (document.getElementById('custGstin').value.trim() || "N/A");
  const buildingFloor = document.getElementById('custAddress').value.trim();
  const paymentMode = isB2c ? "Razorpay Gateway" : (currentB2bPayOption === 'INVOICE' ? "Corporate Invoice (Net Terms)" : "Razorpay Gateway");

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
    pinCode: pin,
    deliveryWindow: deliveryWindow,
    dropDate: dropDate,
    bean: bean,
    pack: activePack.name,
    quantity: qty,
    bottles: activePack.bottles * qty,
    totalAmount: total,
    paymentMode: paymentMode,
    paymentStatus: `${statusText} (${paymentId})`,
    deliveryStatus: 'Pre-Ordered',
    notes: `Payment ID: ${paymentId} | Mode: ${currentMode}`
  };

  if (CONFIG.googleSheetEndpoint && !CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    fetch(CONFIG.googleSheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(orderPayload)
    }).catch(console.error);
  }

  // Display Confirmation Screen
  document.getElementById('rOrderId').textContent = orderId;
  document.getElementById('rOrderType').textContent = isB2c ? 'Individual Pre-Order' : 'Corporate Office Drop';
  document.getElementById('rCompanyRow').style.display = isB2c ? 'none' : 'flex';
  if (!isB2c) document.getElementById('rCompany').textContent = company;
  document.getElementById('rWindowRow').style.display = isB2c ? 'none' : 'flex';
  if (!isB2c) document.getElementById('rWindow').textContent = deliveryWindow;

  document.getElementById('rPayId').textContent = paymentId;
  document.getElementById('rDropDate').textContent = dropDate;
  document.getElementById('rName').textContent = name;
  document.getElementById('rEmail').textContent = email;
  document.getElementById('rPack').textContent = `${activePack.name} x ${qty} (${activePack.bottles * qty} bottles)`;
  document.getElementById('rTotal').textContent = `₹${total.toLocaleString('en-IN')}`;

  document.getElementById('orderFormView').style.display = 'none';
  document.getElementById('confirmationView').style.display = 'block';
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
  document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('input-valid', 'input-invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
}

switchMode('B2C');
