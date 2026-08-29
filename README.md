# **☕ The Apartment Brew Co. — System & Operations Manual**

### **Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR**

**⚡ Asset-Light Craft Brewery** • **❄️ 94°C → 4°C Flash-Chilled** • **🌿 0 Preservatives**  
**📦 Standard 200ml Glass** • **💳 Razorpay Gateway \+ Net-7** • **📊 Google Sheets CMS**  
A lightweight, serverless e-commerce and order intake platform built for scheduled micro-batch craft coffee drops, headless Google Sheets CMS synchronization, Razorpay payment processing, real-time self-service order tracking, and automated transactional customer communications. All coffee across retail, corporate, and catering tiers is standardized into premium 200ml glass bottles.  
---

### **📑 Table of Contents**

1. [1\. Craft Philosophy & Operations](#1-craft-philosophy--operations)  
2. [2\. Platform Architecture & Data Flow](#2-platform-architecture--data-flow)  
3. [3\. Portal Directory & Clean-URL Routing](#3-portal-directory--clean-url-routing)  
4. [4\. User Journey & Ordering Engine](#4-user-journey--ordering-engine)  
5. [5\. Headless CMS Schema ("Menu & Config")](#5-headless-cms-schema-menu--config)  
6. [6\. Database Schema & Sheet Specifications](#6-database-schema--sheet-specifications)  
7. [7\. Order Tracking & Status State Machine](#7-order-tracking--status-state-machine)  
8. [8\. Brewery Operational SOP & Drop Cycles](#8-brewery-operational-sop--drop-cycles)  
9. [9\. Deployment & Environment Configuration](#9-deployment--environment-configuration)  
10. [10\. Performance, Security & Resilience Guardrails](#10-performance-security--resilience-guardrails)

---

---

### **1\. Craft Philosophy & Operations**

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


Field Name
Data Type
Description & Purpose
Lot ID
String
Unique identifier (e.g., LOT-01, LOT-02, LOT-03).
Estate Name
String
Single-estate farm title (e.g., Ratnagiri Estate, Riverdale Estate).
Region & Elevation
String
Origin and altitude (e.g., Chikmagalur • 1,350m MASL).
Process Tag
String
Fermentation process (e.g., 72h Anaerobic Natural, Washed Carbonic Maceration).
Tasting Notes
String
Sensory descriptors displayed across harvest cards and receipts.
Emojis
String / Array
Comma-separated emojis driving dynamic visual flavor swatches (e.g., 🍇, 🍑, 🍫).
Flavor Pills
String / Array
Comma-separated tags used for category badges and flavor quiz matching.
Roast Level %
Integer (0–100)
Drives the roast spectrum meter on /orders.
Fermentation Depth %
Integer (0–100)
Drives the fermentation meter on /orders.
Acidity %
Integer (0–100)
Axis 1 of the 5-Axis Sensory Radar & comparative spectrum.
Body %
Integer (0–100)
Axis 4 of the 5-Axis Sensory Radar & viscosity gauge.
Sweetness %
Integer (0–100)
Axis 3 of the 5-Axis Sensory Radar & comparative spectrum.
Aromatics %
Integer (0–100)
Axis 2 of the 5-Axis Sensory Radar & comparative spectrum.
Clarity %
Integer (0–100)
Axis 5 of the 5-Axis Sensory Radar & comparative spectrum.
Process Story
String (Paragraph)
Farm-level processing story rendered dynamically on /flavor.
Pairing Rituals
String
Time of day and food pairing recommendations rendered dynamically on /flavor.
Max Bottles
Integer
Drop capacity allocation. Setting to 0 marks lot as Sold Out.
Active
Boolean (TRUE/FALSE)
Controls whether the lot is active on the website. Inactive lots are automatically disabled across all portals.

| :---- | :---- | :---- |

### 5.3 Package Tiers (Standardized 200ml Glass Bottles)

* B2C Personal Packs:  
  * Single Bottle: 1x 200ml — ₹240  
  * Duo Pack / Discovery Sampler: 2x 200ml — ₹480 (Discovery Flight)  
  * Weekend Pack: 4x 200ml — ₹899 (Popular)  
  * Mega Weekender: 6x 200ml — ₹1,200 (Value)  
* B2B Corporate Packs:  
  * Team Pack: 10x 200ml — ₹1,800  
  * Office Batch: 20x 200ml — ₹3,400  
  * Floor Pack: 40x 200ml — ₹6,000  
  * Townhall Bulk: 60x 200ml — ₹8,700

### 5.4 Delivery Cluster Throttling

Protects Friday delivery routes by capping orders per tech park and window (e.g. DLF Cyber City Morning Kickoff capped at 25 orders). When full, the slot is automatically disabled on the frontend.  
---

## 6\. Database Schema & Sheet Specifications

### 6.1 Sheet1 (B2C Personal Orders — 17 Columns)

```
[A] Timestamp           [G] Drop Instruction    [M] Total Amount (₹)
[B] Order ID            [H] Delivery Window     [N] Payment Preference
[C] Customer Name       [I] Coffee Bean Lot     [O] Payment Status
[D] WhatsApp Number     [J] Pack Selected       [P] Delivery Status
[E] Email Address       [K] Quantity            [Q] Notes / UTR
[F] Delivery Address    [L] Total Bottles
```

### 6.2 B2B Orders (Corporate Drops — 22 Columns)

```
[A] Timestamp           [I]  PIN Code           [Q] Total Amount (₹)
[B] Order ID            [J]  Drop Instructions  [R] Payment Mode
[C] Company Name        [K]  Delivery Window    [S] Payment Status
[D] Contact Name        [L]  Delivery Date      [T] GSTIN
[E] Work Email          [M]  Coffee Selection   [U] Delivery Status
[F] Contact Phone       [N]  Pack Selected      [V] Notes / Invoice Ref
[G] Tech Park           [O]  Quantity
[H] Building & Floor    [P]  Total Bottles
```

### 6.3 Custom & Event Inquiries (13 Columns)

```
[A] Timestamp           [F] Contact Phone       [K] Special Notes
[B] Inquiry ID          [G] Requirement Type    [L] Inquiry Status
[C] Company / Event     [H] Headcount / Scale   [M] Lead Owner
[D] Contact Person      [I] Target Event Date
[E] Work Email          [J] Location / Venue
```

---

## 7\. Order Tracking & Status State Machine

The self-service lookup engine on /track queries the active Google Sheets database via ?action=track\&orderId=... and updates a 4-stage visual timeline stepper:

*

#### **7.1 Standard Order Fulfillment States (Sheet1 & B2B Orders)**

| Stage | Stepper Label & Badge | Matching Trigger Keywords in Database |
| :---- | :---- | :---- |
| **Step 1** | 📦 **PRE-ORDERED** | Pre-Ordered, Pending, Received, New, Confirmed |
| **Step 2** | ☕ **BREWING & CHILLING** | Brewing, Extracting, Chilling, Prep, Roasted |
| **Step 3** | 🚚 **OUT FOR DELIVERY** | Dispatched, Out for Delivery, Transit, En Route |
| **Step 4** | ✅ **DELIVERED** | Delivered, Completed, Fulfilled |

*
*

#### **7.2 Custom Event Inquiry States (Custom & Event Inquiries)**

| Stage | Stepper Label & Badge | Matching Trigger Keywords in Database |
| :---- | :---- | :---- |
| **Step 1** | 📨 **INQUIRY RECEIVED** | New Lead, Received, Logged, In Review |
| **Step 2** | 📋 **PROPOSAL PREPARED** | Proposal Sent, Quoted, Custom Batch Evaluated |
| **Step 3** | ☕ **SETUP & BREW STAGING** | Confirmed, Barista Assigned, Pre-Brew Staging |
| **Step 4** | 🎉 **EVENT SERVED** | Event Completed, Served, Closed |

*

---

### **8\. Brewery Operational SOP & Drop Cycles**

*

1.
2.

| Day | Time (IST) | Operational Focus & Task Checklist |
| :---- | :---- | :---- |
| **Wednesday** | 10:00 AM | **Inventory Check**: Verify bean stock, roast dates, and 200ml glass bottle inventory |
| **Thursday** | 6:00 PM | **Corporate Cutoff**: Finalize Friday delivery rosters & print batch logs |
| **Thursday** | Night | **Corporate Extraction**: 94°C hot pour-overs & instant 4°C flash-chilling |
| **Friday** | 8:30 AM | **Corporate Dispatch**: Morning Kickoff & Afternoon Recharge drops across tech parks |
| **Friday** | 10:00 PM | **Saturday B2C Cutoff**: Lock weekend roster, hand-brew and bottle Saturday drops |
| **Saturday** | 8:00 AM | **Saturday Morning Drop**: 8:00 AM – 11:00 AM cold-chain doorstep delivery |
| **Saturday** | 10:00 PM | **Sunday B2C Cutoff**: Lock weekend roster, hand-brew and bottle Sunday drops |
| **Sunday** | 8:00 AM | **Sunday Morning Drop**: 8:00 AM – 11:00 AM cold-chain doorstep delivery |

1. 1\. Daily Fulfillment Cadence:  
   * Thursday 6:00 PM: Corporate cutoff. Lock Friday rosters and calculate batch volumes.  
   * Friday 8:00 AM – 4:00 PM: Brew, flash-chill, and dispatch Friday office batches.  
   * Friday 10:00 PM: Saturday residential cutoff. Hand-brew and bottle Saturday drops.  
   * Saturday 8:00 AM – 11:00 AM: Cold-chain delivery to residential societies.  
   * Saturday 10:00 PM: Sunday residential cutoff. Hand-brew and bottle Sunday drops.  
   * Sunday 8:00 AM – 11:00 AM: Cold-chain delivery to residential societies.  
2. 2\. Order Lifecycle Status Updates:  
   * Operators update Column P in Sheet1, Column U in B2B Orders, or Column L in Custom & Event Inquiries.  
   * Marking an order as Delivered or Cancelled automatically resets batch reservations for upcoming cycles while retaining financial and tracking records.

---

### **9\. Deployment & Environment Configuration**

#### **9.1 Google Apps Script Deployment (Code.gs)**

1. Open Google Sheets \> Extensions \> Apps Script.  
2. Paste the latest Code.gs script.  
3. Click Deploy \> New Deployment (Type: Web App, Execute as: Me, Access: Anyone).  
4. Save the generated Web App URL (<https://script.google.com/macros/s/.../exec>).  
5. Note: When updating Code.gs, always deploy as a New Version via Manage Deployments.

#### **9.2 Frontend Client Hosting**

---

### **10\. Performance, Security & Resilience Guardrails**

* Zero Build Overhead: Vanilla HTML5, modern CSS variables, and ES6 JavaScript with zero external frameworks or node dependencies.  
* Concurrency Locking: Google Apps Script LockService.getScriptLock() prevents race conditions during high-volume drop cutoffs.  
* Honeypot Bot Trap: Hidden input field (botTrap) silently drops automated spam submissions.  
* Resilient Offline Cache: Progressive Web App service worker (sw.js) caches static assets for lightning-fast loads.  
* Secure Token Authentication: All mutating POST calls are signed with CONFIG.authToken matching Code.gs.


