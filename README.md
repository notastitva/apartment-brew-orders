# **☕ The Apartment Brew Co. — Web Portal & Order Intake System**

## **Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR**

A lightweight, high-performance, serverless e-commerce and order intake portal designed for scheduled micro-batch craft coffee drops, dynamic Google Sheets headless CMS configuration, direct payment gateway integration, live order tracking, and automated customer notifications.  
---

### **📌 1\. Overview & Business Model**

The Apartment Brew Co. operates an asset-light, pre-order only micro-batch craft coffee roastery:

* **Extraction & Peak Freshness:** Coffee is extracted hot to capture delicate floral and fruity aromatics and flash-chilled immediately over ice. 100% preservative-free with a strict 48-hour peak freshness window.  
* Dual Delivery Pathways:  
  * B2C (Individual Saturday Morning Drops): Pre-orders close Friday 10:00 PM; delivered Saturday 8:00 AM – 11:00 AM.  
  * B2B (Corporate Friday Office Drops): Orders close Thursday 6:00 PM; delivered Friday (Morning Kickoff 9:30–11:30 AM or Afternoon Recharge 2:00–4:00 PM).  
* Delivery Coverage: Hyper-local Delhi NCR (Gurugram DLF Phases 1–5, Cyber City, Golf Course Rd, Candor TechSpace, Udyog Vihar, Noida Tech Parks, and Central/South Delhi).  
* **Tasting Sampler Flights (Discovery Packs):** Curated 2-bottle sampler packs (1 bottle each of active single-estate harvests) built on the custom ratio splitter. Dynamically scales across multi-pack orders (e.g. 2 packs \= 2x Lot 1 \+ 2x Lot 2\) while allowing full bottle-level ratio customization, making it easy for new and returning customers to explore the full roast lineup.

---

### **🏗️ 2\. System Architecture & Data Flow**

```
+-----------------------------------------------------------------------------------+
|                                   CLIENT LAYER                                    |
|   index.html (Semantic UI)  +  style.css (Dark Roast Design System)               |
|   app.js (Dynamic CMS Render, SWR Caching, Real-time Validation, Offline Queue)  |
+--------------------------+------------------------------------+-------------------+
                           |                                    |
                Payment Gateway Callback                HTTP GET / POST (JSON)
                           |                                    |
                           v                                    v
+-------------------------------------+      +--------------------------------------+
|        Razorpay Gateway SDK         |      |     Google Apps Script (Code.gs)     |
|       (UPI / Cards / NetBank)       |      |     - doGet: Serve Menu & Config     |
+-------------------------------------+      |     - doPost: Order Intake Engine    |
                                             |     - Auth Token & Honeypot Trap     |
                                             |     - Concurrency LockService Guard  |
                                             +------------------+-------------------+
                                                                |
                                             +------------------+-------------------+
                                             |                                      |
                                             v                                      v
              +----------------------------------------------+      +-------------------------------+
              |            Google Sheets Database            |      |   Gmail Notification Engine   |
              |  - Tab 1: Menu & Config (Headless CMS)       |      |  - B2C Saturday Drop Receipt  |
              |  - Tab 2: Sheet1 (B2C Orders, 17 Columns)    |      |  - B2B Friday Corporate Drop  |
              |  - Tab 3: B2B Orders (Corporate, 22 Columns) |      |  - 1-Click Calendar Links     |
              +----------------------------------------------+      +-------------------------------+
```

---

### **🎛️ 3\. Google Sheets Headless CMS ("Menu & Config")**

The website is 100% data-driven by the Menu & Config tab in the Google Spreadsheet. Non-technical roastery operators can control the live website directly from Google Sheets without writing code:

1. **Store Status Control:**  
   1. OPEN: Pre-orders active; payment gateway enabled.  
   2. PAUSED: Displays roastery preparation banner; temporarily disables checkout buttons.  
   3. SOLD\_OUT: Displays sold-out notice; alerts customers for the next batch release.  
