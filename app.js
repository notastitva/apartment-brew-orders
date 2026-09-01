// ====================================================================
// THE APARTMENT BREW CO. — FRONTEND CONTROLLER (app.js)
// ====================================================================

// Sticky Top Header & Hamburger Navigation Controller
function toggleNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  const isOpen = drawer ? drawer.classList.contains('open') : false;
  if (isOpen) {
    closeNavDrawer();
  } else {
    openNavDrawer();
  }
}

function openNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  const backdrop = document.getElementById('navBackdrop');
  const btn = document.getElementById('navHamburgerBtn');
  if (drawer) drawer.classList.add('open');
  if (backdrop) backdrop.classList.add('open');
  if (btn) btn.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  const backdrop = document.getElementById('navBackdrop');
  const btn = document.getElementById('navHamburgerBtn');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  if (btn) btn.classList.remove('is-open');
  document.body.style.overflow = '';
}

function highlightActiveDrawerLink() {
  document.querySelectorAll('.drawer-link').forEach(link => {
    const targetPage = link.dataset.pageLink;
    const isMatch = (targetPage === PAGE) ||
      ((PAGE === 'INDEX' || PAGE === 'HOME') && (targetPage === 'INDEX' || targetPage === 'HOME')) ||
      ((PAGE === 'PERSONAL' || PAGE === 'ORDER') && (targetPage === 'PERSONAL' || targetPage === 'ORDER')) ||
      ((PAGE === 'CORPORATE' || PAGE === 'OFFICE') && (targetPage === 'CORPORATE' || targetPage === 'OFFICE')) ||
      ((PAGE === 'FLAVOR' || PAGE === 'MENU') && (targetPage === 'FLAVOR' || targetPage === 'MENU'));
    if (isMatch) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Global listener for closing drawer with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeNavDrawer();
  }
});

const CONFIG = {
  razorpayKeyId: "rzp_test_TRVab1bUUwOVN5", // Replace with your active Key ID (rzp_live_...)
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbz9kw-PDrwGXaNeHzvgfuOZsQ5A52tKXk-WN2np30ohE12xekUSK7x-bAp_kN_epmig/exec", // Replace with Apps Script Web App URL ending in /exec
  authToken: "TABC_SECURE_TOKEN_2026" // Shared auth token matching Code.gs
};

let cachedProfile = null;

// Determine current page from body dataset or pathname
const PAGE = document.body.dataset.page || (
  window.location.pathname.includes('orders') ? 'ORDERS' :
  (window.location.pathname.includes('personal') || window.location.pathname.includes('order')) ? 'PERSONAL' :
  (window.location.pathname.includes('corporate') || window.location.pathname.includes('office')) ? 'CORPORATE' :
  window.location.pathname.includes('events') ? 'EVENTS' :
  window.location.pathname.includes('track') ? 'TRACK' :
  window.location.pathname.includes('about') ? 'ABOUT' :
  window.location.pathname.includes('guide') ? 'GUIDE' :
  (window.location.pathname.includes('flavor') || window.location.pathname.includes('menu')) ? 'FLAVOR' : 'INDEX'
);

let currentMode = (PAGE === 'CORPORATE' || PAGE === 'OFFICE') ? "B2B" : "B2C";
let currentWizardStep = 1;
let currentB2bPayOption = "GATEWAY";
let currentStoreStatus = "OPEN";
let liveRemainingBatchBottles = 150;

// Default Dynamic State (Overridden by live Google Sheets Menu & Config)
let availableLots = [
  { id: "LOT-01", name: "Ratnagiri Estate", region: "Chikmagalur, Karnataka • 1,350m MASL", process: "72h Anaerobic Natural", notes: "Wild Raspberry, Ripe Stone Fruit & Dark Cacao Finish", emojis: ["🍇", "🍑", "🍫"], pills: ["Fruity", "High Acidity", "Winey Body", "Morning Focus"], roast: 45, fermentation: 80, acidity: 85, body: 70, sweetness: 80, aromatics: 75, clarity: 65, story: "Whole ripe cherries are sealed inside airtight stainless steel tanks for 72 hours under anaerobic pressure. This oxygen-deprived fermentation forces the coffee seed to absorb dense fruit sugars from the cherry mucilage, creating intense wild raspberry notes and a rich, winey finish.", rituals: "Best Time: 8:00 AM – 11:00 AM (Morning Focus) • Pairings: Sourdough toast, almond croissants, dark chocolate brownies, mature cheeses", maxBottles: 120, remainingBottles: 120, isActive: true, color: "#e76f51" },
  { id: "LOT-02", name: "Banana Banger", region: "Shevaroys Hills, Tamil Nadu • 1,450m MASL", process: "Special Yeast Fermentation", notes: "Orange Blossom, Jasmine & Crisp Green Apple", emojis: ["🌸", "🍏", "✨"], pills: ["Floral", "Crisp Acidity", "Tea-Like Body", "Afternoon Refresh"], roast: 40, fermentation: 85, acidity: 75, body: 45, sweetness: 70, aromatics: 95, clarity: 90, story: "Inoculated with isolated wine-yeast cultures during fermentation. The specific yeast strain metabolizes organic acids into bright malic esters and floral terpenes, stripping away heavy astringency to yield sparkling green apple acidity and crystalline jasmine clarity.", rituals: "Best Time: 1:00 PM – 4:00 PM (Afternoon Refresh) • Pairings: Lemon tea cakes, fruit tarts, light salads, shortbread biscuits", maxBottles: 80, remainingBottles: 80, isActive: true, color: "#2a9d8f" },
  { id: "LOT-03", name: "Riverdale Estate", region: "Yercaud, Eastern Ghats • 1,500m MASL", process: "Washed Carbonic Maceration", notes: "Blackcurrant, Bergamot & Raw Honeyed Peach", emojis: ["🫐", "🍊", "🍯"], pills: ["Complex", "Silky Texture", "Clean Finish", "All-Day Brew"], roast: 38, fermentation: 70, acidity: 80, body: 55, sweetness: 88, aromatics: 88, clarity: 85, story: "Pulped and fermented in a carbon dioxide rich pressurized environment for 48 hours before clean spring water washing. Elevates delicate bergamot and stone fruit notes with crystalline cup sweetness.", rituals: "Best Time: All-Day Focus • Pairings: Fresh berry scones, citrus Madeleine, poached pears", maxBottles: 100, remainingBottles: 100, isActive: true, color: "#d4a373" }
];

let availableB2cPacks = [
  { id: "B2C-01", name: "Single Bottle", bottles: 1, price: 240, badge: "" },
  { id: "B2C-02", name: "Duo Pack / Discovery Sampler", bottles: 2, price: 480, badge: "Discovery Flight" },
  { id: "B2C-03", name: "Weekend Pack", bottles: 4, price: 899, badge: "Popular" },
  { id: "B2C-04", name: "Mega Weekender", bottles: 6, price: 1200, badge: "Value" }
];

let availableB2bPacks = [
  { id: "B2B-01", name: "Team Pack", bottles: 10, price: 1800 },
  { id: "B2B-02", name: "Office Batch", bottles: 20, price: 3400 },
  { id: "B2B-03", name: "Floor Pack", bottles: 40, price: 6000 },
  { id: "B2B-04", name: "Townhall Bulk", bottles: 60, price: 8700 }
];

let availableClusters = [
  { techPark: "DLF Cyber City / Cyber Hub (Gurugram)", window: "Morning Kickoff (9:30 AM – 11:30 AM)", maxOrders: 25, currentOrders: 0, remainingOrders: 25, isFull: false },
  { techPark: "DLF Cyber City / Cyber Hub (Gurugram)", window: "Afternoon Recharge (2:00 PM – 4:00 PM)", maxOrders: 25, currentOrders: 0, remainingOrders: 25, isFull: false },
  { techPark: "One Horizon Center / Golf Course Rd (Gurugram)", window: "Morning Kickoff (9:30 AM – 11:30 AM)", maxOrders: 25, currentOrders: 0, remainingOrders: 25, isFull: false },
  { techPark: "Candor TechSpace / Sector 48 (Gurugram)", window: "Morning Kickoff (9:30 AM – 11:30 AM)", maxOrders: 25, currentOrders: 0, remainingOrders: 25, isFull: false },
  { techPark: "Candor TechSpace / Sector 48 (Gurugram)", window: "Afternoon Recharge (2:00 PM – 4:00 PM)", maxOrders: 25, currentOrders: 0, remainingOrders: 25, isFull: false }
];

let availableCoupons = [
  { code: "FRESHDROP", type: "FLAT", value: 100, minOrder: 480, mode: "B2C" },
  { code: "OFFICE10", type: "PERCENT", value: 10, minOrder: 1800, mode: "B2B" },
  { code: "NCRFIRST", type: "PERCENT", value: 10, minOrder: 240, mode: "ALL" }
];

let appliedCoupon = null;
let selectedBean = "Ratnagiri Estate (Anaerobic Naturals)";
let isCustomSplit = false;
let customSplit = {};
let selectedB2cPack = { name: "Weekend Pack", bottles: 4, unitPrice: 899 };
let selectedB2bPack = { name: "Team Pack", bottles: 10, unitPrice: 1800 };
let currentOrderDetails = null;

function normalizeStr(s) {
  return String(s || '').replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
}

function selectBean(lotId) {
  const lot = availableLots.find(l => l.id === lotId || l.name === lotId);
  if (lotId === 'MIX') {
    isCustomSplit = true;
    selectedBean = "Mix & Match Custom Split";
  } else if (lot) {
    isCustomSplit = false;
    selectedBean = `${lot.name} (${lot.process})`;
  }
  const displayBeanEl = document.getElementById('displaySelectedBean');
  if (displayBeanEl) {
    displayBeanEl.textContent = selectedBean;
  }
  document.querySelectorAll('.lot-option-btn, .lot-card, [data-lot]').forEach(el => {
    const target = el.dataset.lot || el.dataset.lotId || (el.querySelector('.lot-name')?.textContent);
    if (target && (target === lotId || (lot && target.includes(lot.name)))) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  const splitter = document.getElementById('customSplitter');
  if (splitter) splitter.style.display = isCustomSplit ? 'block' : 'none';
  if (isCustomSplit) rebalanceSplitter();
  updateTotal();
  renderSplitterUI();
}

function initHarvestFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const beanParam = params.get('bean') || params.get('lot') || params.get('harvest');
  if ((PAGE === 'PERSONAL' || PAGE === 'CORPORATE' || PAGE === 'OFFICE' || PAGE === 'ORDER') && !beanParam) {
    window.location.href = '/orders';
    return;
  }
  if (beanParam) {
    selectBean(beanParam);
  }
  const displayBeanEl = document.getElementById('displaySelectedBean');
  if (displayBeanEl) {
    displayBeanEl.textContent = selectedBean;
  }
}

function getTotalBottles() {
  var qtyInput = document.getElementById('packQty');
  var qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty <= 0) qty = 1;
  var isB2b = (PAGE === 'CORPORATE' || PAGE === 'OFFICE' || currentMode === 'B2B');
  var active = isB2b ? selectedB2bPack : selectedB2cPack;
  var bottleCount = (active && active.bottles) ? active.bottles : 1;
  return bottleCount * qty;
}

function getActiveLots() {
  return availableLots.filter(function(l) {
    if (l.isActive === false) return false;
    if (l.isSoldOut === true) return false;
    if (typeof l.remainingBottles === 'number' && l.remainingBottles <= 0) return false;
    return true;
  });
}

function getMixSplitSummary() {
  var activeLots = getActiveLots();
  var parts = [];
  activeLots.forEach(function(lot) {
    var count = customSplit[lot.id] || 0;
    if (count !== 0) {
      parts.push(count + 'x ' + lot.name);
    }
  });
  if (parts.length === 0) return 'Mix & Match Discovery Flight';
  return 'Mix & Match (' + parts.join(' + ') + ')';
}

function rebalanceSplitter() {
  var activeLots = getActiveLots();
  var total = getTotalBottles();
  if (activeLots.length === 0) return;

  var currentSum = 0;
  activeLots.forEach(function(l) {
    if (typeof customSplit[l.id] === 'number') {
      currentSum += customSplit[l.id];
    }
  });

  if (currentSum !== total) {
    customSplit = {};
    var base = Math.floor(total / activeLots.length);
    var remainder = total % activeLots.length;
    activeLots.forEach(function(l, idx) {
      customSplit[l.id] = base + (idx < remainder ? 1 : 0);
    });
  }

  renderSplitterUI();
}

function adjustSplit(lotId, delta) {
  var activeLots = getActiveLots();
  var total = getTotalBottles();
  if (activeLots.length <= 1) return;

  var currentVal = customSplit[lotId] || 0;

  if (delta > 0) {
    var otherLots = activeLots.filter(function(l) {
      return l.id !== lotId && (customSplit[l.id] || 0) > 0;
    });
    if (otherLots.length === 0) return;
    otherLots.sort(function(a, b) {
      return (customSplit[b.id] || 0) - (customSplit[a.id] || 0);
    });
    var targetToDec = otherLots[0];
    customSplit[lotId] = currentVal + 1;
    customSplit[targetToDec.id] = (customSplit[targetToDec.id] || 0) - 1;
  } else if (delta < 0) {
    if (currentVal <= 0) return;
    var otherLots = activeLots.filter(function(l) {
      return l.id !== lotId;
    });
    if (otherLots.length === 0) return;
    otherLots.sort(function(a, b) {
      return (customSplit[a.id] || 0) - (customSplit[b.id] || 0);
    });
    var targetToInc = otherLots[0];
    customSplit[lotId] = currentVal - 1;
    customSplit[targetToInc.id] = (customSplit[targetToInc.id] || 0) + 1;
  }

  renderSplitterUI();
}

