# **\# The Apartment Brew Co. — System Documentation & Operations Manual**

## **Micro-Batch Flash-Chilled Specialty Coffee • Gurugram & Delhi NCR**

A lightweight, serverless e-commerce and order intake platform built for scheduled micro-batch craft coffee drops, Google Sheets headless CMS management, Razorpay payment gateway integration, real-time order tracking, and automated transactional customer communications. All coffee is standardized into 200ml glass bottles across all retail and corporate tiers, with sizing presented specifically within the "Batch Size" configuration.  
---

## **1\. Business Model & Craft Operations**

### **1.1 The Micro-Batch Craft Manifesto**

The Apartment Brew Co. operates an asset-light, pre-order only craft specialty coffee brewery in Gurugram, India:

* Hot Extraction & Thermal Flash-Chill: Sourced from award-winning specialty roasters and single-estate farms, coffee is brewed hot at 92–94°C to dissolve delicate floral aromatic oils and fruit sugars, then instantly flash-chilled over ice to 4°C to lock in volatile flavor molecules before oxidation can occur.  
* 100% Preservative Free: Zero stabilizers, zero chemicals, and zero pasteurization. Delivered with a strict 48-Hour Peak Freshness Window.  
* 200ml Glass Bottle Standardization: Every single bottle across retail packs, corporate drops, and event runs is standardized to a 200ml premium glass bottle format.  
* Artisanal Nuance: Each batch is handcrafted separately to order. Subtle natural cup-to-cup character is celebrated as a deliberate hallmark of manual specialty extraction.

### **1.2 Dual Delivery Model & Brewing Cutoffs**

* B2C Weekend Drops (Individual Pre-Orders):  
  * Saturday Morning Drop (8:00 AM – 11:00 AM): Cutoff closes Friday at 10:00 PM.  
  * Sunday Morning Drop (8:00 AM – 11:00 AM): Cutoff closes Saturday at 10:00 PM.  
* B2B Corporate Drops (Office Batches):  
  * Friday Delivery (Morning Kickoff 9:30–11:30 AM or Afternoon Recharge 2:00–4:00 PM): Cutoff closes Thursday at 6:00 PM.  
* Custom Events & Inquiries:  
  * On-demand intake for hackathons, townhalls, pop-up coffee bars, and startup team coffee runs with a 24-hour response SLA.

---

## **2\. Platform Architecture & Data Flow**

```
+-----------------------------------------------------------------------------------+
|                                   CLIENT LAYER                                    |
|   Multi-Page Static Web Portal (GitHub Pages): 8 Dedicated HTML Pages             |
|   style.css (Dark Roast Glassmorphism Design System)                              |
|   app.js (Page Dispatcher, CMS Rendering, SWR Cache, Validation, Splitter Engine) |
+--------------------------+------------------------------------+-------------------+
                           |                                    |
                Payment Gateway Callback                HTTP GET / POST (JSON)
                           |                                    |
                           v                                    v
+-------------------------------------+      +--------------------------------------+
|        Razorpay Gateway SDK         |      |     Google Apps Script (Code.gs)     |
|       (UPI / Cards / NetBank)       |      |     - doGet: Live CMS & Order Status |
+-------------------------------------+      |     - doPost: Order Intake & Locks   |
                                             |     - Concurrency LockService Guard  |
                                             |     - Auth Token & Honeypot Trap     |
                                             +------------------+-------------------+
                                                                |
                                             +------------------+-------------------+
                                             |                                      |
                                             v                                      v
              +----------------------------------------------+      +-------------------------------+
              |            Google Sheets Database            |      |   Gmail Notification Engine   |
              |  - Tab 1: Menu & Config (Headless CMS)       |      |  - HTML Confirmation Receipts |
              |  - Tab 2: Sheet1 (B2C Orders, 17 Cols)       |      |  - 1-Click Calendar Links     |
              |  - Tab 3: B2B Orders (Corporate, 22 Cols)    |      |  - WhatsApp Deep-Links        |
              |  - Tab 4: Custom & Event Inquiries (13 Cols) |      +-------------------------------+
              |  - Tab 5: Operational Guide & SOP            |
              +----------------------------------------------+
```

---

## **3\. Web Pages & Portal Directory**