2. Batch Capacity & Scarcity Progress Bar:  
   1. Batch Capacity: Sets the total roasted batch bottle limit (e.g. 200 bottles).  
   2. Live Reservation Tally: doGet automatically sums active bottles from Sheet1 (B2C) and B2B Orders to display live reservation progress on the frontend.  
3. Coffee Harvest Lots & Lot-Level Caps:  
   1. Configure lot estate names, processing methods (e.g. Anaerobic Naturals, Washed Lot), tasting notes, flavor pills, acidity %, and body %.  
   2. Max Bottles column: Defines the maximum bottle ceiling for each lot to enforce lot-level inventory caps and prevent overselling scarce beans.  
   3. Setting Active to FALSE immediately removes the lot from the frontend.  
   4. The interactive Custom Ratio Splitter automatically updates its lot labels and split controls based on active harvests, allowing 2-bottle Duo Packs to be configured as Discovery Sampler Flights with custom 1:1 split ratios.  
4. B2C & B2B Pack Tiers Management:  
   1. Edit pack names, bottle quantities, unit prices (₹), and marketing badges (e.g. Popular, Value, MOQ). Note that 2-bottle Duo Packs can be configured as Discovery Sampler Flights with custom 1:1 split ratios between active single-estate harvests.  
5. **Coupon Discount & Audit Engine:** Define flat (₹) or percentage (%) discount codes with minimum order thresholds and mode applicability (B2C, B2B, ALL). Features frontend promo validation and backend audit logging for usage tracking.  
   1. Define flat (₹) or percentage (%) discount coupon codes with minimum order thresholds and mode applicability (B2C, B2B, ALL).  
6. **Delivery Clusters & Slot Throttling:** Configure maximum order capacities per tech park/commercial complex and delivery window (e.g. DLF Cyber City Morning Kickoff max 15 orders). The system enforces capacity limits by automatically disabling slots to balance logistics and courier load.  
   1. Configure maximum order capacities per tech park/commercial complex and delivery window (e.g. DLF Cyber City Morning Kickoff max 15 orders) to balance logistics and courier load.

---

### **🔄 4\. Capacity Reset & Fulfillment Lifecycle SOP**

To reset the capacity counter between weekly drops:

* **Mark Orders as Delivered / Cancelled (Recommended):**  
  * In Sheet1 (B2C): Set Column P (Delivery Status) to Delivered or Cancelled.  
  * In B2B Orders: Set Column U (Delivery Status) to Delivered or Cancelled.  
  * The backend automatically excludes fulfilled orders and resets the reserved bottle counter back to 0 for the upcoming drop while preserving historical order logs.  
* **Clear / Delete Test Rows:** Select test order rows (row 2 downwards) in *Sheet1* or *B2B Orders* and delete them.  
* Change Total Batch Limit: In the Menu & Config tab, change Cell B3 (Batch Capacity) to the new batch target.

---

### **🚀 5\. Detailed Component Breakdown**

#### **1\. index.html (Frontend Structure)**