function renderSplitterUI() {
  var total = getTotalBottles();
  var activeLots = getActiveLots();
  var customSplitter = document.getElementById('customSplitter');
  if (customSplitter) {
    customSplitter.style.display = isCustomSplit ? 'block' : 'none';
  }
  if (!isCustomSplit || activeLots.length === 0) return;

  var controlsContainer = document.getElementById('splitterControlsContainer');
  var ratioBar = document.getElementById('splitterRatioBar');
  var allocEl = document.getElementById('allocCount');
  var targetEl = document.getElementById('targetCount');
  var tallyEl = document.getElementById('tallyStatus');

  var currentAllocated = 0;
  activeLots.forEach(function(l) {
    currentAllocated += (customSplit[l.id] || 0);
  });

  if (allocEl) allocEl.textContent = currentAllocated;
  if (targetEl) targetEl.textContent = total;

  if (controlsContainer) {
    var rowsHtml = '';
    activeLots.forEach(function(lot) {
      var count = customSplit[lot.id] || 0;
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      rowsHtml += '<div class="splitter-row">' +
        '<div class="splitter-lot-info">' +
        '<span class="splitter-lot-name" style="color: ' + lotColor + ';">' + lot.name + '</span>' +
        '<span class="splitter-lot-sub">' + lot.process + '</span>' +
        '</div>' +
        '<div class="qty-stepper">' +
        '<button type="button" class="stepper-btn" data-lot-id="' + lot.id + '" onclick="adjustSplit(this.dataset.lotId, -1)">&ndash;</button>' +
        '<span class="stepper-val" id="splitCount_' + lot.id + '">' + count + '</span>' +
        '<button type="button" class="stepper-btn" data-lot-id="' + lot.id + '" onclick="adjustSplit(this.dataset.lotId, 1)">+</button>' +
        '</div>' +
        '</div>';
    });
    controlsContainer.innerHTML = rowsHtml;
  }

  // Render One Bottle Allocation Card Per Active Lot
  var crateContainer = document.getElementById('crateBottleGrid');
  if (crateContainer) {
    var crateHtml = '';
    activeLots.forEach(function(lot) {
      var count = customSplit[lot.id] || 0;
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      var pct = total > 0 ? Math.round((count / total) * 100) : 0;
      var isZero = (count === 0);

      crateHtml += '<div class="lot-bottle-card" ' + (isZero ? ' is-zero' : '') + '" style="border-color: ' + (isZero ? 'var(--card-border)' : lotColor + '66') + ';">' +
        '<div class="lot-bottle-visual-wrap">' +
          '<svg class="tabc-bottle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 240" width="34" height="68">' +
            '<defs>' +
              '<linearGradient id="capGrad_' + lot.id + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
                '<stop offset="0%" stop-color="#CD9A3A"/>' +
                '<stop offset="50%" stop-color="#E5C068"/>' +
                '<stop offset="100%" stop-color="#B08968"/>' +
              '</linearGradient>' +
            '</defs>' +
            '<path d="M 12,105 L 88,105 L 88,226 A 6,6 0 0,1 82,232 L 18,232 A 6,6 0 0,1 12,226 Z" fill="' + (isZero ? '#191816' : '#241005') + '"/>' +
            '<line x1="12" y1="105" x2="88" y2="105" stroke="' + lotColor + '" stroke-width="3"/>' +
            '<rect x="20" y="8" width="60" height="14" rx="4" fill="url(#capGrad_' + lot.id + ')"/>' +
            '<path d="M 30,22 L 30,35 L 12,75 L 12,226 A 6,6 0 0,0 18,232 L 82,232 A 6,6 0 0,0 88,226 L 88,75 L 70,35 L 70,22 Z" fill="none" stroke="url(#capGrad_' + lot.id + ')" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>' +
          '</svg>' +
          '<span class="lot-bottle-qty-overlay" style="background: ' + (isZero ? 'var(--card-border)' : lotColor) + '; color: ' + (isZero ? 'var(--text-muted)' : '#141312') + ';">' + count + '</span>' +
        '</div>' +
        '<div class="lot-bottle-info">' +
          '<span class="lot-bottle-name" style="color: ' + (isZero ? 'var(--text-muted)' : lotColor) + ';">' + lot.name + '</span>' +
          '<span class="lot-bottle-count-label">' + count + ' ' + (count === 1 ? 'Bottle' : 'Bottles') + ' (' + pct + '%)</span>' +
        '</div>' +
      '</div>';
    });

    if (crateHtml === '') {
      crateHtml = '<div style="color: var(--text-muted); font-size: 0.74rem; padding: 12px; grid-column: 1 / -1;">Select a pack size above to configure bottle splits.</div>';
    }
    crateContainer.innerHTML = crateHtml;
  }
  // Render Interactive Visual Bottle Crate Slots
  var crateContainer = document.getElementById('crateBottleGrid');
  if (crateContainer) {
    var crateHtml = '';
    activeLots.forEach(function(lot) {
      var count = customSplit[lot.id] || 0;
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      var shortName = lot.name.split(' ')[0]; // e.g. Ratnagiri, Banana, Riverdale

      for (var b = 0; b < count; b++) {
        crateHtml += '<div class="crate-slot" style="animation-delay: ' + (b * 0.05) + 's;">' +
          '<svg class="tabc-bottle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 240" width="28" height="56">' +
            '<defs>' +
              '<linearGradient id="goldCapGrad_' + lot.id + '_' + b + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
                '<stop offset="0%" stop-color="#CD9A3A"/>' +
                '<stop offset="50%" stop-color="#E5C068"/>' +
                '<stop offset="100%" stop-color="#B08968"/>' +
              '</linearGradient>' +
            '</defs>' +
            '<path d="M 12,105 L 88,105 L 88,226 A 6,6 0 0,1 82,232 L 18,232 A 6,6 0 0,1 12,226 Z" fill="#241005"/>' +
            '<line x1="12" y1="105" x2="88" y2="105" stroke="' + lotColor + '" stroke-width="3"/>' +
            '<rect x="20" y="8" width="60" height="14" rx="4" fill="url(#goldCapGrad_' + lot.id + '_' + b + ')"/>' +
            '<path d="M 30,22 L 30,35 L 12,75 L 12,226 A 6,6 0 0,0 18,232 L 82,232 A 6,6 0 0,0 88,226 L 88,75 L 70,35 L 70,22 Z" fill="none" stroke="url(#goldCapGrad_' + lot.id + '_' + b + ')" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>' +
          '</svg>' +
          '<span class="crate-slot-badge" style="background: ' + lotColor + '22; color: ' + lotColor + '; border: 1px solid ' + lotColor + '88;">' + shortName + '</span>' +
        '</div>';
      }
    });

    if (crateHtml === '') {
      crateHtml = '<div style="color: var(--text-muted); font-size: 0.74rem; padding: 12px;">Select a pack size above to populate your bottle crate.</div>';
    }
    crateContainer.innerHTML = crateHtml;
  }

  if (ratioBar) {
    var segmentsHtml = '';
    activeLots.forEach(function(lot) {
      var count = customSplit[lot.id] || 0;
      var pct = total > 0 ? (count / total) * 100 : 0;
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      if (pct > 0) {
        segmentsHtml += '<div class="ratio-segment" style="width: ' + pct + '%; background: ' + lotColor + '; height: 100%; transition: width 0.3s ease;" title="' + lot.name + ': ' + count + ' bottles"></div>';
      }
    });
    ratioBar.innerHTML = segmentsHtml;
  }

  if (tallyEl) {
    var summaryStr = getMixSplitSummary();
    tallyEl.textContent = '✨ ' + summaryStr + ' (Total ' + total + ' bottles)';
  }
}
// --------------------------------------------------------------------
// Discovery Flight & Splitter Engine (Step 2 Dynamic Calculation)
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// 2-Question Flavor Matcher Engine (flavor.html / menu.html)
// --------------------------------------------------------------------
let defaultQuizQuestions = [
  { qId: 'Q1', qTitle: '1. When will you enjoy your coffee?', key: 'opt_morning', icon: '🌅', label: 'Morning Focus (8:00 AM – 11:30 AM)' },
  { qId: 'Q1', qTitle: '1. When will you enjoy your coffee?', key: 'opt_afternoon', icon: '⚡', label: 'Afternoon Recharge (1:00 PM – 4:30 PM)' },
  { qId: 'Q1', qTitle: '1. When will you enjoy your coffee?', key: 'opt_allday', icon: '☀️', label: 'All-Day Focus & Flow' },
  { qId: 'Q1', qTitle: '1. When will you enjoy your coffee?', key: 'opt_mix', icon: '🌓', label: 'Both / All-Day Variety (Discovery Flight)' },
  { qId: 'Q2', qTitle: '2. Which tasting notes appeal to you?', key: 'opt_berry', icon: '🍇', label: 'Wild Berry, Ripe Peach & Dark Cacao Finish' },
  { qId: 'Q2', qTitle: '2. Which tasting notes appeal to you?', key: 'opt_floral', icon: '🌸', label: 'Jasmine Florals, Crisp Apple & Citrus' },
  { qId: 'Q2', qTitle: '2. Which tasting notes appeal to you?', key: 'opt_complex', icon: '🫐', label: 'Blackcurrant, Bergamot & Raw Honeyed Peach' },
  { qId: 'Q2', qTitle: '2. Which tasting notes appeal to you?', key: 'opt_mix', icon: '✨', label: 'Curious about multiple single-estate micro-lots' }
];

let defaultQuizRules = [
  { q1: 'opt_morning', q2: 'opt_berry', lotId: 'LOT-01', badge: '🍇 RECOMMENDED: SINGLE-ESTATE HARVEST', note: 'Rich winey body with wild raspberry and dark cacao finish. Perfect for morning focus and deep creative work.' },
  { q1: 'opt_morning', q2: 'opt_floral', lotId: 'LOT-02', badge: '🌸 RECOMMENDED: SPECIAL FERMENTATION', note: 'Bright floral aromas and crisp malic apple acidity to jumpstart your morning clean.' },
  { q1: 'opt_morning', q2: 'opt_complex', lotId: 'LOT-03', badge: '🫐 RECOMMENDED: CLEAN MACERATION', note: 'Complex honeyed blackcurrant and stone fruit notes with crystalline sweetness.' },
  { q1: 'opt_afternoon', q2: 'opt_floral', lotId: 'LOT-02', badge: '🌸 RECOMMENDED: AFTERNOON RECHARGE', note: 'Sparkling jasmine clarity and green apple acidity. Light tea-like mouthfeel ideal for afternoon refresh.' },
  { q1: 'opt_afternoon', q2: 'opt_berry', lotId: 'LOT-01', badge: '🍇 RECOMMENDED: FRUIT INDULGENCE', note: 'Winey sweetness and dark cacao to power through late afternoon meetings.' },
  { q1: 'opt_afternoon', q2: 'opt_complex', lotId: 'LOT-03', badge: '🫐 RECOMMENDED: AFTERNOON FLOW', note: 'Silky texture with lingering bergamot and honey notes for uninterrupted afternoon flow.' },
  { q1: 'opt_allday', q2: 'opt_complex', lotId: 'LOT-03', badge: '☀️ RECOMMENDED: ALL-DAY HARVEST', note: 'Smooth balanced all-day brew with deep blackcurrant and raw honeyed sweetness.' },
  { q1: 'opt_allday', q2: 'opt_berry', lotId: 'LOT-01', badge: '🍇 RECOMMENDED: SINGLE-ESTATE HARVEST', note: 'Full-bodied single-estate harvest crafted for deep focus all day long.' },
  { q1: 'opt_allday', q2: 'opt_floral', lotId: 'LOT-02', badge: '🌸 RECOMMENDED: SPECIAL FERMENTATION', note: 'Clean floral fermentation with zero bitterness for all-day sipping.' },
  { q1: 'opt_allday', q2: '*', lotId: 'LOT-03', badge: '☀️ RECOMMENDED: ALL-DAY BREW', note: 'Handcrafted for balanced all-day enjoyment.' },
  { q1: 'opt_mix', q2: '*', lotId: 'MIX', badge: '✨ RECOMMENDED: DUO DISCOVERY FLIGHT', note: 'Experience multiple single-estate micro-lots in equal parts or custom ratios in a single pack!' },
  { q1: '*', q2: 'opt_mix', lotId: 'MIX', badge: '✨ RECOMMENDED: DUO DISCOVERY FLIGHT', note: 'Blend our single-estate micro-lots in a single order with fine-tuned splits.' }
];

let liveQuizConfig = {
  questions: defaultQuizQuestions,
  rules: defaultQuizRules
};

let quizAnswers = { time: 'opt_morning', flavor: 'opt_berry' };

function selectQuizAnswer(questionNum, answerKey, element) {
  if (questionNum === 1) {
    quizAnswers.time = answerKey;
    document.querySelectorAll('.quiz-opt-q1').forEach(function(b) { b.classList.remove('active'); });
  } else if (questionNum === 2) {
    quizAnswers.flavor = answerKey;
    document.querySelectorAll('.quiz-opt-q2').forEach(function(b) { b.classList.remove('active'); });
  }
  if (element) element.classList.add('active');
  updateQuizRecommendation();
}
function getQuizSwatchClass(key, label) {
  var k = (key || '').toLowerCase();
  var l = (label || '').toLowerCase();
  if (k.indexOf('mix') !== -1 || l.indexOf('mix') !== -1 || l.indexOf('variety') !== -1 || l.indexOf('both') !== -1 || l.indexOf('flight') !== -1) return 'swatch-mix';
  if (k.indexOf('berry') !== -1 || k.indexOf('morning') !== -1 || l.indexOf('berry') !== -1 || l.indexOf('morning') !== -1 || l.indexOf('fruit') !== -1 || l.indexOf('raspberry') !== -1 || l.indexOf('cacao') !== -1) return 'swatch-berry';
  if (k.indexOf('floral') !== -1 || k.indexOf('afternoon') !== -1 || l.indexOf('floral') !== -1 || l.indexOf('afternoon') !== -1 || l.indexOf('jasmine') !== -1 || l.indexOf('apple') !== -1 || l.indexOf('citrus') !== -1) return 'swatch-floral';
  if (k.indexOf('complex') !== -1 || k.indexOf('allday') !== -1 || l.indexOf('complex') !== -1 || l.indexOf('all-day') !== -1 || l.indexOf('honey') !== -1 || l.indexOf('blackcurrant') !== -1 || l.indexOf('maceration') !== -1) return 'swatch-complex';
  return 'swatch-complex';
}


function renderQuizUI(lots, quizConfig) {
  var config = (quizConfig && quizConfig.questions && quizConfig.questions.length > 0) ? quizConfig : liveQuizConfig;
  var questions = (config && config.questions && config.questions.length > 0) ? config.questions : defaultQuizQuestions;

  var q1Container = document.getElementById('quizQ1Options');
  var q2Container = document.getElementById('quizQ2Options');

  var q1Questions = questions.filter(function(q) { return q.qId === 'Q1'; });
  var q2Questions = questions.filter(function(q) { return q.qId === 'Q2'; });

  if (q1Container && q1Questions.length > 0) {
    var q1Html = '';
    q1Questions.forEach(function(q, idx) {
      var isAct = (quizAnswers.time === q.key) || (!quizAnswers.time && idx === 0) ? 'active' : '';
      if (!quizAnswers.time && idx === 0) quizAnswers.time = q.key;
      var swatchCls = getQuizSwatchClass(q.key, q.label);
      q1Html += '<button type="button" class="quiz-opt-btn quiz-opt-q1 ' + swatchCls + ' ' + isAct + '" data-ans="' + q.key + '" onclick="selectQuizAnswer(1, this.dataset.ans, this)">' +
        '<span class="quiz-opt-icon">' + (q.icon || '☕') + '</span>' +
        '<span class="quiz-opt-label">' + q.label + '</span>' +
        '</button>';
    });
    q1Container.innerHTML = q1Html;
  }

  if (q2Container && q2Questions.length > 0) {
    var q2Html = '';
    q2Questions.forEach(function(q, idx) {
      var isAct = (quizAnswers.flavor === q.key) || (!quizAnswers.flavor && idx === 0) ? 'active' : '';
      if (!quizAnswers.flavor && idx === 0) quizAnswers.flavor = q.key;
      var swatchCls = getQuizSwatchClass(q.key, q.label);
      q2Html += '<button type="button" class="quiz-opt-btn quiz-opt-q2 ' + swatchCls + ' ' + isAct + '" data-ans="' + q.key + '" onclick="selectQuizAnswer(2, this.dataset.ans, this)">' +
        '<span class="quiz-opt-icon">' + (q.icon || '✨') + '</span>' +
        '<span class="quiz-opt-label">' + q.label + '</span>' +
        '</button>';
    });
    q2Container.innerHTML = q2Html;
  }
}

function findQuizRuleMatch(timeKey, flavorKey) {
  var rules = (liveQuizConfig && liveQuizConfig.rules && liveQuizConfig.rules.length > 0) ? liveQuizConfig.rules : defaultQuizRules;
  for (var i = 0; i < rules.length; i++) {
    var r = rules[i];
    if (r.q1 === timeKey && r.q2 === flavorKey) return r;
  }
  for (var j = 0; j < rules.length; j++) {
    var r2 = rules[j];
    if (r2.q1 === timeKey && r2.q2 === '*') return r2;
  }
  for (var k = 0; k < rules.length; k++) {
    var r3 = rules[k];
    if (r3.q1 === '*' && r3.q2 === flavorKey) return r3;
  }
  return null;
}

function updateQuizRecommendation() {
  const resultCard = document.getElementById('quizResultCard');
  const resultTitle = document.getElementById('quizResultTitle');
  const resultDesc = document.getElementById('quizResultDesc');
  const btnPersonal = document.getElementById('quizBtnPersonal');
  const btnCorporate = document.getElementById('quizBtnCorporate');
  const resultBadge = document.getElementById('quizResultBadge');
  if (!resultCard) return;

  const rule = findQuizRuleMatch(quizAnswers.time, quizAnswers.flavor);
  const targetLotId = rule ? rule.lotId : (quizAnswers.flavor.includes('floral') ? 'LOT-02' : (quizAnswers.flavor.includes('complex') ? 'LOT-03' : 'LOT-01'));

  if (targetLotId === 'MIX') {
    resultCard.className = 'quiz-result-box result-mix';
    resultCard.style.borderColor = 'var(--accent)';
    resultCard.style.boxShadow = '0 8px 24px rgba(212, 163, 115, 0.25)';
    if (resultBadge) resultBadge.textContent = rule && rule.badge ? rule.badge : '✨ RECOMMENDED: DUO DISCOVERY FLIGHT';
    if (resultTitle) resultTitle.textContent = 'Mix & Match Custom Split';
    if (resultDesc) {
      const defaultDesc = 'Experience multiple single-estate micro-lots in equal parts or custom ratios in a single pack! Enjoy rich winey fruit in the morning and sparkling floral clarity in the afternoon.';
      resultDesc.textContent = (rule && rule.note) ? rule.note : defaultDesc;
    }
    if (btnPersonal) btnPersonal.href = '/personal?bean=MIX';
    if (btnCorporate) btnCorporate.href = '/corporate?bean=MIX';
  } else {
    const lot = availableLots.find(function(l) { return l.id === targetLotId; }) || availableLots[0];
    const lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
    const emoji = (lot.emojis && lot.emojis[0]) || '☕';

    resultCard.className = 'quiz-result-box';
    resultCard.style.borderColor = lotColor;
    resultCard.style.boxShadow = '0 8px 24px ' + lotColor + '22';

    if (resultBadge) {
      resultBadge.style.color = lotColor;
      resultBadge.textContent = (rule && rule.badge) ? rule.badge : (emoji + ' RECOMMENDED: SINGLE-ESTATE HARVEST');
    }
    if (resultTitle) {
      resultTitle.style.color = lotColor;
      resultTitle.textContent = lot.name + ' (' + (lot.process || 'Single-Estate') + ')';
    }
    if (resultDesc) {
      if (rule && rule.note) {
        resultDesc.textContent = rule.note;
      } else {
        const rituals = lot.rituals ? (' • ' + lot.rituals) : '';
        resultDesc.textContent = (lot.story || lot.notes) + rituals;
      }
    }
    if (btnPersonal) btnPersonal.href = '/personal?bean=' + encodeURIComponent(lot.id);
    if (btnCorporate) btnCorporate.href = '/corporate?bean=' + encodeURIComponent(lot.id);
  }
}

