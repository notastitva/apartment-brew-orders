// ====================================================================
// THE APARTMENT BREW CO. — FRONTEND CONTROLLER (app.js)
// ====================================================================

const CONFIG = {
  razorpayKeyId: "rzp_test_TRVab1bUUwOVN5", // Replace with your active Key ID (rzp_live_...)
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbx7nE2uQV08Ev4UYt8FFkmVZMGMpksvhIjljALGSbXYmc1FEv_1nh34BoR99mdTHic/exec", // Replace with Apps Script Web App URL ending in /exec
  authToken: "TABC_SECURE_TOKEN_2026" // Shared auth token matching Code.gs
};

let currentMode = "B2C";
let currentB2bPayOption = "GATEWAY";
let selectedBean = "Ratnagiri Estate (Anaerobic Naturals)";
let selectedB2cPack = { name: "Weekend Pack", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack (10x 250ml)", bottles: 10, unitPrice: 1800 };
let currentOrderDetails = null;

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
    if (diff <= 0) {
      document.getElementById('countdownTimer').textContent = "⚡ Cutoff reached for next batch. Orders queue for following drop.";
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const cutoffLabel = isB2c ? "Saturday Drop Cutoff" : "Friday Drop Cutoff";
    document.getElementById('countdownTimer').textContent = `⏱️ ${cutoffLabel} closes in ${hours}h ${mins}m ${secs}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('tabB2c').classList.toggle('active', mode === 'B2C');
  document.getElementById('tabB2b').classList.toggle('active', mode === 'B2B');

  const isB2c = mode === 'B2C';
  document.getElementById('dropBanner').innerHTML = isB2c 
    ? `<span>⚡</span> Next Fresh Drop: ${getUpcomingSaturdayFormatted()} (Morning)` 
    : `<span>⚡</span> Next Office Drop: ${getUpcomingFridayFormatted()} (Friday Delivery)`;
  
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

function selectLot(lotName, element) {
  document.querySelectorAll('#lotGrid .lot-card').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  selectedBean = lotName;
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
  document.getElementById('payOptionGateway').classList.toggle('active', option === 'GATEWAY');
  document.getElementById('payOptionInvoice').classList.toggle('active', option === 'INVOICE');
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

function checkSavedProfile() {
  try {
    const raw = localStorage.getItem('tabc_customer_profile');
    if (raw) {
      const profile = JSON.parse(raw);
      if (profile && profile.name) {
        document.getElementById('savedProfileBar').style.display = 'flex';
        document.getElementById('savedProfileText').textContent = `👋 Welcome back, ${profile.name}! Autofill your details?`;
      }
    }
  } catch (e) {}
}

function applySavedProfile() {
  try {
    const raw = localStorage.getItem('tabc_customer_profile');
    if (raw) {
      const p = JSON.parse(raw);
      if (p.name) document.getElementById('custName').value = p.name;
      if (p.email) document.getElementById('custEmail').value = p.email;
      if (p.phone) document.getElementById('custPhone').value = p.phone;
      if (p.pin) {
        document.getElementById('custPincode').value = p.pin;
        validatePincodeField();
      }
      if (p.address) document.getElementById('custAddress').value = p.address;
      if (p.company && document.getElementById('custCompany')) document.getElementById('custCompany').value = p.company;
      if (p.gstin && document.getElementById('custGstin')) document.getElementById('custGstin').value = p.gstin;
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
    localStorage.setItem('tabc_customer_profile', JSON.stringify(profile));
  } catch (e) {}
}

function toggleGuide() {
  const body = document.getElementById('guideBody');
  const arrow = document.getElementById('guideArrow');
  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.textContent = isOpen ? '▼' : '▲';
}

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
  const emailRegex = /^[a-zA-Z0-9._%+-\]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

  const total = calculateTotal();
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
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const pin = document.getElementById('custPincode').value.trim();
  const qty = parseInt(document.getElementById('packQty').value, 10) || 1;
  const total = calculateTotal();
  const activePack = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;
  const dropInstructions = document.getElementById('dropInstructions').value;

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
    dropInstructions: dropInstructions,
    pinCode: pin,
    deliveryWindow: deliveryWindow,
    dropDate: dropDate,
    bean: selectedBean,
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
  document.getElementById('rBean').textContent = selectedBean;
  document.getElementById('rPack').textContent = `${activePack.name} x ${qty} (${activePack.bottles * qty} bottles)`;
  document.getElementById('rTotal').textContent = `₹${total.toLocaleString('en-IN')}`;

  document.getElementById('orderFormView').style.display = 'none';
  document.getElementById('confirmationView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
  checkSavedProfile();
}

document.addEventListener('DOMContentLoaded', () => {
  switchMode('B2C');
  startCutoffCountdown();
  checkSavedProfile();
});
