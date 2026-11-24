# Product Requirements Document (PRD): PrintQR — Multi-Tenant QR-to-Print SaaS

## 1. Project Overview
**PrintQR** is a mobile-first, multi-tenant **QR-to-Print micro-SaaS platform** built for local photocopy shops, cyber cafes, photo studios, and CSC / Jan Seva Kendras in India. 

Instead of customers sharing personal phone numbers and sensitive documents (Aadhaar, PAN, admit cards) via WhatsApp, each shop gets a branded QR code and dedicated URL (`domain.com/s/:shopSlug`). Customers scan, upload files (or merge front/back ID cards), and track live print status with zero login. Shopkeepers manage a real-time split-screen **PWA Counter Dashboard** with 1-click **Approve & Print** or **Reject**.

### Core Architectural Principles
1. **Strict Zero-Storage Privacy:** Files are **never permanently stored**. Files are uploaded temporarily via presigned URLs to Cloudflare R2 and **permanently deleted immediately upon Print or Reject**, with an automatic **15-minute TTL fallback cleanup**.
2. **100% Web / PWA (Zero Desktop Software):** Shopkeepers install the counter dashboard as a Chrome PWA (no `.exe` installation).
3. **Self-Serve Onboarding:** Shops sign up, start a 3-day free trial or pay the **₹499 Launch Offer** via UPI/Razorpay, and immediately download their ready-to-print A4 QR Standee PDF.
4. **Mobile-First & Bilingual (EN / HI):** Customer upload screens must be thumb-friendly, ultra-fast on 4G, and support instant English/Hindi switching.

---

## 2. Tech Stack
* **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4 + `vite-plugin-pwa`
* **Client-Side Document Utilities:**
  * `pdf-lib` (ID Card Front+Back auto-merge into A4 PDF, page counting, A4 QR Standee PDF generation)
  * `pdfjs-dist` (In-browser PDF preview rendering in Shopkeeper Dashboard)
  * `qrcode` (QR code generation)
  * `lucide-react` (Icons)
* **Backend:** Node.js + Express + TypeScript + `Socket.io` (Real-time queue & status sync)
* **Database:** PostgreSQL (NeonDB compatible) + Prisma ORM
* **Temporary File Storage:** Cloudflare R2 (via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) with presigned PUT/GET URLs so large files bypass backend memory.
* **Payments:** Razorpay (UPI / Cards / Netbanking — ₹499 Launch Offer + Webhook verification)
* **Auth:** JWT (HTTP-only cookies / Bearer token) + bcrypt password hashing (Shopkeepers & Super Admin). Customers require **zero auth**.

---

## 3. User Roles & Route Map

