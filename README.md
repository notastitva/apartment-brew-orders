# ☕ The Apartment Brew Co. — Web Portal & Order Intake System

## Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR

A lightweight, high-performance, serverless e-commerce and order intake portal designed for scheduled micro-batch craft coffee drops, dynamic Google Sheets headless CMS configuration, direct payment gateway integration, live order tracking, and automated customer notifications.

---

## 📌 1. Overview & Business Model

The Apartment Brew Co. operates an asset-light, pre-order only micro-batch craft coffee roastery:

* **Extraction & Peak Freshness:** Coffee is extracted hot to capture delicate floral and fruity aromatics and flash-chilled immediately over ice. 100% preservative-free with a strict **48-hour peak freshness window**.
* **Dual Delivery Pathways:**
  * **B2C (Individual Saturday Morning Drops):** Pre-orders close Friday 10:00 PM; delivered Saturday 8:00 AM – 11:00 AM.
  * **B2B (Corporate Friday Office Drops):** Orders close Thursday 6:00 PM; delivered Friday (Morning Kickoff 9:30–11:30 AM or Afternoon Recharge 2:00–4:00 PM).
* **Delivery Coverage:** Hyper-local Delhi NCR (Gurugram DLF Phases 1–5, Cyber City, Golf Course Rd, Candor TechSpace, Udyog Vihar, Noida Tech Parks, and Central/South Delhi).

---

## 🏗️ 2. System Architecture



```
flowchart TD
    subgraph Frontend["Client Layer (Frontend UI & Controller)"]
        UI["index.html + style.css (Dark Roast UI)"]
        JS["app.js (Dynamic Drop Engine & Validations)"]
    end

    subgraph Gateway["Payment Gateway"]
        RZP["Razorpay SDK (UPI / Cards / NetBanking)"]
    end

    subgraph Serverless["Backend Microservice (Google Apps Script)"]
        GAS["Code.gs (Auth Token & Bot Trap Verification)"]
    end

    subgraph Storage["Google Workspace Services"]
        DB["Google Sheets Database (Sheet1 & B2B Orders)"]
        Mail["Gmail Dispatch Engine (HTML Order Receipts & GCal)"]
    end

    UI --> JS

    JS -->|Payment Modal| RZP

    JS -->|Async HTTP POST| GAS
    GAS -->|Append Row| DB
    GAS -->|Send Confirmation| Mail
```

### **\#\#\# Architecture Data Flow**

```
+-------------------------------------------------------------------------+
|                              CLIENT LAYER                               |
|        index.html (Semantic UI)  +  style.css (Dark Roast Palette)      |
|        app.js (Dynamic Cutoff Engine, Validation & LocalStorage)        |
+--------------------+--------------------------------+-------------------+
                     |                                |
         Razorpay SDK Callback             Async HTTP POST (JSON)
                     |                                |
                     v                                v
+----------------------------+   +----------------------------------------+
|    Razorpay Gateway SDK    |   |     Google Apps Script (Code.gs)       |
|    (UPI / Cards / NetBank) |   |     - Shared Auth Token Security Check |
+----------------------------+   |     - Anti-Bot Honeypot Trap Filter    |
                                 +--------------------+-------------------+
                                                      |
                                     +----------------+---------------+
                                     |                                |
                                     v                                v
       +---------------------------------------------+  +--------------------------------+
       |           Google Sheets Database            |  |    Gmail Notification Engine   |
       |  - Tab 1: Sheet1 (B2C Orders, 17 Columns)   |  |  - B2C Saturday Drop Receipt   |
       |  - Tab 2: B2B Orders (Corporate, 22 Columns)|  |  - B2B Friday Corporate Drop  |
       +---------------------------------------------+  +--------------------------------+
```


---

## 🎛️ 3. Google Sheets Headless CMS ("Menu & Config")

The website is 100% data-driven by the **`Menu & Config`** tab in the Google Spreadsheet. Non-technical roastery operators can control the live website directly from Google Sheets without writing code:

### 1. Store Status Control
* **`OPEN`**: Pre-orders active; payment gateway enabled.
* **`PAUSED`**: Displays roastery preparation banner; temporarily disables checkout buttons.
* **`SOLD_OUT`**: Displays sold-out notice; alerts customers for the next batch release.

