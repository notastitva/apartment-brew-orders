☕ The Apartment Brew Co. — System & Operations Manual
Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR
     


A modern, serverless e-commerce and interactive sensory platform built for scheduled micro-batch craft coffee drops, headless Google Sheets CMS synchronization, Razorpay payment processing, corporate Net-7 invoicing, dedicated 4-drop pre-paid coffee pass subscriptions, dynamic N-lot discovery flights, Chart.js 5-axis sensory radar visualizations, and self-service order and pass tracking.


All coffee across retail, corporate, and catering tiers is standardized into recyclable 200ml glass bottles extracted hot (92–94°C) and instantly flash-chilled to 4°C with zero preservatives.


________________


📑 Table of Contents
1. [Craft Philosophy & Operations](#1-craft-philosophy--operations)
2. [Platform Architecture & Data Flow](#2-platform-architecture--data-flow)
3. [Portal Directory & Clean-URL Routing](#3-portal-directory--clean-url-routing)
4. [Interactive Frontend Engines](#4-interactive-frontend-engines)
5. [Headless CMS Schema (Google Sheets)](#5-headless-cms-schema-google-sheets)
6. [Database Schema & Order Ledgers](#6-database-schema--order-ledgers)
7. [Self-Service Order Tracking & Pass Management State Machines](#7-self-service-order-tracking--pass-management-state-machines)
8. [Brewery Operational SOP & Drop Cycles](#8-brewery-operational-sop--drop-cycles)
9. [Deployment & Environment Configuration](#9-deployment--environment-configuration)
10. [Security, Performance & Resilience Guardrails](#10-security-performance--resilience-guardrails)
11. [Multi-Step Checkout Wizards & State Flows](#11-multi-step-checkout-wizards--state-flows)
12. [Promo Code & Discount Engine](#12-promo-code--discount-engine)
13. [Packaging, Bottle Specifications & Handwritten Batch Ledger](#13-packaging-bottle-specifications--handwritten-batch-ledger)
14. [Geographic Service Areas & Corporate Tech Park Clusters](#14-geographic-service-areas--corporate-tech-park-clusters)
15. [Automated Email Receipts & Notification System](#15-automated-email-receipts--notification-system)
16. [Offline Resilience, Caching & Dynamic Fallbacks](#16-offline-resilience-caching--dynamic-fallbacks)
17. [Design System, Typography & Lucide Icon Specifications](#17-design-system-typography--lucide-icon-specifications)
18. [Visual & Interaction Engines](#18-visual--interaction-engines)
19. [Responsive Desktop & Tablet Design System](#19-responsive-desktop--tablet-design-system)
20. [Advanced Logistics, Sensory Calibration & 4-Drop Coffee Pass Architecture](#20-advanced-logistics-sensory-calibration--4-drop-coffee-pass-architecture)
________________


1. Craft Philosophy & Operations
1.1 The Micro-Batch Manifesto
* Hot Extraction & Rapid Thermal Shock: Coffee is hand-extracted hot at 92–94°C to dissolve delicate floral aromatics, complex fruit acids, and natural sugars, then immediately flash-chilled over ice directly to 4°C to seal volatile aroma compounds before oxidation occurs.
* 100% Preservative-Free: Zero artificial stabilizers, chemical additives, or high-heat industrial pasteurization.
* 48-Hour Peak Flavor Window: Formulated strictly for peak sensory enjoyment within 48 hours of brewing when kept refrigerated (≤4°C).
* Single-Estate Terroir: Small-batch roastery curation celebrating high-elevation micro-lots from Chikmagalur, Shevaroys Hills, and the Western & Eastern Ghats.
1.2 Dual Delivery Model & Scheduled Cutoffs

| Fulfillment Stream | Target Audience | Delivery Windows | Order Cutoff | Pricing & Packs |
| :--- | :--- | :--- | :--- | :--- |
| 🏠 **B2C Residential Drop** (`/personal`) | Gurugram & Delhi NCR homes | Saturday Morning (8:00 AM – 11:00 AM)<br>Sunday Morning (8:00 AM – 11:00 AM) | Friday 10:00 PM | Single (₹240), Duo (₹480), Weekend 4-Pack (₹899), Mega 6-Pack (₹1,200) |
| 🏢 **B2B Corporate Drop** (`/corporate`) | Tech parks & commercial offices | Friday Morning Kickoff (9:30 AM – 11:30 AM)<br>Friday Afternoon Recharge (2:00 PM – 4:00 PM) | Thursday 6:00 PM | Team 10-Pack (₹1,800), Office 20-Pack (₹3,400), Floor 40-Pack (₹6,000), Townhall 60-Pack (₹8,700) |
| 🔄 **4-Drop Coffee Pass** (`/subscribe`) | Multi-week residential & office subscribers | Choice of Saturday, Sunday, or Friday Corporate drop windows | Same as stream cutoff | Weekend 4-Pack Pass (₹3,199), Duo Discovery Pass (₹1,699), Corporate Team Pass (₹6,480), Mega Weekender Pass (₹4,199) |
| 🎪 **Event Catering** (`/events`) | Hackathons, pop-up bars & summits | Custom Scheduled Dates | 7 Days Prior | Custom Single-Estate Curation & Co-Branded Labeling |
---
2. Platform Architecture & Data Flow
```text
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
```


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


---
3. Portal Directory & Clean-URL Routing
The platform uses clean, extensionless routing across 11 dedicated portals:


```text
├── /                    (index.html)     -> Hero landing, weekend countdown, batch scarcity, 3-card portal hub, FAQ accordion
├── /orders              (orders.html)    -> 3-Way Harvest Gateway (Personal Weekend Drop, 4-Drop Pass, Corporate Office Drop)
├── /personal            (personal.html)  -> Dedicated B2C residential pre-order wizard with mandatory pack validation & splitter
├── /corporate           (corporate.html) -> Dedicated B2B Friday office drop wizard with tech park clusters & Net-7 invoicing
├── /subscribe           (subscribe.html) -> Dedicated 4-Drop Coffee Pass purchase wizard (1 upfront payment, 10–15% savings)
├── /pass                (pass.html)      -> Dedicated Pass Management Portal with digital punch card, drop dates & skip/swap
├── /flavor              (flavor.html)    -> Chart.js 5-axis sensory radar, spectrum comparison & sheet-driven calibration quiz
├── /guide               (guide.html)     -> 48-hour freshness protocol, rapid thermal shock & serving rituals
├── /about               (about.html)     -> Story so far, craft manifesto, big bold stats & live roastery capacity
├── /events              (events.html)    -> Corporate coffee bar catering, hackathon drops & bulk lead wizard
├── /track               (track.html)     -> Self-service 4-step real-time order tracking & discrete drop rating portal
├── /style.css           (style.css)      -> Universal stylesheet (Dark artisanal theme, gold gradient accents, Lucide utilities)
├── /app.js              (app.js)         -> Universal JavaScript controller, pass state engine & client-side state machine
└── /assets/             (static assets)  -> SVGs, brand emblems, and social preview assets
```


4. Interactive Frontend Engines
4.1 Visual Harvest Discovery Gateway (orders.html)
* 100% Dynamic Cards: Hydrated on load via renderHarvestGateway() using live lot configurations from Google Sheets.
* Color-Coded Swatch Pills: Automatically maps flavor keywords to gradient swatches (.swatch-berry, .swatch-stonefruit, .swatch-cacao, .swatch-blossom, .swatch-apple, .swatch-jasmine).
* Roast & Fermentation Gauges: Renders roast percentage bars, 72h anaerobic gradients, and mouthfeel viscosity meters (🍷 Syrupy & Winey vs 🍵 Tea-Like & Silky).
* 3-Way Active Destination Routing: Selecting any harvest dynamically unlocks three dedicated scale cards:
   * 1. 🏠 Personal Pre-Order (1–6 Bottles) -> /personal?bean=LOT-XX
   * 2. 🔄 4-Drop Coffee Pass (Save 10–15%) -> /subscribe?bean=LOT-XX
   * 3. 🏢 Corporate Office Drop (10–60 Bottles) -> /corporate?bean=LOT-XX
4.2 Dynamic N-Lot Mix & Match Splitter Engine (personal.html, corporate.html, subscribe.html)
* Multi-Lot Scalability: Automatically accommodates any number of active lots in Google Sheets without layout breakages.
* Balanced Auto-Rebalance: Divides target per-drop bottle quotas evenly across active harvests upon activation.
* Zero-Sum Stepper: Incrementing or decrementing any harvest automatically adjusts remaining lots so total bottle allocation strictly equals pack size.
* Multi-Segment Ratio Bar: Dynamically renders color-coded progress segments representing each harvest's share in real time.
* Live Order Breakdown: Compiles exact bottle splits into the order payload (e.g., Mix & Match (2x Ratnagiri Estate + 1x Banana Banger + 1x Riverdale Estate)).
4.3 Sheets-Driven 2-Question Flavor Matcher (flavor.html)
* Configurable from Google Sheets: Questions, buttons, icons, and combination rules are parsed dynamically from the Menu & Config tab.
* Centered Swatch Tiles: Responsive multi-line grid with tactile color-coded swatch cards.
* Rule-Based Decision Matrix: Evaluates answer pairs (e.g., opt_morning + opt_berry -> LOT-01) with wildcard fallback (*), styling the result box and generating direct checkout links.
4.4 Chart.js v4.4.4 Interactive 5-Axis Sensory Radar (flavor.html)
* Production Canvas Engine: Migrated from raw SVG polygons to high-performance Chart.js on <canvas id="sensoryRadarCanvas">.
* Dark Luxury Theme Styling: Custom configuration using gold axis grids (rgba(212, 163, 115, 0.2)), cream typography (#faedcd), and dark translucent tooltips.
* Dynamic Tab Isolation & Filtering: setRadarFocus(mode) toggles dataset visibility dynamically via chart.update() without re-rendering the canvas, enabling single-estate isolation or full overlay comparisons.
4.5 Lucide Icons Micro-Library & Dynamic Lifecycle Renderer
* Vector Icon System: Integrated Lucide Icons (lucide.min.js) across all portal pages, eliminating heavy image sprites.
* Dynamic Lifecycle Integration: renderLucideIcons() hook executed across all dynamic UI lifecycles (DOMContentLoaded, renderPacks, renderPassPacks, renderFlavorPage, renderHarvestGateway, renderTrackingDetails, and wizard step transitions).
* CSS Utilities: Universal .lucide rules in style.css for consistent sizing (16px, 18px, 20px), alignment, and brushed gold tinting.
4.6 Canvas-Confetti Particle Micro-Engine
* Delightful Interaction Design: Lightweight particle physics via canvas-confetti@1.9.3.
* Trigger Events: Fires celebratory particle bursts on successful pre-order and pass checkout (handleOrderSuccess) and upon submitting post-delivery sensory calibration ratings (submitFeedbackAction).


---
5. Headless CMS Schema (Google Sheets)
The Menu & Config tab in The Apartment Brew Co. — Live Order Tracker acts as the real-time CMS backend:
5.1 General Settings

| Setting Key | Example Value | Purpose |
| :--- | :--- | :--- |
| Store Status | `OPEN` | Global web checkout switch (`OPEN` / `PAUSED` / `SOLD_OUT`) |
| Batch Capacity | `500` | Total combined bottle brew capacity |
| B2C Batch Capacity | `150` | Maximum residential bottles available for weekend drop |
| B2B Batch Capacity | `200` | Maximum corporate bottles available for Friday drop |
| Drop Announcement | *Text* | Broadcast banner displayed across landing and checkout headers |

5.2 Coffee Lots (18-Column Schema)
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
5.3 Flavor Quiz Questions & Combination Matrix
* --- FLAVOR QUIZ QUESTIONS & OPTIONS ---
   * Question ID (Q1 / Q2) | Question Title | Option Key (opt_morning, opt_berry) | Option Icon (🌅, 🍇) | Option Label
* --- FLAVOR QUIZ COMBINATION RULES ---
   * Q1 Option Key | Q2 Option Key | Matched Lot ID (LOT-01, LOT-02, LOT-03, MIX) | Badge Text | Custom Recommendation Note


---
6. Database Schema & Order Ledgers
6.1 B2C Residential Orders (Sheet1)

| Col | Header | Description |
| :---: | :--- | :--- |
| A | Order Timestamp | ISO string timestamp |
| B | Order ID | Unique alphanumeric identifier (`TABC-XXXXXX`) |
| C | Customer Name | Primary contact name |
| D | WhatsApp Number | 10-digit mobile number for dispatch updates |
| E | Email Address | Customer receipt & notification address |
| F | Delivery Address / Area | Residence / Society / Tower details |
| G | Delivery / Gate Instruction | `Deliver directly to door/desk` / `Leave with Tower Security/Concierge Desk` |
| H | Delivery Date | Saturday / Sunday drop date |
| I | Delivery Window | Saturday Morning (8:00 AM – 11:00 AM) / Sunday Morning |
| J | Coffee Bean Lot | Single-estate selection or custom split breakdown |
| K | Pack Selected | Single, Duo, Weekend Pack, Mega Weekender |
| L | Quantity | Number of packs ordered |
| M | Total Bottles | Computed bottle count |
| N | Total Amount (₹) | Final charged amount after discounts |
| O | Payment Preference | Razorpay Gateway |
| P | Payment Status | Gateway capture reference (`Paid via Gateway (pay_XXX)`) |
| Q | Delivery Status | `Pre-Ordered` → `Brewing` → `Dispatched` → `Delivered` |
| R | Notes / UTR | Payment ID, applied coupon discount breakdown |

6.2 B2B Corporate Orders (B2B Orders)
Includes company name, GSTIN (for 18% Input Tax Credit), tech park cluster, Net-7 corporate invoicing references (INV-REQ-XXXXXX), and reception desk drop instructions. Order IDs follow the TABC-B2B-XXXXXX taxonomy.
6.3 Event Catering Inquiries (Custom & Event Inquiries)
Captures corporate coffee bar bookings, pop-up events, estimated headcounts, venue locations, and lead management statuses (New Lead → In Discussion → Event Confirmed → Event Completed). Event leads are assigned IDs following the TABC-EVT-XXXXXX taxonomy.
6.4 Coffee Passes Master Sheet (Coffee Passes)
A dedicated ledger specifically engineered for 4-drop subscription passes, eliminating operational conflicts with single-order pre-orders:

| Col | Header | Description |
| :---: | :--- | :--- |
| A | Timestamp | ISO timestamp of pass registration |
| B | Pass ID | Unique master pass identifier (`TABC-PASS-XXXXXX`) |
| C | Customer Name | Primary subscriber name |
| D | WhatsApp Phone | 10-digit phone for drop day updates |
| E | Email Address | Subscriber email for schedule reminders & 1-click links |
| F | Delivery Address | Flat / Tower / Society / Office address |
| G | Drop Instructions | `Deliver directly to door/desk` / `Leave with Tower Security/Concierge Desk` |
| H | Pass Tier | Weekend 4-Pack Pass / Duo Discovery Pass / Corporate Team Pass / Mega Weekender |
| I | Frequency | `Weekly` (4 consecutive weeks) or `Bi-Weekly` (every 2 weeks) |
| J | Drop Window | Saturday/Sunday Morning (8–11 AM) or Friday Corporate (9:30–11:30 AM / 2–4 PM) |
| K | Total Drops | 4 Drops |
| L | Drops Fulfilled | Count of delivered drops (0 to 4) |
| M | Drops Remaining | Count of remaining credits (4 to 0) |
| N | Current Harvest | Selected single-estate micro-lot (e.g., Ratnagiri Estate) |
| O | Next Drop Date | Target date for the upcoming fulfillment run |
| P | Total Paid (₹) | Upfront charged amount (10–15% discounted rate) |
| Q | Payment Status | `Paid via Gateway (pay_XXX)` or `Corporate Invoice` |
| R | Pass Status | `Active` / `Paused` / `Completed` |
| S | Individual Drop IDs | List of generated drop IDs (`TABC-PASS-XXXXXX-D1` to `-D4`) |
| T | Notes | Fulfillment history, skip logs, and coupon breakdowns |

6.5 Discrete Individual Drop IDs (-D1 through -D4)
* Individual Tracking & Roastery Queueing: Every pass purchase generates 4 discrete child Order IDs. Drop 1 (e.g., TABC-PASS-804219-D1) is immediately queued into Sheet1 / B2B Orders for the upcoming drop cutoff, ensuring it counts against that week's batch capacity.
* Independent Sensory Ratings: When each drop is delivered, the customer receives an individual tracking link (/track?orderId=TABC-PASS-XXXXXX-D1) allowing them to log sensory feedback for that specific extraction into the Sensory Feedback sheet.
6.6 Sensory Feedback Ledger & In-Place Deduplication
* Multi-Criteria Feedback: Captures Overall Brew (1–5 Stars), Bitterness Balance (1–5), Notes Clarity (1–5), and Barista Notes.
* Robust Deduplication: Code.gs performs an Order ID lookup before appending. If a customer re-rates an order, the existing row is updated in-place, eliminating duplicate rows. app.js utilizes a single POST JSON transport.
6.7 Strict Delivery / Gate Instructions Validation
* Exact Canonical Values: To satisfy strict Google Sheet validation criteria (without space-around-slash formatting mismatches), options across personal.html, corporate.html, and subscribe.html are standardized to:
   * 1. Deliver directly to door/desk
   * 2. Leave with Tower Security/Concierge Desk
   * 3. Call upon arrival for pickup
* Defensive Backend Normalization: Both app.js and Code.gs execute .replace(/\s*\/\s*/g, '/') on all incoming address payloads prior to sheet appending.
7. Self-Service Order Tracking State Machine
Customers track live orders in real time on /track via a 4-stage visual stepper:


```text
+------------------+     +------------------------+     +--------------------+     +------------------+
|  1. Pre-Ordered  | --> | 2. Brewing & Chilling  | --> | 3. Out for Delivery| --> |   4. Delivered   |
+------------------+     +------------------------+     +--------------------+     +------------------+
| Order logged &   |     | Hot extraction (94°C)  |     | Dispatched in      |     | Dropped at door/ |
| batch scheduled. |     | & flash-chilled to 4°C |     | thermal cold-bags. |     | concierge desk.  |
+------------------+     +------------------------+     +--------------------+     +------------------+
```

* Live Status Keywords:
   * Stage 1 (Pre-Ordered): Pre-Ordered, Pending, Received
   * Stage 2 (Brewing & Chilling): Brewing, Roasting, Extracting, Chilling, Prep
   * Stage 3 (Out for Delivery): Dispatched, Out for Delivery, In Transit, Shipped, On the way
   * Stage 4 (Delivered): Delivered, Completed, Fulfilled (Starts 48-hour freshness clock)
* Event Inquiry Pipeline State Machine:
   * Stage 1: New Lead (Inquiry received & logged)
   * Stage 2: In Discussion (Capacity, custom single-estate lot selection & date confirmation)
   * Stage 3: Event Confirmed (Logistics finalized, batch scheduled)
   * Stage 4: Event Completed (On-site bar execution / bulk dispatch fulfilled)


---
8. Brewery Operational SOP & Drop Cycles
8.1 Weekly Production Timeline
* Monday – Wednesday: Headless CMS configuration, green coffee QC, estate allocation, and tech park cluster scheduling.
* Thursday 6:00 PM: B2B Corporate Drop order cutoff. Production planning for Friday tech park runs.
* Friday 6:00 AM – 9:00 AM: Hot extraction & flash chilling for Friday office morning kickoff & afternoon recharge.
* Friday 10:00 PM: B2C Residential Drop order cutoff.
* Saturday & Sunday 5:30 AM – 7:30 AM: Weekend batch extraction, ice shock chilling, 200ml bottle packaging, and dispatch across Delhi NCR.


---
9. Deployment & Environment Configuration
9.1 Frontend Configuration (app.js)
Update the CONFIG object in app.js:


const CONFIG = {


  razorpayKeyId: "rzp_live_XXXXXXXXXXXXXX",


  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbz.../exec",


  authToken: "TABC_SECURE_TOKEN_2026"


};
9.2 Apps Script Deployment (Code.gs)
* Open the spreadsheet: The Apartment Brew Co. — Live Order Tracker.
* Go to Extensions > Apps Script and paste the code from Code.gs.
* Click Deploy > Manage deployments > Edit > New version.
* Configure:
   * Execute as: Me
   * Who has access: Anyone
* Copy the generated Web App URL (.../exec) into app.js.


---
10. Security, Performance & Resilience Guardrails
* Zero-Leak Bot Trap & Token Authorization: All POST requests validate the internal auth token and reject hidden bot-trap fields.
* Stale-While-Revalidate (SWR): UI components render immediately from cached localStorage while background polling refreshes live bottle counts without layout flashes.
* Guaranteed Order Intake: Orders are recorded in sheets even if capacity limits are breached (flagged as [Over-Capacity] in the notes column for roastery review).
* Cross-Browser Verification: Fully tested and AST-compiled under JavaScriptCore and modern browser engines with zero console syntax errors.


---
Crafted with pride by The Apartment Brew Co. • Gurugram, India


---
11. Multi-Step Checkout Wizards & State Flows
11.1 Dedicated Residential Drop Wizard (/personal)
* Step 1 — Harvest & Mandatory Pack Gatekeeper: Customer selects their single-estate lot (or Mix & Match). To prevent checkout errors, batch sizes start unselected (selectedB2cPack = null). Customers cannot advance to Step 2 without selecting a pack size; attempting to advance triggers the dedicated #errPackSelection validation error.
* Dedicated Single-Order Scope: Redundant standing order checkboxes and cadence selectors have been retired; personal.html is strictly dedicated to clean, one-time weekend pre-orders.
* Step 2 — Delivery Schedule & Logistics: Drop day selection (Saturday vs. Sunday morning), Customer Name, 10-digit phone, Email Address, Delivery Address, and normalized Gate Drop Instructions (Deliver directly to door/desk).
* Step 3 — Payment & Confirmation: Triggers Razorpay Standard Checkout (checkout.js) for that weekend&apos;s batch. Upon payment capture, order is logged in Sheet1 and user can view live brewing status on /track.
11.2 Dedicated Corporate Drop Wizard (/corporate)
* Step 1 — Office Pack Selection & Gatekeeper: Choose team volume (Team 10-Pack, Office 20-Pack, Floor 40-Pack, Townhall 60-Pack). Enforces mandatory pack selection gatekeeper (#errPackSelection). Redundant cadence selectors have been retired in favor of clean single Friday drops.
* Step 2 — Corporate Verification & Tech Park Cluster: Company Name, Work Email, WhatsApp contact, GSTIN (for 18% ITC), Tech Park cluster dropdown, and delivery window (Morning Kickoff vs. Afternoon Recharge).
* Step 3 — B2B Payment Route: Instant Razorpay Gateway checkout or Net-7 Corporate Invoicing (INV-REQ-XXXXXX).
11.3 4-Drop Coffee Pass Purchase Wizard (/subscribe)
* Step 1 — Pass Tier & Starting Harvest: Sits symmetrically alongside personal and corporate wizards. Customer chooses their pass tier: Weekend 4-Pack Pass (₹3,199 • Save 11%), Duo Discovery Pass (₹1,699 • Save 11%), Corporate Team Pass (₹6,480 • Save 10%), or Mega Weekender Pass (₹4,199 • Save 13%). Includes custom bottle ratio splitter and promo code inputs.
* Step 2 — Fulfillment Schedule & Delivery Details: Customer selects preferred drop window (Saturday, Sunday, or Friday corporate) and delivery cadence (Weekly across 4 weeks vs. Bi-Weekly across 8 weeks), along with Delhi NCR PIN and address details.
* Step 3 — Upfront Payment & Pass Activation: 1 single Razorpay payment covers all 4 drops upfront. Activates Master Pass ID (TABC-PASS-XXXXXX), queues Drop 1 (TABC-PASS-XXXXXX-D1) for that week&apos;s batch brewing, and links directly to the /pass management portal.
11.4 Event & Catering Inquiry Wizard (/events)
---
12. Promo Code & Discount Engine
12.1 Dynamic Coupon Validation
* Configuration: Defined in the Menu & Config sheet or handled dynamically by the frontend controller (app.js).
* Active Codes (e.g., NCRFIRST): Applies a 10% introductory discount across single and multi-bottle packs (e.g., -₹24 on Single, -₹48 on Duo, -₹90 on Weekend 4-Pack).
* Validation Rules: Evaluates code case-insensitively, verifies expiration date and minimum spend thresholds, and dynamically recalculates total payable amount and savings badge.
* Ledger Audit Trail: The applied coupon code and exact discount amount are appended into Column R (Notes / UTR) of Sheet1 (e.g., Payment ID: pay_TUQ9XEXPBWbtHR | Coupon: NCRFIRST (-₹90)).
---
13. Packaging, Bottle Specifications & Handwritten Batch Ledger
13.1 Physical Vessel Architecture
* Vessel: 200ml (6.76 fl oz) vintage-inspired Flint Glass Bottle.
* Dimensions: Height: 130 mm ± 1.5 mm, Outer Diameter: 56 mm, Circumference: ~175.93 mm.
* Closure: 38mm deep black metal lug cap with airtight food-grade plastisol liner to prevent oxygen ingress.
* Thermal Performance: Calibrated for sub-4°C refrigeration and rapid heat-dissipation during ice thermal shock.
13.2 Label Dieline & Print Production
* Dimensions: 180 mm × 65 mm (allows 4.0 mm overlap adhesive seam; 2126 × 768 px at 300 DPI).
* Layout: 3-panel wrap (Panel 1: Left Wrap / Philosophy & 48h Storage Notice; Panel 2: Front Center / Gold Emblem & Estate Card; Panel 3: Right Wrap / Handwritten Batch Ledger).
* Substrate & Finish: Waterproof Synthetic Matte Polypropylene (PP) or Textured Estate Felt with cold-temperature permanent acrylic adhesive (-5°C to +40°C).
* Reference: The Apartment Brew Co. — 200ml Bottle Packaging, Label Print & Mockup Guide.
13.3 Handwritten Craft Batch Ledger Fields
Each bottle is individually hand-inscribed with archival pigment paint pens (Uni Posca PC-1M 0.7mm White/Gold or Sakura Pigma Micron 08):
19. BATCH NO.: Unique brew run identifier (e.g., #048-RAT, TABC-AUG26, CORP-012).
20. BREW DATE: Exact extraction date & timestamp (e.g., 28 AUG 2026 (06:30 AM)).
21. BOTTLE NO.: Individual sequence within the batch (e.g., 14 of 30).
22. BREWER SIGN: Barista / artisan initials (e.g., AG).
23. BEST BEFORE: Strict 48-Hour Cold-Chain Window benchmark from extraction time.
---
14. Geographic Service Areas & Corporate Tech Park Clusters
14.1 B2C Residential Delivery Zones
* Primary Hub: Gurugram residential societies and gated complexes (DLF Phase 1–5, Cyber City residential, Golf Course Road, Golf Course Extension Road, Sohna Road, Nirvana Country, Sectors 42–65).
* Extended NCR Corridor: Select South Delhi residential belts and Noida sectors (subject to cold-chain delivery transit windows).
14.2 B2B Corporate Tech Park Clusters
Scheduled Friday office drop routes optimized for key commercial tech centers:
* DLF Cyber City & Cyber Hub: Buildings 5, 8, 9, 10, 14, and Infinity Towers.
* Golf Course Road Corridor: One Horizon Center, Two Horizon Center, Palm Springs Plaza, Global Foyer.
* Sohna Road & Sub-Arterial: Candor TechSpace (Sector 21 & Sector 48), Bestech Business Park, Spaze I-Tech Park.
* Delhi-Gurugram Border & Aerocity: Cyber Park (Sector 20), Ambience Corporate Tower, Worldmark Aerocity.
---
15. Automated Email Receipts & Notification System
15.1 Transactional Intake Confirmation
Upon order submission, Code.gs immediately dispatches an itemized HTML receipt containing the unique Order ID, lot breakdown, pack size, delivery window, and mandatory cold-chain refrigeration instructions (48-hour peak flavor curve).
15.2 Automated Status-Change Email Triggers (onEdit)
Editing the Delivery Status column in Google Sheets (Sheet1 Column Q for B2C, B2B Orders Column U for B2B) automatically triggers stage-specific transactional emails:
24. Brewing & Chilling (Brewing): Notifies customer that single-estate beans are currently undergoing 92–94°C hot extraction and rapid 4°C thermal shock over clean ice.
25. Out for Delivery (Dispatched): Informs customer that insulated cold bags are in transit, reminding them of doorstep/concierge drop instructions.
26. Delivered (Delivered): Confirms delivery completion, starts the 48-hour peak freshness clock, and presents the 1-Click Sensory Feedback Widget.


15.3 3-Criteria 5-Star Sensory Feedback Engine
* Delivery Email CTA: Delivered status update emails provide a single, branded CTA button: [ Rate Your Brew & Sensory Notes → ] linking directly to https://apartmentbrewco.in/track?orderId=TABC-XXXXXX.
* Portal Placement: Located on the tracking portal (/track) directly below the Order ID search box.
* Sensory Rating Dimensions (All 5-Star Systems):
   * Overall Brew Experience (1–5 Stars): Evaluates overall satisfaction and temperature/dilution balance.
   * Bitterness Level (1–5 Stars): Calibrates roast and extraction depth:
      1. 1/5: Very Low / Smooth
      2. 2/5: Mild
      3. 3/5: Balanced
      4. 4/5: Pronounced
      5. 5/5: Intense / High
   * Tasting Notes Clarity (1–5 Stars): Calibrates grind distribution and volatile aromatic ester retention:
      1. 1/5: Muted / Blended
      2. 2/5: Subtle Notes
      3. 3/5: Distinct Tasting Notes
      4. 4/5: Bright & Defined
      5. 5/5: Crystalline / Complex
   * Barista Comments (Optional): Free-text field for specific customer notes regarding acidity, ice dilution, or pairings.
* Dual Persistence:
   * Client LocalStorage: Saves recorded feedback locally so that the customer immediately sees their recorded ratings (✓ Your Sensory Rating for this Brew) under their order ID whenever they revisit /track.
   * Google Sheets Database: Dispatches payload to the Sensory Feedback tab in the Live Order Tracker spreadsheet.
* Database Ledger Schema (Sensory Feedback Sheet):
   * Col A: Feedback Timestamp
   * Col B: Order ID (TABC-XXXXXX / TABC-B2B-XXXXXX)
   * Col C: Customer Name / Email
   * Col D: Overall Brew (1–5 Stars)
   * Col E: Bitterness (1–5)
   * Col F: Notes Clarity (1–5)
   * Col G: Barista Notes / Comments
   * Col H: Coffee Bean Lot
19. Phase 5 Retention & Community Feedback Architecture
19.1 Live Community Calibration Engine (flavor.html)
* Live Aggregation from Google Sheets: Aggregates real-time ratings from the Sensory Feedback database sheet:
   * Overall Brew Experience (1–5 Stars): Weighted average customer cupping rating.
   * Bitterness Balance (1–5 Scale): Average perceived bitterness score (target: 2.8–3.2 balanced).
   * Notes Clarity (1–5 Scale): Clarity and note transparency rating (target: 4.6–4.9 crystalline).
* Estate Cupping Cards: Displays community calibration cards for each active micro-lot with verified review counts, metric breakdown bars, and real community tasting quotes.
19.2 1-Click "Refill My Brew" Reordering (track.html)
* Frictionless Reorder Flow:
   * Once an order is delivered (or looked up via /track), a prominent ☕ Refill My Brew → action card appears.
   * Captures the tracked order's bean lot, pack size, quantity, customer profile, address, and drop instructions in tabc_refill_order.
   * Redirects directly to /personal?refill=1 or /corporate?refill=1, automatically pre-selecting the harvest, pack, and pre-filling delivery coordinates.
19.3 Recurring Standing Orders (Subscription Model)
* Cadence Options:
   * One-Time Weekend Drop: Standard pricing; upcoming batch only.
   * Weekly Standing Order (Save 10%): Automatic batch reservation every weekend with a 10% recurring discount applied directly in the pricing engine.
   * Bi-Weekly Standing Order (Save 10%): Alternate weekend drops with 10% discount.
* Corporate Tech-Park Cadence: Supported on /corporate for weekly or bi-weekly Friday office drops.
* Database & Tracking Integration:
   * Logged with [STANDING_ORDER: WEEKLY] or [STANDING_ORDER: BI_WEEKLY] tags in Google Sheets.
   * Displays active recurring subscription status and discount badge directly in the Live Tracker manifest.
   * Col I: Order Type (B2C / B2B)
15.4 Apps Script Trigger Setup Guide
To enable status-change triggers in Google Sheets:
27. Open The Apartment Brew Co. — Live Order Tracker.
28. Navigate to Extensions > Apps Script.
29. Go to Triggers (clock icon) > Add Trigger.
30. Configure:
   1. Choose which function to run: onEdit
   2. Select event source: From spreadsheet
   3. Select event type: On edit
31. Save and authorize the requested Gmail permissions (GmailApp.sendEmail).
---
16. Offline Resilience, Caching & Dynamic Fallbacks
16.1 Stale-While-Revalidate (SWR) & LocalStorage
* Initial page loads pull cached menu items, lot descriptions, and sensory parameters from browser localStorage instantly with zero layout shift.
* Background asynchronous fetch revalidates live stock, capacity limits, and announcements from Google Sheets.
16.2 Hardcoded Dynamic Fallbacks
If Google Sheets API endpoint is unreachable or throttled, app.js automatically activates default static configurations (availableLots):
32. LOT-01: Ratnagiri Estate (72h Anaerobic Natural • 1,350m MASL • Chikmagalur, Karnataka)
33. LOT-02: Banana Banger (Special Yeast Fermentation • 1,450m MASL • Shevaroys Hills, Tamil Nadu)
16.3 Service Worker (sw.js) & PWA Architecture
* Asset Caching: Implements Cache-First strategy for static vectors (tabc-emblem-gold-transparent.svg), brand favicons (16x16, 180x180, 192x192), stylesheets (style.css), and Google Fonts.
* Network Strategy: Network-First with SWR fallback for all dynamic order and tracking API calls (/exec).
---
17. Design System & Brand Asset Specifications
17.1 Master Color Matrix & Design Tokens
* Signature Brushed Gold: Accent #d4a373, Hover #b08968, Metallic Gold #CD9A3A, Gold Sim #faedcd.
* Dark Obsidian Backgrounds: Body #141312, Elevated #1a1816, Card Surface #1f1d1a, Card Inner #151413.
* Typography: System UI Font Stack (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif).
* Design Reference: The Apartment Brew Co. — Visual Asset, Color & Typography Quick-Spec.
---
18. Visual & Interaction Polish
18.1 5-Axis Sensory Radar Polygon Enhancements
* Ambient Aura Effect: Added an SVG Gaussian blur filter (#radarAuraFilter, stdDeviation="5") and dual-stroke layering that projects an ambient, theme-colored aura behind each estate's sensory polygon.
* Color-Matched Glowing Vertex Nodes: Each vertex displays concentric circles matching the harvest's exact theme color (outer 7.5px breathing aura halo + inner 3.8px color-filled node with a crisp white edge), keeping the visual presentation clean and distraction-free.
* Dynamic Metric Calibration: Values across all 5 axes (Bright Acidity, Floral Aromatics, Cane Sweetness, Body & Texture, Cup Clarity) map dynamically to live lot metrics fetched from Google Sheets.
18.2 Dual-Stream Automatic Rotating Ticker & Capacity Engine
* 5-Second Auto-Cycling (INDEX, ORDERS, ABOUT):
   * Automatically rotates every 5 seconds between:
      1. 🏠 Weekend Personal Drops: Countdown to Friday 10:00 PM cutoff; displays weekend retail capacity (250 bottles).
      2. 🏢 Friday Corporate Drops: Countdown to Thursday 6:00 PM cutoff; displays Friday tech-park office batch capacity (350 bottles).
   * Includes manual override toggle pills (#pillPersonal & #pillCorporate) so visitors can instantly lock to their desired stream.
* Dedicated Single Streams (PERSONAL & CORPORATE Pages):
   * personal.html is locked strictly to Weekend Personal (Friday 10:00 PM).
   * corporate.html is locked strictly to Friday Corporate (Thursday 6:00 PM).
* Enlarged Mechanical Flip Cards & Compact Spacing:
   * Flip-card digits enlarged to 1.3rem with tabular-nums in high-contrast gold (#fcf29b).
   * Card padding tightened to 6px 8px and container constrained to max-width: 380px for optimal mobile legibility without horizontal elongation.
   * Turns amber (#f39c12 / #e76f51) when remaining batch capacity falls below 20%.
   * Turns crimson red (#e63946) with rapid breathing pulse when remaining capacity falls below 10%.
18.3 Hardware-Accelerated Wizard Slide Transitions
* Fluid Slide Physics: Step panels in personal.html and corporate.html are wrapped in a 300% horizontal track inside a clipping viewport.
18.4 Desktop Layout & Parallel Alignment Optimizations (index.html)
Decoupled Full-Length Cards: Removed .parallel-card-deck 50/50 split wrappers so each core content block spans full width on desktop viewports.
1. Sensory Profile & Extraction: Full-width card with all 4 sensory metric cards (Aromatics, Acidity, Sweetness, Clarity) arranged in parallel across 4 columns (grid-template-columns: repeat(4, 1fr)).
2. 48-Hour Freshness Peak: 2-tier layout featuring the full-width SVG freshness curve on Line 1, and the 3 milestone cards (Hours 0–12, Hours 12–36, Hours 36–48) arranged in 3 parallel columns on Line 2 (grid-template-columns: repeat(3, 1fr)).
3. The Craft Process: 3-step brewing methodology laid out in 3 parallel columns (grid-template-columns: repeat(3, 1fr)).
4. "Confused About What to Order?" Banner: Single horizontal line banner on desktop (.confused-order-banner) with icon + title + descriptor on the left and primary CTA button on the right.
5. The Comparison Matrix: 3 comparison cards (The Apartment Brew Co., Commercial Cold Brew, Instant) aligned side-by-side in 3 parallel columns (grid-template-columns: repeat(3, 1fr)).
```css
transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
will-change: transform;
```
* Frictionless Navigation: Navigating forward and backward smoothly shifts the viewport via translateX(-0%), translateX(-33.3333%), and translateX(-66.6667%) with GPU composition, eliminating layout jumps.
18.5 Responsive Desktop Parallel Card Architecture & Full-Width Ticker
* Decoupled 50/50 decks on large viewports so cards span full container width.
* Aligns multi-column sensory grids and comparison matrices in clean desktop parallel decks.
18.6 Three Ways to Experience Card & Main Portals Grid (index.html)
* Full-Sized 3-Way Experience Card: A prominent section card on index.html explaining the three fulfillment formats:
   1. 🏠 Personal Drops: Single weekend pre-orders (1–6 bottles) delivered Saturday & Sunday morning across Delhi NCR.
   2. 🏢 Corporate Drops: Scheduled Friday office drops (10–60 bottles) with GSTIN 18% ITC and Net-7 terms.
   3. 🔄 4-Drop Coffee Passes: 1 upfront payment, 4 scheduled deliveries, 10–15% savings, individual drop IDs, and flexible skip/swap.
* Streamlined 2-Card Hub: Clean 2-card layout under Order & Inquire featuring Harvests & Ordering Hub (/orders) and Event Catering (/events).
* Dynamic Batch Navigation Label: Navigation drawer dynamically updates to Order Batch #X based on the roastery&apos;s active batch counter.
---
19. SEO, LocalBusiness Schema & Mobile Form Architecture
19.1 Technical SEO & Canonical Routing
Every route across the website implements canonical link tags and contextual meta descriptions to prevent duplicate content indexing and maximize search engine visibility:
* / (index.html): Canonical to https://apartmentbrewco.in/ — Meta Description for micro-batch flash-chilled specialty coffee hand-brewed fresh to order in Gurugram.
* /orders: Canonical to https://apartmentbrewco.in/orders — Meta Description for single-estate harvest curation and order scaling.
* /personal: Canonical to https://apartmentbrewco.in/personal — Meta Description for weekend retail drops across Delhi NCR.
* /corporate: Canonical to https://apartmentbrewco.in/corporate — Meta Description for corporate tech-park office drops.
* /flavor: Canonical to https://apartmentbrewco.in/flavor — Meta Description for flavor matcher and sensory radar comparison.
* /guide: Canonical to https://apartmentbrewco.in/guide — Meta Description for 48-hour freshness science and temperature stability.
* /about: Canonical to https://apartmentbrewco.in/about — Meta Description for brewery philosophy and sourcing story.
* /events: Canonical to https://apartmentbrewco.in/events — Meta Description for custom coffee runs and catering bars.
* /track: Canonical to https://apartmentbrewco.in/track — Meta Description for live order tracking and 3-criteria calibration.
19.2 JSON-LD LocalBusiness & CoffeeShop Schema
Implemented structured data on index.html and about.html following schema.org standards for enhanced Google search snippets and local Knowledge Graph integration:
* Entity Type: CoffeeShop (LocalBusiness)
* Coordinates: Lat 28.4595, Long 77.0266 (Gurugram, Haryana, India)
* Operating Windows: Friday corporate dispatch (09:30–16:00), Saturday & Sunday weekend drops (08:00–11:00).
* Coverage Area: Gurugram, Delhi, Noida, Faridabad.
* Catalog: Itemized menu offerings for Ratnagiri Estate and Banana Banger 200ml bottles.
19.3 Mobile Keyboard & Form Optimization
All customer-facing forms (personal.html, corporate.html, events.html, track.html) are augmented with HTML5 attributes for native mobile keyboard invocation and browser autofill:
* Full Name: autocomplete="name" autocapitalize="words" spellcheck="false"
* Work/Personal Email: type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false"
* WhatsApp / Phone: type="tel" inputmode="tel" autocomplete="tel"
* Pincode: type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="postal-code" maxlength="6"
* Company Name: autocomplete="organization" autocapitalize="words"
* Delivery Address: autocomplete="street-address" autocapitalize="words"
* Coupons, GSTIN & Order IDs: inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false"
* Quantity Selectors: inputmode="numeric" min="1"
19.4 Asset Cache-Busting Protocol
To bypass aggressive browser and CDN (Cloudflare) caching upon deploying updates to GitHub Pages, static asset imports append versioned query parameters:
* <link rel="stylesheet" href="style.css?v=2.5" />
* <script src="app.js?v=2.5"></script>
When pushing stylesheet or controller updates, incrementing the version string guarantees instantaneous asset invalidation for all visitors.
20. Advanced Logistics, Community Calibration & Subscription Architecture
20.1 Live Community Calibration Scores (flavor.html)
* Real Drinker Aggregation: Automatically pulls ratings from the Sensory Feedback sheet tab and aggregates drinker scores per lot across 3 dimensions: Overall Brew (1–5), Bitterness Balance (1–5), and Notes Clarity (1–5).
* Dynamic Calibration Display: Displays verified drinker scores, overall approval percentages (e.g., 98% Drinker Approval), total calibrations count, and top community flavor quotes directly beneath the sensory radar chart.
20.2 1-Click "Refill My Brew" Reordering (track.html)
* Zero-Friction Reordering: When customers look up an order on the tracker, an artisanal 1-click "Refill My Brew" button allows them to instantly duplicate their exact drop configuration.
* Intelligent Autofill Routing: Preserves the customer's harvest selection, pack size, custom bottle split, and delivery address, routing them to /personal?refill=1 or /corporate?refill=1 with details pre-loaded.
20.3 4-Drop Pre-Paid Coffee Pass & Self-Service Management Architecture
* Elimination of Unfunded Orders: Replaces confusing single-order auto-debit toggles with a clean, pre-paid 4-drop pass model where full payment is collected upfront on Day 1.
* Symmetrical Page Architecture:
   * Creation Wizard (/subscribe): 3-step checkout wizard for pass purchase, custom bottle ratio splitting, and upfront payment.
   * Management Portal (/pass): Self-service portal dedicated to tracking pass balance and adjusting schedules.
* Discrete Drop Order IDs (-D1 through -D4): Every pass generates 4 child drop IDs. Drop 1 (e.g., TABC-PASS-104-D1) is immediately queued into Sheet1 / B2B Orders so it is brewed for the upcoming drop, tracked on /track, and individually rated in Sensory Feedback.
* Artisanal Digital Punch Card: Visual 4-stamp card showing exact drop dates, coffee lot names, fulfillment states (DELIVERED, QUEUED FOR BREW, SCHEDULED), and direct rating links.
* 1-Click Drop Skips: Tapping "Skip Next Drop" in reminder emails or on /pass pushes the next scheduled delivery by 1 week with zero credit loss.
* 1-Click Harvest Swapping: Subscribers can switch single-estate lots between drops.
* 1-Click Pass Renewal: Prompts seamless pass renewal when remaining credits reach 0.
20.4 Smart Lot Depletion & 1-Click Auto-Rebalancing Splitter
* Inventory Guardrails: Real-time remaining bottle checks prevent customers from allocating more bottles of a single-estate lot than the roastery has in stock.
* 1-Click Auto-Rebalance: Clicking ⚡ Auto-Rebalance evenly distributes the pack's bottle quota across all active, available harvests without manual recalculation.
20.5 Luxury Metallic Shimmer Keyframes (style.css)
* Artisanal Micro-Animations: Introduces @keyframes metallicShimmer and @keyframes goldGleam for buttons, badges, and status elements, projecting a luxury flash-chilled specialty brand aesthetic.
20.6 Artisanal Cold-Chain Boarding Pass Manifest (track.html)
* Air Waybill Aesthetics: Redesigned order tracker summary card with ticket-style perforated cutouts, official cold-chain temperature verification (≤ 4.0°C Thermal Shock), digital SVG barcode, and certified roastery stamp.
20.7 Tactile Haptic & Synthesized Audio Feedback
* Multi-Sensory Interactions: Built-in Web Audio API micro-synthesizer and hardware vibration engine (playHapticTap()):
   * Stepper & Button Clicks: 12ms soft sine micro-click (800Hz → 180Hz) + 12ms vibration.
   * Rating Stars: Harmonic high chime (1046Hz C6) + 20ms vibration.
   * Order & Feedback Confirmations: Two-tone major chord confirmation + multi-pulse haptic feedback.