* Branding Header: Brand titles, active drop announcement banner (\#dropBanner), live cutoff countdown (\#countdownTimer), and limited batch scarcity progress bar (\#scarcityText, \#scarcityFill).  
* Segmented Mode Switch: Smooth toggle between B2C (\#tabB2c) and B2B (\#tabB2b).  
* **N-Lot Scalable Custom Ratio Splitter:** Features dynamic bottle counters for customizing exact lot ratios between harvests across any pack size. Supported by an N-lot scalable architecture with automatic allocation rebalancing and a multi-color live ratio bar visualization. Includes a 2-bottle Curated Discovery Flight preset with 1:1 auto-split logic.  
* Interactive Lot Selector: Single-estate visual cards with tasting notes, roast levels, and acidity/body sensory meters (\#lotGrid).  
* Pack Selection Grids:  
  * B2C: Single Bottle (₹240), Duo Pack / Discovery Sampler Flight (2x 250ml, ₹480), Weekend Pack (₹899), Mega Weekend (6x 250ml, ₹1,200).  
  * B2B: Team Pack (₹1,800), Office Batch (₹3,400), Floor Pack (₹6,000), Townhall Bulk (₹8,700).  
* Customer & Delivery Details: Returning customer 1-click autofill banner (\#savedProfileBar), PIN Code validator (\#pinStatus), and drop & gate instruction selector (Door drop vs Security / Concierge desk).  
* Interactive Freshness Accordion: 48-Hour storage and serving guide (.guide-accordion).  
* **Self-Service Live Order Tracker & Confirmation:** Order receipt view with a 4-step status timeline (Pre-Ordered \-\> Brewing \-\> Dispatched \-\> Delivered). Includes Google Calendar 1-click reminders, native .ics iCalendar attachment generation, and formatted WhatsApp receipt triggers.

#### **2\. style.css (Design System)**

* Color Palette: Dark roast aesthetic (--bg: \#141312, \--card-bg: \#1f1d1a, \--card-inner: \#151413) with coffee gold accents (--accent: \#d4a373) and status indicators (--whatsapp: \#25d366, \--success: \#2d6a4f, \--info-blue: \#90e0ef).  
* Responsive Layout: Mobile-first flex container capped at 520px width.  
* Component Styling: Styled lot cards with CSS containment (contain: content), sensory meter fill bars using GPU acceleration, scarcity tracks, and hardware-accelerated micro-interactions.

#### **3\. app.js (Frontend Controller)**

* **Custom Ratio Splitter & Discovery Engine:** Features dynamic bottle counters (+ / \-) for customizing exact lot ratios between harvests across any pack size. For Discovery Sampler packs, defaults automatically to a balanced 50/50 split across active single-estate harvests (scaling dynamically with pack quantity: 1 pack \= 1:1, 2 packs \= 2:2, etc.) and preserves custom proportional ratios when pack quantities change.  
* **Unified Cutoff & Schedule Synchronization:** Centralized SCHEDULE\_CONFIG object keeps banners and ticking countdown timers 100% in sync. Calculates closest delivery windows and computes live countdowns to Thursday 6:00 PM (B2B) and Friday 10:00 PM (B2C) cutoffs.  
* Resilience & Offline Management: Features in-memory profile caching and localStorage persistence (tabc\_customer\_profile). Provides cold-start feedback via visual status pills with retry mechanisms, supported by an automated offline order retry queue and PWA Service Worker integration.  
* Validation Subsystem: Debounced input validation for Delhi NCR PIN codes, 10-digit Indian phone numbers, and 15-character GSTINs.  
* Checkout & Dispatch: Opens Razorpay checkout modal or generates corporate invoice IDs (INV-REQ-xxxxxx), then dispatches payload to Apps Script.  
* Google Calendar Link Generator & WhatsApp Sync: Generates formatted calendar URLs and structured WhatsApp pre-filled text receipts.

#### **4\. Code.gs (Backend Microservice)**

* Security Checks: Verifies authToken \=== 'TABC\_SECURE\_TOKEN\_2026' and rejects bots using honeypot detection (botTrap).  
* Concurrency & LockService: Uses LockService.getScriptLock() with a 15-second timeout (lock.tryLock(15000)) in doPost to eliminate race conditions and prevent oversubscribing coffee lots or cluster slots during peak drop cutoffs.  
* Database Routing: B2C orders append to Sheet1 (17 columns, instruction in Column G), while B2B orders append to B2B Orders (22 columns, instruction in Column K).  
* Email Generator: Dispatches inline-styled HTML confirmation emails via GmailApp.sendEmail with order details, 48-hour shelf-life guidelines, and Google Calendar event links.  
* **Inventory & Aggregation Engine (doGet):** Query endpoint that calculates lot-level inventory management with per-harvest caps. Dynamically deducts bottles across single and custom split orders in real-time, triggering sold-out visual indicators when limits are reached.

---

### **📊 6\. Google Sheets Database Schema**

#### **Sheet1 (B2C Orders — 17 Columns)**

| Col | Field Name | Description |
| :---: | :---- | :---- |
| A | Order Timestamp | Date and time order was placed |
| B | Order ID | Unique B2C identifier (e.g. TABC-856192) |
| C | Customer Name | Name of customer |
| D | WhatsApp Number | 10-digit mobile number |
| E | Email Address | Customer email for confirmation receipt |
| F | Delivery Address / Area | Full address with building, tower, floor, and PIN |
| G | Delivery / Gate Instruction | Door drop vs Security / Concierge desk |
| H | Delivery Date | Scheduled Saturday drop date |
| I | Coffee Bean Lot | Selected coffee lot or custom split ratio |
| J | Pack Selected | Pack tier name |
| K | Quantity | Quantity of packs ordered |
| L | Total Bottles | Total 250ml bottles |
| M | Total Amount (₹) | Final order total |
| N | Payment Preference | Razorpay Gateway |
| O | Payment Status | Paid via Gateway (payment ID) |
| P | Delivery Status | Pre-Ordered / Brewing / Dispatched / Delivered / Cancelled |
| Q | Notes / UTR | Gateway reference or special notes |

#### **B2B Orders (Corporate Drops — 22 Columns)**

| Col | Field Name | Description |
| :---: | :---- | :---- |
| A | Order Timestamp | Date and time order was placed |
| B | Order ID | Unique B2B identifier (e.g. TABC-B2B-417722) |
| C | Company / Business Name | Name of enterprise / company |
| D | Contact Person Name | Point of contact |
| E | Work Email | Corporate email address |
| F | WhatsApp / Phone | Contact phone number |
| G | GSTIN | 15-character GST identification number |
| H | Tech Park / Commercial Complex | Selected commercial complex or tech park |
| I | Building / Tower / Floor | Specific office / desk location |
| J | PIN Code | 6-digit Delhi NCR PIN |
| K | Delivery / Gate Instruction | Gate drop instruction |
| L | Delivery Window | Morning Kickoff (9:30–11:30 AM) / Afternoon Recharge (2:00–4:00 PM) |
| M | Delivery Date (Friday Drop) | Scheduled Friday drop date |
| N | Coffee Lot Selection | Coffee lot or custom split |
| O | Pack Tier | Corporate pack tier |
| P | Quantity | Number of packs |
| Q | Total Bottles | Total 250ml bottles |
| R | Total Amount (₹) | Final order amount |
| S | Payment Method | Razorpay Gateway / Corporate Invoice |
| T | Payment Status | Paid / Invoice Requested (Net Terms) |
| U | Delivery Status | Pre-Ordered / Brewing / Dispatched / Delivered / Cancelled |
| V | Notes / Payment Ref / PO Number | Invoice request ID or PO number |

---

### **⚙️ 7\. Deployment & Configuration Guide**

1. **1\. Deploy Google Apps Script:** Open your Google Spreadsheet (*The Apartment Brew Co. — Live Order Tracker*), navigate to Extensions \> Apps Script, paste Code.gs, click Deploy \> New Deployment (Web App, Execute as: Me, Access: Anyone), and copy the Web App URL.  
2. 2\. Configure Frontend (app.js): In app.js, set CONFIG.googleSheetEndpoint to your deployed Apps Script URL, CONFIG.razorpayKeyId to your active key, and CONFIG.authToken to match AUTH\_TOKEN in Code.gs.  
3. 3\. Deploy Web Application: Host index.html, style.css, and app.js on GitHub Pages, Cloudflare Pages, Vercel, or Netlify.

---

### **⚡ 8\. Core Web Vitals & Optimization Architecture**

The system is engineered for high-performance rendering and resilience against network drops:

* Core Web Vitals: Enhancements to FCP and LCP via resource hints (preconnect/dns-prefetch) and deferred SDK loading. CLS is minimized through CSS containment and GPU-accelerated tracks. INP is optimized using centralized DOM query caching and debounced validation.  
* Network Resilience: Integrated PWA Service Workers ensure the UI remains accessible during connectivity drops, while an automated localStorage retry queue preserves and re-attempts order dispatches.  