### 2. Batch Capacity & Scarcity Progress Bar
* **`Batch Capacity`**: Sets the total roasted batch bottle limit (e.g., `60`, `100`, `200`).
* **Live Reservation Tally**: `doGet` automatically sums active bottles from `Sheet1` (B2C) and `B2B Orders` to display `X / [Capacity] Bottles Reserved` on the frontend.

### 3. Coffee Harvest Lots Management
* Edit lot estate names, processing methods (e.g. *Anaerobic Naturals*, *Washed Lot*), tasting notes, flavor pill tags, acidity %, and body %.
* Setting `Active (TRUE/FALSE)` to `FALSE` immediately removes the lot from the frontend.
* The interactive **Custom Ratio Splitter** automatically updates its lot labels and split controls based on the active harvests.

### 4. B2C & B2B Pack Tiers Management
* Edit pack names, bottle quantities, unit prices (₹), and marketing badges (e.g. `Popular`, `Value`, `MOQ`).

### 5. Coupon Discount Engine
* Define flat (₹) or percentage (%) discount coupon codes with minimum order thresholds and mode applicability (`B2C`, `B2B`, `ALL`).

---

## 🔄 4. Capacity Reset & Fulfillment Lifecycle SOP

To reset the capacity counter (the "$X$" in "$X$ / 200 Bottles Reserved") between weekly drops:

1. **Mark Orders as Delivered / Cancelled (Recommended):**
   * In **`Sheet1`** (B2C): Set **Column P** (`Delivery Status`) to `Delivered` or `Cancelled`.
   * In **`B2B Orders`**: Set **Column U** (`Delivery Status`) to `Delivered` or `Cancelled`.
   * The backend automatically excludes fulfilled orders and resets the reserved bottle counter back to `0` for the upcoming drop while preserving historical order logs.
2. **Clear / Delete Test Rows:**
   * Select test order rows (row 2 downwards) in `Sheet1` or `B2B Orders` and delete them.
3. **Change Total Batch Limit:**
   * In the `Menu & Config` tab, change Cell **B3** (`Batch Capacity`) to the new batch target.

---

## 📁 5. Repository File Structure & Breakdown

* **`index.html`**: Semantic single-page application structure featuring dynamic rendering containers (`#lotGrid`, `#b2cPacks`, `#b2bPacks`, `#storeStatusBanner`), preconnect resource hints, deferred Razorpay SDK script loading, and PWA Service Worker integration.
* **`style.css`**: Design system utilizing CSS Custom Properties, CSS containment (`contain: layout style;`), and GPU compositor transforms (`scaleX`) for smooth progress bars.
* **`app.js`**: Frontend controller featuring:
  * **Dynamic CMS Rendering:** Builds coffee lot cards, sensory meters, pack option buttons, and custom ratio splitter controls directly from `Menu & Config`.
  * **Stale-While-Revalidate (SWR) Caching:** Stores fetched config in `localStorage` (`tabc_live_config`) for instant zero-latency rendering on page reload.
  * **Background Polling:** Re-fetches config every 60 seconds to keep scarcity counters synced.
  * **Input Validation Subsystem:** Real-time regex validation for Delhi NCR PIN codes (`11xxxx`, `122xxx`, `121xxx`, `201xxx`), 10-digit Indian phone numbers, and 15-character GSTINs.
  * **Offline Order Queue:** Queues 10-digit Indian phone numbers, and 15-character GSTINs.
  * **Offline Order Queue:** Queues failed order submissions in `localStorage` (`tabc_pending_orders`) and dispatches them automatically upon network reconnection (`window.addEventListener('online')`).
  * **1-Click Customer Profile Autofill:** Saves customer details locally for returning customers.
* **`Code.gs`**: Google Apps Script backend:
  * **`doGet(e)`**: Serves parsed JSON payload of `Menu & Config` settings, active lots, packs, coupons, and live reservation calculations.
  * **`doPost(e)`**: Handles secure order ingestion, honeypot spam filtering, shared auth token verification, spreadsheet logging, and HTML receipt dispatch via Gmail.
  * **Test Runners (`testDoGet`, `testDoPost`)**: Enables direct in-editor execution and one-click Google OAuth permission authorization.

---

## 📊 6. Google Sheets Database Schema

