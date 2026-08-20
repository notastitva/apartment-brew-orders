# ☕ The Apartment Brew Co. — Web Portal & Order Intake System

> **Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR**  
> A lightweight, serverless e-commerce and order intake portal powered by a **Google Sheets Headless CMS**, featuring live menu rotations, dynamic pricing, automated batch scarcity tracking, custom flight batch builders, payment gateway integration, scoped promo codes, and transactional email confirmations with 1-click Google Calendar reminders.

---

## 📌 1. Overview & Business Model

**The Apartment Brew Co.** operates an asset-light, pre-order only micro-batch coffee venture in Gurugram, delivering across Delhi NCR:

* **Extraction & Freshness Protocol**: Coffee is extracted hot to dissolve volatile aromatics and flash-chilled immediately over ice below 3°C. Zero preservatives or additives with a strict **48-hour peak freshness window**.
* **Dual Delivery Pathways**:
  * **B2C (Individual Saturday Morning Drops)**: Pre-orders open Monday and close Friday 10:00 PM; delivered Saturday 8:00 AM – 11:00 AM.
  * **B2B (Corporate Friday Office Drops)**: Orders close Thursday 6:00 PM; delivered Friday (Morning Kickoff 9:30–11:30 AM or Afternoon Recharge 2:00–4:00 PM).
* **Delivery & Gate Instructions**: 3 standardized drop preferences:
  1. `Deliver directly to door / desk`
  2. `Leave with Tower Security / Concierge Desk`
  3. `Call upon arrival for pickup`
* **Coverage**: Hyper-local Delhi NCR (Gurugram DLF Phases 1-5, Cyber City, Golf Course Rd, Candor TechSpace, Udyog Vihar, Noida, South Delhi).

---

## 🏗️ 2. System Architecture

```mermaid
flowchart TD
    subgraph SheetsCMS [Google Sheets Headless CMS]
        Config["Menu & Config Tab: Lots, Pricing and Store Status"]
        LiveDB["Order Database: Sheet1 and B2B Orders"]
    end

    subgraph Backend [Google Apps Script Backend]
        DoGet["doGet: Live Config Server and Coupon Validator"]
        DoPost["doPost: Order Ingestion and Bot Trap Filter"]
        Mailer["Gmail Notification Engine: HTML Receipts and Calendar"]
    end

    subgraph Frontend [Client Layer Frontend]
        UI["index.html + style.css: Dark Roast Interface"]
        JS["app.js: Controller, Batch Splitter and Cart"]
    end

    subgraph Payments [Payment Gateway]
        RZP["Razorpay SDK: UPI, Cards and Corporate Invoices"]
    end

    Config -->|Reads Live Config & Formulas| DoGet
    DoGet -->|HTTP GET Config JSON| JS
    JS -->|Renders Menu & Dynamic Lots| UI
    UI -->|Customer Checkout Action| JS
    JS -->|Payment Modal or Invoice| RZP
    JS -->|HTTP POST Order JSON| DoPost
    DoPost -->|Appends Order Row| LiveDB
    DoPost -->|Sends Confirmation Email| Mailer
```

### Architecture Data Flow

```text
+-------------------------------------------------------------------------+
|                  GOOGLE SHEETS HEADLESS CMS & DATABASE                  |
|  - Tab 1: 'Menu & Config' (Lots, Packs, Pricing, Store Status, Coupons) |
|  - Tab 2: 'Sheet1' (B2C Individual Orders — 17 Columns)                 |
|  - Tab 3: 'B2B Orders' (Corporate Friday Drops — 22 Columns)            |
|  - Tab 4: 'Instructions' (Operational SOPs & Freshness Protocols)       |
+--------------------+--------------------------------+-------------------+
                     ^                                |
       doPost() Order Log               doGet() Live Config Feed
                     |                                v
+------------------------------------+   +--------------------------------+
|    Google Apps Script (Code.gs)    |   |     Client Layer (Frontend)    |
|    - doGet: Config & Coupon Server |   |  - index.html (Semantic UI)    |
|    - doPost: Order & Email Engine  |   |  - style.css (Dark Roast UI)   |
|    - Auth Token & Bot Trap Filter  |   |  - app.js (Dynamic Controller) |
+--------------------+---------------+   +----------------+---------------+
                     |                                    |
                     v                                    v
       +----------------------------+       +-----------------------------+
       | Gmail Notification Engine  |       |    Razorpay Payment SDK     |
       | - Safe HTML Confirmations  |       |   (UPI, Cards, NetBanking)  |
       | - 1-Click GCal Invitations |       +-----------------------------+
       +----------------------------+
```

---

## 📂 3. Repository File Structure