function setRadarFocus(mode) {
  document.querySelectorAll('#radarTabsContainer .mode-tab').forEach(function(tab) {
    tab.classList.toggle('active', tab.dataset.lotId === mode);
  });

  document.querySelectorAll('.radar-lot-poly-group').forEach(function(group) {
    if (mode === 'OVERLAY' || !mode) {
      group.style.opacity = '1';
    } else {
      var targetId = 'radarGroup_' + mode;
      group.style.opacity = (group.id === targetId) ? '1' : '0.12';
    }
  });
}

function renderFlavorPage(lots) {
  var displayLots = (Array.isArray(lots) && lots.length > 0) ? lots.filter(function(l) { return l.isActive !== false; }) : availableLots.filter(function(l) { return l.isActive !== false; });
  if (displayLots.length === 0) displayLots = availableLots;

  // 1. Render Radar Tabs & Legend
  var tabsContainer = document.getElementById('radarTabsContainer');
  var legendContainer = document.getElementById('radarLegendContainer');
  var svgContainer = document.getElementById('radarSvgContainer');

  if (tabsContainer) {
    var tabsHtml = '<button type="button" class="mode-tab active" data-lot-id="OVERLAY" style="padding: 6px 12px; font-size: 0.72rem;" onclick="setRadarFocus(this.dataset.lotId)">✨ All Lots Overlay</button>';
    displayLots.forEach(function(lot) {
      var emoji = (lot.emojis && lot.emojis[0]) || '☕';
      tabsHtml += '<button type="button" class="mode-tab" data-lot-id="' + lot.id + '" style="padding: 6px 12px; font-size: 0.72rem;" onclick="setRadarFocus(this.dataset.lotId)">' + emoji + ' ' + lot.name + '</button>';
    });
    tabsContainer.innerHTML = tabsHtml;
  }

  if (legendContainer) {
    var legendHtml = '';
    displayLots.forEach(function(lot) {
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      legendHtml += '<div style="display: flex; align-items: center; gap: 6px; color: ' + lotColor + '; font-weight: 700;">' +
        '<span style="width: 10px; height: 10px; border-radius: 50%; background: ' + lotColor + '; display: inline-block;"></span>' +
        lot.name + ' (' + (lot.process || 'Specialty') + ')' +
        '</div>';
    });
    legendContainer.innerHTML = legendHtml;
  }

  // 2. Render Radar SVG
  if (svgContainer) {
    var defsHtml = '<defs>';
    var polysHtml = '';

    var angles = [-Math.PI/2, -18 * Math.PI/180, 54 * Math.PI/180, 126 * Math.PI/180, 198 * Math.PI/180];
    var cx = 200, cy = 120, maxR = 80;

    displayLots.forEach(function(lot) {
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      var gradId = 'radarGrad_' + lot.id.replace(/[^a-zA-Z0-9]/g, '_');
      defsHtml += '<linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="' + lotColor + '" stop-opacity="0.65" />' +
        '<stop offset="100%" stop-color="#d4a373" stop-opacity="0.2" />' +
        '</linearGradient>';

      var vals = [
        (lot.acidity || 75) / 100,
        (lot.aromatics || 80) / 100,
        (lot.sweetness || 75) / 100,
        (lot.body || 65) / 100,
        (lot.clarity || 70) / 100
      ];

      var pointsArr = [];
      var circlesHtml = '';
      for (var i = 0; i < 5; i++) {
        var r = maxR * Math.min(Math.max(vals[i], 0.2), 1.0);
        var px = (cx + r * Math.cos(angles[i])).toFixed(1);
        var py = (cy + r * Math.sin(angles[i])).toFixed(1);
        pointsArr.push(px + ',' + py);
        circlesHtml += '<circle cx="' + px + '" cy="' + py + '" r="3.5" fill="' + lotColor + '" />';
      }

      polysHtml += '<g class="radar-lot-poly-group" id="radarGroup_' + lot.id + '" style="transition: all 0.35s ease;">' +
        '<polygon points="' + pointsArr.join(' ') + '" fill="url(#' + gradId + ')" stroke="' + lotColor + '" stroke-width="2.5" style="filter: drop-shadow(0 0 6px ' + lotColor + '88);" />' +
        circlesHtml +
        '</g>';
    });
    defsHtml += '</defs>';

    var gridPolys = [
      '<polygon points="200,100 219.0,113.8 211.8,136.2 188.2,136.2 181.0,113.8" stroke="rgba(255,255,255,0.08)" stroke-width="1" fill="none" />',
      '<polygon points="200,80 238.0,107.6 223.5,152.4 176.5,152.4 162.0,107.6" stroke="rgba(255,255,255,0.1)" stroke-width="1" fill="none" />',
      '<polygon points="200,60 257.1,101.5 235.3,168.5 164.7,168.5 142.9,101.5" stroke="rgba(255,255,255,0.12)" stroke-width="1" fill="none" />',
      '<polygon points="200,40 276.1,95.3 247.0,184.7 153.0,184.7 123.9,95.3" stroke="rgba(212,163,115,0.3)" stroke-width="1.2" fill="none" />'
    ].join('');

    var spokes = [
      '<line x1="200" y1="120" x2="200" y2="40" stroke="rgba(255,255,255,0.14)" stroke-dasharray="2 2" />',
      '<line x1="200" y1="120" x2="276.1" y2="95.3" stroke="rgba(255,255,255,0.14)" stroke-dasharray="2 2" />',
      '<line x1="200" y1="120" x2="247.0" y2="184.7" stroke="rgba(255,255,255,0.14)" stroke-dasharray="2 2" />',
      '<line x1="200" y1="120" x2="153.0" y2="184.7" stroke="rgba(255,255,255,0.14)" stroke-dasharray="2 2" />',
      '<line x1="200" y1="120" x2="123.9" y2="95.3" stroke="rgba(255,255,255,0.14)" stroke-dasharray="2 2" />'
    ].join('');

    var labels = [
      '<text x="200" y="26" fill="#fefae0" font-size="9.5" font-weight="800" text-anchor="middle">Bright Acidity</text>',
      '<text x="292" y="93" fill="#fefae0" font-size="9.5" font-weight="800" text-anchor="start">Floral Aromatics</text>',
      '<text x="258" y="204" fill="#fefae0" font-size="9.5" font-weight="800" text-anchor="start">Cane Sweetness</text>',
      '<text x="142" y="204" fill="#fefae0" font-size="9.5" font-weight="800" text-anchor="end">Body &amp; Texture</text>',
      '<text x="108" y="93" fill="#fefae0" font-size="9.5" font-weight="800" text-anchor="end">Cup Clarity</text>'
    ].join('');

    svgContainer.innerHTML = '<svg viewBox="0 0 400 250" style="width: 100%; max-width: 380px; height: auto; margin: 0 auto; display: block;" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      defsHtml + gridPolys + spokes + polysHtml + labels +
      '</svg>';
  }

  // 3. Render Side-by-Side Sensory Spectrum Bars
  var specContainer = document.getElementById('spectrumComparisonContainer');
  if (specContainer) {
    var metrics = [
      { label: '🍷 Body & Viscosity (Mouthfeel)', key: 'body', desc: 'Mouthfeel and thickness on palate' },
      { label: '🍋 Fruit Acidity & Brightness', key: 'acidity', desc: 'Vibrancy, fruit acids and sparkle' },
      { label: '🍫 Sweetness & Aftertaste', key: 'sweetness', desc: 'Natural cane and fruit sugar depth' },
      { label: '✨ Aromatic Volatiles & Scent', key: 'aromatics', desc: 'Fragrance, terpenes and florality' },
      { label: '🔍 Cup Clarity & Cleanliness', key: 'clarity', desc: 'Definition and transparency of cup' }
    ];

    var specHtml = '';
    metrics.forEach(function(m) {
      var trackBars = '';
      var valLabels = [];

      displayLots.forEach(function(lot) {
        var val = lot[m.key] || 60;
        var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
        trackBars += '<div class="bar-track-single" style="height: 8px; background: #25221e; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">' +
          '<div style="width: ' + val + '%; background: ' + lotColor + '; height: 100%; border-radius: 4px; transition: width 0.4s ease;"></div>' +
          '</div>';
        valLabels.push('<span style="color: ' + lotColor + '; font-weight: 700; font-size: 0.68rem;">' + lot.name + ': ' + val + '%</span>');
      });

      specHtml += '<div class="spectrum-bar-item" style="margin-bottom: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--card-border); border-radius: 10px; padding: 10px 12px;">' +
        '<div class="spectrum-header-row" style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.78rem; font-weight: 800; color: var(--text);">' +
        '<span>' + m.label + '</span>' +
        '</div>' +
        '<div class="spectrum-double-track">' + trackBars + '</div>' +
        '<div class="spectrum-metric-labels" style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-top: 4px;">' +
        valLabels.join('') +
        '</div>' +
        '</div>';
    });
    specContainer.innerHTML = specHtml;
  }

  // 4. Render Farm Process Science Cards
  var procContainer = document.getElementById('processCardsContainer');
  if (procContainer) {
    var procHtml = '';
    displayLots.forEach(function(lot) {
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      var story = lot.story || lot.notes || 'Hand-harvested and crafted in micro-batches with meticulous fermentation control.';
      procHtml += '<div style="background: linear-gradient(165deg, rgba(255,255,255,0.03) 0%, #151413 100%); border: 1.5px solid ' + lotColor + '44; border-radius: 12px; padding: 14px; margin-bottom: 10px;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">' +
        '<strong style="color: ' + lotColor + '; font-size: 0.95rem;">' + lot.name + ' (' + lot.id + ')</strong>' +
        '<span style="background: rgba(212,163,115,0.15); color: ' + lotColor + '; border: 1px solid ' + lotColor + '; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 10px;">' + lot.process + '</span>' +
        '</div>' +
        '<div style="font-size: 0.72rem; color: var(--accent); margin-bottom: 6px;">' + (lot.region || 'Western Ghats • Single-Estate') + '</div>' +
        '<p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; margin: 0 0 12px;">' + story + '</p>' +
        '<a href="/personal?bean=' + encodeURIComponent(lot.id) + '" class="btn" style="background: var(--gradient-gold); color: #141312; font-weight: 800; font-size: 0.76rem; padding: 9px 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 100%; border-radius: 8px;">' +
        '<span>Configure ' + lot.name + ' Drop &rarr;</span>' +
        '</a>' +
        '</div>';
    });
    procContainer.innerHTML = procHtml;
  }

  // 5. Render Daypart & Food Pairing Cards
  var pairContainer = document.getElementById('pairingCardsContainer');
  if (pairContainer) {
    var pairHtml = '';
    displayLots.forEach(function(lot) {
      var lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
      var emoji = (lot.emojis && lot.emojis[0]) || '☕';
      var rawRituals = lot.rituals || '';

      var timePart = '';
      var pairingPart = '';

      if (rawRituals.indexOf('• Pairings:') !== -1) {
        var splits = rawRituals.split('• Pairings:');
        timePart = splits[0].replace(/^[•\s]+/, '').replace(/[•\s]+$/, '').trim();
        pairingPart = splits[1].trim();
      } else if (rawRituals.indexOf('•') !== -1) {
        var splits2 = rawRituals.split('•');
        timePart = splits2[0].trim();
        pairingPart = splits2.slice(1).join('•').replace(/^Pairings:\s*/i, '').trim();
      } else {
        timePart = rawRituals || 'Best enjoyed fresh in small batches.';
      }

      var itemsHtml = '';
      if (timePart) {
        itemsHtml += '<div class="pairing-list-item" style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">' +
          '<span style="font-size: 0.95rem; flex-shrink: 0;">⏱️</span>' +
          '<span><strong style="color: var(--text);">' + (timePart.indexOf('Best Time:') === -1 ? 'Best Time: ' : '') + '</strong>' + timePart.replace(/^Best Time:\s*/i, '') + '</span>' +
          '</div>';
      }
      if (pairingPart) {
        itemsHtml += '<div class="pairing-list-item" style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.74rem; color: var(--text-muted); line-height: 1.4; margin-top: 4px;">' +
          '<span style="font-size: 0.95rem; flex-shrink: 0;">🥐</span>' +
          '<span><strong style="color: var(--text);">Food Pairings: </strong>' + pairingPart.replace(/^Pairings:\s*/i, '') + '</span>' +
          '</div>';
      }
      pairHtml += '<div class="pairing-card" style="background: var(--card-inner); border: 1.5px solid ' + lotColor + '33; border-radius: 12px; padding: 14px; margin-bottom: 10px;">' +
        '<div class="pairing-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
        '<span style="font-weight: 800; color: ' + lotColor + '; font-size: 0.9rem;">' + emoji + ' ' + lot.name + ' Rituals</span>' +
        '<span style="font-size: 0.68rem; font-weight: 700; color: var(--accent); background: rgba(212,163,115,0.12); padding: 2px 8px; border-radius: 8px;">' + (lot.pills ? lot.pills[0] : 'Specialty') + '</span>' +
        '</div>' +
        '<div class="pairing-list" style="display: flex; flex-direction: column; gap: 6px;">' +
        itemsHtml +
        '</div>' +
        '</div>';
    });
    pairContainer.innerHTML = pairHtml;
  }
}

// ====================================================================
// 48-HOUR FRESHNESS INTERACTIVE SCRUBBER CONTROLLER (guide.html)
// ====================================================================
function updateFreshnessScrubber(val) {
  var hours = parseInt(val, 10);
  if (isNaN(hours)) hours = 0;

  var badge = document.getElementById('scrubberBadge');
  var title = document.getElementById('scrubberHourTitle');
  var volatiles = document.getElementById('scrubberVolatiles');
  var desc = document.getElementById('scrubberDesc');
  var card = document.getElementById('scrubberOutputCard');

  if (!badge || !title || !volatiles || !desc) return;

  if (hours <= 12) {
    var retPct = Math.round(96 - (hours / 12) * 4); // 96% down to 92%
    badge.textContent = hours + 'h: Explosive Aromatics';
    badge.style.background = 'rgba(149, 213, 178, 0.2)';
    badge.style.color = '#95d5b2';
    badge.style.borderColor = '#95d5b2';

    title.textContent = 'Hour ' + hours + ' — Immediate Morning Drop';
    volatiles.textContent = retPct + '% Volatiles Locked';
    volatiles.style.color = '#95d5b2';
    desc.textContent = 'Explosive wild berry aromatics, sparkling malic acidity, and intense floral jasmine esters trapped under rapid 4°C thermal shock.';
  } else if (hours <= 36) {
    var retPct = Math.round(92 - ((hours - 12) / 24) * 8); // 92% down to 84%
    badge.textContent = hours + 'h: Peak Balance & Integration';
    badge.style.background = 'rgba(212, 163, 115, 0.2)';
    badge.style.color = '#d4a373';
    badge.style.borderColor = '#d4a373';

    title.textContent = 'Hour ' + hours + ' — Integrated Sweetness Window';
    volatiles.textContent = retPct + '% Stable';
    volatiles.style.color = '#d4a373';
    desc.textContent = 'Acidity rounds out seamlessly with dark cacao and sweet stone fruit undertones. Maximum flavor cohesion across single-estate lots.';
  } else if (hours <= 48) {
    var retPct = Math.round(84 - ((hours - 36) / 12) * 10); // 84% down to 74%
    badge.textContent = hours + 'h: Mellow Finish (Cutoff)';
    badge.style.background = 'rgba(231, 111, 81, 0.2)';
    badge.style.color = '#e76f51';
    badge.style.borderColor = '#e76f51';

    title.textContent = 'Hour ' + hours + ' — Peak 48h Freshness Benchmark';
    volatiles.textContent = retPct + '% (Approaching Cutoff)';
    volatiles.style.color = '#e76f51';
    desc.textContent = 'Rich, smooth, rounded sweetness. The delicate floral top-notes begin to settle. Consume before the 48-hour peak benchmark!';
  } else {
    badge.textContent = hours + 'h: Oxidation & Degradation';
    badge.style.background = 'rgba(230, 57, 70, 0.2)';
    badge.style.color = '#e63946';
    badge.style.borderColor = '#e63946';

    title.textContent = 'Hour ' + hours + ' — Past Peak Freshness';
    volatiles.textContent = '<50% Volatiles (Oxidizing)';
    volatiles.style.color = '#e63946';
    desc.textContent = 'Because our coffee contains zero chemical stabilizers or artificial preservatives, exposure past 48 hours results in aromatic decay and muted acidity.';
  }
}