### Sheet1 (B2C Orders — 17 Columns)
| Col | Field Name | Description |
|:---:|:---|:---|
| A | Order Timestamp | Date and time order was placed |
| B | Order ID | Unique B2C identifier (e.g. `TABC-856192`) |
| C | Customer Name | Customer full name |
| D | WhatsApp Number | 10-digit phone number |
| E | Email Address | Customer email |
| F | Delivery Address / Area | Building, flat, society, region, and PIN |
| G | Delivery / Gate Instruction | Door drop / security desk preference |
| H | Delivery Date | Saturday morning drop date |
| I | Coffee Bean Lot | Selected harvest lot or custom split ratio |
| J | Pack Selected | Pack tier name (e.g. `Weekend Pack`) |
| K | Quantity | Quantity of packs |
| L | Total Bottles | Total 250ml bottles ordered |
| M | Total Amount (₹) | Total paid amount |
| N | Payment Preference | `Razorpay Gateway` |
| O | Payment Status | Gateway transaction reference |
| P | Delivery Status | `Pre-Ordered` / `Brewing` / `Dispatched` / `Delivered` |
| Q | Notes / UTR | Additional delivery and payment metadata |

### B2B Orders (Corporate Drops — 22 Columns)
| Col | Field Name | Description |
|:---:|:---|:---|
| A | Order Timestamp | Date and time order was placed |
| B | Order ID | Unique B2B identifier (e.g. `TABC-B2B-417722`) |
| C | Company / Business Name | Company or organization name |
| D | Contact Person Name | Contact name & role |
| E | Work Email | Corporate email address |
| F | WhatsApp / Phone | Contact phone number |
| G | GSTIN | 15-character GSTIN (or `N/A`) |
| H | Tech Park / Commercial Complex | Selected commercial complex hub |
| I | Building / Tower / Floor | Specific office building and floor details |
| J | PIN Code | 6-digit Delhi NCR PIN code |
| K | Delivery / Gate Instruction | Gate drop / desk delivery preference |
| L | Delivery Window | Morning Kickoff or Afternoon Recharge slot |
| M | Delivery Date | Friday office drop date |
| N | Coffee Lot Selection | Selected harvest lot or custom split ratio |
| O | Pack Tier | Pack tier name (e.g. `Team Pack`) |
| P | Quantity | Quantity of packs |
| Q | Total Bottles | Total 250ml bottles ordered |
| R | Total Amount (₹) | Total order value |
| S | Payment Method | `Razorpay Gateway` or `Corporate Invoice (Net Terms)` |
| T | Payment Status | Gateway ID or Invoice request reference |
| U | Delivery Status | `Pre-Ordered` / `Brewing` / `Dispatched` / `Delivered` |
| V | Notes / Payment Ref / PO Number | Corporate billing and dispatch notes |

---

## ⚙️ 7. Deployment & Configuration Guide

### 1. Deploy Google Apps Script
1. Open your Google Spreadsheet (**The Apartment Brew Co. — Live Order Tracker**).
2. Go to **Extensions > Apps Script** and paste `Code.gs`.
3. Select `testDoGet` in the toolbar dropdown and click **Run** to authorize permissions (Spreadsheet & Gmail).
4. Click **Deploy > New Deployment** (or **Manage Deployments > Edit > New Version**).
5. Configure:
   * **Execute as:** `Me (your email)`
   * **Who has access:** `Anyone`
6. Click **Deploy** and copy the Web App URL (ending in `/exec`).

### 2. Configure Frontend (`app.js`)
1. In `app.js`, set `CONFIG.googleSheetEndpoint` to your deployed Apps Script Web App URL.
2. Set `CONFIG.razorpayKeyId` to your active Razorpay Key (`rzp_live_...` for production or `rzp_test_...` for testing).
3. Ensure `CONFIG.authToken` matches `AUTH_TOKEN` in `Code.gs`.

### 3. Deploy Web Application
Host `index.html`, `style.css`, and `app.js` on GitHub Pages, Cloudflare Pages, Vercel, or Netlify.

---

## ⚡ 8. Core Web Vitals & Optimization Architecture

* **First Contentful Paint (FCP) & Largest Contentful Paint (LCP):** Optimized via `preconnect` and `dns-prefetch` resource hints for `checkout.razorpay.com` and deferred SDK script loading.
* **Cumulative Layout Shift (CLS):** Eliminated via CSS layout containment (`contain: layout style;`) on all cards and containers.
* **Interaction to Next Paint (INP):** Optimized by eliminating synchronous layout thrashing and executing instant Stale-While-Revalidate cache reads.
* **Network & Offline Fault Tolerance:** PWA Service Worker caching and an automated localStorage retry queue guarantee that customer orders are never lost during intermittent mobile network dropouts.
