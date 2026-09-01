☕ The Apartment Brew Co. — System & Operations Manual
Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR
![Platform](https://img.shields.io/badge/Platform-GitHub%20Pages%20%7C%20Static-gold?style=flat-square)![Backend](https://img.shields.io/badge/Backend-Google%20Apps%20Script%20%28Serverless%29-blue?style=flat-square)![Database](https://img.shields.io/badge/CMS%20%26%20Database-Google%20Sheets-success?style=flat-square)![Payment](https://img.shields.io/badge/Payments-Razorpay%20%7C%20Net--7%20Invoicing-orange?style=flat-square)![Bottles](https://img.shields.io/badge/Form%20Factor-200ml%20Amber%20Glass-brown?style=flat-square)![Routing](https://img.shields.io/badge/Routing-Clean%20Extensionless%20URLs-blueviolet?style=flat-square)
A modern, serverless e-commerce and interactive sensory platform built for scheduled micro-batch craft coffee drops, headless Google Sheets CMS synchronization, Razorpay payment processing, corporate Net-7 invoicing, dynamic N-lot discovery flights, interactive sensory radar visualizations, and self-service order tracking.
All coffee across retail, corporate, and catering tiers is standardized into recyclable 200ml glass bottles extracted hot (92–94°C) and instantly flash-chilled to 4°C with zero preservatives.
---
📑 Table of Contents
1. Craft Philosophy & Operations
2. Platform Architecture & Data Flow
3. Portal Directory & Clean-URL Routing
4. Interactive Frontend Engines
5. Headless CMS Schema (Google Sheets)
6. Database Schema & Order Ledgers
7. Self-Service Order Tracking State Machine
8. Brewery Operational SOP & Drop Cycles
5. [5\. Headless CMS Schema ("Menu & Config")](#5-headless-cms-schema-menu--config)  
9. Deployment & Environment Configuration
10. Security, Performance & Resilience Guardrails
---
8. [8\. Brewery Operational SOP & Drop Cycles](#8-brewery-operational-sop--drop-cycles)  
9. [9\. Deployment & Environment Configuration](#9-deployment--environment-configuration)  
1. Craft Philosophy & Operations
1.1 The Micro-Batch Manifesto
Hot Extraction & Rapid Thermal Shock: Coffee is hand-extracted hot at 92–94°C to dissolve delicate floral aromatics, complex fruit acids, and natural sugars, then immediately flash-chilled over ice directly to 4°C to seal volatile aroma compounds before oxidation occurs.
100% Preservative-Free: Zero artificial stabilizers, chemical additives, or high-heat industrial pasteurization.
---
48-Hour Peak Flavor Window: Formulated strictly for peak sensory enjoyment within 48 hours of brewing when kept refrigerated (≤4°C).
Single-Estate Terroir: Small-batch roastery curation celebrating high-elevation micro-lots from Chikmagalur, Shevaroys Hills, and the Western & Eastern Ghats.
1.2 Dual Delivery Model & Scheduled Cutoffs
#### **1.1 The Micro-Batch Manifesto**

* Hot Extraction & Rapid Thermal Shock: Coffee is hand-extracted hot at 92–94°C to dissolve delicate volatile floral aromatics, organic fruit acids, and natural sucrose, then instantly flash-chilled over ice directly to 4°C. This locks in complex aroma compounds before oxidation occurs.  
* 100% Preservative-Free: Zero artificial stabilizers, chemical additives, or high-heat industrial pasteurization.  
* 48-Hour Peak Flavor Window: Formulated strictly for peak enjoyment within 48 hours of brewing when kept refrigerated (≤4°C).  
* Artisanal Micro-Lot Nuances: Handcrafted separately to order in small batches to celebrate the natural nuances of specialty Indian terroir.

#### **1.2 Dual Delivery Model & Scheduled Cutoffs**

###

| Fulfillment Stream | Delivery Windows | Order Cutoff Timing |
| :---- | :---- | :---- |
| **🏢 Friday Office Drops** *(Corporate B2B)* | Friday Morning Kickoff (9:30–11:30 AM) Friday Afternoon Recharge (2:00–4:00 PM) | **Thursday at 6:00 PM** *(Strict roster finalization)* |
| **☕ Saturday Drop** *(Personal B2C)* | Saturday Morning Drop (8:00 AM – 11:00 AM) | **Friday at 10:00 PM** *(Night batch brew & chill)* |
| **☕ Sunday Drop** *(Personal B2C)* | Sunday Morning Drop (8:00 AM – 11:00 AM) | **Saturday at 10:00 PM** *(Night batch brew & chill)* |
| **🎉 Event Catering** *(Townhalls / Offsites)* | Scheduled custom target dates across Delhi NCR | **On-Demand (24-Hour SLA)** |

---

### **2\. Platform Architecture & Data Flow**

* **Client Layer**:  
  * Multi-Page Clean-URL Static Web Portal (hosted on GitHub Pages / CDN).  
  * `style.css`: Dark Roast Glassmorphism Design System (Max-Width 540px Bounded).  
  * `app.js`: Page Controller, Splitter Engine, Live SWR Sync, and Form Validation.  
* **Payment Layer**:  
  * Razorpay Gateway SDK (`checkout.js`): Cards, UPI, NetBanking, and Net-7 Corporate Invoicing.  
* **Serverless Backend (Google Apps Script \- `Code.gs`)**:  
  * `doGet`: Live CMS & Order Status API (*Menu & Config* \+ Live Tracking lookup).  
  * `doPost`: Concurrency Locks (`LockService`), Order Intake, and Bot Honeypot Validation.  
* **Database & Notification Layer**:  
  * Google Sheets Database (*Menu & Config, Sheet1, B2B Orders, Custom & Event Inquiries, Operational Guide & SOP*).  
  * Gmail Notification Engine: Rich HTML Receipts, 1-Click Google Calendar Add Links, and WhatsApp Deep-Links (`wa.me`).

---

### **3\. Portal Directory & Clean-URL Routing**

The platform uses extensionless, clean URLs across all navigation links, action buttons, and internal scripts:

| Clean Route | Source Document | Primary Purpose & Functional Scope |
| :---- | :---- | :---- |
| **/** | index.html | **Home & Craft Manifesto**: Origin story, 4 craft pillars, flash-chilling thermodynamic extraction science, flavor curve, and FAQs |
| **/orders** | orders.html | **Order Now (Harvests Gateway)**: Discovery portal to compare flavor swatches, roast meters, and body gauges before selecting personal or corporate fulfillment |
| **/personal** | personal.html | **Personal Pre-Order Wizard**: Streamlined 3-step checkout (1. Batch Size & Splitter → 2\. Delivery & PIN Validation → 3\. Review & Payment) for 1–6 bottles |
| **/corporate** | corporate.html | **Corporate Office Drops**: Streamlined 3-step B2B checkout (1. Batch Tier & Splitter → 2\. Tech Park Window, GSTIN & Role → 3\. Razorpay or Net-7 Invoice) for 10–60+ bottles |
| **/flavor** | flavor.html | **flavor matcher (Sensory Menu)**: Interactive 2-question quiz matcher, 5-axis Sensory Radar, and side-by-side spectrum intensity gauges |
| **/guide** | guide.html | **Freshness Guide**: Science of flash-chilling, temperature stability graph, and 48-hour cold storage/serving rituals |
| **/about** | about.html | **Story so far**: Hand-brewing journey, milestone statistics (2,480+ bottles, 18+ harvests, 1,250+ hours, 35+ events), and live batch capacity dashboard |
| **/events** | events.html | **Event Runs Wizard**: Streamlined 3-step catering intake (1. Scope & Scale → 2\. Logistics & Contact → 3\. Review & Submit) with 24-hour proposal SLA |
| **/track** | track.html | **Inquiry/Order tracking**: Real-time customer self-service status lookup with dynamic 4-stage visual timeline stepper and FAQ accordion |

---

### **4\. User Journey & Ordering Engine**

*

1. **Discovery Gateway (`/orders`)**:  
   * Customers explore active single-estate harvest micro-lots (`LOT-01`, `LOT-02`, or `MIX`) and pass selection parameters to `/personal?bean=...` or `/corporate?bean=...`.  
2. **Streamlined 3-Step Checkout Wizards (`/personal` & `/corporate`)**:  
   * **Step 1: Batch Size & Split**: Select pack tier, quantity, fine-tune bottle ratio (for Mix & Match), apply promo codes, and verify live capacity.  
   * **Step 2: Delivery & Contact Details**: Select drop schedule / tech park window, validate 6-digit Delhi NCR PIN, and enter recipient info (with 1-click autofill).  
   * **Step 3: Review & Confirmation**: Review breakdown and complete checkout via Razorpay or request a Net-7 Corporate Invoice.  
3. **Streamlined 3-Step Event Runs Wizard (`/events`)**:  
   * **Step 1: Scope & Scale**: Organization name, requirement type, estimated headcount, and blend.  
   * **Step 2: Logistics & Contact**: Target date, venue location, contact person name, email, phone, and setup preferences.  
   * **Step 3: Review & Submit**: Comprehensive inquiry summary card with 24-hour SLA guarantee.  
4. **Post-Order Confirmation**:  
   * Instant order confirmation card with Inquiry/Order ID.  
   * 1-Click Google Calendar event addition with formatted drop notes.  
   * 1-Click WhatsApp direct concierge deep-link.  
   * Real-time self-service order tracking link (`/track?orderId=...`).

#### **4.1 Discovery Gateway (/orders)**

* Interactive harvest selector cards highlight estate details (LOT-01, LOT-02, or MIX) and pass the selection via URL query parameters (/personal?bean=LOT-01 or /corporate?bean=LOT-02).  
* Interactive sensory palettes display color-coded flavor swatches, roast degrees, and anaerobic fermentation meters.

#### **4.2 3-Step Checkout Wizards (/personal & /corporate)**

1. Step 1: Batch Size & Fine-Tune Split:  
   1. Select bottle pack tiers, adjust quantity, and use the custom stepper controls to fine-tune Mix & Match bottle distributions (e.g. 3x Ratnagiri \+ 3x Banana Banger).  
   2. Real-time capacity checks prevent ordering above active batch caps.  
   3. ← Back to Harvest button returns customers directly to /orders.  
2. Step 2: Delivery & Contact Details:  
   1. Personal orders select Saturday or Sunday delivery; corporate drops choose from pre-set Friday Tech Park cluster windows.  
   2. Real-time 6-digit Delhi NCR PIN validation (11xxxx, 122xxx, 121xxx, 201xxx).  
   3. 1-click customer profile autofill for returning users via localStorage.  
3. Step 3: Review & Confirmation:  
   1. Comprehensive breakdown of coffee selections, batch sizes, promo discounts, delivery schedules, and tax credits.  
   2. Personal orders check out via Razorpay (UPI, Credit/Debit Cards, NetBanking); Corporate orders can select Razorpay or Net-7 Invoice.

#### **4.3 3-Step Event Runs Wizard (/events)**

1. Step 1: Event Scope & Scale: Organization name, requirement type, bottle volume / headcount, and preferred single-estate coffee selection.  
2. Step 2: Logistics & Contact Details: Target delivery date, event venue, contact person name, corporate work email, WhatsApp number, and setup preferences.  
3. Step 3: Review & Submit: Comprehensive inquiry summary card, 24-hour SLA guarantee, instant WhatsApp deep-link dispatch, and live status tracker link.

---

### **5\. Headless CMS Schema ("Menu & Config")**

The frontend dynamically hydrates and updates from the Menu & Config tab in Google Sheets via doGet:

### 5.1 General Store Settings & Batch Capacities

* Store Status: OPEN (active ordering), PAUSED (maintenance/prep), or SOLD\_OUT (capacity reached).  
* **Batch Limits**:  
  * B2C Batch Capacity: 150 bottles (200ml) per weekend drop.  
  * B2B Batch Capacity: 200 bottles (200ml) per Friday office drop.  
* Banner Text: Real-time announcement bar rendered across all headers.

### 5.2 Single-Estate Harvest Lots



Fulfillment Stream
Target Audience
Delivery Windows
Order Cutoff
Pricing & Packs
🏠 B2C Residential Drop (`/personal`)
Gurugram & Delhi NCR homes
Saturday Morning (8:00 AM – 11:00 AM)Sunday Morning (8:00 AM – 11:00 AM)
Friday 10:00 PM
Single (₹240), Duo (₹480), Weekend 4-Pack (₹899), Mega 6-Pack (₹1,200)
🏢 B2B Corporate Drop (`/corporate`)
Tech parks & commercial offices
Friday Morning Kickoff (9:30 AM – 11:30 AM)Friday Afternoon Recharge (2:00 PM – 4:00 PM)
Thursday 6:00 PM
Team 10-Pack (₹1,800), Office 20-Pack (₹3,400), Floor 40-Pack (₹6,000), Townhall 60-Pack (₹8,700)
🎪 Event Catering (`/events`)
Hackathons, pop-up bars & summits
Custom Scheduled Dates
7 Days Prior
Custom Single-Estate Curation & Co-Branded Labeling

---
2. Platform Architecture & Data Flow
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
+----------------------------------------+------------------------------------------+
---
3. Portal Directory & Clean-URL Routing
The platform uses clean, extensionless routing across 9 dedicated portals:
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
---
4. Interactive Frontend Engines
4.1 Visual Harvest Discovery Gateway (orders.html)
100% Dynamic Cards: Hydrated on load via renderHarvestGateway() using live data from Google Sheets.
Color-Coded Swatch Pills: Automatically maps flavor keywords to gradient swatches (.swatch-berry, .swatch-stonefruit, .swatch-cacao, .swatch-blossom, .swatch-apple, .swatch-jasmine).
Roast & Fermentation Gauges: Renders roast percentage bars, 72h anaerobic gradients, and mouthfeel viscosity meters (🍷 Syrupy & Winey vs 🍵 Tea-Like & Silky).
Active State Routing: Expanding a card unlocks the Personal Order and Corporate Order destination cards, pre-configuring query parameters (/personal?bean=LOT-01).
4.2 Dynamic N-Lot Mix & Match Splitter Engine (personal.html & corporate.html)
Multi-Lot Support: Automatically scales to support any number of active lots in Google Sheets.
Balanced Auto-Rebalance: Divides the target batch volume evenly across active harvests upon opening.
Zero-Sum Stepper: Adjusting (+) / (-) any harvest automatically rebalances remaining lots so the total bottle allocation strictly equals the selected pack size.
Multi-Segment Ratio Bar: Dynamically renders color-coded progress segments representing each harvest's share in real time.
4.3 Sheets-Driven 2-Question Flavor Matcher (flavor.html)
Configurable from Google Sheets: Questions, buttons, icons, and combination rules are parsed from the Menu & Config tab.
4.4 Interactive 5-Axis Sensory Radar (flavor.html)
Mathematical Polygon Generation: Computes regular pentagon trigonometric coordinates from 5 sensory axes (acidity, aromatics, sweetness, body, clarity).
---
5. Headless CMS Schema (Google Sheets)
The Menu & Config tab acts as the real-time CMS backend:
5.1 General Settings
Includes global store status (OPEN/PAUSED/SOLD_OUT), batch capacities (500 total, 200 B2C, 300 B2B), and announcement banner text.
5.2 Coffee Lots (18-Column Schema)
Columns include Lot ID, Estate Name, Region, Process Tag, Tasting Notes, Emojis, Flavor Pills, Roast/Fermentation %, Sensory Axis % (Acidity, Body, Sweetness, Aromatics, Clarity), Process Story, Pairing Rituals, and Active status.
---
6. Database Schema & Order Ledgers
6.1 B2C Residential Orders (Sheet1)
Tracks Order ID, Timestamp, Contact Info, Delivery Address, Saturday/Sunday Window, Bottle Split Breakdown, Pack Selection, and Payment/Delivery Status.
6.2 B2B Corporate Orders (B2B Orders)
Includes GSTIN, Tech Park Cluster, and Invoicing references.
---
7. Self-Service Order Tracking State Machine
Real-time stepper: 1. Pre-Ordered → 2. Brewing & Chilling → 3. Out for Delivery → 4. Delivered.
---
8. Brewery Operational SOP & Drop Cycles
Weekly cycle: Production planning Mon-Wed; Thursday cutoff for B2B; Friday production & delivery; Friday cutoff for B2C; Weekend production & residential delivery.
---
9. Deployment & Environment Configuration
Configure app.js with Razorpay keys and Apps Script endpoint; deploy Code.gs as a Web App (Execute as Me, Access Anyone).
---
10. Security, Performance & Resilience Guardrails
Zero-Leak bot traps, token auth, SWR caching for UI responsiveness, and guaranteed order intake even at capacity.
---
Crafted with pride by The Apartment Brew Co. • Gurugram, India

