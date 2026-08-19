const CONFIG = {
  razorpayKeyId: "rzp_test_TRVab1bUUwOVN5", // Replace with your active Key ID
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbx7nE2uQV08Ev4UYt8FFkmVZMGMpksvhIjljALGSbXYmc1FEv_1nh34BoR99mdTHic/exec" // Replace with your Web App URL
};

let currentMode = "B2C";
let currentB2bPayOption = "GATEWAY";

let selectedB2cPack = { name: "Weekend Pack", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack", bottles: 10, unitPrice: 1800 };
let isPincodeServiceable = true;

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

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('tabB2c').classList.toggle('active', mode === 'B2C');
  document.getElementById('tabB2b').classList.toggle('active', mode === 'B2B');

  const isB2c = mode === 'B2C';
  document.getElementById('dropBanner').textContent = isB2c ? `Next Fresh Drop: ${getUpcomingSaturdayFormatted()} (Morning)` : `Next Office Drop: ${getUpcomingFridayFormatted()} (Friday Drop)`;
  document.getElementById('packSubtext').textContent = isB2c ? 'Saturday Drop' : 'Friday Office Drop (Cutoff: Thu 6 PM)';
  document.getElementById('b2cPacks').style.display = isB2c ? 'grid' : 'none';
  document.getElementById('b2bPacks').style.display = isB2c ? 'none' : 'grid';
  document.getElementById('b2bFields').style.display = isB2c ? 'none' : 'block';
  document.getElementById('b2cCityGroup').style.display = isB2c ? 'flex' : 'none';
  document.getElementById('b2bPaymentChoiceGroup').style.display = isB2c ? 'none' : 'block';
  document.getElementById('labelName').textContent = isB2c ? 'Your Name *' : 'Contact Person Name & Role *';
  document.getElementById('labelEmail').textContent = isB2c ? 'Email Address *' : 'Official Work Email *';
  document.getElementById('labelAddress').textContent = isB2c ? 'Full Address (Flat/Society) *' : 'Tower, Floor & Pantry Details *';
  
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
  const qty = parseInt(document.getElementById('packQty').value, 10) || 1;
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

function validatePincode() {
  const pin = document.getElementById('custPincode').value.trim();
  const statusEl = document.getElementById('pinStatus');
  if (pin.length < 6) { statusEl.textContent = ''; return; }
  const isNcr = /^(11[0-9]{4}|122[0-9]{3}|121[0-9]{3}|201[0-9]{3})$/.test(pin);
  statusEl.textContent = isNcr ? '✓ Serviceable in Delhi NCR' : '✕ Outside Primary NCR Hubs';
  statusEl.className = isNcr ? 'pin-status pin-valid' : 'pin-status pin-invalid';
}

function handlePayClick() {
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const pin = document.getElementById('custPincode').value.trim();

  if (!name || !email || !phone || !address || !pin) {
    alert('Please fill in all required fields.');
    return;
  }
  if (currentMode === 'B2B' && !document.getElementById('custCompany').value.trim()) {
    alert('Please enter your Company Name.');
    return;
  }

  if (currentMode === 'B2B' && currentB2bPayOption === 'INVOICE') {
    const invId = "INV-REQ-" + Math.floor(100000 + Math.random() * 900000);
    handleOrderSuccess(invId, 'Corporate Invoice Requested (Net Terms)');
    return;
  }

  const total = calculateTotal();
  const active = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;

  const options = {
    key: CONFIG.razorpayKeyId,
    amount: total * 100,
    currency: "INR",
    name: "The Apartment Brew Co.",
    description: `${currentMode === 'B2B' ? 'Office Drop' : 'Pre-Order'}: ${active.name}`,
    prefill: { name: name, email: email, contact: phone },
    theme: { color: "#d4a373" },
    handler: function (res) { handleOrderSuccess(res.razorpay_payment_id, "Paid via Gateway"); }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function (res) {
    alert('Payment was not completed: ' + (res.error.description || 'Please try again.'));
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
  const active = currentMode === 'B2C' ? selectedB2cPack : selectedB2bPack;

  const isB2c = currentMode === 'B2C';
  const orderId = isB2c ? "TABC-" + Math.floor(100000 + Math.random() * 900000) : "TABC-B2B-" + Math.floor(100000 + Math.random() * 900000);
  const dropDate = isB2c ? getUpcomingSaturdayFormatted() : getUpcomingFridayFormatted();
  const location = isB2c ? document.getElementById('custCity').value : document.getElementById('b2bTechPark').value;
  const deliveryWindow = isB2c ? "Saturday Morning (8:00 AM – 11:00 AM)" : document.getElementById('b2bDeliveryWindow').value;
  const company = isB2c ? "N/A" : document.getElementById('custCompany').value.trim();
  const gstin = isB2c ? "N/A" : (document.getElementById('custGstin').value.trim() || "N/A");

  const orderPayload = {
    orderType: currentMode,
    targetSheet: isB2c ? 'Sheet1' : 'B2B Orders',
    orderId: orderId,
    dropDate: dropDate,
    deliveryWindow: deliveryWindow,
    company: company,
    gstin: gstin,
    name: name,
    email: email,
    phone: phone,
    techPark: location,
    address: `${document.getElementById('custAddress').value.trim()}, ${location} (PIN: ${pin})`,
    bean: bean,
    pack: `${active.name} (${active.bottles}x 250ml)`,
    quantity: qty,
    bottles: active.bottles * qty,
    totalAmount: total,
    paymentMode: "Razorpay Gateway",
    paymentStatus: `${statusText} (${paymentId})`,
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

  // Display receipt
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
  document.getElementById('rPack').textContent = `${active.name} x ${qty} (${active.bottles * qty} bottles)`;
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
}

switchMode('B2C');