| Page | File | Purpose |
| :---- | :---- | :---- |
| Home & Manifesto | index.html | Brand origin story, 4 craft pillars, side-by-side comparison matrix, and portal pathways |
| Individual Pre-Order | order.html | 4-step consumer wizard (Harvest \-\> Batch Size \-\> Delivery \-\> Review) with Saturday/Sunday selector |
| Corporate Office Drops | office.html | 4-step B2B corporate wizard with cluster delivery windows, GSTIN capture, and Net-7 invoicing |
| Harvests & Sensory Menu | menu.html | Interactive sensory profiles, acidity/body meters, tasting notes, and active farm lot showcase |
| Freshness Guide | guide.html | Science of flash-chilling, temperature stability graph, and cold storage/serving rituals |
| Craft & Philosophy | about.html | In-depth brand origin story, small-batch hand-brewing philosophy, and direct trade farm sourcing |
| Event Runs | events.html | Intake form for startup hackathons, townhalls, pop-up coffee bars, and bulk team drops |
| Enquiry / Order Tracker | track.html | Real-time self-service lookup for B2C, B2B, and custom event inquiry fulfillment stages |

---

## 4\. Headless CMS Configuration ("Menu & Config")

The entire website frontend is dynamically powered by the Menu & Config tab in Google Sheets:

### 4.1 General Store Settings

* Store Status: OPEN (active ordering), PAUSED (temporarily paused), or SOLD\_OUT (batch capacity reached).  
* Independent Batch Capacities & Cutoffs:  
  * B2C Batch Capacity: 150 bottles (200ml) for weekend drops (Cutoffs: Friday 10 PM for Saturday drop, Saturday 10 PM for Sunday drop).  
  * B2B Batch Capacity: 200 bottles (200ml) for Friday corporate drops (Cutoff: Thursday 6 PM).  
* Announcement Banner: Custom text displayed in the header drop banner.

### 4.2 Single-Estate Harvest Lots

* Configurable Fields: Lot ID, Estate Name, Processing Method, Tasting Notes, Flavor Pills, Acidity %, Body %, Max Bottle Cap, and Active (TRUE/FALSE).  
* Mix & Match Option: Automatically rendered on retail/office portals to allow custom bottle ratio distributions across active lots.

### 4.3 Pack Tiers (All Standardized to 200ml)

* B2C Retail Packs:  
  * Single Bottle: 1x 200ml (₹240)  
  * Duo Pack / Discovery Sampler: 2x 200ml (₹480)  
  * Weekend Pack: 4x 200ml (₹899 \- Popular)  
  * Mega Weekender: 6x 200ml (₹1,200 \- Value)  
* B2B Corporate Packs:  
  * Team Pack: 10x 200ml (₹1,800)  
  * Office Batch: 20x 200ml (₹3,400)  
  * Floor Pack: 40x 200ml (₹6,000)  
  * Townhall Bulk: 60x 200ml (₹8,700)  
* Dynamic Throttling: Pack tiers that exceed remaining batch capacity are automatically grayed out and disabled on the frontend.

### 4.4 Coupon Code Engine

Supports FLAT (₹) or PERCENT (%) discounts with minimum order thresholds and mode targeting (B2C, B2B, or ALL).

### 4.5 Delivery Clusters & Slot Throttling

Configures maximum capacity per tech park and Friday delivery window (e.g. DLF Cyber City Morning Kickoff max 25 orders) to prevent courier overloading.  
---

## 5\. Google Sheets Database Schema

### 5.1 Sheet1 (B2C Orders — 17 Columns)

\[Order Timestamp, Order ID, Customer Name, WhatsApp Number, Email Address, Delivery Address / Area, Delivery / Gate Instruction, Delivery Date & Window, Coffee Bean Lot, Pack Selected, Quantity, Total Bottles, Total Amount (₹), Payment Preference, Payment Status, Delivery Status, Notes / UTR\]

### 5.2 B2B Orders (Corporate Drops — 22 Columns)

\[Timestamp, Order ID, Company, Contact Name, Email, Phone, GSTIN, Tech Park, Building Floor, PIN, Drop Instructions, Window, Date, Bean, Pack, Quantity, Bottles, Total, Payment Mode, Payment Status, Delivery Status, Notes\]

### 5.3 Custom & Event Inquiries (13 Columns)

\[Timestamp, Inquiry ID, Company, Contact Name, Work Email, Phone, Requirement Type, Headcount, Target Date, Location, Notes, Status, Lead Owner\]  
---

## 6\. Live Order & Inquiry Status Tracking Reference

### 6.1 Standard Orders Status Keywords (Sheet1 Col P & B2B Orders Col U)

