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

### **📌 1.1 Roastery Operations & Craft Philosophy**

#### **Micro-Batch Protocol (Manual Extraction Limit)**

The Apartment Brew Co. maintains a strict manual extraction protocol to ensure peak quality across every drop, focusing on core craft principles:

* Manual Batch Extraction: Each coffee is brewed separately by hand in small batches specifically for each order to ensure artisanal precision.  
* Craft Nuance: Because every order is crafted manually to order, slight natural cup-to-cup flavor nuances are celebrated as a deliberate hallmark of manual specialty coffee extraction, distinguishing it from industrial brewing.

---

### **🏗️ 2\. System Architecture & Data Flow**

```
+-----------------------------------------------------------------------------------+
|                                   CLIENT LAYER                                    |
|   Multi-Page Architecture (GitHub Pages): index, order, office, events, track.html|
|   .site-nav (Global Navigation) + style.css (Dark Roast Design System)            |
|   app.js (Page Dispatcher, CMS Render, SWR Caching, Real-time Validation)         |
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
              |  - Tab 4: Custom Inquiries (13 Columns)      |      +-------------------------------+
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
   2. **Dynamic Pack Disabling:** Pack tiers whose bottle size exceeds live remaining roastery capacity (batchCapacity \- reservedBottles) are automatically grayed out and disabled on the frontend.  
   3. **Multi-Pack Quantity Throttling:** If increasing the quantity causes total bottles to exceed remaining capacity, a real-time warning (\#errCapacityLimit) triggers and blocks checkout navigation to ensure inventory integrity.  
5. Coupon Discount Engine:  
   1. Define flat (₹) or percentage (%) discount coupon codes with minimum order thresholds and mode applicability (B2C, B2B, ALL).  
6. Delivery Clusters & Slot Throttling:  
   1. Configure maximum order capacities per tech park/commercial complex and delivery window (e.g. DLF Cyber City Morning Kickoff max 15 orders) to balance logistics and courier load. The *doGet* function sums active orders from *B2B Orders* per cluster key (*techPark|window*), calculates remaining capacity, and flags *isFull* when met. The frontend (*app.js*) dynamically renders available windows, disables full slots, and displays real-time availability badges, while *doPost* enforces backend capacity validation to prevent oversubscribing corporate slots during peak cutoffs.

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

#### **1\. Multi-Page Architecture & Information Structure**

* index.html: Dedicated Brand Manifesto, Roastery Philosophy, Core Craft Pillars & Side-by-Side Comparison Matrix (Flash-Chilled vs Cold Brew vs Instant)  
* order.html: Dedicated Individual Saturday Morning Drop Pre-Order (4-Step Wizard)  
* office.html: Dedicated Corporate Friday Office Batch Drops (4-Step Wizard)  
* menu.html: Single-Estate Harvest Showcase & Sensory Profiles  
* about.html: Roastery Origin Story & Farm Direct Sourcing  
* guide.html: 48-Hour Peak Freshness Science & Serving Ritual  
* events.html: Custom Events, Hackathons & Pop-Up Coffee Bars  
* track.html: Customer Self-Service Live Order & Inquiry Status Tracker

#### **2\. Uniform 4-Step Ordering Wizard Architecture**

* The ordering workflow is uniform across both individual (order.html) and office (office.html) drops:  
  * Step 1: Harvest (Select Single-Estate Harvest): Clean 3-choice lot grid (Ratnagiri Estate \- Anaerobic Naturals, Banana Banger \- Fermented Lot, or Mix & Match).  
  * Step 2: Batch Size (Choose Batch Size & Quantity): Batch size selection with dynamic Mix & Match bottle split steppers (automatic 50/50 scaling to any pack size, live ratio bar).  
  * Mix & Match Details: Tag: "Custom split" | Notes: "Curious about trying both single-estate harvests? Customize your exact split in Batch Size" | Pills: "Bit of both", "Customised", "Your Choice" (No sensory meters).  
  * Step 3: Delivery (Delivery & Contact / Office Details): Delivery and contact/office details.  
  * Step 4: Review (Order Review & Gateway / Corporate Invoicing): Confirmation and checkout / invoicing.

#### **3\. Global Navigation System & Controller Dispatcher in app.js**

* Global Navigation (.site-nav): Transitioned to a sticky glassmorphism top header featuring a hamburger-to-X transition animation and a slide-in navigation drawer for clean, uncluttered access across the standardized navigation menu:  
  * Home (index.html)  
  * Individual Brew (order.html)  
  * Team Brew (office.html)  
  * Harvests & Sensory Menu (menu.html)  
  * Freshness Guide (guide.html)  
  * Craft & Philosophy (about.html)  
  * Event Runs (events.html)  
  * Enquiry/Order Tracker (track.html)  
* Navigation Logic & Accessibility: The slide-in drawer includes automated auto-close behaviors triggered by backdrop clicks, link selections, or the Escape key. An active page highlight mechanism ensures the current HTML context is visually indicated within the drawer navigation. All HTML entity escaping has been sanitized across the drawer header and navigation items.  
* Color Palette: Dark roast aesthetic (--bg: \#141312, \--card-bg: \#1f1d1a, \--card-inner: \#151413) with coffee gold accents (--accent: \#d4a373) and status indicators (--whatsapp: \#25d366, \--success: \#2d6a4f, \--info-blue: \#90e0ef, \--slot-full: \#6c757d).  
* Responsive Layout: Mobile-first flex container capped at 520px width.  
* Component Styling: Styled lot cards with CSS containment (contain: content), sensory meter fill bars using GPU acceleration, scarcity tracks, and hardware-accelerated micro-interactions.

#### **3\. app.js (Frontend Controller & Dispatcher)**

* Page Dispatcher Logic: Centralized management for multi-page routing and rendering based on the active HTML context, ensuring seamless data flow between the GitHub Pages architecture and the Apps Script backend.  
* **Custom Ratio Splitter & Discovery Engine:** Features dynamic bottle counters (+ / \-) for customizing exact lot ratios between harvests across any pack size. For Discovery Sampler packs, defaults automatically to a balanced 50/50 split across active single-estate harvests (scaling dynamically with pack quantity: 1 pack \= 1:1, 2 packs \= 2:2, etc.) and preserves custom proportional ratios when pack quantities change.  
* Coupon Code Engine Logic: Supports flat (₹) and percentage (%) discounts with minimum order threshold verification and mode enforcement (B2C, B2B, or ALL). Includes dynamic discount rebalancing on quantity or pack changes, Razorpay discounted payload dispatch, and structured confirmation receipt breakdowns.  
* Dynamic Cutoff & Slot Engine: Calculates closest Saturday morning delivery for B2C and Friday for B2B. Computes live ticking countdown to Thursday 6:00 PM (B2B) and Friday 10:00 PM (B2C) cutoffs. Dynamically renders available delivery windows and disables full slots based on real-time cluster capacity data.  
* Profile & Offline Management: Features in-memory profile caching and saves customer details in browser localStorage (tabc\_customer\_profile) for instant re-ordering, supported by an automated localStorage offline order retry queue and PWA Service Worker integration.  
* Validation Subsystem: Debounced input validation for Delhi NCR PIN codes, 10-digit Indian phone numbers, and 15-character GSTINs.  
* Checkout & Dispatch: Opens Razorpay checkout modal or generates corporate invoice IDs (INV-REQ-xxxxxx), then dispatches payload to Apps Script.  
* Google Calendar Link Generator & WhatsApp Sync: Generates formatted calendar URLs and structured WhatsApp pre-filled text receipts.

#### **4\. Code.gs (Backend Microservice)**

* Security Checks: Verifies authToken \=== 'TABC\_SECURE\_TOKEN\_2026' and rejects bots using honeypot detection (botTrap).  
* Concurrency & Capacity Validation: Uses LockService.getScriptLock() with a 15-second timeout (lock.tryLock(15000)) in doPost to eliminate race conditions and prevent oversubscribing coffee lots or cluster slots during peak drop cutoffs. Validates requested delivery slots against remaining cluster capacity before appending orders.  
* Database Routing: B2C orders append to Sheet1 (17 columns, instruction in Column G), while B2B orders append to B2B Orders (22 columns, instruction in Column K).  
* Email Generator: Dispatches inline-styled HTML confirmation emails via GmailApp.sendEmail with order details, 48-hour shelf-life guidelines, and Google Calendar event links.  
* Dynamic Aggregations (doGet): Calculates active lot reservations, remaining lot inventory, and cluster slot fullness in real-time.

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

## **\#\# 7\. Order & Inquiry Status Keyword Reference (Live Tracker Mapping)**

This section provides a dictionary of exact keywords, spreadsheet mappings, and resulting frontend timeline stages for the live tracking system.

### **1\. Individual Pre-Orders (Sheet1 \-\> Column P Delivery Status)**

* **Stage 1: Pre-Ordered** (Keywords: Pre-Ordered, Pending, Received) \-\> Highlights Step 1: Pre-Ordered  
* **Stage 2: Brewing** (Keywords: Brewing, Roasting, Extracting, Chilling, Prep) \-\> Highlights Step 2: Brewing & Chilling  
* **Stage 3: Dispatched** (Keywords: Dispatched, Out for Delivery, In Transit, Shipped, On the way) \-\> Highlights Step 3: Out for Delivery  
* **Stage 4: Delivered** (Keywords: Delivered, Completed, Fulfilled, Received by customer) \-\> Marks all 4 steps complete & green (Delivered)

### **2\. Corporate Office Drops (B2B Orders \-\> Column U Delivery Status)**

* **Stage 1: Pre-Ordered** \-\> Highlights Step 1  
* **Stage 2: Brewing** \-\> Highlights Step 2  
* **Stage 3: Dispatched / Out for Delivery** \-\> Highlights Step 3  
* **Stage 4: Delivered** \-\> Highlights Step 4

### **3\. Custom & Event Inquiries (Custom & Event Inquiries \-\> Column L Status)**

* **Stage 1: Inquiry Received** (Keywords: New Lead, Lead, Received, Inquiry, New) \-\> Step 1: Requirement logged & queued for review  
* **Stage 2: Proposal & Curation** (Keywords: In Discussion, Discussion, Quote, Proposal, Curating, Review) \-\> Step 2: Tasting menu, batch scale & pricing discussion  
* **Stage 3: Event Confirmed** (Keywords: Event Confirmed, Confirmed, Booked, Scheduled, Locked) \-\> Step 3: Date locked & roastery extraction scheduled  
* **Stage 4: Event Completed** (Keywords: Event Completed, Delivered, Completed, Fulfilled, Done) \-\> Step 4: Coffee bar served & fulfilled

### **4\. Event Inquiries Data Column Dictionary**

* Col C (Company): Organization / Event Name  
* Col D (Contact Name): Contact Person  
* Col G (Requirement Type): Requirement Type (Pop-up bar, Hackathon drop, etc.)  
* Col H (Headcount): Scale & Headcount / Bottles  
* Col I (Target Date): Target Event Date  
* Col J (Location): Event Venue & Tech Park  
* Col K (Notes): Special Notes & Tasting Preferences Callout Banner  
* Col L (Status): Controls Timeline Stepper & Status Badge

### **5\. Operational SOP for Roastery Updates**

* **Google Sheets Updates:** Roastery operators must manually update the status columns (Column P in Sheet1, Column U in B2B Orders, or Column L in Inquiries) using the keywords above to trigger frontend timeline changes.  
* **Apps Script Versioning:** When Code.gs is updated, ensure you use **Deploy \> Manage deployments \> Edit \> Version: New version \> Deploy** to ensure the live tracker runs the latest logic.

### **⚙️ 7\. Deployment & Configuration Guide**

1. **1\. Deploy Google Apps Script:** Open your Google Spreadsheet (*The Apartment Brew Co. — Live Order Tracker*), navigate to Extensions \> Apps Script, paste Code.gs, click Deploy \> New Deployment (Web App, Execute as: Me, Access: Anyone), and copy the Web App URL.  
2. 2\. Configure Frontend (app.js): In app.js, set CONFIG.googleSheetEndpoint to your deployed Apps Script URL, CONFIG.razorpayKeyId to your active key, and CONFIG.authToken to match AUTH\_TOKEN in Code.gs.  
3. 3\. Deploy Web Application: Host index.html, style.css, and app.js on GitHub Pages, Cloudflare Pages, Vercel, or Netlify.

---

### **⚡ 8\. Core Web Vitals & Optimization Architecture**

The system is engineered for high-performance rendering and resilience against network drops:

* Core Web Vitals: Enhancements to FCP and LCP via resource hints (preconnect/dns-prefetch) and deferred SDK loading. CLS is minimized through CSS containment and GPU-accelerated tracks. INP is optimized using centralized DOM query caching and debounced validation.  
* Network Resilience: Integrated PWA Service Workers ensure the UI remains accessible during connectivity drops, while an automated localStorage retry queue preserves and re-attempts order dispatches.  
* 

### **🛰️ 9\. Customer Self-Service Live Order Status Tracker**

The system features a real-time fulfillment lifecycle tracker allowing customers to monitor their micro-batch coffee from extraction to delivery, utilizing a Dual-Mode Stepper Architecture that adapts to the order type:

* **Pre-Ordered:** Order successfully logged and queued for the upcoming drop.  
* **Brewing:** Coffee is being hand-extracted and flash-chilled to capture peak aromatics.  
* **Dispatched:** Order has left the roastery and is in cold-chain transit to the delivery cluster.  
* **Delivered:** Coffee successfully delivered to the customer’s door or security/concierge desk.  
* **Custom Requirements & Events (TABC-EVT-XXXXXX):**  
  * **Inquiry Received:** Specialized request successfully logged in the inquiry database.  
  * **Proposal & Curation:** Roastery team is evaluating requirements and curating the bespoke discovery workshop or catering plan.  
  * **Event Confirmed:** Logistics and coffee lots finalized for the scheduled event date.  
  * **Event Completed:** Successful execution of the custom startup coffee run or event catering service.

#### **Backend Lookup Handler (doGet)**

The tracker is powered by a dedicated *doGet* lookup handler in the backend microservice. It supports the query parameter *?action=track\&orderId=TABC-XXXXXX*, which performs a cross-tab search across both *Sheet1* (B2C) and *B2B Orders* to retrieve live status data.

#### **Client-Side Tracking UI**

The frontend (*app.js*) renders a specialized tracking view featuring an animated 4-step stepper with glowing active states. This tracker dynamically switches stepper headers, descriptions, card fields, and stage transitions based on the detected order type (Standard vs. Events), complemented by an order details card displaying specific batch and delivery parameters.  
---

### **🎉 10\. Custom Requirements, Event Catering & Startup Coffee Runs**

The system includes a dedicated module for managing high-volume event catering and bespoke roastery requirements, integrated directly into the serverless architecture.

#### **4-Mode Website Structure**

The frontend navigation and logic are segmented into four primary operational modes:

* **Individual (B2C):** Standard Saturday morning micro-batch drops for retail customers.  
* **Office Drop (B2B):** Scheduled Friday corporate deliveries for established office clusters.  
* **Events & Custom:** Specialized intake for catering, discovery workshops, and startup coffee runs.  
* **Track Order:** Real-time fulfillment status lookup for active orders.

#### **Custom & Event Inquiries Sheet Schema (13 Columns)**

All specialized requests are routed to a dedicated database tab with the following structure:

| Column | Field Definition |
| :---- | :---- |
| A \- B | Timestamp, Inquiry ID |
| C \- F | Organization Name, Contact Person, Work Email, WhatsApp |
| G \- J | Requirement Type, Headcount/Bottles, Event Date, Location |
| K \- M | Notes, Status, Lead Owner |

#### **Backend Processing & SLA**

The backend *doPost* engine handles intake for these requests by appending data to the inquiry sheet and triggering an automated HTML confirmation email via GmailApp. The system is configured for a standard 24-hour response SLA for all custom lead evaluations.  
---

### **🛠️ 11\. Troubleshooting & Configuration Recovery**

1. **Delivery Cluster Capacity Limits:** Ensure the Max Orders column in the *Menu & Config* tab is set appropriately (e.g., 25 orders) so active cluster capacity does not block test or production B2B orders by meeting the *isFull* flag prematurely.  
2. **Apps Script Deployment:** When updating *Code.gs*, roastery operators must deploy using **Deploy \> Manage deployments \> Edit \> Version: New version \> Deploy**. This is critical to ensure the live /exec endpoint runs the latest B2B order handling and capacity validation code.