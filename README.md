# ☕ The Apartment Brew Co. — System & Operations Manual

### **Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR**

[![Platform](https://img.shields.io/badge/Platform-GitHub%20Pages%20%7C%20Static-gold?style=flat-square)](https://github.com/)
[![Backend](https://img.shields.io/badge/Backend-Google%20Apps%20Script%20%28Serverless%29-blue?style=flat-square)](https://script.google.com/)
[![Database](https://img.shields.io/badge/CMS%20%26%20Database-Google%20Sheets-success?style=flat-square)](https://sheets.google.com/)
[![Payment](https://img.shields.io/badge/Payments-Razorpay%20%7C%20Net--7%20Invoicing-orange?style=flat-square)](https://razorpay.com/)
[![Bottles](https://img.shields.io/badge/Form%20Factor-200ml%20Amber%20Glass-brown?style=flat-square)]()
[![Routing](https://img.shields.io/badge/Routing-Clean%20Extensionless%20URLs-blueviolet?style=flat-square)]()

A modern, serverless e-commerce and interactive sensory platform built for scheduled micro-batch craft coffee drops, headless Google Sheets CMS synchronization, Razorpay payment processing, corporate Net-7 invoicing, dynamic N-lot discovery flights, interactive sensory radar visualizations, and self-service order tracking. 

All coffee across retail, corporate, and catering tiers is standardized into recyclable **200ml glass bottles** extracted hot (92–94°C) and instantly flash-chilled to 4°C with zero preservatives.

---

## 📑 Table of Contents

1. [Craft Philosophy & Operations](#1-craft-philosophy--operations)
2. [Platform Architecture & Data Flow](#2-platform-architecture--data-flow)
3. [Portal Directory & Clean-URL Routing](#3-portal-directory--clean-url-routing)
4. [Interactive Frontend Engines](#4-interactive-frontend-engines)
5. [Headless CMS Schema (Google Sheets)](#5-headless-cms-schema-google-sheets)
6. [Database Schema & Order Ledgers](#6-database-schema--order-ledgers)
7. [Self-Service Order Tracking State Machine](#7-self-service-order-tracking-state-machine)
8. [Brewery Operational SOP & Drop Cycles](#8-brewery-operational-sop--drop-cycles)
9. [Deployment & Environment Configuration](#9-deployment--environment-configuration)
10. [Security, Performance & Resilience Guardrails](#10-security-performance--resilience-guardrails)

---

## **1\. Craft Philosophy & Operations**

### **1.1 The Micro-Batch Manifesto**

* **Hot Extraction & Rapid Thermal Shock:** Coffee is hand-extracted hot at 92–94°C to dissolve delicate floral aromatics, complex fruit acids, and natural sugars, then immediately flash-chilled over ice directly to 4°C to seal volatile aroma compounds before oxidation occurs.  
* **100% Preservative-Free:** Zero artificial stabilizers, chemical additives, or high-heat industrial pasteurization.  
* **48-Hour Peak Flavor Window:** Formulated strictly for peak sensory enjoyment within 48 hours of brewing when kept refrigerated (≤4°C).  
* **Single-Estate Terroir:** Small-batch roastery curation celebrating high-elevation micro-lots from Chikmagalur, Shevaroys Hills, and the Western & Eastern Ghats.

### **1.2 Dual Delivery Model & Scheduled Cutoffs**

| Fulfillment Stream | Target Audience | Delivery Windows | Order Cutoff | Pricing & Packs |
| :---- | :---- | :---- | :---- | :---- |
| **🏠 B2C Residential Drop** (`/personal`) | Gurugram & Delhi NCR homes | **Saturday Morning** (8:00 AM – 11:00 AM)**Sunday Morning** (8:00 AM – 11:00 AM) | **Friday 10:00 PM** | Single (₹240), Duo (₹480), Weekend 4-Pack (₹899), Mega 6-Pack (₹1,200) |
| **🏢 B2B Corporate Drop** (`/corporate`) | Tech parks & commercial offices | **Friday Morning Kickoff** (9:30 AM – 11:30 AM)**Friday Afternoon Recharge** (2:00 PM – 4:00 PM) | **Thursday 6:00 PM** | Team 10-Pack (₹1,800), Office 20-Pack (₹3,400), Floor 40-Pack (₹6,000), Townhall 60-Pack (₹8,700) |
| **🎪 Event Catering** (`/events`) | Hackathons, pop-up bars & summits | Custom Scheduled Dates | **7 Days Prior** | Custom Single-Estate Curation & Co-Branded Labeling |

\---

## **2\. Platform Architecture & Data Flow**

```
+-----------------------------------------------------------------------------------+
|                            CLIENT BROWSER (Static PWA)                             |
|                                                                                   |
|  [ index.html ]   [ orders.html ]   [ personal.html ]   [ corporate.html ]        |
|  [ flavor.html ]  [ guide.html ]    [ about.html ]      [ events.html ]   [ track.html ]
|                                                                                   |
|                         Shared Frontend Controller (app.js)                       |
|   * SWR Caching (localStorage)            * Dynamic N-Lot Mix Splitter Engine     |
|   * Dynamic Radar & Spectrum Visualizer   * Sheets-Driven 2-Question Quiz Engine  |
|   * Multi-Step Wizard State Machine       * Razorpay Standard Checkout SDK        |
+----------------------------------------+------------------------------------------+
                                         |
                       Fetch API (GET / POST JSON)
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     SERVERLESS BACKEND (Google Apps Script)                       |
|                                                                                   |
|                                     Code.gs                                       |
|   * doGet(e):                                                                     |
|       - Action 'track': Queries B2C/B2B/Event sheets & returns timeline state.    |
|       - Action 'config' (Default): Parses Menu & Config (Lots, Packs, Clusters,   |
|         Coupons, Live Capacities, Quiz Questions & Combination Matrix).           |
|   * doPost(e):                                                                    |
|       - Validates auth token, sanitize inputs, prevents bot spam.                 |
|       - Appends order rows to Sheet1 (B2C), B2B Orders, or Event Inquiries.       |
|       - Dispatches HTML receipt emails via MailApp.                               |
+----------------------------------------+------------------------------------------+
                                         |
                        Google Spreadsheet REST / Service
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                   HEADLESS DATABASE (Live Order Tracker Sheet)                    |
|                                                                                   |
|  [ Menu & Config ]     -> Dynamic CMS (18-col Lots, Packs, Quiz Matrix, Clusters) |
|  [ Sheet1 ]            -> B2C Order Ledger (Timestamp, ID, Address, Status, Notes)|
|  [ B2B Orders ]        -> Corporate Order Ledger (GSTIN, Tech Park, Invoice Refs) |
|  [ Event Inquiries ]   -> Catering Leads & Bar Booking Pipeline                   |
|  [ Operational SOP ]   -> Roastery Brew Guide, Thermal Shock & Packing Specs      |
+-----------------------------------------------------------------------------------+
```

\---

## **3\. Portal Directory & Clean-URL Routing**

The platform uses clean, extensionless routing across 9 dedicated portals:

```
├── /                    (index.html)     -> Hero landing, weekend countdown, batch scarcity, FAQ accordion
├── /orders              (orders.html)    -> Visual Harvest Discovery Gateway with dynamic cards, swatches & meters
├── /personal            (personal.html)  -> B2C residential pre-order wizard with dynamic N-lot bottle splitter
├── /corporate           (corporate.html) -> B2B Friday office drop wizard with tech park clusters & Net-7 invoicing
├── /flavor              (flavor.html)    -> Dynamic 5-axis sensory radar, spectrum comparison & sheet-driven quiz
├── /guide               (guide.html)     -> 48-hour freshness protocol, rapid thermal shock & serving rituals
├── /about               (about.html)     -> Story so far, craft manifesto, big bold stats & live roastery capacity
├── /events              (events.html)    -> Corporate coffee bar catering, hackathon drops & bulk lead wizard
├── /track               (track.html)     -> Self-service 4-step real-time order and event inquiry tracking portal
├── /style.css           (style.css)      -> Universal stylesheet (Dark artisanal theme, gold gradient accents)
├── /app.js              (app.js)         -> Universal JavaScript controller and client-side state machine
├── /sw.js               (sw.js)          -> Service Worker for offline resilience & asset caching
└── /assets/             (assets/)        -> Standalone gold emblem SVG, favicons, banners & icons
```

\---

## **4\. Interactive Frontend Engines**

### **4.1 Visual Harvest Discovery Gateway (`orders.html`)**

* **100% Dynamic Cards:** Hydrated on load via `renderHarvestGateway()` using live data from Google Sheets.  
* **Color-Coded Swatch Pills:** Automatically maps flavor keywords to gradient swatches (`.swatch-berry`, `.swatch-stonefruit`, `.swatch-cacao`, `.swatch-blossom`, `.swatch-apple`, `.swatch-jasmine`).  
* **Roast & Fermentation Gauges:** Renders roast percentage bars, 72h anaerobic gradients, and mouthfeel viscosity meters (`🍷 Syrupy & Winey` vs `🍵 Tea-Like & Silky`).  
* **Active State Routing:** Expanding a card unlocks the **Personal Order** and **Corporate Order** destination cards, pre-configuring query parameters (`/personal?bean=LOT-01`).

### **4.2 Dynamic N-Lot Mix & Match Splitter Engine (`personal.html` & `corporate.html`)**

* **Multi-Lot Support:** Automatically scales to support any number of active lots in Google Sheets.  
* **Balanced Auto-Rebalance:** Divides the target batch volume evenly across active harvests upon opening.  
* **Zero-Sum Stepper:** Adjusting (`+` / `-`) any harvest automatically rebalances remaining lots so the total bottle allocation strictly equals the selected pack size.  
* **Multi-Segment Ratio Bar:** Dynamically renders color-coded progress segments representing each harvest's share in real time.  
* **Live Order Breakdown:** Compiles exact bottle splits into the order payload (e.g. `Mix & Match (2x Ratnagiri Estate + 1x Banana Banger + 1x Riverdale Estate)`).

### **4.3 Sheets-Driven 2-Question Flavor Matcher (`flavor.html`)**

* **Configurable from Google Sheets:** Questions, buttons, icons, and combination rules are parsed from the `Menu & Config` tab.  
* **Centered Swatch Tiles:** Responsive multi-line grid (`justify-content: center`) with tactile color-coded swatch cards.  
* **Rule-Based Decision Matrix (**`findQuizRuleMatch`): Matches answer pairs (e.g., `opt_morning` \+ `opt_berry` → `LOT-01`) with wildcard fallback (`*`), dynamically styling the result box and generating direct checkout buttons.

### **4.4 Interactive 5-Axis Sensory Radar (`flavor.html`)**

* **Mathematical Polygon Generation:** Computes regular pentagon trigonometric coordinates from 5 sensory axes (`acidity`, `aromatics`, `sweetness`, `body`, `clarity`).  
* **Multi-Lot Overlay & Isolation:** Clickable tabs allow customers to isolate single estates or view the multi-lot overlay with ambient glow.

\---

## **5\. Headless CMS Schema (Google Sheets)**

The **`Menu & Config`** tab in [The Apartment Brew Co. — Live Order Tracker](https://drive.google.com/open?id=1k4mRcFpbIVf3CLtzzGoXEvA_FM1Q70dMWKiBqQFZQ_4) acts as the real-time CMS backend:

### **5.1 General Settings**

| Setting Key | Example Value | Purpose |
| :---- | :---- | :---- |
| `Store Status` | `OPEN / PAUSED / SOLD_OUT` | Global web checkout switch |
| `Batch Capacity` | `500` | Total combined bottle brew capacity |
| `B2C Batch Capacity` | `200` | Residential weekend bottle volume cap |
| `B2B Batch Capacity` | `300` | Commercial Friday bottle volume cap |
| `Announcement Banner` | `Weekend Drops & Friday Office Drops` | Global header banner text |

### **5.2 Coffee Lots (18-Column Schema)**

```
Col 0:  Lot ID               (e.g., LOT-01)
Col 1:  Estate Name          (e.g., Ratnagiri Estate)
Col 2:  Region & Elevation   (e.g., Chikmagalur, Karnataka • 1,350m MASL)
Col 3:  Process Tag          (e.g., 72h Anaerobic Natural)
Col 4:  Tasting Notes        (e.g., Wild Raspberry, Ripe Stone Fruit & Dark Cacao Finish)
Col 5:  Emojis               (e.g., 🍇, 🍑, 🍫)
Col 6:  Flavor Pills         (e.g., Fruity, High Acidity, Winey Body, Morning Focus)
Col 7:  Roast Level %        (e.g., 45)
Col 8:  Fermentation Depth % (e.g., 80)
Col 9:  Acidity %            (e.g., 85)
Col 10: Body %               (e.g., 70)
Col 11: Sweetness %          (e.g., 80)
Col 12: Aromatics %          (e.g., 75)
Col 13: Clarity %            (e.g., 65)
Col 14: Process Story        (Narrative of farm processing and fermentation science)
Col 15: Pairing Rituals      (Best Time: 8:00 AM – 11:00 AM • Pairings: Sourdough toast...)
Col 16: Max Bottles          (e.g., 200)
Col 17: Active (TRUE/FALSE)  (Controls visibility on frontend)
```

### **5.3 Flavor Quiz Questions & Combination Matrix**

* **\--- FLAVOR QUIZ QUESTIONS & OPTIONS \---**  
  * `Question ID` (`Q1` / `Q2`) | `Question Title` | `Option Key` (`opt_morning`, `opt_berry`) | `Option Icon` (`🌅`, `🍇`) | `Option Label`  
* **\--- FLAVOR QUIZ COMBINATION RULES \---**  
  * `Q1 Option Key` | `Q2 Option Key` | `Matched Lot ID` (`LOT-01`, `LOT-02`, `LOT-03`, `MIX`) | `Badge Text` | `Custom Recommendation Note`

\---

## **6\. Database Schema & Order Ledgers**

### **6.1 B2C Residential Orders (`Sheet1`)**

| Col | Header | Description |
| :---- | :---- | :---- |
| **A** | `Order Timestamp` | ISO string timestamp |
| **B** | `Order ID` | Unique alphanumeric identifier (`TABC-XXXXXX`) |
| **C** | `Customer Name` | Primary contact name |
| **D** | `WhatsApp Number` | 10-digit mobile number for dispatch updates |
| **E** | `Email Address` | Customer receipt & notification address |
| **F** | `Delivery Address / Area` | Residence / Society / Tower details |
| **G** | `Delivery / Gate Instruction` | Concierge / Door / Security drop rules |
| **H** | `Delivery Date` | Saturday / Sunday drop date |
| **I** | `Delivery Window` | `Saturday Morning (8:00 AM – 11:00 AM)` / `Sunday Morning` |
| **J** | `Coffee Bean Lot` | Single-estate selection or custom split breakdown |
| **K** | `Pack Selected` | Single, Duo, Weekend Pack, Mega Weekender |
| **L** | `Quantity` | Number of packs ordered |
| **M** | `Total Bottles` | Computed bottle count |
| **N** | `Total Amount (₹)` | Final charged amount after discounts |
| **O** | `Payment Preference` | `Razorpay Gateway` |
| **P** | `Payment Status` | Gateway capture reference (`Paid via Gateway (pay_XXX)`) |
| **Q** | `Delivery Status` | `Pre-Ordered` → `Brewing` → `Dispatched` → `Delivered` |
| **R** | `Notes / UTR` | Payment ID, applied coupon discount breakdown |

### **6.2 B2B Corporate Orders (`B2B Orders`)**

Includes company name, GSTIN (for 18% Input Tax Credit), tech park cluster, Net-7 corporate invoicing references (`INV-REQ-XXXXXX`), and reception desk drop instructions.

### **6.3 Event Catering Inquiries (`Event Inquiries`)**

Captures corporate coffee bar bookings, pop-up events, estimated headcounts, venue locations, and lead management statuses (`New Lead` → `In Discussion` → `Event Confirmed` → `Event Completed`).  
\---

## **7\. Self-Service Order Tracking State Machine**

Customers track live orders in real time on `/track` via a 4-stage visual stepper:

```
+------------------+     +------------------------+     +--------------------+     +------------------+
|  1. Pre-Ordered  | --> | 2. Brewing & Chilling  | --> | 3. Out for Delivery| --> |   4. Delivered   |
+------------------+     +------------------------+     +--------------------+     +------------------+
| Order logged &   |     | Hot extraction (94°C)  |     | Dispatched in      |     | Dropped at door/ |
| batch scheduled. |     | & flash-chilled to 4°C |     | thermal cold-bags. |     | concierge desk.  |
+------------------+     +------------------------+     +--------------------+     +------------------+
```

* **Live Status Keywords:**  
  * **Stage 1 (Pre-Ordered):** `Pre-Ordered`, `Pending`, `Received`  
  * **Stage 2 (Brewing & Chilling):** `Brewing`, `Roasting`, `Extracting`, `Chilling`, `Prep`  
  * **Stage 3 (Out for Delivery):** `Dispatched`, `Out for Delivery`, `In Transit`, `Shipped`, `On the way`  
  * **Stage 4 (Delivered):** `Delivered`, `Completed`, `Fulfilled` (Starts 48-hour freshness clock)

\---

## **8\. Brewery Operational SOP & Drop Cycles**

### **8.1 Weekly Production Timeline**

* **Monday – Wednesday:** Headless CMS configuration, green coffee QC, estate allocation, and tech park cluster scheduling.  
* **Thursday 6:00 PM:** B2B Corporate Drop order cutoff. Production planning for Friday tech park runs.  
* **Friday 6:00 AM – 9:00 AM:** Hot extraction & flash chilling for Friday office morning kickoff & afternoon recharge.  
* **Friday 10:00 PM:** B2C Residential Drop order cutoff.  
* **Saturday & Sunday 5:30 AM – 7:30 AM:** Weekend batch extraction, ice shock chilling, 200ml bottle packaging, and dispatch across Delhi NCR.

\---

## **9\. Deployment & Environment Configuration**

### **9.1 Frontend Configuration (`app.js`)**

Update the `CONFIG` object in `app.js`:

```javascript
const CONFIG = {
  razorpayKeyId: "rzp_live_XXXXXXXXXXXXXX",
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbz.../exec",
  authToken: "TABC_SECURE_TOKEN_2026"
};
```

### **9.2 Apps Script Deployment (`Code.gs`)**

* Open the spreadsheet: [The Apartment Brew Co. — Live Order Tracker](https://drive.google.com/open?id=1k4mRcFpbIVf3CLtzzGoXEvA_FM1Q70dMWKiBqQFZQ_4).  
* Go to **Extensions \> Apps Script** and paste the code from `Code.gs`.  
* Click **Deploy \> Manage deployments \> Edit \> New version**.  
* Configure:  
  * **Execute as:** `Me`  
  * **Who has access:** `Anyone`  
* Copy the generated Web App URL (`.../exec`) into `app.js`.

\---

## **10\. Security, Performance & Resilience Guardrails**

* **Zero-Leak Bot Trap & Token Authorization:** All POST requests validate the internal auth token and reject hidden bot-trap fields.  
* **Stale-While-Revalidate (SWR):** UI components render immediately from cached `localStorage` while background polling refreshes live bottle counts without layout flashes.  
* **Guaranteed Order Intake:** Orders are recorded in sheets even if capacity limits are breached (flagged as `[Over-Capacity]` in the notes column for roastery review).  
* **Cross-Browser Verification:** Fully tested and AST-compiled under JavaScriptCore and modern browser engines with zero console syntax errors.

\---  
*Crafted with pride by The Apartment Brew Co. • Gurugram, India*

### 