// Orders Gateway Controller (orders.html)
// --------------------------------------------------------------------
let selectedGatewayLot = null;
function selectHarvestOption(lotId) {
  selectedGatewayLot = (selectedGatewayLot === lotId) ? null : lotId;
  document.querySelectorAll('.harvest-preview-card').forEach(card => {
    card.classList.toggle('active', selectedGatewayLot && card.dataset.lotId === selectedGatewayLot);
  });
  const btnPersonal = document.getElementById('btnGoPersonal');
  const btnCorporate = document.getElementById('btnGoCorporate');
  const prompt = document.getElementById('harvestPrompt');
  if (selectedGatewayLot) {
    if (btnPersonal) {
      btnPersonal.classList.remove('disabled');
      btnPersonal.href = '/personal?bean=' + encodeURIComponent(selectedGatewayLot);
    }
    if (btnCorporate) {
      btnCorporate.classList.remove('disabled');
      btnCorporate.href = '/corporate?bean=' + encodeURIComponent(selectedGatewayLot);
    }
    if (prompt) {
      prompt.textContent = '✓ Harvest selected! Choose your order scale below:';
      prompt.classList.add('selection-made');
    }
  } else {
    if (btnPersonal) {
      btnPersonal.classList.add('disabled');
      btnPersonal.href = 'javascript:void(0)';
    }
    if (btnCorporate) {
      btnCorporate.classList.add('disabled');
      btnCorporate.href = 'javascript:void(0)';
    }
    if (prompt) {
      prompt.textContent = '👆 Please select a single-estate harvest above to choose your order scale';
      prompt.classList.remove('selection-made');
    }
  }
}
function getSwatchClass(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('berry') || t.includes('rasp') || t.includes('fruit') || t.includes('currant')) return 'swatch-berry';
  if (t.includes('stone') || t.includes('peach') || t.includes('orange') || t.includes('citrus') || t.includes('bergamot')) return 'swatch-stonefruit';
  if (t.includes('cacao') || t.includes('choc') || t.includes('toffee') || t.includes('caramel') || t.includes('nut') || t.includes('honey')) return 'swatch-cacao';
  if (t.includes('blossom') || t.includes('flower') || t.includes('floral')) return 'swatch-blossom';
  if (t.includes('apple') || t.includes('malic') || t.includes('crisp')) return 'swatch-apple';
  if (t.includes('jasmine') || t.includes('clean') || t.includes('tea') || t.includes('clarity') || t.includes('silky')) return 'swatch-jasmine';
  return 'swatch-stonefruit';
}
function renderHarvestGateway(lots) {
  const container = document.getElementById('harvestLotsContainer');
  if (!container) return;

  const displayLots = Array.isArray(lots) && lots.length > 0 ? lots : availableLots;
  let html = '';

  displayLots.forEach((lot) => {
    const isSoldOut = (lot.isActive === false) || (lot.isSoldOut === true) || (typeof lot.remainingBottles === 'number' && lot.remainingBottles <= 0);
    const activeClass = (selectedGatewayLot === lot.id) ? 'active' : '';
    const soldOutTag = isSoldOut ? '<div class="harvest-tag" style="background:#e63946; border-color:#e63946; color:#fff;">SOLD OUT</div>' : '';
    const clickAttr = isSoldOut ? '' : ('onclick="selectHarvestOption(\'' + lot.id + '\')"');

    const lotColor = lot.color || (lot.id === 'LOT-01' ? '#e76f51' : (lot.id === 'LOT-02' ? '#2a9d8f' : '#d4a373'));
    const tagClass = (lot.id === 'LOT-01') ? 'tag-ratnagiri' : ((lot.id === 'LOT-02') ? 'tag-banana' : '');
    const tagStyle = tagClass ? '' : ('style="border-color:' + lotColor + '; color:' + lotColor + '; background: rgba(212,163,115,0.12);"');

    const defaultEmojis = (lot.id === 'LOT-01') ? ["🍇", "🍑", "🍫"] : ((lot.id === 'LOT-02') ? ["🌸", "🍏", "✨"] : ["🫐", "🍊", "🍯"]);
    const emojis = (Array.isArray(lot.emojis) && lot.emojis.length > 0) ? lot.emojis : defaultEmojis;

    const defaultPills = (lot.notes ? lot.notes.split(',').map(s => s.trim()) : ["Specialty Single-Estate", "Micro-Batch"]);
    const pills = (Array.isArray(lot.pills) && lot.pills.length > 0) ? lot.pills : defaultPills;

    const swatchesHtml = emojis.map((e, sIdx) => {
      const label = pills[sIdx] || 'Flavor Note';
      const swatchCls = getSwatchClass(label);
      return '<div class="flavor-swatch ' + swatchCls + '"><span class="swatch-icon">' + e + '</span><span class="swatch-text">' + label + '</span></div>';
    }).join('');

    const fermentClass = (lot.id === 'LOT-01') ? 'fill-ferment-lot1' : ((lot.id === 'LOT-02') ? 'fill-ferment-lot2' : '');
    const fermentStyle = fermentClass ? ('style="width:' + (lot.fermentation || 75) + '%;"') : ('style="width:' + (lot.fermentation || 75) + '%; background:' + lotColor + ';"');
    const fermentLabel = lot.process || 'Single-Estate Fermentation';

    const viscClass = (lot.id === 'LOT-01') ? 'viscosity-lot1' : ((lot.id === 'LOT-02') ? 'viscosity-lot2' : '');
    const viscStyle = viscClass ? '' : ('style="width:' + (lot.body || 60) + '%; background:' + lotColor + ';"');

    const isHeavyBody = (lot.body && lot.body > 65) || (lot.id === 'LOT-01');
    const viscTitle = isHeavyBody ? '🍷 Body &amp; Texture: Syrupy &amp; Winey' : '🍵 Body &amp; Texture: Tea-Like &amp; Silky';
    const viscDesc = lot.rituals || (isHeavyBody ? 'Medium-Full Body • Best paired with dark pastries &amp; morning focus' : 'Light, Crisp Body • Best paired with light desserts &amp; afternoon refresh');

    html += '<div class="harvest-preview-card ' + activeClass + ' ' + (isSoldOut ? 'lot-sold-out' : '') + '" data-lot-id="' + lot.id + '" id="cardLot_' + lot.id + '" style="' + (isSoldOut ? 'opacity:0.5; cursor:not-allowed;' : '') + '" ' + clickAttr + '>' +
      '<div class="harvest-card-top">' +
      '<div class="harvest-info-wrap">' +
      '<div class="harvest-title" style="color:' + lotColor + ';">' + lot.name + '</div>' +
      '<div class="harvest-origin">' + (lot.region || 'Western Ghats • Single-Estate') + '</div>' +
      '<div class="harvest-notes">' + lot.notes + '</div>' +
      '</div>' +
      '<div class="harvest-top-right">' +
      (soldOutTag || ('<div class="harvest-tag ' + tagClass + '" ' + tagStyle + '>' + lot.process + '</div>')) +
      '<div class="harvest-radio-dot"></div>' +
      '</div>' +
      '</div>' +
      '<div class="harvest-expanded-content">' +
      '<div class="flavor-swatches-grid">' + swatchesHtml + '</div>' +
      '<div class="spectrum-meter-group">' +
      '<div class="spectrum-meter">' +
      '<div class="spectrum-header"><span>Roast Degree</span><strong>' + (lot.roast ? (lot.roast + '%') : 'Medium-Light (45%)') + '</strong></div>' +
      '<div class="spectrum-track"><div class="spectrum-fill fill-roast" style="width:' + (lot.roast || 45) + '%;"></div></div>' +
      '<div class="spectrum-labels"><span>Light</span><span>Medium</span><span>Dark</span></div>' +
      '</div>' +
      '<div class="spectrum-meter">' +
      '<div class="spectrum-header"><span>Fermentation Depth</span><strong>' + fermentLabel + ' (' + (lot.fermentation || 80) + '%)</strong></div>' +
      '<div class="spectrum-track"><div class="spectrum-fill ' + fermentClass + '" ' + fermentStyle + '></div></div>' +
      '<div class="spectrum-labels"><span>Washed</span><span>Naturals</span><span>Experimental</span></div>' +
      '</div>' +
      '</div>' +
      '<div class="viscosity-meter-card">' +
      '<div class="viscosity-info">' +
      '<span class="viscosity-title">' + viscTitle + '</span>' +
      '<span class="viscosity-desc">' + viscDesc + '</span></div>' +
      '<div class="viscosity-bar"><div class="viscosity-fill ' + viscClass + '" ' + viscStyle + '></div></div>' +
      '</div>' +
      '</div>' +
      '</div>';
  });

  const activeCount = displayLots.filter(l => l.isActive !== false && !l.isSoldOut && (typeof l.remainingBottles !== 'number' || l.remainingBottles > 0)).length;
  if (activeCount >= 2) {
    const mixActiveClass = (selectedGatewayLot === 'MIX') ? 'active' : '';
    html += '<div class="harvest-preview-card ' + mixActiveClass + '" data-lot-id="MIX" id="cardLotMix" onclick="selectHarvestOption(\'MIX\')">' +
      '<div class="harvest-card-top">' +
      '<div class="harvest-info-wrap">' +
      '<div class="harvest-title">Mix &amp; Match</div>' +
      '<div class="harvest-origin" style="color: var(--accent);">Custom Multi-Lot Discovery Flight</div>' +
      '<div class="harvest-notes">Curious about multiple harvests? Customize your split ratio across all active micro-lots.</div>' +
      '</div>' +
      '<div class="harvest-top-right">' +
      '<div class="harvest-tag tag-mix">Custom Split</div>' +
      '<div class="harvest-radio-dot"></div>' +
      '</div>' +
      '</div>' +
      '<div class="harvest-expanded-content">' +
      '<div class="mix-split-box">' +
      '<div class="mix-split-desc">Blend our single-estate micro-lots in a single order. Fine-tune your bottle split during checkout.</div>' +
      '<div class="mix-badges-row">' +
      '<span class="mix-badge">✨ Custom Bottle Split</span>' +
      '<span class="mix-badge">☕ Multi-Fermentation Styles</span>' +
      '<span class="mix-badge">⚡ Available Across All Packs</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  container.innerHTML = html;
}
// --------------------------------------------------------------------
function validateWizardStep(stepNum) {
  if (stepNum === 1) {
    const qtyInput = document.getElementById('packQty');
    const qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
    const errQty = document.getElementById('errQty');
    const isValid = !isNaN(qty) && qty >= 1;
    setFieldState(qtyInput, errQty, isValid);
    
    const totalBottles = getTotalBottles();
    const isUnderCapacity = totalBottles <= liveRemainingBatchBottles;
    const errCap = document.getElementById('errCapacityLimit');
    if (errCap) {
      if (!isUnderCapacity) {
        errCap.textContent = `⚠️ Selected order (${totalBottles} bottles) exceeds remaining batch capacity (${liveRemainingBatchBottles} bottles left). Please reduce quantity or select a smaller pack.`;
        errCap.style.display = 'block';
      } else {
        errCap.style.display = 'none';
      }
    }
    return isValid && isUnderCapacity;
  }
  if (stepNum === 2) {
    const isNameValid = validateField('custName');
    const isEmailValid = validateEmailField();
    const isPhoneValid = validatePhoneField();
    const isAddressValid = validateField('custAddress');
    const isPinValid = validatePincodeField();
    const isCompanyValid = (PAGE === 'CORPORATE' || PAGE === 'OFFICE') ? validateField('custCompany') : true;
    const isGstinValid = (PAGE === 'CORPORATE' || PAGE === 'OFFICE') ? validateGstinField() : true;
    
    let isSlotValid = true;
    if (PAGE === 'CORPORATE' || PAGE === 'OFFICE') {
      const parkSelect = document.getElementById('b2bTechPark');
      const windowSelect = document.getElementById('b2bDeliveryWindow');
      if (parkSelect && windowSelect) {
        const park = parkSelect.value;
        const win = windowSelect.value;
        const cluster = availableClusters.find(c => normalizeStr(c.techPark) === normalizeStr(park) && normalizeStr(c.window) === normalizeStr(win));
        if (cluster && cluster.isFull) {
          isSlotValid = false;
          const alertEl = document.getElementById('slotStatusAlert');
          if (alertEl) {
            alertEl.textContent = `⚠️ Selected delivery slot is fully booked. Please choose another window.`;
            alertEl.className = 'slot-status-alert slot-full';
            alertEl.style.display = 'block';
          }
        }
      }
    }
    return isNameValid && isEmailValid && isPhoneValid && isAddressValid && isPinValid && isCompanyValid && isGstinValid && isSlotValid;
  }
  return true;
}

function nextWizardStep(targetStep) {
  if (targetStep > currentWizardStep) {
    for (let s = currentWizardStep; s < targetStep; s++) {
      if (!validateWizardStep(s)) {
        alert('Please complete the required information before continuing.');
        return;
      }
    }
  }
  goToWizardStep(targetStep);
}

function goToWizardStep(stepNum) {
  if (stepNum < 1 || stepNum > 3) return;
  if (stepNum > currentWizardStep && !validateWizardStep(currentWizardStep)) {
    return;
  }
  
  currentWizardStep = stepNum;
  
  // When entering Step 1, ensure splitter UI matches selected pack size
  if (stepNum === 1 && isCustomSplit) {
    rebalanceSplitter();
  }
  
  // Show / Hide Step Panels
  for (let i = 1; i <= 3; i++) {
    const panel = document.getElementById(`stepPanel${i}`);
    if (panel) panel.style.display = (i === stepNum) ? 'block' : 'none';
  }
  
  // Update Progress Nodes & Connecting Lines
  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById(`wNode${i}`);
    const line = document.getElementById(`wLine${i}`);
    
    if (node) {
      node.classList.remove('node-active', 'node-completed');
      if (i === stepNum) {
        node.classList.add('node-active');
      } else if (i < stepNum) {
        node.classList.add('node-completed');
      }
    }
    
    if (line) {
      line.classList.toggle('line-completed', i < stepNum);
    }
  }
  
  if (stepNum === 3) {
    populateOrderReview();
  }
  
  window.scrollTo({ top: 120, behavior: 'smooth' });
}
// Multi-Step Ordering Wizard Engine (Step Navigation & Validation)
// --------------------------------------------------------------------