* Stage 1 (Pre-Ordered): Pre-Ordered, Pending, Received \-\> Highlights Step 1  
* Stage 2 (Brewing & Chilling): Brewing, Extracting, Chilling, Prep \-\> Highlights Step 2  
* Stage 3 (Out for Delivery): Dispatched, Out for Delivery, In Transit, Shipped, On the way \-\> Highlights Step 3  
* Stage 4 (Delivered): Delivered, Completed, Fulfilled, Received by customer \-\> Completes all 4 steps (Green)

### 6.2 Custom & Event Inquiries Status Keywords (Custom & Event Inquiries Col L)

* Stage 1 (Inquiry Received): New Lead, Lead, Received, Inquiry, New \-\> Highlights Step 1  
* Stage 2 (Proposal & Curation): In Discussion, Discussion, Quote, Proposal, Curating, Review \-\> Highlights Step 2  
* Stage 3 (Event Confirmed): Event Confirmed, Confirmed, Booked, Scheduled, Locked \-\> Highlights Step 3  
* Stage 4 (Event Completed): Event Completed, Delivered, Completed, Fulfilled, Done \-\> Completes all 4 steps (Green)

### 6.3 Event Inquiries Field Mappings Reference

* Col B (Inquiry ID): Customer self-service search key (TABC-EVT-XXXXXX)  
* Col C (Company): Organization / Event Name  
* Col D (Contact Name): Contact Person display  
* Col E (Work Email): Confirmation & receipt target  
* Col F (Phone): WhatsApp / Phone coordination  
* Col G (Requirement Type): Requirement Type (Pop-up Bar, Hackathon Drop, etc.)  
* Col H (Headcount): Scale / Headcount (e.g. 100–250 people / 150 bottles)  
* Col I (Target Date): Target event date  
* Col J (Location): Event venue & tech park  
* Col K (Notes): Special Notes & Brew Preferences banner  
* Col L (Status): Controls 4-step timeline stepper and status badge  
* Col M (Lead Owner): Internal operations assignee

---

## **7\. Operational SOP for Brew Fulfillment**

* 1\. Daily & Weekly Order Lifecycle:  
  * Thursday 6:00 PM: B2B corporate order cutoff. Finalize Friday delivery cluster rosters.  
  * Friday Morning / Afternoon: Hand-brew, flash-chill, and dispatch Friday corporate drops.  
  * Friday 10:00 PM: B2C Saturday drop cutoff. Brew, flash-chill, and bottle Saturday pre-orders.  
  * Saturday Morning: Cold-chain drop for Saturday residential pre-orders.  
  * Saturday 10:00 PM: B2C Sunday drop cutoff. Brew, flash-chill, and bottle Sunday pre-orders.  
  * Sunday Morning: Cold-chain drop for Sunday residential pre-orders.  
* 2\. Updating Order Statuses:  
  * Brewery operators update Column P in Sheet1, Column U in B2B Orders, or Column L in Custom & Event Inquiries using the exact keywords listed in Section 6\.  
* 3\. Capacity Resetting for Next Drop:  
  * Setting Delivery Status to Delivered or Cancelled automatically deducts those bottles from the active reservation count, resetting capacity for the next drop cycle without deleting customer history.

---

## 8\. Deployment & Setup Guide

* 1\. Google Apps Script (Code.gs):  
  * In Google Sheets, navigate to Extensions \> Apps Script, paste Code.gs, and click Deploy \> New Deployment (Type: Web App, Execute as: Me, Access: Anyone).  
  * Whenever modifying Code.gs, always use Deploy \> Manage Deployments \> Edit \> Version: New Version \> Deploy.  
* 2\. Frontend Configuration (app.js):  
  * Set CONFIG.googleSheetEndpoint to your deployed Apps Script Web App URL.  
  * Set CONFIG.razorpayKeyId to your active Razorpay Key ID.  
  * Ensure CONFIG.authToken matches AUTH\_TOKEN in Code.gs.  
* 3\. Static Web Hosting:  
  * Deploy HTML files, style.css, app.js, and sw.js to GitHub Pages, Cloudflare Pages, Vercel, or Netlify.

---

## 9\. Performance & Core Web Vitals Optimization

* Core Web Vitals: Preconnect and dns-prefetch hints for Razorpay checkout, CSS containment, GPU-accelerated transforms on progress bars, and debounced validation.  
* Offline Resilience & PWA: Service worker caching (sw.js) and automated localStorage retry queue to prevent lost orders during momentary network interruptions.