| Role | Route | Description |
| :--- | :--- | :--- |
| **Public** | `/` | Mobile-first high-converting Landing Page (₹499 Offer, Live Demo preview, Features, FAQ) |
| **Public** | `/register`, `/login` | 2-minute Shopkeeper self-onboarding & login |
| **Customer (No Auth)** | `/s/:shopSlug` | Branded shop upload page (Normal Print + ID Card Mode + Live Token Tracker) |
| **Shopkeeper (Auth)** | `/dashboard` | Live Counter Split-Screen Dashboard (Queue + Preview + Print/Reject + Today's Stats) |
| **Shopkeeper (Auth)** | `/dashboard/standee` | Printable A4/A5 QR Standee PDF Generator (3 templates) |
| **Shopkeeper (Auth)** | `/dashboard/settings` | Shop profile, rates (B&W/Color/ID), UPI ID, Counter Open/Close, Plan status |
| **Super Admin (Auth)** | `/admin` | Manage all shops, toggle active/suspended, view revenue/trials, monitor active jobs |

---

## 4. Detailed Functional Requirements

### Module A: Public Landing Page & Self-Serve Onboarding (`/`, `/register`)
1. **Landing Page (`/`):**
   * Hero section targeting Indian print shops: *"WhatsApp Chhodo — Apni Dukan ka QR-to-Print Lagwao Sirf ₹499 Mein"*.
   * Interactive visual walkthrough of Scan → Upload → Counter Print → Auto-Delete.
   * Primary CTAs: **"Start 3-Day Free Trial"** and **"Get ₹499 Launch Offer"**.
2. **Quick Registration (`/register`):**
   * Fields: `Shop Name`, `Auto-generated Slug` (editable, live availability check e.g. `/s/verma-digital`), `Phone / WhatsApp Number`, `Password`, `City`.
   * Pre-filled editable defaults: `B&W Rate: ₹2/page`, `Color Rate: ₹10/page`, `Optional Shop UPI ID`.
   * Instant account creation with `planStatus: 'TRIAL'` (expires in 3 days) + immediate prompt to upgrade to `LAUNCH_499` via Razorpay checkout.

### Module B: Customer Mobile Flow (`/s/:shopSlug`)
* **Shop Status Guard:** If shop does not exist, plan expired, or `isCounterOpen === false`, show a clean friendly state (*"Shop is currently closed for QR uploads"*).
* **Header:** Shop Name, Verified Badge, **EN / हिंदी** toggle, and green privacy pill: *"🔒 100% Private • Print hote hi server se delete"*.
* **Tab 1: Normal Print Mode**
  * Multi-file drag/tap upload accepting `.pdf`, `.jpg`, `.jpeg`, `.png` (Max **15 MB per file**, max 5 files per job).
  * Client-side auto-detection of PDF page count (using `pdf-lib`) and image count.
  * Print Options (Large tap-friendly chips):
    * Color Mode: `B&W` (shows shop's rate) / `Color` (shows shop's rate)
    * Copies: `- [ 1 ] +` stepper
    * Sides: `Single Side` / `Front-Back (Duplex)`
    * Optional Customer Name (e.g., "Rahul")
  * **Sticky Bottom Bar:** Displays real-time calculated `Estimated Total (₹)` + primary button **`Send to Counter →`**.
* **Tab 2: ID Card Mode (Killer Feature)**
  * Two camera/gallery upload boxes: **`FRONT SIDE`** and **`BACK SIDE`**.
  * Client-side canvas preprocessing toggle: *"Auto-Brighten & Clean Contrast"* (enabled by default).
  * Live preview showing both front and back neatly positioned on a single **A4 Portrait sheet** (standard Aadhaar/PAN card aspect ratio, centered with subtle cut guidelines).
  * On submit, `pdf-lib` merges both images into a single crisp A4 PDF **in the browser** and uploads it as a `jobType: 'ID_CARD'` job.
* **Screen C: Live Token & Status Tracker**
  * Immediately after upload, show a large bold **Token Number** (e.g., `#14` — resets daily per shop).
  * Real-time 4-step vertical tracker synced via `Socket.io`:
    1. `File Sent to Counter ✓`
    2. `Shopkeeper Reviewing...`
    3. `Printing 🖨️`
    4. `Printed & Permanently Deleted 🔒`
  * **Rejected State:** Turns red with exact reason sent by shopkeeper (e.g., *"Photo blur hai"* / *"PDF Password Protected"*) + prominent **`Upload Again`** button.
  * **Optional UPI Pay Button:** If shopkeeper configured `upiId`, show a deep-link button (`upi://pay?pa=...&pn=...&am=...&cu=INR`) for 1-tap UPI payment.

### Module C: Shopkeeper PWA Counter Dashboard (`/dashboard`)
* **Top Bar:**
  * Shop Name + Live Connection Dot (`Connected` / `Reconnecting`)
  * **`Counter OPEN / CLOSED`** toggle switch
  * **`Sound Alert ON / OFF`** toggle (plays crisp notification chime via Web Audio API when new job arrives)
  * Today's live counter summary: `Today: X Prints • Est. ₹Y`
  * Quick links: `Download QR Standee`, `Settings`, `Install App` (PWA prompt)
* **Split-Screen Layout (Desktop/Tablet):**
  * **Left Pane — Live Queue (35% width):**
    * Filter tabs: `All`, `B&W`, `Color`, `ID Card`.
    * Each job card shows: **Color-coded left border** (Blue = B&W, Amber = Color, Teal = ID Card), Token `#`, Customer Name (or "Walk-in"), Filename, Page Count, Settings badges, Estimated ₹, and live **Countdown Timer** (`14:30 left`).
  * **Right Pane — Inline Preview & Actions (65% width):**
    * Renders PDF/Image inline immediately upon selecting a queue card (fetches file as Blob into browser RAM via presigned R2 GET URL).
    * Preview controls: `Zoom (- / +)`, `Rotate 90°`, `Fit to Page`, page navigator for multi-page PDFs.
    * Bottom Action Bar:
      * **`❌ Reject`** (dropdown with 1-click quick reasons: *Blur / Unclear*, *Password Locked PDF*, *Wrong File*, *Custom*). Triggers immediate server delete + emits rejection to customer.
      * **`🖨️ Approve & Print`** (Primary button). Emits `PRINTING` status → triggers clean print iframe/Blob print dialog (`window.print()`) → on print completion (`afterprint` event or manual *"Confirm Printed & Clear"* button), calls `POST /api/jobs/:id/complete` which **immediately deletes the file from Cloudflare R2**.
  * **30-Second Local RAM Reprint Undo:**
    * After a file is deleted from the server, keep the already-fetched Blob URL in the shopkeeper's local browser state for **30 seconds** with a small toast: *"Token #14 Printed & Deleted from server. [Paper jam? Reprint (28s)]"*. After 30s, call `URL.revokeObjectURL()`. Zero server storage used!
  * **Keyboard Shortcuts:**
    * `ArrowUp` / `ArrowDown`: Navigate queue
    * `Enter` or `P`: Approve & Print selected job
    * `Delete`: Open quick Reject menu

### Module D: Auto QR Standee Generator (`/dashboard/standee`)
* Generates high-resolution, print-ready **A4 and A5 PDFs** client-side using `pdf-lib` + `qrcode`.
* Offers **3 clean templates** (Classic Blue, Minimal White, Vibrant Retail).
* Each standee includes:
  * Shop Name (large bold header)
  * High-contrast QR Code pointing to `https://domain.com/s/:shopSlug`
  * Bilingual instructions: *"No WhatsApp Needed • Scan QR & Send Document • 100% Private (Auto-Deletes after Print)"*
  * **Viral Growth Footer:** *"Apni dukan ke liye ₹499 mein lagwayein — domain.com"*

### Module E: Ephemeral Zero-Storage & Auto-Cleanup Engine
1. **Upload Flow:** Client requests `POST /api/public/:slug/jobs/init` → Backend validates shop active/open, generates daily sequential `tokenNumber`, returns Cloudflare R2 **Presigned PUT URL** (expires in 2 mins). Client uploads directly to R2, then calls `POST /api/public/:slug/jobs/:id/confirm` → Backend emits `job:new` via Socket.io to shop's room.
2. **Instant Delete:** Calling `complete` or `reject` immediately executes `DeleteObjectCommand` on R2 and clears `r2ObjectKey` in DB.
3. **15-Minute TTL Fallback Cron:** A server-side cron job runs every **2 minutes**, finds any job with `status IN ('PENDING', 'REVIEWING', 'PRINTING')` where `expiresAt < NOW()`, deletes its R2 object, updates status to `EXPIRED`, and notifies both shopkeeper and customer via Socket.io.
4. **R2 Bucket Lifecycle Rule (Defense in Depth):** Document setup instructions to configure a 1-day bucket lifecycle expiration on Cloudflare R2 as an ultimate failsafe.
5. **Privacy Logging:** Only non-PII metadata is retained for daily stats (`pageCount`, `copies`, `colorMode`, `estimatedPrice`, `status`, `createdAt`). Filenames and file keys are wiped upon completion/expiry.

### Module F: Super Admin Panel (`/admin`)
* Protected by `role === 'SUPER_ADMIN'`.
* **Metrics Cards:** Total Shops, Paid Shops (`₹499`), Active Trials, Total Prints Today, Revenue Collected.
* **Shops Table:** Search by shop name/phone/slug, view plan status, expiry date, total prints, and 1-click actions: `Activate Paid Plan (Manual UPI Override)`, `Extend Trial`, `Suspend / Unsuspend`.

---

## 5. Database Schema (PostgreSQL / Prisma)

```prisma
enum Role {
  SHOPKEEPER
  SUPER_ADMIN
}

enum PlanStatus {
  TRIAL
  ACTIVE_LAUNCH
  EXPIRED
  SUSPENDED
}

enum JobType {
  NORMAL
  ID_CARD
}

enum ColorMode {
  BW
  COLOR
}

enum PrintSides {
  SINGLE
  DOUBLE
}

enum JobStatus {
  UPLOADING
  PENDING
  REVIEWING
  PRINTING
  COMPLETED
  REJECTED
  EXPIRED
}

model Shop {
  id            String     @id @default(cuid())
  shopName      String
  slug          String     @unique
  ownerPhone    String     @unique
  passwordHash  String
  city          String?
  upiId         String?
  role          Role       @default(SHOPKEEPER)

  // Pricing Configuration (in INR)
  bwRate        Float      @default(2)
  colorRate     Float      @default(10)
  idCardRate    Float      @default(10)

  // Operational & Subscription State
  isCounterOpen Boolean    @default(true)
  planStatus    PlanStatus @default(TRIAL)
  trialEndsAt   DateTime?
  paidAt        DateTime?
  dailyTokenSeq Int        @default(0)
  lastTokenDate String?    // YYYY-MM-DD in IST for daily token reset

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  printJobs     PrintJob[]
  payments      Payment[]
}

model PrintJob {
  id             String     @id @default(cuid())
  shopId         String
  shop           Shop       @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  tokenNumber    Int
  customerName   String?    @default("Walk-in")
  jobType        JobType    @default(NORMAL)
  
  // File metadata (wiped after print/reject/expiry)
  fileName       String?
  mimeType       String
  fileSizeBytes  Int
  r2ObjectKey    String?    // Set to null immediately after R2 deletion
  
  // Print specifications
  pageCount      Int        @default(1)
  copies         Int        @default(1)
  colorMode      ColorMode  @default(BW)
  sides          PrintSides @default(SINGLE)
  estimatedPrice Float      @default(0)
  
  status         JobStatus  @default(UPLOADING)
  rejectReason   String?
  
  expiresAt      DateTime   // createdAt + 15 minutes
  deletedAt      DateTime?
  createdAt      DateTime   @default(now())

  @@index([shopId, status])
  @@index([expiresAt])
}

model Payment {
  id                String   @id @default(cuid())
  shopId            String
  shop              Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  amountInr         Int      @default(499)
  razorpayOrderId   String   @unique
  razorpayPaymentId String?
  status            String   @default("CREATED") // CREATED, PAID, FAILED
  createdAt         DateTime @default(now())
}
```

---

## 6. Core API & Socket.io Events

### REST Endpoints
* **Auth & Shop:**
  * `POST /api/auth/register` — Create shop + start 3-day trial
  * `POST /api/auth/login` — Login shopkeeper/admin
  * `GET /api/shop/me`, `PATCH /api/shop/settings` — Profile, rates, UPI, `isCounterOpen` toggle
  * `GET /api/shop/stats/today` — Today's completed prints & estimated revenue
* **Public Customer Flow:**
  * `GET /api/public/shops/:slug` — Public shop name, rates, UPI ID, `isCounterOpen`
  * `POST /api/public/shops/:slug/jobs/init` — Validate file size/MIME, allocate daily `tokenNumber`, return R2 Presigned PUT URL + `jobId`
  * `POST /api/public/jobs/:jobId/confirm` — Mark `PENDING`, emit `job:new` to shop room
* **Shopkeeper Job Management:**
  * `GET /api/jobs/pending` — List active queue for logged-in shop
  * `GET /api/jobs/:jobId/preview-url` — Emit `REVIEWING`, return 2-min R2 Presigned GET URL
  * `POST /api/jobs/:jobId/printing` — Emit `PRINTING` to customer
  * `POST /api/jobs/:jobId/complete` — Delete object from R2, wipe `r2ObjectKey` & `fileName`, mark `COMPLETED`, emit `job:updated`
  * `POST /api/jobs/:jobId/reject` — Delete object from R2, wipe `r2ObjectKey` & `fileName`, save `rejectReason`, mark `REJECTED`, emit `job:updated`
* **Payments & Admin:**
  * `POST /api/payments/create-order` & `POST /api/payments/verify` (Razorpay ₹499 Launch Offer)
  * `GET /api/admin/overview`, `GET /api/admin/shops`, `PATCH /api/admin/shops/:id`

### Socket.io Rooms & Events
* Shopkeeper joins room `shop:{shopId}` (JWT authenticated).
* Customer joins room `job:{jobId}` (unauthenticated, scoped strictly to that single `jobId`).
* Events:
  * `job:new` → Server to `shop:{shopId}` (payload: job metadata card)
  * `job:status` → Server to `job:{jobId}` & `shop:{shopId}` (payload: `{ jobId, status, rejectReason, deletedAt }`)

---

## 7. UI/UX & Visual Design Guidelines
* **Theme:** Crisp Light Mode default (optimized for bright retail shops with overhead glare).
  * Background: `#F8FAFC` (Slate 50), Surface Cards: `#FFFFFF`, Primary Text: `#0F172A` (Slate 900).
  * Primary Accent: `#2563EB` (Electric Blue), Privacy/Success: `#10B981` (Emerald), Color Print Badge: `#F59E0B` (Amber), ID Card Badge: `#0D9488` (Teal), Destructive/Reject: `#EF4444` (Red).
* **Typography:** `Plus Jakarta Sans` (English) + `Noto Sans Devanagari` (Hindi) with `tabular-nums` for Token IDs, timers, and prices.
* **PWA Manifest:** Proper `manifest.json` + service worker so Chrome prompts *"Install PrintQR Counter"* on shopkeeper desktops and Android tablets.
* **Environment Flexibility (Local Dev Mode):** Include a clean storage adapter interface (`StorageService`). Use **Cloudflare R2** when `R2_*` env vars are provided, and automatically fall back to a temporary local `/tmp/uploads` adapter during local development so the app runs out-of-the-box for testing without credentials.

---

## 8. Security & Guardrails
* Strict MIME-type allowlist (`application/pdf`, `image/jpeg`, `image/png`) and max file size `15MB` enforced both client-side and when signing R2 URLs.
* Rate limit public upload endpoints (`express-rate-limit`: max 20 uploads per IP per 15 mins) to prevent abuse.
* Ensure customers can never access another shop's queue or another customer's `jobId` (use unguessable `cuid()` IDs).
* Strip/sanitize all filenames and reject executable extensions.

---

## 9. Phased Build Order (Instructions for Coding Agent)
Build and verify the application incrementally in the following 5 phases. Do not skip verification between phases:

1. **Phase 1 — Project Scaffold, Database & Storage Adapter:**
   * Initialize monorepo (`/client` Vite+React+TS+Tailwind, `/server` Express+TS+Prisma+Socket.io).
   * Implement Prisma schema, auth middleware, and pluggable `StorageService` (Cloudflare R2 + Local Temp Dev Fallback).
   * Implement the 15-minute auto-expiry cleanup cron job.
2. **Phase 2 — Auth, Landing Page & Shop Settings:**
   * Build Landing Page (`/`), Register (`/register`), Login (`/login`), and Shop Settings (`/dashboard/settings`).
   * Implement Super Admin dashboard (`/admin`) and seed script for 1 Super Admin + 1 Demo Shop (`/s/demo-shop`).
3. **Phase 3 — Customer Mobile Flow & ID Card Mode:**
   * Build `/s/:shopSlug` with EN/HI toggle, Normal Print uploader, client-side PDF page counting, live price calculation, and **ID Card Front+Back A4 PDF Merger** (`pdf-lib`).
   * Build Live Token & Status Tracker screen with Socket.io updates and optional UPI Pay link.
4. **Phase 4 — Real-Time Shopkeeper Counter Dashboard & Printing:**
   * Build split-screen `/dashboard` with Socket.io live queue, Web Audio beep alerts, inline PDF/Image viewer (Zoom + Rotate 90°), keyboard shortcuts, Approve & Print (with 30s RAM Reprint Undo + immediate server deletion), and Reject with quick reasons.
5. **Phase 5 — QR Standee PDF Generator, Razorpay & PWA Polish:**
   * Build `/dashboard/standee` with 3 downloadable A4/A5 templates + viral footer.
   * Integrate Razorpay ₹499 Launch Offer checkout & verification (with mock/test mode fallback if keys are absent).
   * Configure `vite-plugin-pwa` manifest/icons and verify responsive mobile & desktop layouts.