function populateOrderReview() {
  const isB2b = (PAGE === 'CORPORATE' || PAGE === 'OFFICE');
  const activePack = isB2b ? selectedB2bPack : selectedB2cPack;
  const qty = parseInt(document.getElementById('packQty')?.value, 10) || 1;
  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  
  const lot1Name = availableLots[0] ? availableLots[0].name : "Lot 1";
  const lot2Name = availableLots[1] ? availableLots[1].name : "Lot 2";
  const coffeeLotDisplay = isCustomSplit ? getMixSplitSummary() : selectedBean;
  
  const name = (document.getElementById('custName')?.value || '').trim();
  const address = (document.getElementById('custAddress')?.value || '').trim();
  const pin = (document.getElementById('custPincode')?.value || '').trim();
  const location = isB2b ? (document.getElementById('b2bTechPark')?.value || '') : (document.getElementById('custCity')?.value || '');
  
  const b2cDaySelect = document.getElementById('b2cDeliveryDay');
  const b2cDayVal = b2cDaySelect ? b2cDaySelect.value : "Saturday Morning (8:00 AM – 11:00 AM)";
  const deliveryWindow = isB2b ? (document.getElementById('b2bDeliveryWindow')?.value || '') : b2cDayVal;
  const dropDate = isB2b ? getUpcomingFridayFormatted() : getUpcomingB2cDropDate(b2cDayVal);
  const company = (document.getElementById('custCompany')?.value || '').trim();
  
  const revBean = document.getElementById('revBean');
  const revPack = document.getElementById('revPack');
  const revDate = document.getElementById('revDate');
  const revWindow = document.getElementById('revWindow');
  const revAddress = document.getElementById('revAddress');
  const revCustomer = document.getElementById('revCustomer');
  const revCompany = document.getElementById('revCompany');
  const revDiscountRow = document.getElementById('revDiscountRow');
  const revDiscount = document.getElementById('revDiscount');
  const revTotal = document.getElementById('revTotal');
  
  if (revBean) revBean.textContent = coffeeLotDisplay;
  if (revPack) revPack.textContent = `${activePack.name} x ${qty} (${activePack.bottles * qty} bottles)`;
  if (revDate) revDate.textContent = `${dropDate} (${deliveryWindow})`;
  if (revWindow) revWindow.textContent = deliveryWindow;
  if (revAddress) revAddress.textContent = `${address}, ${location} (PIN: ${pin})`;
  if (revCustomer) revCustomer.textContent = name;
  if (revCompany) revCompany.textContent = company || 'N/A';
  
  if (discount > 0) {
    if (revDiscountRow) revDiscountRow.style.display = 'flex';
    if (revDiscount) revDiscount.textContent = `-₹${discount.toLocaleString('en-IN')} (${appliedCoupon.code})`;
  } else {
    if (revDiscountRow) revDiscountRow.style.display = 'none';
  }
  
  if (revTotal) revTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
}