* `index.html` - Semantic single-page application structure, dynamic lot/pack grids, custom ratio splitter, promo coupon row, and confirmation receipt.
* `style.css` - Dark-roast CSS design system (`:root` tokens), sensory meter bars, custom splitter steppers, dual-tone ratio tracks, coupon badges, and responsive layouts.
* `app.js` - Dynamic configuration loader, session cache manager, custom ratio balancing engine, live countdown timer, scoped coupon validator, and validation subsystem.
* `Code.gs` - Backend microservice serving `doGet` (dynamic CMS & coupon validation) and `doPost` (order ingestion & HTML email receipts).
* `README.md` - Complete architectural guide, database schemas, operator SOPs, and deployment steps.

---

## 🚀 4. Detailed Component Breakdown

### 1. `index.html` (Frontend Structure)
* **Branding Header**: Brand logo, active drop banner (`#dropBanner`), live countdown timer (`#countdownTimer`), and capacity scarcity bar (`#scarcityText`, `#scarcityFill`).
* **Store Status Alert**: Top banner (`#storeStatusBanner`) that dynamically displays alerts if drops are paused or sold out.
* **Mode Switcher**: Segmented toggle between B2C (`#tabB2c`) and B2B (`#tabB2b`).
* **Dynamic Lot Selector (`#lotGrid`)**: Populated dynamically from Google Sheets with tasting notes, roast levels, and acidity/body sensory meters.
* **Build Your Own Batch (Custom Ratio Splitter)**: Dynamic bottle steppers (`+` / `–`) allowing customers to customize exact lot ratios between Ratnagiri Anaerobic and Thogarihunkal Washed with an interactive dual-tone ratio bar.
* **Dynamic Pack Grids (`#b2cPacks`, `#b2bPacks`)**: Renders pack tiers and prices live from Google Sheets:
  * **B2C**: Single Bottle (₹240), Duo Pack (₹480), Weekend Pack (₹899), Mega Weekend (6x 250ml, ₹1,200).
  * **B2B**: Team Pack (₹1,800), Office Batch (₹3,400), Floor Pack (₹6,000), Townhall Bulk (₹8,700).
* **Promo & Coupon Input**: `#couponInput` and `#btn-coupon` for instant discount validation.
* **Customer & Delivery Fields**: Autocomplete returning customer banner (`#savedProfileBar`), Delhi NCR PIN code validator, and 3-option gate delivery preference selector.
* **Freshness Accordion**: 48-Hour storage and serving guide (`.guide-accordion`).
* **Confirmation View**: Order receipt, Google Calendar 1-click reminder (`.btn-calendar`), and formatted WhatsApp receipt (`.btn-whatsapp`).

### 2. `style.css` (Design System)
* **Color Palette**: Dark roast aesthetic (`--bg: #141312`, `--card-bg: #1f1d1a`, `--card-inner: #151413`) with coffee gold accents (`--accent: #d4a373`) and status indicators (`--whatsapp: #25d366`, `--success: #2d6a4f`, `--info-blue: #90e0ef`).
* **Components**: Custom ratio splitter steppers, dual-tone ratio tracks, coupon input groups, error tooltips, and confirmation receipt cards.
* **Responsive Layout**: Mobile-first flex container capped at 520px width.

### 3. `app.js` (Frontend Controller)
* **Dynamic Config Fetcher (`fetchLiveConfig`)**: Loads menu lots, packs, scarcity counts, and store status from Google Sheets on page load with built-in instant fallback if offline.
* **Scarcity Session Caching (`loadCachedScarcity`)**: Prevents UI flickering by caching latest batch capacity in `sessionStorage`.
* **Dynamic Cutoff Engine**: Computes ticking countdown to Thursday 6:00 PM (B2B) and Friday 10:00 PM (B2C) cutoffs.
* **Scoped Coupon Engine (`recalculateDiscount`, `applyCoupon`)**: Automatically re-calculates percentage discounts against active cart totals and validates channel eligibility (B2C vs B2B) to prevent discount leakage.
* **1-Click Profile Caching**: Saves customer details in browser `localStorage` (`tabc_customer_profile`) for instant re-ordering.
* **Validation Subsystem**:
  * Delhi NCR PIN Code RegEx: `^(11[0-9]{4}|122[0-9]{3}|121[0-9]{3}|201[0-9]{3})$`
  * Indian Mobile Number RegEx: `^[6-9]\d{9}$`
  * 15-character GSTIN RegEx: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
* **Checkout & Dispatch**: Razorpay checkout integration with corporate invoice fallback (`INV-REQ-xxxxxx`), dispatching payload to Google Apps Script via `fetch(..., { mode: 'no-cors' })`.

### 4. `Code.gs` (Backend Microservice)
* **`doGet(e)` Server**:
  * Auto-initializes and repairs the `Menu & Config` sheet if missing or incomplete with 8-column normalization.
  * Serves live lots, pricing, store status, and automated reserved bottle counts (`=SUM(Sheet1!L2:L)`).
  * Validates promo coupons with minimum order checks and channel mode restrictions (`B2C`, `B2B`, `ALL`).
  * Self-healing reset endpoint (`?action=resetConfig`).