// Dynamic Date Calculations
function getUpcomingFridayFormatted() {
  const d = new Date();
  let days = (5 - d.getDay() + 7) % 7;
  if (days === 0 && d.getHours() >= 12) days = 7;
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getUpcomingB2cDropDate(slotStr) {
  const d = new Date();
  const isSunday = slotStr && (slotStr.includes('Sun') || slotStr.includes('Sunday'));
  const targetDay = isSunday ? 0 : 6; // 0 = Sunday, 6 = Saturday
  
  let days = (targetDay - d.getDay() + 7) % 7;
  if (days === 0 && d.getHours() >= 10) days = 7;
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getUpcomingSaturdayFormatted() {
  return getUpcomingB2cDropDate('Saturday');
}

function renderClusterOptions() {
  const parkSelect = document.getElementById('b2bTechPark');
  if (!parkSelect) return;
  
  const currentSelection = parkSelect.value;
  const uniqueParks = [...new Set(availableClusters.map(c => c.techPark))];
  
  const defaultExtras = [
    "Cyber Park / Sector 67 (Gurugram)",
    "Udyog Vihar Phases 1-5 (Gurugram)",
    "Noida Sector 62 / 126 / 135 Tech Parks",
    "South / Central Delhi Office Area",
    "Other Commercial Complex"
  ];
  defaultExtras.forEach(p => {
    if (!uniqueParks.includes(p)) uniqueParks.push(p);
  });
  
  let html = '';
  uniqueParks.forEach(p => {
    const isSelected = p === currentSelection;
    html += `<option value="${p}" ${isSelected ? 'selected' : ''}>${p}</option>`;
  });
  parkSelect.innerHTML = html;
  
  updateDeliveryWindows();
}

function updateDeliveryWindows() {
  const parkSelect = document.getElementById('b2bTechPark');
  const windowSelect = document.getElementById('b2bDeliveryWindow');
  const alertEl = document.getElementById('slotStatusAlert');
  if (!parkSelect || !windowSelect) return;
  
  const selectedPark = parkSelect.value;
  const matchingClusters = availableClusters.filter(c => normalizeStr(c.techPark) === normalizeStr(selectedPark));
  
  let windowsToRender = matchingClusters;
  if (matchingClusters.length === 0) {
    windowsToRender = [
      { window: "Morning Kickoff (9:30 AM – 11:30 AM)", maxOrders: 25, remainingOrders: 25, isFull: false },
      { window: "Afternoon Recharge (2:00 PM – 4:00 PM)", maxOrders: 25, remainingOrders: 25, isFull: false }
    ];
  }
  
  const currentWindowVal = windowSelect.value;
  let html = '';
  let hasAvailableSlot = false;
  
  windowsToRender.forEach(w => {
    const isFull = w.isFull === true || (typeof w.remainingOrders === 'number' && w.remainingOrders <= 0);
    const isSelected = normalizeStr(w.window) === normalizeStr(currentWindowVal) && !isFull;
    if (!isFull) hasAvailableSlot = true;
  
    if (isFull) {
      html += `<option value="${w.window}" disabled>${w.window} — Slot Full (Sold Out)</option>`;
    } else {
      const remainingLabel = typeof w.remainingOrders === 'number' ? ` (${w.remainingOrders} slot${w.remainingOrders === 1 ? '' : 's'} left)` : '';
      html += `<option value="${w.window}" ${isSelected ? 'selected' : ''}>${w.window}${remainingLabel}</option>`;
    }
  });
  
  windowSelect.innerHTML = html;
  
  const activeSelectedWindow = windowSelect.value;
  const activeCluster = matchingClusters.find(c => normalizeStr(c.window) === normalizeStr(activeSelectedWindow));
  
  if (alertEl) {
    if (!hasAvailableSlot && matchingClusters.length > 0) {
      alertEl.textContent = `⚠️ All delivery slots for ${selectedPark} are fully booked for this Friday drop. Please select another tech park.`;
      alertEl.className = 'slot-status-alert slot-full';
      alertEl.style.display = 'block';
    } else if (activeCluster) {
      if (activeCluster.isFull) {
        alertEl.textContent = `⚠️ The selected delivery slot is full. Please choose another delivery window.`;
        alertEl.className = 'slot-status-alert slot-full';
        alertEl.style.display = 'block';
      } else {
        alertEl.textContent = `⚡ ${activeCluster.remainingOrders} of ${activeCluster.maxOrders} slots remaining for Friday drop.`;
        alertEl.className = 'slot-status-alert slot-available';
        alertEl.style.display = 'block';
      }
    } else {
      alertEl.style.display = 'none';
    }
  }
}

// --------------------------------------------------------------------
// Dynamic Menu & Config Rendering (Data-Driven from Google Sheets)
// --------------------------------------------------------------------
function renderLots(lots) {
  if (!Array.isArray(lots) || lots.length === 0) lots = availableLots;
  availableLots = lots;
  
  const lotGrid = document.getElementById('lotGrid');
  if (!lotGrid) return;
  
  let html = '';
  lots.forEach((lot, idx) => {
    const fullName = `${lot.name} (${lot.process})`;
    const isFirstActive = idx === 0 && !isCustomSplit;
    const pillsHtml = (lot.pills || []).map(p => `<span class="flavor-pill">${p}</span>`).join('');
    const isSoldOut = lot.isSoldOut === true || (typeof lot.remainingBottles === 'number' && lot.remainingBottles <= 0);
    const soldOutTag = isSoldOut ? `<span class="sold-out-tag" style="background:#e63946; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">SOLD OUT</span>` : '';
    const clickHandler = isSoldOut ? '' : `onclick="selectLot('${fullName}', this)"`;
    
    html += `
      <div class="lot-card ${isFirstActive && !isSoldOut ? 'active' : ''} ${isSoldOut ? 'lot-sold-out' : ''}" style="${isSoldOut ? 'opacity:0.5; cursor:not-allowed;' : ''}" ${clickHandler}>
        <div class="lot-header">
          <span class="lot-name">${lot.name} ${soldOutTag}</span>
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
  
  // 3rd Option: Mix & Match
if (PAGE !== 'MENU' && PAGE !== 'ORDERS') {
    const l1 = lots[0] || { name: "Ratnagiri Estate", process: "Anaerobic Naturals" };
    const l2 = lots[1] || { name: "Banana Banger", process: "Fermented Lot" };
    
    html += `
      <div class="lot-card ${isCustomSplit ? 'active' : ''}" onclick="selectLot('Mix & Match', this)">
        <div class="lot-header">
          <span class="lot-name">Mix & Match</span>
          <span class="lot-tag">Custom split</span>
        </div>
        <div class="lot-notes">&#127915; Curious about trying both single-estate harvests? Customize your exact split in Batch Size</div>
        <div class="flavor-pills">
          <span class="flavor-pill">Bit of both</span>
          <span class="flavor-pill">Customised</span>
          <span class="flavor-pill">Your Choice</span>
        </div>
      </div>`;
  
    const l1Name = document.getElementById('splitLot1Name');
    const l1Sub = document.getElementById('splitLot1Sub');
    const l2Name = document.getElementById('splitLot2Name');
    const l2Sub = document.getElementById('splitLot2Sub');
  
    if (l1Name) l1Name.textContent = l1.name;
    if (l1Sub) l1Sub.textContent = l1.process;
    if (l2Name) l2Name.textContent = l2.name;
    if (l2Sub) l2Sub.textContent = l2.process;
  }
  
  lotGrid.innerHTML = html;
  
  if (!isCustomSplit && lots[0] && !lots[0].isSoldOut) {
    selectedBean = `${lots[0].name} (${lots[0].process})`;
  }
}

function renderPacks(b2cPacks, b2bPacks) {
  if ((PAGE === 'PERSONAL' || PAGE === 'ORDER' || PAGE === 'HOME') && Array.isArray(b2cPacks) && b2cPacks.length > 0) {
    availableB2cPacks = b2cPacks;
    const b2cGrid = document.getElementById('b2cPacks');
    if (b2cGrid) {
      let b2cHtml = '';
      let hasDefault = false;
      let fallback = null;
  
      b2cPacks.forEach((p) => {
        const isOverCap = p.bottles > liveRemainingBatchBottles;
        if (!isOverCap && !fallback) fallback = p;
        const isSelected = p.name === selectedB2cPack.name && !isOverCap;
        if (isSelected) hasDefault = true;
  
        const badgeHtml = p.badge ? `<div class="pack-badge">${p.badge}</div>` : '';
        const disabledBadge = isOverCap ? `<div class="pack-disabled-badge">Cap Exceeded</div>` : '';
        const perBottle = p.bottles > 1 ? ` (@ ₹${Math.round(p.price / p.bottles)})` : '';
        const clickHandler = isOverCap ? '' : `onclick="selectB2cPack('${p.name}', ${p.bottles}, ${p.price}, this)"`;
  
        b2cHtml += `
          <div class="pack-option ${isSelected ? 'active' : ''} ${isOverCap ? 'pack-disabled' : ''}" ${clickHandler}>
            ${disabledBadge}
            ${badgeHtml}
            <div class="pack-name">${p.name}</div>
            <div class="pack-price">₹${p.price.toLocaleString('en-IN')}</div>
            <div class="pack-desc">${p.bottles}x 200ml${perBottle}</div>
          </div>`;
      });
      b2cGrid.innerHTML = b2cHtml;
  
      if (!hasDefault && fallback) {
        selectedB2cPack = { name: fallback.name, bottles: fallback.bottles, unitPrice: fallback.price };
      }
    }
  }
  
  if ((PAGE === 'CORPORATE' || PAGE === 'OFFICE') && Array.isArray(b2bPacks) && b2bPacks.length > 0) {
    availableB2bPacks = b2bPacks;
    const b2bGrid = document.getElementById('b2bPacks');
    if (b2bGrid) {
      let b2bHtml = '';
      let hasDefault = false;
      let fallback = null;
  
      b2bPacks.forEach((p) => {
        const isOverCap = p.bottles > liveRemainingBatchBottles;
        if (!isOverCap && !fallback) fallback = p;
        const isSelected = p.name === selectedB2bPack.name && !isOverCap;
        if (isSelected) hasDefault = true;
  
        const disabledBadge = isOverCap ? `<div class="pack-disabled-badge">Cap Exceeded</div>` : '';
        const perBottle = ` (₹${Math.round(p.price / p.bottles)}/ea)`;
        const clickHandler = isOverCap ? '' : `onclick="selectB2bPack('${p.name}', ${p.bottles}, ${p.price}, this)"`;
  
        b2bHtml += `
          <div class="pack-option ${isSelected ? 'active' : ''} ${isOverCap ? 'pack-disabled' : ''}" ${clickHandler}>
            ${disabledBadge}
            <div class="pack-name">${p.name}</div>
            <div class="pack-price">₹${p.price.toLocaleString('en-IN')}</div>
            <div class="pack-desc">${p.bottles}x 200ml${perBottle}</div>
          </div>`;
      });
      b2bGrid.innerHTML = b2bHtml;
  
      if (!hasDefault && fallback) {
        selectedB2bPack = { name: fallback.name, bottles: fallback.bottles, unitPrice: fallback.price };
      }
    }
  }
}


function selectLot(lotName, element) {
  document.querySelectorAll('#lotGrid .lot-card').forEach(el => el.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  } else if (lotName) {
    document.querySelectorAll('#lotGrid .lot-card').forEach(card => {
      const nameEl = card.querySelector('.lot-name');
      const cardText = (nameEl ? nameEl.textContent : card.textContent) || '';
      if (lotName.includes('Mix & Match') && cardText.includes('Mix & Match')) {
        card.classList.add('active');
      } else if (normalizeStr(cardText).includes(normalizeStr(lotName.split('(')[0]))) {
        card.classList.add('active');
      }
    });
  }

  isCustomSplit = (lotName === 'Mix & Match' || (lotName && lotName.toLowerCase().includes('mix')));
  if (!isCustomSplit && lotName) {
    selectedBean = lotName;
  }
  
  const customSplitter = document.getElementById('customSplitter');
  if (customSplitter) {
    customSplitter.style.display = isCustomSplit ? 'block' : 'none';
  }
  if (isCustomSplit) {
    rebalanceSplitter();
  }
  updateTotal();
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

function applyStoreStatus(status) {
  currentStoreStatus = (status || 'OPEN').toUpperCase();
  const banner = document.getElementById('storeStatusBanner');
  const payBtn = document.getElementById('payNowBtn');
  const btnText = document.getElementById('btnText');
  
  if (currentStoreStatus === 'PAUSED') {
    if (banner) {
      banner.textContent = '⚠️ Pre-orders are currently paused by the brewery. Batch in preparation.';
      banner.style.display = 'block';
    }
    if (payBtn) payBtn.disabled = true;
    if (btnText) btnText.innerHTML = '&#128683; Pre-Orders Temporarily Paused';
  } else if (currentStoreStatus === 'SOLD_OUT') {
    if (banner) {
      banner.textContent = '⚡ Batch Capacity Reached (Sold Out). Next drop opens Monday.';
      banner.style.display = 'block';
    }
    if (payBtn) payBtn.disabled = true;
    if (btnText) btnText.innerHTML = '&#128683; Sold Out for This Drop';
  } else {
    if (banner) banner.style.display = 'none';
    if (payBtn) payBtn.disabled = false;
    updateTotal();
  }
}

function applyConfigToUI(data) {
  if (!data || data.action === 'track') return;

  const isB2b = (PAGE === 'CORPORATE' || PAGE === 'OFFICE' || currentMode === 'B2B');
  const cap = isB2b ? (data.b2bBatchCapacity || 200) : (data.b2cBatchCapacity || 150);
  const resCount = isB2b ? (data.b2bReservedBottles || 0) : (data.b2cReservedBottles || 0);
  const remBottles = isB2b ? data.b2bRemainingBatchBottles : data.b2cRemainingBatchBottles;

  liveRemainingBatchBottles = typeof remBottles === 'number' ? remBottles : Math.max(0, cap - resCount);

  const scarcityText = document.getElementById('scarcityText');
  const scarcityFill = document.getElementById('scarcityFill');

  if (scarcityText) {
    scarcityText.textContent = `${resCount} / ${cap} Bottles Reserved`;
  }
  if (scarcityFill) {
    const pct = Math.min(Math.round((resCount / cap) * 100), 100);
    scarcityFill.style.transform = `scaleX(${pct / 100})`;
  }

  if (data.lots) {
    data.lots.forEach(l => {
      if (l.isActive === undefined) l.isActive = true;
    });
    availableLots = data.lots;
    if (typeof renderLots === 'function') renderLots(data.lots);
    if (PAGE === 'ORDERS') renderHarvestGateway(data.lots);
    if (PAGE === 'FLAVOR' || PAGE === 'MENU') {
      renderFlavorPage(data.lots);
      renderQuizUI(data.lots);
    }
  }

  if (data.quizConfig) {
    liveQuizConfig = data.quizConfig;
    if (PAGE === 'FLAVOR' || PAGE === 'MENU') {
      renderQuizUI(availableLots, data.quizConfig);
      updateQuizRecommendation();
    }
  }
  if (data.b2cPacks || data.b2bPacks) {
    if (typeof renderPacks === 'function') renderPacks(data.b2cPacks, data.b2bPacks);
  }

  if (Array.isArray(data.coupons) && data.coupons.length > 0) {
    availableCoupons = data.coupons;
  }

  if ((PAGE === 'CORPORATE' || PAGE === 'OFFICE') && Array.isArray(data.clusters) && data.clusters.length > 0) {
    availableClusters = data.clusters;
    if (typeof renderClusterOptions === 'function') renderClusterOptions();
  }

  const isFull = isB2b ? (data.isB2bBatchFull === true || resCount >= cap) : (data.isB2cBatchFull === true || resCount >= cap);
  if (isFull) {
    applyStoreStatus('SOLD_OUT');
  } else if (data.storeStatus) {
    applyStoreStatus(data.storeStatus);
  }

  if (typeof updateTotal === 'function') updateTotal();
  if (isCustomSplit && typeof rebalanceSplitter === 'function') rebalanceSplitter();


  if (aboutB2cCapText && typeof data.b2cRemainingBottles === "number") {
    const total = data.b2cBatchCapacity || 150;
    const remaining = data.b2cRemainingBottles;
    const pct = Math.max(5, Math.min(100, (remaining / total) * 100));
    aboutB2cCapText.textContent = `${remaining} / ${total} Bottles Available`;
    if (aboutB2cBar) aboutB2cBar.style.width = `${pct}%`;
  }

  if (aboutB2bCapText && typeof data.b2bRemainingBottles === "number") {
    const total = data.b2bBatchCapacity || 200;
    const remaining = data.b2bRemainingBottles;
    const pct = Math.max(5, Math.min(100, (remaining / total) * 100));
    aboutB2bCapText.textContent = `${remaining} / ${total} Bottles Available`;
    if (aboutB2bBar) aboutB2bBar.style.width = `${pct}%`;
  }
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
      if (data && data.status === 'success' && !data.action) {
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
    const target = new Date();
    let daysUntilFri = (5 - now.getDay() + 7) % 7;
    if (daysUntilFri === 0 && now.getHours() >= 22) daysUntilFri = 7;
    target.setDate(now.getDate() + daysUntilFri);
    target.setHours(22, 0, 0, 0);
    const diff = target - now;
    if (diff <= 0) {
      timerEl.textContent = "⚡ Cutoff reached for next batch. Orders queue for following drop.";
      return;
    }
  
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
  
    const cutoffLabel = "Weekend Drop Cutoff";
    timerEl.textContent = `⏱️ ${cutoffLabel} closes in ${hours}h ${mins}m ${secs}s`;
  }
  
  updateTimer();
  setInterval(updateTimer, 1000);
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
  const qtyInput = document.getElementById('packQty');
  let qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
  if (isNaN(qty) || qty < 1) qty = 1;
  const active = (PAGE === 'CORPORATE' || PAGE === 'OFFICE' || currentMode === 'B2B') ? selectedB2bPack : selectedB2cPack;
  return (active && active.unitPrice ? active.unitPrice : 0) * qty;
}

function recalculateCouponDiscount(subtotal) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.type === 'PERCENT') {
    return Math.round((subtotal * appliedCoupon.value) / 100);
  } else {
    return Math.min(appliedCoupon.value, subtotal);
  }
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

function applyCoupon() {
  const inputEl = document.getElementById('couponInput');
  const statusEl = document.getElementById('couponStatus');
  const btnRemove = document.getElementById('btnRemoveCoupon');
  const btnApply = document.getElementById('btnApplyCoupon');
  if (!inputEl) return;
  
  const rawCode = inputEl.value.trim().toUpperCase();
  inputEl.value = rawCode;
  
  if (!rawCode) {
    if (statusEl) {
      statusEl.textContent = 'Please enter a coupon code.';
      statusEl.className = 'coupon-status coupon-invalid';
      statusEl.style.display = 'block';
    }
    return;
  }
  
  const subtotal = calculateSubtotal();
  const coupon = availableCoupons.find(c => c.code.toUpperCase() === rawCode);
  
  if (!coupon) {
    if (statusEl) {
      statusEl.textContent = `✕ Coupon "${rawCode}" is not valid.`;
      statusEl.className = 'coupon-status coupon-invalid';
      statusEl.style.display = 'block';
    }
    appliedCoupon = null;
    if (btnRemove) btnRemove.style.display = 'none';
    if (btnApply) btnApply.style.display = 'inline-block';
    updateTotal();
    return;
  }
  
  const couponMode = (coupon.mode || 'ALL').toUpperCase();
  const targetCheck = (PAGE === 'CORPORATE' || PAGE === 'OFFICE' || currentMode === 'B2B') ? 'B2B' : 'B2C';
  if (couponMode !== 'ALL' && couponMode !== targetCheck) {
    const targetMode = couponMode === 'B2C' ? 'individual pre-orders (B2C)' : 'corporate office drops (B2B)';
    if (statusEl) {
      statusEl.textContent = `✕ Coupon "${coupon.code}" is valid only for ${targetMode}.`;
      statusEl.className = 'coupon-status coupon-invalid';
      statusEl.style.display = 'block';
    }
    appliedCoupon = null;
    if (btnRemove) btnRemove.style.display = 'none';
    if (btnApply) btnApply.style.display = 'inline-block';
    updateTotal();
    return;
  }
  
  const minOrder = parseFloat(coupon.minOrder) || 0;
  if (subtotal < minOrder) {
    if (statusEl) {
      statusEl.textContent = `✕ Minimum order of ₹${minOrder.toLocaleString('en-IN')} required for coupon "${coupon.code}". (Current subtotal: ₹${subtotal.toLocaleString('en-IN')})`;
      statusEl.className = 'coupon-status coupon-invalid';
      statusEl.style.display = 'block';
    }
    appliedCoupon = null;
    if (btnRemove) btnRemove.style.display = 'none';
    if (btnApply) btnApply.style.display = 'inline-block';
    updateTotal();
    return;
  }
  
  const discountVal = coupon.type === 'PERCENT' 
    ? Math.round((subtotal * coupon.value) / 100)
    : Math.min(coupon.value, subtotal);
  
  appliedCoupon = {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: discountVal
  };
  
  if (statusEl) {
    const desc = coupon.type === 'PERCENT' ? `${coupon.value}% off` : `₹${coupon.value} off`;
    statusEl.textContent = `✓ Coupon "${coupon.code}" applied! (${desc}, saving ₹${discountVal.toLocaleString('en-IN')})`;
    statusEl.className = 'coupon-status coupon-valid';
    statusEl.style.display = 'block';
  }
  
  if (btnApply) btnApply.style.display = 'none';
  if (btnRemove) btnRemove.style.display = 'inline-block';
  
  updateTotal();
}

function removeCoupon() {
  appliedCoupon = null;
  const inputEl = document.getElementById('couponInput');
  const statusEl = document.getElementById('couponStatus');
  const btnRemove = document.getElementById('btnRemoveCoupon');
  const btnApply = document.getElementById('btnApplyCoupon');
  
  if (inputEl) inputEl.value = '';
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.style.display = 'none';
  }
  if (btnRemove) btnRemove.style.display = 'none';
  if (btnApply) btnApply.style.display = 'inline-block';
  
  updateTotal();
}

function updateTotal() {
  const subtotal = calculateSubtotal();
  const totalBottles = getTotalBottles();
  const errCap = document.getElementById('errCapacityLimit');
  const btnStep1Next = document.getElementById('btnStep1Next') || document.getElementById('btnStep2Next');
  const payBtn = document.getElementById('payNowBtn');
  
  if (totalBottles > liveRemainingBatchBottles) {
    if (errCap) {
      errCap.textContent = `⚠️ Selected order (${totalBottles} bottles) exceeds remaining batch capacity (${liveRemainingBatchBottles} bottles left). Please reduce quantity or select a smaller pack.`;
      errCap.style.display = 'block';
    }
    if (btnStep1Next) btnStep1Next.disabled = true;
    if (payBtn) payBtn.disabled = true;
  } else {
    if (errCap) errCap.style.display = 'none';
    if (btnStep1Next) btnStep1Next.disabled = false;
    if (payBtn && currentStoreStatus === 'OPEN') payBtn.disabled = false;
  }
  
  const total = calculateTotal();
  const formattedTotal = `₹${total.toLocaleString('en-IN')}`;
  const formattedSubtotal = `₹${subtotal.toLocaleString('en-IN')}`;
  
  const totalDisplay = document.getElementById('totalAmountDisplay');
  const subtotalDisplay = document.getElementById('subtotalDisplay');
  const discountDisplay = document.getElementById('discountDisplay');
  const discountLabel = document.getElementById('discountLabel');
  const summaryBreakdown = document.getElementById('summaryBreakdown');
  const btnAmount = document.getElementById('btnAmount');
  const btnText = document.getElementById('btnText');
  const statusEl = document.getElementById('couponStatus');
  
  if (appliedCoupon) {
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === appliedCoupon.code);
    const minOrder = coupon ? (parseFloat(coupon.minOrder) || 0) : 0;
    if (subtotal < minOrder) {
      if (statusEl) {
        statusEl.textContent = `⚠️ Subtotal dropped below ₹${minOrder} minimum. Coupon removed.`;
        statusEl.className = 'coupon-status coupon-invalid';
        statusEl.style.display = 'block';
      }
      appliedCoupon = null;
      const btnRemove = document.getElementById('btnRemoveCoupon');
      const btnApply = document.getElementById('btnApplyCoupon');
      if (btnRemove) btnRemove.style.display = 'none';
      if (btnApply) btnApply.style.display = 'inline-block';
    }
  }
  
  if (summaryBreakdown) {
    if (appliedCoupon && appliedCoupon.discount > 0) {
      summaryBreakdown.style.display = 'flex';
      if (subtotalDisplay) subtotalDisplay.textContent = formattedSubtotal;
      if (discountDisplay) discountDisplay.textContent = `-₹${appliedCoupon.discount.toLocaleString('en-IN')}`;
      if (discountLabel) discountLabel.textContent = `Promo Discount (${appliedCoupon.code}):`;
    } else {
      summaryBreakdown.style.display = 'none';
    }
  }
  
  if (totalDisplay) totalDisplay.textContent = formattedTotal;
  if (btnAmount) btnAmount.textContent = formattedTotal;
  
  if (btnText && currentStoreStatus === 'OPEN') {
    if ((PAGE === 'CORPORATE' || PAGE === 'OFFICE') && currentB2bPayOption === 'INVOICE') {
      btnText.innerHTML = `📄 Request Corporate Invoice (<span id="btnAmount">${formattedTotal}</span>)`;
    } else if (PAGE === 'CORPORATE' || PAGE === 'OFFICE') {
      btnText.innerHTML = `💳 Pay & Confirm Office Batch (<span id="btnAmount">${formattedTotal}</span>)`;
    } else {
      btnText.innerHTML = `💳 Pay & Confirm Pre-Order (<span id="btnAmount">${formattedTotal}</span>)`;
    }
  }
  
  if (isCustomSplit) rebalanceSplitter();
}

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
    const profile = cachedProfile || JSON.parse(localStorage.getItem('tabc_customer_profile') || '{}');
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
  
      validateWizardStep(3);
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
    return setFieldState(el, errEl, (PAGE !== 'CORPORATE' && PAGE !== 'OFFICE') || val.length >= 2);
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
  const emailRegex = /^[a-zA-Z0-9._%+-\\\]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

function handlePayClick() {
  if (currentStoreStatus === 'PAUSED' || currentStoreStatus === 'SOLD_OUT') {
    alert('Pre-orders are currently closed for this drop.');
    return;
  }
  
  if (!validateWizardStep(1) || !validateWizardStep(2)) {
    return;
  }
  
  if ((PAGE === 'CORPORATE' || PAGE === 'OFFICE') && currentB2bPayOption === 'INVOICE') {
    const invId = "INV-REQ-" + Math.floor(100000 + Math.random() * 900000);
    handleOrderSuccess(invId, 'Corporate Invoice Requested (Net Terms)');
    return;
  }
  
  const total = calculateTotal();
  const name = (document.getElementById('custName')?.value || '').trim();
  const email = (document.getElementById('custEmail')?.value || '').trim();
  const phone = (document.getElementById('custPhone')?.value || '').trim();
  const activePack = (PAGE === 'CORPORATE' || PAGE === 'OFFICE') ? selectedB2bPack : selectedB2cPack;
  
  if (CONFIG.razorpayKeyId && !CONFIG.razorpayKeyId.includes("YOUR_RAZORPAY")) {
    const options = {
      key: CONFIG.razorpayKeyId,
      amount: total * 100,
      currency: "INR",
      name: "The Apartment Brew Co.",
      description: `${(PAGE === 'CORPORATE' || PAGE === 'OFFICE') ? 'Office Drop' : 'Pre-Order'}: ${activePack.name}`,
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
  const subtotal = calculateSubtotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const couponCode = appliedCoupon ? appliedCoupon.code : 'NONE';
  const total = calculateTotal();
  const isB2b = (PAGE === 'CORPORATE' || PAGE === 'OFFICE');
  const activePack = isB2b ? selectedB2bPack : selectedB2cPack;
  const dropInstructions = document.getElementById('dropInstructions')?.value || 'Deliver directly to door / desk';
  
  const b2cDaySelect = document.getElementById('b2cDeliveryDay');
  const b2cDayVal = b2cDaySelect ? b2cDaySelect.value : "Saturday Morning (8:00 AM – 11:00 AM)";
  const deliveryWindow = isB2b ? (document.getElementById('b2bDeliveryWindow')?.value || '') : b2cDayVal;
  const dropDate = isB2b ? getUpcomingFridayFormatted() : getUpcomingB2cDropDate(b2cDayVal);
  
  const orderId = isB2b ? "TABC-B2B-" + Math.floor(100000 + Math.random() * 900000) : "TABC-" + Math.floor(100000 + Math.random() * 900000);
  const location = isB2b ? (document.getElementById('b2bTechPark')?.value || '') : (document.getElementById('custCity')?.value || '');
  const company = isB2b ? ((document.getElementById('custCompany')?.value || '').trim() || "N/A") : "N/A";
  const gstin = isB2b ? ((document.getElementById('custGstin')?.value || '').trim() || "N/A") : "N/A";
  const buildingFloor = (document.getElementById('custAddress')?.value || '').trim();
  const paymentMode = isB2b ? (currentB2bPayOption === 'INVOICE' ? "Corporate Invoice (Net Terms)" : "Razorpay Gateway") : "Razorpay Gateway";
  
  const lot1Name = availableLots[0] ? availableLots[0].name : "Lot 1";
  const lot2Name = availableLots[1] ? availableLots[1].name : "Lot 2";
  
  const coffeeLotDisplay = isCustomSplit ? getMixSplitSummary() : selectedBean;
  
  const orderPayload = {
    authToken: CONFIG.authToken,
    botTrap: "",
    orderType: isB2b ? 'B2B' : 'B2C',
    targetSheet: isB2b ? 'B2B Orders' : 'Sheet1',
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
    deliveryStatus: 'Pre-Ordered',
    notes: (isB2b ? (currentB2bPayOption === 'INVOICE' ? `Invoice Ref: ${paymentId} (Net Terms)` : `Payment ID: ${paymentId}`) : `Payment ID: ${paymentId}`) + (discount > 0 ? ` | Coupon: ${couponCode} (-₹${discount})` : '')
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
  const rSubtotalRow = document.getElementById('rSubtotalRow');
  const rSubtotal = document.getElementById('rSubtotal');
  const rDiscountRow = document.getElementById('rDiscountRow');
  const rDiscount = document.getElementById('rDiscount');
  const linkTrackOrder = document.getElementById('linkTrackOrder');
  
  if (rOrderId) rOrderId.textContent = orderId;
  if (rOrderType) rOrderType.textContent = isB2b ? 'Corporate Office Drop (Fri Drop)' : 'Individual Pre-Order (' + deliveryWindow + ')';
  if (rCompanyRow) rCompanyRow.style.display = isB2b ? 'flex' : 'none';
  if (isB2b && rCompany) rCompany.textContent = company;
  if (rWindowRow) rWindowRow.style.display = 'flex';
  if (rWindow) rWindow.textContent = deliveryWindow;
  
  if (rPayId) rPayId.textContent = paymentId;
  if (rDropDate) rDropDate.textContent = `${dropDate} (${deliveryWindow})`;
  if (rName) rName.textContent = name;
  if (rEmail) rEmail.textContent = email;
  if (rBean) rBean.textContent = coffeeLotDisplay;
  if (rPack) rPack.textContent = `${activePack.name} x ${qty} (${activePack.bottles * qty} bottles)`;
  if (rTotal) rTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  
  if (discount > 0) {
    if (rSubtotalRow) rSubtotalRow.style.display = 'flex';
    if (rSubtotal) rSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    if (rDiscountRow) rDiscountRow.style.display = 'flex';
    if (rDiscount) rDiscount.textContent = `-₹${discount.toLocaleString('en-IN')} (${couponCode})`;
  } else {
    if (rSubtotalRow) rSubtotalRow.style.display = 'none';
    if (rDiscountRow) rDiscountRow.style.display = 'none';
  }
  
  if (linkTrackOrder) {
    linkTrackOrder.href = `/track?orderId=${encodeURIComponent(orderId)}`;
  }
  
  const orderFormView = document.getElementById('orderFormView');
  const confirmationView = document.getElementById('confirmationView');
  if (orderFormView) orderFormView.style.display = 'none';
  if (confirmationView) confirmationView.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------------------------
// Custom Requirements & Event Catering Controller
// --------------------------------------------------------------------
function validateInqField(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return true;
  const val = el.value.trim();
  let errId = 'err' + fieldId.charAt(0).toUpperCase() + fieldId.slice(1);
  let errEl = document.getElementById(errId);
  return setFieldState(el, errEl, val.length >= 2);
}

function validateInqEmail() {
  const el = document.getElementById('inqEmail');
  const errEl = document.getElementById('errInqEmail');
  if (!el) return true;
  const val = el.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return setFieldState(el, errEl, emailRegex.test(val));
}

function validateInqPhone() {
  const el = document.getElementById('inqPhone');
  const errEl = document.getElementById('errInqPhone');
  if (!el) return true;
  let raw = el.value.replace(/[^0-9]/g, '');
  const isValid = raw.length >= 8 && raw.length <= 15;
  return setFieldState(el, errEl, isValid);
}

// --------------------------------------------------------------------
// Custom Event Intake Wizard Controller (events.html)
// --------------------------------------------------------------------
let currentInqStep = 1;

function validateInqStep(stepNum) {
  if (stepNum === 1) {
    return validateInqField('inqCompany');
  }
  if (stepNum === 2) {
    const isDateValid = validateInqField('inqDate');
    const isNameValid = validateInqField('inqName');
    const isEmailValid = validateInqEmail();
    const isPhoneValid = validateInqPhone();
    return isDateValid && isNameValid && isEmailValid && isPhoneValid;
  }
  return true;
}

function nextInqStep(targetStep) {
  if (targetStep > currentInqStep) {
    for (let s = currentInqStep; s < targetStep; s++) {
      if (!validateInqStep(s)) {
        alert('Please fill in all required fields (* marked) before continuing.');
        return;
      }
    }
  }
  goToInqStep(targetStep);
}

function goToInqStep(stepNum) {
  if (stepNum < 1 || stepNum > 3) return;
  if (stepNum > currentInqStep) {
    for (let s = currentInqStep; s < stepNum; s++) {
      if (!validateInqStep(s)) {
        return;
      }
    }
  }

  currentInqStep = stepNum;

  for (let i = 1; i <= 3; i++) {
    const panel = document.getElementById(`stepPanel${i}`);
    if (panel) panel.style.display = (i === stepNum) ? 'block' : 'none';
  }

  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById(`wNode${i}`);
    const line = document.getElementById(`wLine${i}`);

    if (node) {
      node.classList.remove('node-active', 'node-completed');
      if (i === stepNum) {
        node.classList.add('node-active');
      } else if (i < stepNum) {
        node.classList.add('node-completed');
      }
    }

    if (line) {
      line.classList.toggle('line-completed', i < stepNum);
    }
  }

  if (stepNum === 3) {
    populateInqReview();
  }

  window.scrollTo({ top: 120, behavior: 'smooth' });
}

function populateInqReview() {
  const comp = (document.getElementById('inqCompany')?.value || '').trim();
  const reqType = document.getElementById('inqType')?.value || 'Event Catering';
  const headcount = document.getElementById('inqHeadcount')?.value || '20–50 people';
  const blend = document.getElementById('inqBlend')?.value || 'Dual Discovery Flight';
  const date = (document.getElementById('inqDate')?.value || '').trim();
  const loc = (document.getElementById('inqLocation')?.value || '').trim() || 'Gurugram / NCR';
  const name = (document.getElementById('inqName')?.value || '').trim();
  const email = (document.getElementById('inqEmail')?.value || '').trim();
  const phone = (document.getElementById('inqPhone')?.value || '').trim();
  const notes = (document.getElementById('inqNotes')?.value || '').trim();

  const revComp = document.getElementById('revInqCompany');
  const revType = document.getElementById('revInqType');
  const revHead = document.getElementById('revInqHeadcount');
  const revBlend = document.getElementById('revInqBlend');
  const revDate = document.getElementById('revInqDate');
  const revLoc = document.getElementById('revInqLocation');
  const revContact = document.getElementById('revInqContact');
  const revEmailPhone = document.getElementById('revInqEmailPhone');
  const revNotes = document.getElementById('revInqNotes');
  const revNotesRow = document.getElementById('revInqNotesRow');

  if (revComp) revComp.textContent = comp || '-';
  if (revType) revType.textContent = reqType;
  if (revHead) revHead.textContent = headcount;
  if (revBlend) revBlend.textContent = blend;
  if (revDate) revDate.textContent = date || '-';
  if (revLoc) revLoc.textContent = loc;
  if (revContact) revContact.textContent = name || '-';
  if (revEmailPhone) revEmailPhone.textContent = `${email} • ${phone}`;

  if (revNotes && revNotesRow) {
    if (notes) {
      revNotes.textContent = notes;
      revNotesRow.style.display = 'flex';
    } else {
      revNotesRow.style.display = 'none';
    }
  }
}

function handleCustomInquirySubmit() {
  if (!validateInqStep(1) || !validateInqStep(2)) {
    alert('Please fill in all required fields (* marked) before submitting your custom request.');
    return;
  }

  const comp = (document.getElementById('inqCompany')?.value || '').trim();
  const name = (document.getElementById('inqName')?.value || '').trim();
  const email = (document.getElementById('inqEmail')?.value || '').trim();
  const phone = (document.getElementById('inqPhone')?.value || '').trim();
  const reqType = document.getElementById('inqType')?.value || 'Event Catering';
  const headcount = document.getElementById('inqHeadcount')?.value || '20–50 people';
  const blend = document.getElementById('inqBlend')?.value || 'Dual Discovery Flight';
  const date = (document.getElementById('inqDate')?.value || '').trim();
  const loc = (document.getElementById('inqLocation')?.value || '').trim() || 'Gurugram / NCR';
  const notes = (document.getElementById('inqNotes')?.value || '').trim();

  const inqId = "TABC-EVT-" + Math.floor(100000 + Math.random() * 900000);
  const btnSubmit = document.getElementById('btnSubmitCustom');
  const statusMsg = document.getElementById('inqStatusMsg');

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>⏳ Submitting Inquiry...</span>';
  }
  if (statusMsg) {
    statusMsg.textContent = '⏳ Dispatching requirement to curation team...';
    statusMsg.className = 'track-status-msg msg-info';
    statusMsg.style.display = 'block';
  }

  const inqPayload = {
    authToken: CONFIG.authToken,
    botTrap: "",
    orderType: "CUSTOM_EVENT",
    targetSheet: "Custom & Event Inquiries",
    orderId: inqId,
    company: comp,
    name: name,
    email: email,
    phone: phone,
    requirementType: reqType,
    headcount: headcount,
    coffeeBlend: blend,
    eventDate: date,
    location: loc,
    notes: notes
  };

  const whatsappMsg = `Hi Apartment Brew Co., I just submitted a custom event inquiry on your website!\n\n*Inquiry ID:* ${inqId}\n*Company / Event:* ${comp}\n*Requirement:* ${reqType}\n*Scale:* ${headcount}\n*Coffee Blend:* ${blend}\n*Target Date:* ${date}\n*Contact:* ${name} (${phone})\n\nLooking forward to your proposal!`;
  const directWaUrl = `https://wa.me/919719510654?text=${encodeURIComponent(whatsappMsg)}`;

  if (CONFIG.googleSheetEndpoint && CONFIG.googleSheetEndpoint.startsWith('http')) {
    fetch(CONFIG.googleSheetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(inqPayload)
    }).then(res => res.text()).then(() => {
      renderInquirySuccess(inqId, name, comp, reqType, headcount, date, directWaUrl);
    }).catch(() => {
      renderInquirySuccess(inqId, name, comp, reqType, headcount, date, directWaUrl);
    });
  } else {
    setTimeout(() => {
      renderInquirySuccess(inqId, name, comp, reqType, headcount, date, directWaUrl);
    }, 600);
  }
}

function renderInquirySuccess(inqId, name, comp, reqType, headcount, date, waUrl) {
  const formSection = document.getElementById('customInquirySection');
  const confSection = document.getElementById('confirmationView');

  if (formSection) formSection.style.display = 'none';
  if (confSection) {
    const rId = document.getElementById('rInqId');
    const rComp = document.getElementById('rInqCompany');
    const rType = document.getElementById('rInqType');
    const rScale = document.getElementById('rInqScale');
    const rDate = document.getElementById('rInqDate');
    const rName = document.getElementById('rInqName');
    const linkWa = document.getElementById('linkInqWa');
    const linkTrack = document.getElementById('linkInqTrack');

    if (rId) rId.textContent = inqId;
    if (rComp) rComp.textContent = comp || '-';
    if (rType) rType.textContent = reqType;
    if (rScale) rScale.textContent = headcount || '-';
    if (rDate) rDate.textContent = date || '-';
    if (rName) rName.textContent = name || '-';
    if (linkWa) linkWa.href = waUrl;
    if (linkTrack) linkTrack.href = `/track?orderId=${encodeURIComponent(inqId)}`;

    confSection.style.display = 'block';
  }

  window.scrollTo({ top: 80, behavior: 'smooth' });
}

function resetInqForm() {
  const formSection = document.getElementById('customInquirySection');
  const confSection = document.getElementById('confirmationView');
  const btnSubmit = document.getElementById('btnSubmitCustom');

  if (formSection) formSection.style.display = 'block';
  if (confSection) confSection.style.display = 'none';
  if (btnSubmit) {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<span id="btnCustomText">&#128233; Submit Custom Request</span>';
  }

  ['inqCompany', 'inqName', 'inqEmail', 'inqPhone', 'inqDate', 'inqLocation', 'inqNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
    const errId = 'err' + id.charAt(0).toUpperCase() + id.slice(1);
    const errEl = document.getElementById(errId);
    if (el) el.classList.remove('input-error');
    if (errEl) errEl.style.display = 'none';
  });

  const statusMsg = document.getElementById('inqStatusMsg');
  if (statusMsg) statusMsg.style.display = 'none';

  goToInqStep(1);
}
// --------------------------------------------------------------------
// Customer Self-Service Live Order Tracker Controller
// --------------------------------------------------------------------
function submitTrackOrder() {
  const input = document.getElementById('trackOrderIdInput');
  const statusMsg = document.getElementById('trackStatusMsg');
  const resultContainer = document.getElementById('trackerResult');
  const btnTrack = document.getElementById('btnSubmitTrack');
  
  if (!input) return;
  const rawId = input.value.trim().toUpperCase();
  input.value = rawId;
  
  if (!rawId) {
    if (statusMsg) {
      statusMsg.textContent = 'Please enter a valid Order or Inquiry ID (e.g. TABC-154359, TABC-B2B-287603, or TABC-EVT-804299).';
      statusMsg.className = 'track-status-msg msg-error';
      statusMsg.style.display = 'block';
    }
    if (resultContainer) resultContainer.style.display = 'none';
    return;
  }
  
  if (statusMsg) {
    statusMsg.textContent = '⏳ Querying brewing fulfillment log...';
    statusMsg.className = 'track-status-msg msg-info';
    statusMsg.style.display = 'block';
  }
  if (btnTrack) btnTrack.disabled = true;
  
  if (!CONFIG.googleSheetEndpoint || CONFIG.googleSheetEndpoint.includes("YOUR_GOOGLE_APPS")) {
    setTimeout(() => {
      if (btnTrack) btnTrack.disabled = false;
      if (currentOrderDetails && normalizeStr(currentOrderDetails.orderId) === normalizeStr(rawId)) {
        if (statusMsg) statusMsg.style.display = 'none';
        renderTrackingDetails(currentOrderDetails);
      } else {
        const isEvent = rawId.includes('EVT');
        const isB2b = rawId.includes('B2B');
        
        let mockOrder;
        if (isEvent) {
          mockOrder = {
            orderId: rawId,
            orderType: 'CUSTOM_EVENT',
            customerName: "Astitva Gupta",
            company: "Zomato HQ (Tech Meetup)",
            requirementType: "Hackathon / Townhall Bulk Drop",
            headcount: "100–250 people (150 bottles)",
            dropDate: "Fri, 4 Sep, 2026",
            deliveryAddress: "One Horizon Center, Golf Course Rd, Gurugram",
            deliveryWindow: "Target Date: Fri, 4 Sep, 2026",
            bean: "Hackathon / Townhall Bulk Drop",
            pack: "100–250 people (150 bottles)",
            totalAmount: 0,
            paymentStatus: "Custom Quote / In Discussion",
            deliveryStatus: "In Discussion",
            notes: "Special cold brew station setup with custom branded tasting cards."
          };
        } else if (isB2b) {
          mockOrder = {
            orderId: rawId,
            orderType: 'B2B',
            customerName: "Amr",
            company: "Cognizant Technology Solutions",
            deliveryAddress: "KALUA 9480, DLF Cyber City / Cyber Hub (Gurugram) (PIN: 122009)",
            dropInstructions: "Deliver directly to door / desk",
            deliveryWindow: "Morning Kickoff (9:30 AM – 11:30 AM)",
            dropDate: "Fri, 28 Aug, 2026",
            bean: "Ratnagiri Estate (Anaerobic Naturals)",
            pack: "Office Batch x 1 (20 bottles)",
            totalAmount: 3060,
            paymentStatus: "Corporate Invoice Requested (Net Terms)",
            deliveryStatus: "Pre-Ordered"
          };
        } else {
          mockOrder = {
            orderId: rawId,
            orderType: 'B2C',
            customerName: "Sarthak",
            company: "N/A",
            deliveryAddress: "Flat 402, DLF Phase 5, Gurugram (PIN: 122009)",
            dropInstructions: "Deliver directly to door / desk",
            deliveryWindow: "Saturday Morning (8:00 AM – 11:00 AM)",
            dropDate: getUpcomingSaturdayFormatted(),
            bean: "Ratnagiri Estate (Anaerobic Naturals)",
            pack: "Weekend Pack x 1 (4 bottles)",
            totalAmount: 899,
            paymentStatus: "Paid via Gateway",
            deliveryStatus: "Brewing"
          };
        }
        if (statusMsg) statusMsg.style.display = 'none';
        renderTrackingDetails(mockOrder);
      }
    }, 500);
    return;
  }
  
  const trackUrl = `${CONFIG.googleSheetEndpoint}?action=track&orderId=${encodeURIComponent(rawId)}`;
  
  fetch(trackUrl)
    .then(res => res.json())
    .then(data => {
      if (btnTrack) btnTrack.disabled = false;
      if (data && data.status === 'success' && data.order) {
        if (statusMsg) statusMsg.style.display = 'none';
        renderTrackingDetails(data.order);
      } else if (data && data.status === 'success' && !data.order && data.lots) {
        if (statusMsg) {
          statusMsg.innerHTML = `⚠️ <strong>Apps Script Update Needed:</strong> The live Web App is currently running an earlier script version. Please open Google Sheets > <strong>Extensions > Apps Script</strong>, paste the latest <a href="https://docs.google.com/document/d/1xyoq3YjMxTVK5XDSaZYNo2xBd7NT7bRk3g_iKl-hzCI/edit" target="_blank" style="color:var(--accent);">Code.gs</a>, and deploy as a <strong>New Version</strong>.`;
          statusMsg.className = 'track-status-msg msg-error';
          statusMsg.style.display = 'block';
        }
        if (resultContainer) resultContainer.style.display = 'none';
      } else {
        if (statusMsg) {
          statusMsg.textContent = data.message || `✕ No active order or inquiry found with ID "${rawId}". Please verify your ID.`;
          statusMsg.className = 'track-status-msg msg-error';
          statusMsg.style.display = 'block';
        }
        if (resultContainer) resultContainer.style.display = 'none';
      }
    })
    .catch(err => {
      if (btnTrack) btnTrack.disabled = false;
      if (statusMsg) {
        statusMsg.textContent = `⚠️ Network error checking status. Please check your connection and try again.`;
        statusMsg.className = 'track-status-msg msg-error';
        statusMsg.style.display = 'block';
      }
      if (resultContainer) resultContainer.style.display = 'none';
    });
}

function renderTrackingDetails(order) {
  const resultContainer = document.getElementById('trackerResult');
  if (!resultContainer) return;
  
  const isEvent = order.orderType === 'CUSTOM_EVENT' || (order.orderId && order.orderId.startsWith('TABC-EVT'));
  
  const sTitle1 = document.getElementById('stepTitle1');
  const sDesc1 = document.getElementById('stepDesc1');
  const sTitle2 = document.getElementById('stepTitle2');
  const sDesc2 = document.getElementById('stepDesc2');
  const sTitle3 = document.getElementById('stepTitle3');
  const sDesc3 = document.getElementById('stepDesc3');
  const sTitle4 = document.getElementById('stepTitle4');
  const sDesc4 = document.getElementById('stepDesc4');
  
  if (isEvent) {
    if (sTitle1) sTitle1.textContent = 'Inquiry Received';
    if (sDesc1) sDesc1.textContent = 'Requirement logged & queued for review';
    if (sTitle2) sTitle2.textContent = 'Proposal & Curation';
    if (sDesc2) sDesc2.textContent = 'Tasting menu, batch scale & pricing discussion';
    if (sTitle3) sTitle3.textContent = 'Event Confirmed';
    if (sDesc3) sDesc3.textContent = 'Date locked & brew extraction scheduled';
    if (sTitle4) sTitle4.textContent = 'Event Completed';
    if (sDesc4) sDesc4.textContent = 'Coffee bar served & fulfilled';
  } else {
    if (sTitle1) sTitle1.textContent = 'Pre-Ordered';
    if (sDesc1) sDesc1.textContent = 'Order confirmed & queued';
    if (sTitle2) sTitle2.textContent = 'Brewing';
    if (sDesc2) sDesc2.textContent = 'Hand-extracted & flash-chilled';
    if (sTitle3) sTitle3.textContent = 'Dispatched';
    if (sDesc3) sDesc3.textContent = 'Out for cold-chain delivery';
    if (sTitle4) sTitle4.textContent = 'Delivered';
    if (sDesc4) sDesc4.textContent = 'Enjoy fresh within 48 hours';
  }
  
  const lblCustomer = document.getElementById('lblCustomer');
  const lblCompany = document.getElementById('lblCompany');
  const lblDeliveryWindow = document.getElementById('lblDeliveryWindow');
  const lblDestination = document.getElementById('lblDestination');
  const lblDropNote = document.getElementById('lblDropNote');
  const lblBean = document.getElementById('lblBean');
  const lblPack = document.getElementById('lblPack');
  const lblPayment = document.getElementById('lblPayment');
  const tFreshnessNote = document.getElementById('tFreshnessNote');
  
  if (isEvent) {
    if (lblCustomer) lblCustomer.textContent = 'Contact Person:';
    if (lblCompany) lblCompany.textContent = 'Organization / Event:';
    if (lblDeliveryWindow) lblDeliveryWindow.textContent = 'Target Event Date:';
    if (lblDestination) lblDestination.textContent = 'Event Venue / Location:';
    if (lblBean) lblBean.textContent = 'Requirement Type:';
    if (lblPack) lblPack.textContent = 'Scale / Headcount:';
    if (lblPayment) lblPayment.textContent = 'Status Stage:';
    if (lblDropNote) lblDropNote.textContent = 'Special Notes:';
    if (tFreshnessNote) tFreshnessNote.innerHTML = '☕ <strong>Custom Event Protocol:</strong> Our coffee team will reach out directly to coordinate brew profiles and ice stations tailored to your venue.';
  } else {
    if (lblCustomer) lblCustomer.textContent = 'Customer:';
    if (lblCompany) lblCompany.textContent = 'Company:';
    if (lblDeliveryWindow) lblDeliveryWindow.textContent = 'Delivery Window:';
    if (lblDestination) lblDestination.textContent = 'Destination:';
    if (lblBean) lblBean.textContent = 'Coffee Selection:';
    if (lblPack) lblPack.textContent = 'Batch Size:';
    if (lblPayment) lblPayment.textContent = 'Payment:';
    if (lblDropNote) lblDropNote.textContent = 'Gate / Drop Note:';
    if (tFreshnessNote) tFreshnessNote.innerHTML = '&#10052; <strong>48-Hour Freshness Window:</strong> Keep refrigerated upon delivery and consume within 48 hours for peak tasting notes!';
  }
  
  const tBadge = document.getElementById('tBadgeStatus');
  const tOrderId = document.getElementById('tOrderId');
  const tCustomer = document.getElementById('tCustomer');
  const tCompanyRow = document.getElementById('tCompanyRow');
  const tCompany = document.getElementById('tCompany');
  const tWindow = document.getElementById('tDeliveryWindow');
  const tDestination = document.getElementById('tDestination');
  const tDropNote = document.getElementById('tDropNote');
  const tDropNoteRow = document.getElementById('tDropNoteRow');
  const tBean = document.getElementById('tBean');
  const tPack = document.getElementById('tPack');
  const tPayment = document.getElementById('tPayment');
  
  if (tOrderId) tOrderId.textContent = order.orderId;
  if (tCustomer) tCustomer.textContent = order.customerName || 'Valued Customer';
  if (tWindow) tWindow.textContent = isEvent ? (order.dropDate || 'Date TBD') : `${order.dropDate}`;
  if (tDestination) tDestination.textContent = order.deliveryAddress || order.location || 'Gurugram / Delhi NCR';
  
  if (order.notes) {
    if (tDropNote) tDropNote.textContent = order.notes;
    if (tDropNoteRow) tDropNoteRow.style.display = 'flex';
  } else if (!isEvent && order.dropInstructions) {
    if (tDropNote) tDropNote.textContent = order.dropInstructions;
    if (tDropNoteRow) tDropNoteRow.style.display = 'flex';
  } else {
    if (tDropNoteRow) tDropNoteRow.style.display = isEvent ? 'none' : 'flex';
    if (tDropNote) tDropNote.textContent = 'Deliver directly to door / desk';
  }
  
  if (tBean) tBean.textContent = isEvent ? (order.requirementType || order.bean) : order.bean;
  if (tPack) tPack.textContent = isEvent ? (order.headcount || order.pack) : order.pack;
  if (tPayment) tPayment.textContent = order.paymentStatus || (isEvent ? 'Inquiry / Proposal Phase' : 'Confirmed');
  
  if (tCompanyRow) {
    if (order.company && order.company !== 'N/A') {
      tCompanyRow.style.display = 'flex';
      if (tCompany) tCompany.textContent = order.company;
    } else {
      tCompanyRow.style.display = 'none';
    }
  }
  
  const sPre = document.getElementById('stepPreOrdered');
  const sBrew = document.getElementById('stepBrewing');
  const sDisp = document.getElementById('stepDispatched');
  const sDelv = document.getElementById('stepDelivered');
  const l1 = document.getElementById('line1');
  const l2 = document.getElementById('line2');
  const l3 = document.getElementById('line3');
  
  [sPre, sBrew, sDisp, sDelv].forEach(s => {
    if (s) s.className = 'stepper-step';
  });
  [l1, l2, l3].forEach(l => {
    if (l) l.className = 'stepper-line';
  });
  
  const status = normalizeStr(order.deliveryStatus || 'Pre-Ordered');
  
  if (isEvent) {
    if (status.includes('complete') || status === 'delivered' || status.includes('fulfilled') || status.includes('done')) {
      if (sPre) sPre.classList.add('step-completed');
      if (l1) l1.classList.add('line-completed');
      if (sBrew) sBrew.classList.add('step-completed');
      if (l2) l2.classList.add('line-completed');
      if (sDisp) sDisp.classList.add('step-completed');
      if (l3) l3.classList.add('line-completed');
      if (sDelv) sDelv.classList.add('step-completed');
      if (tBadge) {
        tBadge.textContent = 'EVENT COMPLETED';
        tBadge.className = 'tracker-badge status-delivered';
      }
    } else if (status.includes('confirm') || status.includes('booked') || status.includes('scheduled') || status.includes('locked')) {
      if (sPre) sPre.classList.add('step-completed');
      if (l1) l1.classList.add('line-completed');
      if (sBrew) sBrew.classList.add('step-completed');
      if (l2) l2.classList.add('line-completed');
      if (sDisp) sDisp.classList.add('step-active');
      if (tBadge) {
        tBadge.textContent = 'EVENT CONFIRMED';
        tBadge.className = 'tracker-badge status-dispatched';
      }
    } else if (status.includes('discussion') || status.includes('quote') || status.includes('proposal') || status.includes('curat') || status.includes('review')) {
      if (sPre) sPre.classList.add('step-completed');
      if (l1) l1.classList.add('line-completed');
      if (sBrew) sBrew.classList.add('step-active');
      if (tBadge) {
        tBadge.textContent = 'PROPOSAL & CURATION';
        tBadge.className = 'tracker-badge status-brewing';
      }
    } else {
      if (sPre) sPre.classList.add('step-active');
      if (tBadge) {
        tBadge.textContent = 'INQUIRY RECEIVED';
        tBadge.className = 'tracker-badge status-preordered';
      }
    }
  } else {
    if (status.includes('out for delivery') || status.includes('transit') || status.includes('dispatch') || status.includes('shipped') || status.includes('on the way')) {
      if (sPre) sPre.classList.add('step-completed');
      if (l1) l1.classList.add('line-completed');
      if (sBrew) sBrew.classList.add('step-completed');
      if (l2) l2.classList.add('line-completed');
      if (sDisp) sDisp.classList.add('step-active');
      if (tBadge) {
        tBadge.textContent = 'OUT FOR DELIVERY';
        tBadge.className = 'tracker-badge status-dispatched';
      }
    } else if (status === 'delivered' || status.includes('complete') || status.includes('fulfilled') || status.includes('received by customer')) {
      if (sPre) sPre.classList.add('step-completed');
      if (l1) l1.classList.add('line-completed');
      if (sBrew) sBrew.classList.add('step-completed');
      if (l2) l2.classList.add('line-completed');
      if (sDisp) sDisp.classList.add('step-completed');
      if (l3) l3.classList.add('line-completed');
      if (sDelv) sDelv.classList.add('step-completed');
      if (tBadge) {
        tBadge.textContent = 'DELIVERED';
        tBadge.className = 'tracker-badge status-delivered';
      }
    } else if (status.includes('brew') || status.includes('extract') || status.includes('prep') || status.includes('chill')) {
      if (sPre) sPre.classList.add('step-completed');
      if (l1) l1.classList.add('line-completed');
      if (sBrew) sBrew.classList.add('step-active');
      if (tBadge) {
        tBadge.textContent = 'BREWING & CHILLING';
        tBadge.className = 'tracker-badge status-brewing';
      }
    } else {
      if (sPre) sPre.classList.add('step-active');
      if (tBadge) {
        tBadge.textContent = 'PRE-ORDERED';
        tBadge.className = 'tracker-badge status-preordered';
      }
    }
  }
  
  resultContainer.style.display = 'block';
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
  const isB2b = (d.orderType === 'B2B');
  const title = encodeURIComponent(isB2b ? `The Apartment Brew Co. Office Drop: ${d.company}` : `The Apartment Brew Co. Drop (${d.orderId})`);
  const details = encodeURIComponent(`Fresh Flash-Brew Specialty Coffee Drop\nOrder ID: ${d.orderId}\nLot: ${d.bean}\nSelection: ${d.pack}\nInstruction: ${d.dropInstructions}\nTotal: ₹${d.totalAmount}\n\nNote: Please refrigerate upon delivery and enjoy within 48 hours for peak flavor!`);
  const location = encodeURIComponent(`${d.buildingFloor}, ${d.techPark} (PIN: ${d.pinCode})`);
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  window.open(gcalUrl, '_blank');
}

function sendWhatsAppReceipt() {
  if (!currentOrderDetails) return;
  const d = currentOrderDetails;
  
  const discountText = d.discountAmount && d.discountAmount > 0 
    ? `\*Discount:\* -₹${d.discountAmount} (${d.couponCode})\n` 
    : '';
  
  const message = `\*☕ ORDER & DELIVERY CONFIRMATION — THE APARTMENT BREW CO.\*\n` +
                  `------------------------------------\n` +
                  `\*Order ID:\* ${d.orderId}\n` +
                  `\*Delivery Date:\* ${d.dropDate} (${d.deliveryWindow})\n` +
                  `\*Customer:\* ${d.name} (${d.phone})\n` +
                  `\*Delivery Address:\* ${d.buildingFloor}, ${d.techPark}\n` +
                  `\*Drop Note:\* ${d.dropInstructions}\n` +
                  `------------------------------------\n` +
                  `\*Coffee Lot:\* ${d.bean}\n` +
                  `\*Selection:\* ${d.pack}\n` +
                  discountText +
                  `\*Total Bottles:\* ${d.bottles} bottles\n` +
                  `\*Total Paid:\* ₹${d.totalAmount} (${d.paymentStatus})\n` +
                  `------------------------------------\n` +
                  `\_Freshness Reminder: Extracted hot and flash-chilled with zero preservatives. Please refrigerate and consume within 48 hours!\_`;
  
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
  
  const fields = ['custName', 'custEmail', 'custPhone', 'custAddress', 'custPincode', 'custCompany', 'custGstin', 'inqCompany', 'inqName', 'inqEmail', 'inqPhone', 'inqDate', 'inqLocation', 'inqNotes'];
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
  goToWizardStep(1);
}

// --------------------------------------------------------------------
// Page Initialization Dispatcher
// --------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  highlightActiveDrawerLink();
  // Auto-select lot from URL parameter if arriving from orders.html gateway
  const urlParams = new URLSearchParams(window.location.search);
  const beanParam = urlParams.get('bean') || urlParams.get('lot');
  
  if (PAGE === 'PERSONAL' || PAGE === 'ORDER') {
    startCutoffCountdown();
    renderLots(availableLots);
    renderPacks(availableB2cPacks, []);
    initHarvestFromUrl();
    updateTotal();
    goToWizardStep(1);
    fetchLiveConfig();
    setInterval(fetchLiveConfig, 30000);
    
  } else if (PAGE === 'CORPORATE' || PAGE === 'OFFICE') {
    startCutoffCountdown();
    renderLots(availableLots);
    renderPacks([], availableB2bPacks);
    renderClusterOptions();
    initHarvestFromUrl();
    updateTotal();
    goToWizardStep(1);
    fetchLiveConfig();
    setInterval(fetchLiveConfig, 30000);
  } else if (PAGE === 'ORDERS') {
    renderHarvestGateway();
    fetchLiveConfig();
  } else if (PAGE === 'INDEX') {
    startCutoffCountdown();
    fetchLiveConfig();
    setInterval(fetchLiveConfig, 30000);
  } else if (PAGE === 'FLAVOR' || PAGE === 'MENU') {
    renderFlavorPage(availableLots);
    fetchLiveConfig();
    renderQuizUI(availableLots);
    updateQuizRecommendation();
  } else if (PAGE === "ABOUT") {
    fetchLiveConfig();
    setInterval(fetchLiveConfig, 30000);
  } else if (PAGE === 'TRACK') {
    goToInqStep(1);
    const urlParams = new URLSearchParams(window.location.search);
    const qId = urlParams.get('orderId') || urlParams.get('id');
    if (qId) {
      const input = document.getElementById('trackOrderIdInput');
      if (input) input.value = qId;
      submitTrackOrder();
    }
  }
});