* **`doPost(e)` Order Ingestion**:
  * Shared token security check (`TABC_SECURE_TOKEN_2026`) & honeypot bot trap.
  * Appends B2C orders to `Sheet1` (17 columns, instruction in Column G).
  * Appends B2B orders to `B2B Orders` (22 columns, instruction in Column K).
* **HTML Email Dispatcher**: Dispatches inline-styled HTML receipts via `GmailApp.sendEmail` with email-safe HTML character entities and Google Calendar reminder links.

---

## 📊 5. Google Sheets Database Schema

### 1. `Menu & Config` (Headless CMS)
* **General Settings**: `Store Status` (OPEN / PAUSED / SOLD_OUT), `Batch Capacity` (e.g. 60), `Announcement Banner`
* **Coffee Lots Table**: `Lot ID` | `Estate Name` | `Process Tag` | `Tasting Notes` | `Flavor Pills` | `Acidity %` | `Body %` | `Active`
* **B2C Packs Table**: `Pack ID` | `Pack Name` | `Bottles` | `Price (₹)` | `Badge` | `Active`
* **B2B Packs Table**: `Pack ID` | `Pack Name` | `Bottles` | `Price (₹)` | `Active`
* **Coupons Table**: `Coupon Code` | `Discount Type` (PERCENT / FLAT) | `Discount Value` | `Min Order (₹)` | `Applicable Mode` (B2C / B2B / ALL) | `Active`

### 2. `Sheet1` (B2C Orders — 17 Columns)
`Order Timestamp` | `Order ID` | `Customer Name` | `WhatsApp Number` | `Email Address` | `Delivery Address / Area` | `Delivery / Gate Instruction` | `Delivery Date` | `Coffee Bean Lot` | `Pack Selected` | `Quantity` | `Total Bottles` | `Total Amount (₹)` | `Payment Preference` | `Payment Status` | `Delivery Status` | `Notes / UTR`

### 3. `B2B Orders` (Corporate Drops — 22 Columns)
`Order Timestamp` | `Order ID` | `Company / Business Name` | `Contact Person Name` | `Work Email` | `WhatsApp / Phone` | `GSTIN` | `Tech Park / Commercial Complex` | `Building / Tower / Floor` | `PIN Code` | `Delivery / Gate Instruction` | `Delivery Window` | `Delivery Date (Friday Drop)` | `Coffee Lot Selection` | `Pack Tier` | `Quantity` | `Total Bottles` | `Total Amount (₹)` | `Payment Method` | `Payment Status` | `Delivery Status` | `Notes / Payment Ref / PO Number`

### 4. `Instructions` (Operational SOPs)
Contains batch extraction schedules, 48-hour shelf-life rules, delivery cutoff timelines, pricing reference tables, and tech park reception drop-off guidelines.

---

## ⚙️ 6. Operator & Deployment Guide

### 1. Deploy Google Apps Script
1. Open your Google Sheet (`The Apartment Brew Co. — Live Order Tracker`).
2. Go to **Extensions > Apps Script** and paste `Code.gs`.
3. Click **Deploy > New Deployment**, select **Web App**, set *Execute as* to **Me**, and *Who has access* to **Anyone**.
4. Copy the generated Web App URL (`https://script.google.com/macros/s/.../exec`).

### 2. Configure Frontend
1. In `app.js`, set `CONFIG.googleSheetEndpoint` to your deployed Apps Script Web App URL.
2. Set `CONFIG.razorpayKeyId` to your active Razorpay Key (`rzp_live_...` or `rzp_test_...`).
3. Set `CONFIG.authToken` to match `AUTH_TOKEN` in `Code.gs`.

### 3. How to Manage Weekly Drops in Google Sheets (Zero Code)
* **Rotate Coffee Lots**: In the `Menu & Config` tab, edit `Estate Name`, `Tasting Notes`, or `Acidity %`. The website updates live.
* **Mark Lot Sold Out**: Change `Active` from `TRUE` to `FALSE` next to that coffee lot.
* **Adjust Batch Capacity**: Edit cell B3 (`Batch Capacity`). The progress bar updates in real time.
* **Pause Pre-Orders**: Change cell B2 (`Store Status`) to `PAUSED` or `SOLD_OUT`.
* **Add a Promo Code**: Add a row to `--- COUPONS ---` (e.g. `WEEKEND20`, `PERCENT`, `20`, `480`, `B2C`, `TRUE`).
* **Reset / Repair Config**: Open `https://script.google.com/macros/s/.../exec?action=resetConfig` in your browser to auto-populate all tables and styling.
