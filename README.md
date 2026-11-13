# Inisio — Greenfield Project Advisory & Debt Syndication Platform

> Full-stack MERN application providing bankability appraisal, greenfield project feasibility assessment, CA audit workflow, and Razorpay-powered membership for Indian infrastructure promoters.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Setup](#4-environment-setup)
5. [Running Locally](#5-running-locally)
6. [Backend API Reference](#6-backend-api-reference)
   - [Root & Health](#61-root--health)
   - [Auth Routes — `/api/auth`](#62-auth-routes--apiauth)
   - [User Routes — `/api/users`](#63-user-routes--apiusers)
   - [Lead Routes — `/api/leads`](#64-lead-routes--apileads)
   - [Project Routes — `/api/projects`](#65-project-routes--apiprojects)
   - [Assessment Routes — `/api/assessments`](#66-assessment-routes--apiassessments)
   - [Consultation Routes — `/api/consultations`](#67-consultation-routes--apiconsultations)
   - [Payment Routes — `/api/payments`](#68-payment-routes--apipayments)
   - [Document Routes — `/api/documents`](#69-document-routes--apidocuments)
   - [Notification Routes — `/api/notifications`](#610-notification-routes--apinotifications)
   - [Contact Routes — `/api/contact`](#611-contact-routes--apicontact)
   - [Industry Routes — `/api/industries`](#612-industry-routes--apiindustries)
   - [Service Routes — `/api/services`](#613-service-routes--apiservices)
7. [Database Models](#7-database-models)
8. [Authentication & Authorization Flow](#8-authentication--authorization-flow)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Security Notes](#10-security-notes)
11. [Deployment](#11-deployment)

---

## 1. Project Overview

**Inisio** is a B2B advisory platform for greenfield industrial and manufacturing project promoters in India who seek institutional debt (bank loans, SIDBI, PSU consortium). The platform provides:

- **Greenfield Feasibility Assessment** — Multi-step financial model computing DSCR, debt-equity ratio, bankability score, and CMA projections
- **Promoter Dashboard** — Personal project portfolio, document uploads, consultation bookings, and payment history
- **CA Audit Workflow** — Chartered Accountant review of bankability and feasibility reports
- **Consultation Booking** — Schedule calls with debt syndication advisors
- **Membership / Payments** — Razorpay-powered subscription checkout for unlimited project assessments
- **Blogs & Knowledge Hub** — Advisory articles and research content

---

## 2. Tech Stack

### Frontend

| Package | Version |
|:--------|:--------|
| react | ^19.1.1 |
| react-dom | ^19.1.1 |
| vite | ^7.3.7 |
| typescript | ~5.8.3 |
| tailwindcss (via @tailwindcss/vite) | ^4.1.12 |
| lucide-react | ^0.541.0 |
| motion | ^12.23.12 |
| jspdf | ^4.2.1 |
| docx | ^9.7.1 |
| file-saver | ^2.0.5 |

### Backend

| Package | Version |
|:--------|:--------|
| express | ^4.21.2 |
| mongoose | ^8.12.0 |
| jsonwebtoken | ^9.0.2 |
| bcryptjs | ^3.0.2 |
| multer | ^2.4.0 |
| razorpay | ^2.9.8 |
| helmet | ^8.3.0 |
| compression | ^1.8.2 |
| cors | ^2.8.5 |
| express-rate-limit | ^8.7.4 |
| dotenv | ^17.2.3 |
| nodemon (dev) | ^3.1.9 |

---

## 3. Folder Structure

```
inisio26.1/inisio-website/
│
├── Backend/                        # Express REST API
│   ├── server.js                   # Entry point, middleware setup, graceful shutdown
│   ├── config/
│   │   ├── env.js                  # Centralized env validation & config object
│   │   └── db.js                   # Mongoose connection + isDBConnected() helper
│   ├── routes/
│   │   ├── index.js                # Mounts all routers under /api
│   │   ├── authRoutes.js           # /api/auth/*
│   │   ├── userRoutes.js           # /api/users/*
│   │   ├── leadRoutes.js           # /api/leads/*
│   │   ├── projectRoutes.js        # /api/projects/*
│   │   ├── assessmentRoutes.js     # /api/assessments/*
│   │   ├── consultationRoutes.js   # /api/consultations/*
│   │   ├── paymentRoutes.js        # /api/payments/*
│   │   ├── documentRoutes.js       # /api/documents/*
│   │   ├── notificationRoutes.js   # /api/notifications/*
│   │   ├── contactRoutes.js        # /api/contact/*
│   │   ├── industryRoutes.js       # /api/industries/*
│   │   └── serviceRoutes.js        # /api/services/*
│   ├── controllers/                # Request handlers (thin layer over services)
│   ├── services/                   # Business logic (DB queries, computation)
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js
│   │   ├── Lead.js
│   │   ├── Project.js
│   │   ├── Assessment.js
│   │   ├── Consultation.js
│   │   ├── Payment.js
│   │   ├── Document.js
│   │   ├── Notification.js
│   │   ├── ContactEnquiry.js
│   │   ├── ContactMessage.js
│   │   ├── Industry.js
│   │   └── Service.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # authenticateUser, optionalAuth, authorizeRoles, restrictSuperAdminViewer
│   │   ├── errorMiddleware.js      # Global error handler → { success, code, message }
│   │   └── validateMiddleware.js   # validateBody(), validateIndianPhone()
│   ├── utils/
│   │   ├── generateToken.js        # jwt.sign / jwt.verify wrappers
│   │   ├── logger.js               # Sanitizing logger (redacts secrets/OTPs/passwords)
│   │   ├── responseHandler.js      # sendSuccess() / sendError() helpers
│   │   ├── emailService.js         # Resend transactional emails
│   │   ├── whatsappService.js      # WhatsApp OTP delivery
│   │   ├── memoryUserStore.js      # In-memory user fallback when DB offline
│   │   └── geoIpService.js         # Login metadata capture (IP, city, browser)
│   ├── storage/private/            # Uploaded documents (UUID-named, served via /download)
│   ├── .env.example
│   └── package.json
│
└── Frontend/                       # Vite + React + TypeScript SPA
    ├── src/
    │   ├── main.tsx                # React root render + ErrorBoundary
    │   ├── App.tsx                 # Single-page router (tab state machine)
    │   ├── types.ts                # AuthUser, shared TS types
    │   ├── utils/
    │   │   ├── apiClient.ts        # Fetch wrapper + typed api.* namespace
    │   │   ├── membershipStore.ts  # Local membership eligibility checks
    │   │   ├── leadStore.ts        # LocalStorage lead cache
    │   │   └── userStore.ts        # Login event tracking
    │   └── components/
    │       ├── Navbar.tsx
    │       ├── Hero.tsx
    │       ├── AuthModal.tsx       # Login / Register / OTP / Reset-Password modal
    │       ├── UserDashboard.tsx   # Promoter portal (lazy-loaded)
    │       ├── ProjectAssessmentPage.tsx  # Feasibility engine (lazy-loaded)
    │       ├── ConsultationModal.tsx
    │       ├── MembershipPlansModal.tsx
    │       ├── ErrorBoundary.tsx
    │       ├── SEOHead.tsx
    │       └── ...
    ├── .env.example
    └── package.json
```

---

## 4. Environment Setup

### Backend — `Backend/.env`

> [!IMPORTANT]
> Copy `Backend/.env.example` to `Backend/.env`. **Never commit** `.env` to git.

| Variable | Required | Purpose | Example |
|:---------|:--------:|:--------|:--------|
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | No | HTTP listener port (default `5000`) | `5000` |
| `MONGO_URI` | Yes (prod) | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/inisio?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | HS256 signing key — minimum 16 chars | `64-char-random-hex-string` |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) | `7d` |
| `ALLOWED_ORIGINS` | Yes (prod) | Comma-separated CORS whitelist | `https://inisio.in,https://admin.inisio.in` |
| `ADMIN_EMAIL` | Yes | Primary admin whitelisted email | `admin@inisio.in` |
| `SUPERADMIN_EMAIL` | Yes | Super admin (read-only) email | `superadmin@inisio.in` |
| `ADMIN_PASSWORD` | Yes | Hashed password for admin seed account | `SecurePass@2026` |
| `SUPERADMIN_PASSWORD` | Yes | Hashed password for superadmin seed | `SecurePass@2026` |
| `RESEND_API_KEY` | Yes (email OTPs) | Resend transactional email API key | `re_xxxxxxxxxxxx` |
| `RAZORPAY_KEY_ID` | Yes (payments) | Razorpay live key ID | `rzp_live_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Yes (payments) | Razorpay secret — **never expose to frontend** | `xxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Yes (payments) | Webhook signature verification secret | `whsec_xxxxxxxxxx` |
| `DOCUMENT_STORAGE_DIR` | No | Override upload directory | `/mnt/data/uploads` |
| `ALLOW_MEMORY_FALLBACK` | No | Allow in-memory user store when DB offline | `false` |

### Frontend — `Frontend/.env`

> [!NOTE]
> Only `VITE_*` variables are exposed to the client bundle. Never put secrets here.

| Variable | Required | Purpose | Example |
|:---------|:--------:|:--------|:--------|
| `VITE_BACKEND_API_URL` | Yes | Backend base URL (without trailing `/`) | `https://api.inisio.in` |
| `VITE_RAZORPAY_KEY_ID` | Yes | Public Razorpay key shown to browser | `rzp_live_xxxxxxxx` |

---

## 5. Running Locally

### Backend

```bash
cd inisio26.1/inisio-website/Backend
cp .env.example .env        # Fill in your values
npm install
npm run dev                 # nodemon server.js
# → http://localhost:5000/health
```

### Frontend

```bash
cd inisio26.1/inisio-website/Frontend
cp .env.example .env        # Set VITE_BACKEND_API_URL=http://localhost:5000
npm install
npm run dev                 # vite dev server
# → http://localhost:5173
```

### Production Build

```bash
# Backend
cd Backend && NODE_ENV=production node server.js

# Frontend
cd Frontend && npm run build   # outputs to dist/
```

---

## 6. Backend API Reference

### Common Response Shapes

**Success**
```json
{ "success": true, "data": <payload>, "message": "..." }
```

**Error**
```json
{ "success": false, "code": 400, "message": "Human-readable error" }
```

### Auth Legend

| Symbol | Meaning |
|:-------|:--------|
| 🔓 | Public — no token required |
| 🔑 | `authenticateUser` — any valid JWT |
| 🛡️ | `authorizeRoles(...)` — specific roles only |
| 👁️ | `optionalAuth` — token used if present |
| 🚫 | `restrictSuperAdminViewer` — read-only for superadmin |

---

### 6.1 Root & Health

| Method | Path | Auth | Description |
|:-------|:-----|:----:|:------------|
| `GET` | `/` | 🔓 | Service metadata — name, status, version |
| `GET` | `/health` | 🔓 | Returns `200 { status, database, timestamp }` when MongoDB connected; `200 { status:"degraded" }` on memory fallback; `503` when disconnected in production |

**Health response shapes:**

```json
// Healthy
{ "status": "healthy", "database": "connected", "timestamp": "2026-11-13T..." }

// Degraded (dev only)
{ "status": "degraded", "database": "memory_fallback", "timestamp": "..." }

// Unhealthy (production, DB down)
{ "status": "unhealthy", "database": "disconnected", "timestamp": "..." }
```

---

### 6.2 Auth Routes — `/api/auth`

> Rate limit: **20 requests / 15 minutes per IP** on all auth endpoints.

| Method | Path | Auth | Required Body Fields | Optional Body Fields | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:---------------------|:---------------------|:-----------------|:------------|:------------|
| `POST` | `/api/auth/register` | 🔓 | `name`, `email`, `password` | `phone`, `company`, `role` (locked to `"user"`) | `{ token, user }` | 400 (validation), 409 (email exists) | Register new promoter. Role is always `user` regardless of body. |
| `POST` | `/api/auth/login` | 🔓 | `email`, `password` | — | `{ token, user }` | 400, 401 (bad credentials), 403 (not verified) | Public user login. Bcrypt password check. |
| `POST` | `/api/auth/admin-login` | 🔓 | `email`, `password` | — | `{ token, user }` | 400, 401, 403 (email not whitelisted) | Admin / staff login. Email must be in `ADMIN_EMAIL`, `SUPERADMIN_EMAIL`, or a seeded staff account. |
| `POST` | `/api/auth/verify-email` | 🔓 | `email`, `otp` | — | `{ message }` | 400 (invalid/expired OTP) | Verifies email with 6-digit OTP. OTP expires after 10 minutes. |
| `POST` | `/api/auth/verify-otp` | 🔓 | `email`, `otp` | — | `{ message, valid: true }` | 400 | Checks OTP validity without consuming it (used in reset-password flow). |
| `POST` | `/api/auth/forgot-password` | 🔓 | `email` | — | `{ message }` | 400 (user not found) | Generates a 6-digit OTP and sends a password-reset email via Resend. |
| `POST` | `/api/auth/reset-password` | 🔓 | `email`, `otp`, `newPassword` | — | `{ message }` | 400 (OTP invalid/expired), 422 (weak password) | Consumes OTP and updates hashed password. |
| `POST` | `/api/auth/send-verification` | 🔓 | `email` | — | `{ message }` | 400, 404 | Sends / resends email verification OTP. |
| `POST` | `/api/auth/resend-verification` | 🔓 | `email` | — | `{ message }` | 400, 404 | Alias for `send-verification`. |
| `GET` | `/api/auth/me` | 🔑 | — | — | `{ user }` | 401 | Returns the authenticated user object (no password). |
| `PUT` | `/api/auth/profile` | 🔑 | — | `name`, `company`, `phone`, `avatarUrl` | `{ user }` | 400, 401 | Updates the authenticated user's profile. |

**JWT Payload structure:**
```json
{
  "id":        "<MongoDB ObjectId>",
  "email":     "user@example.com",
  "name":      "Promoter Name",
  "role":      "user",
  "company":   "ABC Industries",
  "phone":     "+919876543210",
  "isVerified": true,
  "iat":       1700000000,
  "exp":       1700604800
}
```

---

### 6.3 User Routes — `/api/users`

> All routes require `authenticateUser`. Modification routes also require `restrictSuperAdminViewer`.

| Method | Path | Auth | Roles | Query Params | Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:-------------|:-----|:-----------------|:------------|:------------|
| `GET` | `/api/users` | 🛡️ | `admin`, `superadmin` | — | — | `[UserProfile[]]` | 401, 403 | All registered users with aggregated project/consultation counts (no N+1). |
| `GET` | `/api/users/profile/:email` | 🛡️ | `admin`, `superadmin` | — | — | `{ user }` | 401, 403, 404 | Lookup user by exact email address. |
| `GET` | `/api/users/:id` | 🛡️ | `admin`, `superadmin` | — | — | `{ user }` | 401, 403, 404 | Lookup user by MongoDB `_id`. |
| `PUT` | `/api/users/:id/role` | 🛡️🚫 | `admin`, `admin1–3` | — | `{ role }` | `{ user }` | 400, 401, 403 | Update user's role. Superadmin blocked (view-only). |
| `PUT` | `/api/users/:id/status` | 🛡️🚫 | `admin`, `admin1–3` | — | `{ status }` | `{ user }` | 400, 401, 403 | Activate / suspend user. |
| `DELETE` | `/api/users/:id` | 🛡️🚫 | `admin`, `admin1–3` | — | — | `{ message }` | 401, 403, 404 | Hard delete user record. |

---

### 6.4 Lead Routes — `/api/leads`

> Public `POST` (enquiry form submission). All `GET/PUT/DELETE` require authentication.

| Method | Path | Auth | Roles | Query Params | Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:-------------|:-----|:-----------------|:------------|:------------|
| `POST` | `/api/leads` | 👁️ | Any | — | `fullName`*, `mobile`*, `email`*, `projectName`, `industry`, `totalCostCr`, `loanRequiredCr`, `location`, `source`, `riskProfileData`, `commercialData` | `{ lead }` | 400 (validation), 422 (invalid phone) | Creates lead / assessment submission. If authenticated, links to `userId`. |
| `GET` | `/api/leads` | 🔑 | Any authenticated | `search`, `filterSource`, `email`, `page`, `limit` (max 100) | — | `{ leads[], total, page }` | 401 | Admins/CA/DPR see all leads. Standard `user` role sees **only their own** leads (IDOR-safe). |
| `GET` | `/api/leads/:id` | 🔑 | Any authenticated | — | — | `{ lead }` | 401, 403, 404 | Single lead by ID. IDOR-checked: users can only view own records. |
| `PUT` | `/api/leads/:id/assignment` | 🛡️🚫 | `admin`, `admin1–3` | — | `{ dprAssignedTo?, consultationAssignedTo? }` | `{ lead }` | 401, 403, 404 | Assign lead to DPR/Prosync staff. |
| `PUT` | `/api/leads/:id/progress` | 🔑🚫 | Any staff | — | `{ assessmentCompleted?, documentsUploaded?, dprCompleted?, bankApplicationSubmitted? }` | `{ lead }` | 401, 403, 404 | Update pipeline milestone checkboxes. |
| `PUT` | `/api/leads/:id` | 🔑🚫 | Any staff | — | Any lead fields | `{ lead }` | 400, 401, 403, 404 | Full lead record update. |
| `DELETE` | `/api/leads/clear-all` | 🛡️🚫 | `admin`, `admin1–3` | — | — | `{ message }` | 401, 403 | Wipe entire leads collection. Irreversible. |
| `DELETE` | `/api/leads/:id` | 🛡️🚫 | `admin`, `admin1–3` | — | — | `{ message }` | 401, 403, 404 | Delete single lead. |

---

### 6.5 Project Routes — `/api/projects`

| Method | Path | Auth | Roles | Required Body | Optional Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:--------------|:--------------|:-----------------|:------------|:------------|
| `GET` | `/api/projects` | 🔑 | Any authenticated | — | `page`, `limit`, `status`, `userId` | `{ projects[], total }` | 401 | List projects. Users see only own; admins/CA see all. Paginated, `.lean()`. |
| `GET` | `/api/projects/:id` | 🔑 | Any authenticated | — | — | `{ project }` | 401, 403, 404 | Single project. IDOR-checked. |
| `POST` | `/api/projects` | 👁️ | Any | `promoterName`, `projectName`, `industry`, `capexCr`, `loanCr` | `email`, `mobile`, `location`, `equityCr`, `dscr`, `feasibilityScore` | `{ project }` | 400, 422 | Create project record from assessment. Optionally linked to authenticated user. |
| `PUT` | `/api/projects/:id/audit` | 🛡️🚫 | `admin`, `ca` | — | `status`, `caReviewNotes`, `assignedCA`, `cmaAuditStatus`, `bankabilityStatus`, `dscr`, `debtEquityRatio` | `{ project }` | 401, 403, 404 | CA/Admin updates audit fields. Superadmin blocked (view-only). |
| `DELETE` | `/api/projects/:id` | 🛡️🚫 | `admin` | — | — | `{ message }` | 401, 403, 404 | Delete project. Admin only. |

**Project `status` enum:** `Draft` · `Pending Audit` · `CA Approved` · `Bank Submitted` · `Sanctioned` · `Clarification Needed`

---

### 6.6 Assessment Routes — `/api/assessments`

| Method | Path | Auth | Roles | Required Body | Optional Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:--------------|:--------------|:-----------------|:------------|:------------|
| `POST` | `/api/assessments/evaluate` | 👁️ | Any | `industry`, `projectCostCr` | Full financial form payload | `{ bankabilityScore, feasibilityScore, dscr, riskProfile, ... }` | 400 | Full bankability appraisal engine. Returns computed financial metrics. |
| `POST` | `/api/assessments/quick-calc` | 🔓 | Any | Partial financial data | — | `{ dscr, debtEquityRatio, ... }` | 400 | Lightweight metric preview without saving. |
| `GET` | `/api/assessments/my-assessments` | 🔑 | Any authenticated | — | — | `{ assessments[] }` | 401 | Returns the authenticated user's saved assessment records. |
| `GET` | `/api/assessments/all` | 🛡️ | `admin`, `superadmin`, `ca` | — | — | `{ assessments[] }` | 401, 403 | All assessment records (admin/CA review). |

---

### 6.7 Consultation Routes — `/api/consultations`

| Method | Path | Auth | Roles | Required Body | Optional Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:--------------|:--------------|:-----------------|:------------|:------------|
| `POST` | `/api/consultations` | 🔓 | Any | `fullName`, `phone` | `email`, `companyName`, `industry`, `projectCostCr`, `preferredDate`, `preferredSlot`, `additionalNotes` | `{ consultation }` | 400, 422 | Book consultation slot. No auth required (public capture). |
| `GET` | `/api/consultations` | 🛡️ | `admin`, `superadmin`, `ca`, `prosync`, `prosync_admin` | — | `page`, `limit` | `{ consultations[], total }` | 401, 403 | List all consultations. Paginated, `.lean()`. |
| `GET` | `/api/consultations/:id` | 🛡️ | `admin`, `superadmin`, `ca`, `prosync`, `prosync_admin` | — | — | `{ consultation }` | 401, 403, 404 | Single consultation detail. |
| `PUT` | `/api/consultations/:id/status` | 🛡️🚫 | `admin`, `ca`, `prosync`, `prosync_admin` | — | `status`, `feedback`, `assignedAdvisor` | `{ consultation }` | 401, 403, 404 | Update consultation status. |

**Consultation `status` enum:** `pending` · `confirmed` · `completed` · `cancelled`

---

### 6.8 Payment Routes — `/api/payments`

| Method | Path | Auth | Roles | Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:-----|:-----------------|:------------|:------------|
| `GET` | `/api/payments/config` | 🔓 | Any | — | `{ keyId }` | — | Returns the public `RAZORPAY_KEY_ID` for the checkout SDK. |
| `POST` | `/api/payments/create-order` | 👁️ | Any | `amount`, `currency`, `itemType`, `planName`, `billingCycle`, `userEmail`, `userName`, `userPhone` | `{ orderId, amount, currency, receipt }` | 400, 500 | Creates a Razorpay order and persists a `Payment` record with `status: "created"`. |
| `POST` | `/api/payments/verify-signature` | 👁️ | Any | `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` | `{ verified: true, payment }` | 400 (signature mismatch), 500 | Verifies HMAC-SHA256 Razorpay signature. **In production (`NODE_ENV=production`) the mock bypass is disabled**. Updates payment `status` to `"captured"`. |
| `GET` | `/api/payments/history` | 🔑 | Any authenticated | — | `{ payments[] }` | 401 | Returns the authenticated user's payment history. IDOR-safe (filtered by `userId`). |
| `GET` | `/api/payments/:id` | 🔑 | Any authenticated | — | `{ payment }` | 401, 403, 404 | Single payment by MongoDB `_id`. Ownership verified (or admin role). |
| `POST` | `/api/payments/webhook` | 🔓 | Razorpay servers | Raw body (Razorpay webhook payload) | `{ received: true }` | 400 | Razorpay webhook handler. Validates `X-Razorpay-Signature` and updates payment status. |

---

### 6.9 Document Routes — `/api/documents`

> All routes require `authenticateUser`. Upload additionally requires `restrictSuperAdminViewer`.

**Upload limits:**
- Max file size: **10 MB**
- Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.ms-powerpoint`, `image/jpeg`, `image/png`, `image/webp`
- Allowed extensions: `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, `.ppt`, `.jpg`, `.jpeg`, `.png`, `.webp`
- Files are stored with **UUID-generated names** (original name discarded)
- Storage location: `Backend/storage/private/` (or `DOCUMENT_STORAGE_DIR` env var)

| Method | Path | Auth | Body / Params | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:--------------|:-----------------|:------------|:------------|
| `POST` | `/api/documents/upload` | 🔑🚫 | `multipart/form-data`: `file` (required), `leadId`, `category` | `{ document }` | 400 (invalid type/size), 401, 403 | Upload single document linked to a lead/project. Superadmin blocked. |
| `GET` | `/api/documents/project/:leadId` | 🔑 | `:leadId` path param | `{ documents[] }` | 401, 404 | List all uploaded documents for a given lead ID. |
| `GET` | `/api/documents/:id/download` | 🔑 | `:id` path param | Binary file stream (`Content-Disposition: attachment`) | 401, 404 | Authenticated document download. Stream file from private storage. |

---

### 6.10 Notification Routes — `/api/notifications`

> All routes require `authenticateUser`.

| Method | Path | Auth | Roles | Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:-----|:-----------------|:------------|:------------|
| `GET` | `/api/notifications` | 🔑 | Any authenticated | — | `{ notifications[] }` | 401 | Fetch all notifications for the authenticated user. |
| `POST` | `/api/notifications` | 🛡️ | `admin`, `superadmin`, `ca`, `dpr_consultant`, `prosync` | `{ title, message, type?, targetUserId? }` | `{ notification }` | 400, 401, 403 | Create a notification (admin/staff only). |
| `PATCH` | `/api/notifications/read-all` | 🔑 | Any authenticated | — | `{ message }` | 401 | Mark all of the user's notifications as read. |
| `PATCH` | `/api/notifications/:id/read` | 🔑 | Any authenticated | — | `{ notification }` | 401, 404 | Mark single notification as read. |
| `DELETE` | `/api/notifications/clear-all` | 🛡️ | `admin` | — | `{ message }` | 401, 403 | Delete all notification records. Admin only. |

---

### 6.11 Contact Routes — `/api/contact`

| Method | Path | Auth | Roles | Body | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:-----|:-----------------|:------------|:------------|
| `POST` | `/api/contact` | 🔓 | Any | `name`/`fullName`, `email`, `phone`, `message`, `company?`, `subject?` | `{ enquiry }` | 400 | Public contact form submission. Creates `ContactEnquiry` record. |
| `GET` | `/api/contact` | 🛡️ | `admin`, `superadmin`, `ca`, `prosync_admin`, `prosync`, `admin1–3` | `page`, `limit`, `status`, `search` | `{ enquiries[], total }` | 401, 403 | List all contact enquiries. |
| `GET` | `/api/contact/:id` | 🛡️ | Same as above | — | `{ enquiry }` | 401, 403, 404 | Single enquiry detail. |
| `PUT` | `/api/contact/:id` | 🛡️🚫 | Same as above | `status?`, `notes?`, `assignedTo?`, `isArchived?` | `{ enquiry }` | 401, 403, 404 | Update enquiry fields. |
| `PUT` | `/api/contact/:id/status` | 🛡️🚫 | Same as above | `status` | `{ enquiry }` | 401, 403, 404 | Update enquiry status only. |
| `DELETE` | `/api/contact/:id` | 🛡️🚫 | Same as above | `?permanent=true` | `{ message }` | 401, 403, 404 | Soft-archive or permanently delete enquiry. |

---

### 6.12 Industry Routes — `/api/industries`

> Public `GET` endpoints are cached in-memory for **15 minutes** with `Cache-Control: public, max-age=900`.

| Method | Path | Auth | Roles | Params | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:-------|:-----------------|:------------|:------------|
| `GET` | `/api/industries` | 🔓 | Any | — | `{ industries[] }` | — | All industry categories with metadata. |
| `GET` | `/api/industries/:slug` | 🔓 | Any | `:slug` | `{ industry }` | 404 | Single industry by URL slug. |
| `POST` | `/api/industries` | 🛡️ | `admin` | — | `{ industry }` | 400, 401, 403 | Create new industry category. |

---

### 6.13 Service Routes — `/api/services`

> Public `GET` endpoints are cached in-memory for **15 minutes** with `Cache-Control: public, max-age=900`.

| Method | Path | Auth | Roles | Params | Success Response | Error Codes | Description |
|:-------|:-----|:----:|:------|:-------|:-----------------|:------------|:------------|
| `GET` | `/api/services` | 🔓 | Any | — | `{ services[] }` | — | All service offerings. |
| `GET` | `/api/services/:slug` | 🔓 | Any | `:slug` | `{ service }` | 404 | Single service by URL slug. |
| `POST` | `/api/services` | 🛡️ | `admin` | — | `{ service }` | 400, 401, 403 | Create new service entry. |

---

## 7. Database Models

### `users` collection — `User.js`

| Field | Type | Constraints | Index |
|:------|:-----|:------------|:------|
| `name` | String | required, trim | — |
| `email` | String | required, unique, lowercase, email regex | Unique |
| `password` | String | required, minLength 6, `select: false`, bcrypt hashed | — |
| `role` | String | enum: `user`, `ca`, `superadmin`, `dpr_consultant`, `prosync_admin`, `admin`, `admin1`, `admin2`, `admin3`, `prosync` | Index |
| `company` | String | default `""` | — |
| `phone` | String | default `""` | Index |
| `avatarUrl` | String | default `""` | — |
| `isVerified` | Boolean | default `false` | — |
| `resetPasswordOtp` | String | default null | — |
| `resetPasswordExpires` | Date | default null | — |
| `verificationOtp` | String | default null | — |
| `verificationExpires` | Date | default null | — |
| `loginCount` | Number | default 0 | — |
| `lastLogin` | Object | `{ date, time, city, state, country, ipAddress, device, browser, timestamp }` | — |
| `createdAt`, `updatedAt` | Date | timestamps: true | — |

### `leads` collection — `Lead.js`

| Field | Type | Constraints | Index |
|:------|:-----|:------------|:------|
| `userId` | ObjectId (ref User) | optional | Index |
| `fullName` | String | required | — |
| `mobile` | String | required | Index |
| `email` | String | required, lowercase | Index |
| `projectName` | String | default `"Greenfield Project Proposal"` | — |
| `industry` | String | default `"Manufacturing & Industrial"` | — |
| `location` | String | default `""` | — |
| `totalCostCr` | Mixed | default `"10"` | — |
| `loanRequiredCr` | Mixed | default `"7.5"` | — |
| `feasibilityScore` | Number | default 80 | — |
| `bankabilityRating` | String | default `"A"` | — |
| `dscrEstimate` | Number | default 0, min 0 | — |
| `source` | String | default `"Web Portal Submission"` | — |
| `status` | String | default `"In Appraisal"` | Index |
| `assignedCA` | String | default `""` | Index |
| `dprAssignedTo` | String | default `""` | Index |
| `consultationAssignedTo` | String | default `""` | Index |
| `consultationStatus` | String | enum: `New`, `In Progress`, `Customer Declined`, `Completed`, `Pending` | — |
| `assessmentCompleted` | Boolean | default false | — |
| `documentsUploaded` | Boolean | default false | — |
| `dprCompleted` | Boolean | default false | — |
| `bankApplicationSubmitted` | Boolean | default false | — |
| `bankApplicationStatus` | String | default `"Draft"` | — |
| `riskProfileData` | Mixed | default null | — |
| `commercialData` | Mixed | default null | — |
| `financials` | Mixed | default `{}` | — |
| `promotersList` | Array | default `[]` | — |
| `editHistory` | Array | default `[]` | — |
| `uploadedDocuments` | Array | default `[]` | — |
| `isFunded` | Boolean | default false | — |
| `membershipTier` | String | default `"Standard"` | — |
| `createdAt`, `updatedAt` | Date | timestamps | Index (`createdAt` desc) |

### `projects` collection — `Project.js`

| Field | Type | Constraints | Index |
|:------|:-----|:------------|:------|
| `userId` | ObjectId (ref User) | optional | Index |
| `email` | String | lowercase, trim | Index |
| `mobile` | String | trim | Index |
| `promoterName` | String | required | — |
| `projectName` | String | required | — |
| `industry` | String | required | — |
| `location` | String | default `"India"` | — |
| `capexCr` | Number | required | — |
| `loanCr` | Number | required | — |
| `equityCr` | Number | default 0 | — |
| `dscr` | Number | default 1.45 | — |
| `feasibilityScore` | Number | default 85 | — |
| `bankabilityRating` | String | default `"A"` | — |
| `subsidyEligible` | Boolean | default true | — |
| `status` | String | enum: `Draft`, `Pending Audit`, `CA Approved`, `Bank Submitted`, `Sanctioned`, `Clarification Needed`; default `"Pending Audit"` | Index |
| `caReviewNotes` | String | default `""` | — |
| `assignedCA` | String | default `"CA Rajesh Sharma (FCA)"` | Index |
| `dprAssignedTo` | String | default `""` | — |
| `uploadedDocuments` | Array | default `[]` | — |
| `documentsUploaded` | Boolean | default false | — |
| `assignedBank` | String | default `"State Bank of India / Punjab National Bank"` | — |
| `sanctionDate` | Date | optional | — |
| `createdAt`, `updatedAt` | Date | timestamps | Index (`createdAt` desc) |

### `consultations` collection — `Consultation.js`

| Field | Type | Constraints | Index |
|:------|:-----|:------------|:------|
| `fullName` | String | required | — |
| `email` | String | default `""`, lowercase | Index |
| `phone` | String | required | Index |
| `companyName` | String | default `""` | — |
| `industry` | String | default `"General Greenfield Project"` | — |
| `projectCostCr` | String | default `""` | — |
| `preferredDate` | String | default `""` | — |
| `preferredSlot` | String | default `"Morning (10:00 AM - 1:00 PM)"` | — |
| `additionalNotes` | String | default `""` | — |
| `status` | String | enum: `pending`, `confirmed`, `completed`, `cancelled`; default `"pending"` | Index |
| `assignedAdvisor` | String | default `"Senior Debt Syndication Expert"` | — |
| `feedback` | String | default `""` | — |
| `createdAt`, `updatedAt` | Date | timestamps | Index (`createdAt` desc) |

### `payments` collection — `Payment.js`

| Field | Type | Constraints | Index |
|:------|:-----|:------------|:------|
| `orderId` | String | required, unique | Unique |
| `paymentId` | String | default `""` | Index |
| `signature` | String | default `""` | — |
| `userId` | ObjectId (ref User) | optional | Index |
| `userEmail` | String | required, lowercase | Index |
| `userName` | String | default `"Promoter"` | — |
| `userPhone` | String | default `""` | — |
| `amount` | Number | required, min 0 (INR) | — |
| `amountPaise` | Number | required, min 0 | — |
| `currency` | String | default `"INR"` | — |
| `status` | String | enum: `created`, `attempted`, `captured`, `failed`, `refunded`; default `"created"` | Index |
| `itemType` | String | enum: `membership`, `consultation`, `dpr_service`, `assessment`, `custom`; default `"membership"` | — |
| `itemId` | String | default `""` | — |
| `planName` | String | default `""` | — |
| `billingCycle` | String | enum: `monthly`, `quarterly`, `annual`, `one-time`; default `"quarterly"` | — |
| `receipt` | String | default `""` | Index |
| `invoiceNumber` | String | default `""` | Index |
| `paymentMethod` | String | default `""` | — |
| `cardOrVpaDetails` | String | default `""` | — |
| `bank` | String | default `""` | — |
| `notes` | Mixed | default `{}` | — |
| `rawRazorpayResponse` | Mixed | default null | — |
| `errorDescription` | String | default `""` | — |
| `createdAt`, `updatedAt` | Date | timestamps | — |

### Other Collections

| Collection | Model File | Key Fields |
|:-----------|:-----------|:-----------|
| `assessments` | `Assessment.js` | `userId`, `industry`, `projectCostCr`, `bankabilityScore`, `feasibilityScore`, `dscr`, computed outputs |
| `contactenquiries` | `ContactEnquiry.js` | `name`, `email`, `phone`, `message`, `status`, `assignedTo`, `isArchived` |
| `contactmessages` | `ContactMessage.js` | `name`, `email`, `message`, `status` |
| `documents` | `Document.js` | `leadId`, `userId`, `filename` (UUID), `originalName`, `mimeType`, `size`, `category` |
| `notifications` | `Notification.js` | `userId`, `title`, `message`, `type`, `isRead`, `createdAt` |
| `industries` | `Industry.js` | `name`, `slug` (unique), `description`, `icon`, `benchmarks` |
| `services` | `Service.js` | `name`, `slug` (unique), `description`, `features` |

---

## 8. Authentication & Authorization Flow

### JWT Issuance

1. On successful login (`/api/auth/login` or `/api/auth/admin-login`), `generateToken(payload)` calls `jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })`.
2. Token is returned in response body as `{ token }`. Client stores in `localStorage` (`inisio_auth_token`).
3. All subsequent requests include `Authorization: Bearer <token>` header.

### Middleware Chain

```
Request
  → authenticateUser          Extracts + verifies JWT; populates req.user
  → authorizeRoles('admin')   Checks req.user.role against allowed list
  → restrictSuperAdminViewer  Blocks POST/PUT/PATCH/DELETE for superadmin
  → Controller
```

### Role Hierarchy & Capabilities

| Role | Alias | Access |
|:-----|:------|:-------|
| `user` | — | Own leads, own projects, own payments, booking consultations |
| `ca` | — | All leads (read), all consultations (read + status update), project audit (`PUT /projects/:id/audit`) |
| `prosync` | `prosync_admin` | All consultations (read + status update), lead progress updates |
| `dpr_consultant` | — | Lead progress updates, document access |
| `admin` | `admin1`, `admin2`, `admin3` | Full CRUD on all resources |
| `superadmin` | — | **Read-only** on all admin resources; blocked from all POST/PUT/PATCH/DELETE |

### OTP Flow (Email Verification)

1. `POST /api/auth/register` → user created with `isVerified: false` → 6-digit OTP generated → stored as hashed `verificationOtp` with 10-minute `verificationExpires`
2. `POST /api/auth/verify-email { email, otp }` → OTP matched & not expired → `isVerified: true` → OTP cleared

### Password Reset Flow

1. `POST /api/auth/forgot-password { email }` → 6-digit OTP generated → stored as `resetPasswordOtp` + `resetPasswordExpires` (+10 min) → Resend email dispatched
2. `POST /api/auth/verify-otp { email, otp }` → (optional) pre-check
3. `POST /api/auth/reset-password { email, otp, newPassword }` → OTP verified → password bcrypt-hashed and saved → OTP cleared

---

## 9. Frontend Architecture

### Page / Tab Routing (SPA — no React Router)

The frontend uses a custom tab state machine in `App.tsx`. URL is updated via `window.history.pushState`.

| Path | Active Tab | Component | Auth Guard | API Calls |
|:-----|:-----------|:----------|:-----------|:----------|
| `/` | `home` | Hero, BankLogosCarousel, TrustNumbers, HowItWorks, WhyChooseInisio, IndustriesSection, Testimonials, FAQSection, LatestBlogs, ContactSection, FinalCTA | None | `/api/industries`, `/api/services` (via IndustriesSection) |
| `/user-dashboard` | `user-dashboard` | `UserDashboard` (lazy) | Shows login prompt if no `currentUser` | `/api/auth/me`, `/api/leads`, `/api/projects`, `/api/payments/history`, `/api/notifications` |
| `/assessment` | `assessment` | `ProjectAssessmentPage` (lazy) | Membership gate (1 free assessment) | `/api/assessments/evaluate`, `/api/assessments/quick-calc`, `/api/projects` (create), `/api/leads` (create) |
| `/blogs/:slug` | `blogs` | `BlogsPage` (lazy) | None | Static blog data |
| `/how-it-works` | `how-it-works` | `HowItWorks` | None | None |
| `/about` | `about` | `WhyChooseInisio` | None | None |
| `/industries` | `industries` | `IndustriesSection` | None | `/api/industries` |
| `/contact` | `contact` | `ContactSection` | None | `POST /api/contact` |
| `/faq` | `faq` | `FAQSection` | None | None |

### Session Management

- Token stored in `localStorage` as `inisio_auth_token`
- User object stored as `inisio_active_user` (JSON)
- On load, `App.tsx` calls `GET /api/auth/me` with the stored token to validate the session; if expired/invalid, clears localStorage and sets `currentUser = null`
- Logout: clears both keys, redirects to `home`

### API Client (`src/utils/apiClient.ts`)

- Base URL resolves from `VITE_BACKEND_API_URL` → appends `/api` if not already present → falls back to `/api` (same-origin proxy)
- 12-second request timeout via `AbortController`
- Automatically attaches `Authorization: Bearer <token>` from localStorage
- All requests return `data.data` if present, otherwise `data` directly
- `multipart/form-data` uploads skip `Content-Type` header (browser sets boundary automatically)

---

## 10. Security Notes

### Rate Limiting

| Endpoint Group | Limit | Window |
|:---------------|:------|:-------|
| `/api/auth/register` | 20 requests | 15 minutes per IP |
| `/api/auth/login` | 20 requests | 15 minutes per IP |
| `/api/auth/admin-login` | 20 requests | 15 minutes per IP |
| `/api/auth/verify-email` | 20 requests | 15 minutes per IP |
| `/api/auth/verify-otp` | 20 requests | 15 minutes per IP |
| `/api/auth/forgot-password` | 20 requests | 15 minutes per IP |
| `/api/auth/reset-password` | 20 requests | 15 minutes per IP |
| `/api/auth/send-verification` | 20 requests | 15 minutes per IP |

### CORS

- Origin whitelist read from `ALLOWED_ORIGINS` env var (comma-separated)
- In development with no whitelist configured, `localhost:*` and `127.0.0.1:*` are auto-allowed
- In production, any origin not in the whitelist receives `CORS Error 403`
- `credentials: true` — no wildcard allowed

### Security Headers (Helmet)

- Content-Security-Policy enabled in production, disabled in dev
- `crossOriginEmbedderPolicy: false` (required for Razorpay iframe)

### File Uploads

- 10 MB max per file
- MIME type + extension double-checked on every upload
- Files saved with `crypto.randomUUID()` names — original filename discarded
- Stored in `Backend/storage/private/` (not publicly web-accessible)

### Payload Limits

- JSON body: `1 MB`
- URL-encoded body: `1 MB`

### Password & Token Security

- Passwords hashed with `bcryptjs` (10 salt rounds)
- JWT secret minimum 16 characters; enforced at startup by `validateEnv()`
- OTPs expire in 10 minutes, cleared after single use
- Stack traces suppressed from error responses in `NODE_ENV=production`
- Sanitizing logger redacts: `password`, `token`, `secret`, `otp`, `authorization` fields

### Razorpay

- Webhook signature verified with `crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)`
- In production (`config.isProd = true`), mock/test-mode payment bypass is **disabled**

---

## 11. Deployment

### Backend — Render (or Railway / EC2)

```bash
# Build command
npm install

# Start command
NODE_ENV=production node server.js
```

**Required environment variables on Render dashboard:**

```ini
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/inisio?retryWrites=true&w=majority
JWT_SECRET=<64-char-random-hex>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://inisio.in,https://admin.inisio.in
ADMIN_EMAIL=admin@inisio.in
SUPERADMIN_EMAIL=superadmin@inisio.in
ADMIN_PASSWORD=<secure-password>
SUPERADMIN_PASSWORD=<secure-password>
RESEND_API_KEY=re_xxxxxxxxxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

**Health check URL:** `GET https://api.inisio.in/health`
**Expected response:** `{ "status": "healthy", "database": "connected" }` with HTTP 200

### Frontend — Vercel

```bash
# Build command
npm run build

# Output directory
dist/
```

**Environment variables on Vercel dashboard:**

```ini
VITE_BACKEND_API_URL=https://api.inisio.in
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
```

### Post-Deployment Checklist

- [ ] Verify `GET /health` returns `200 { status: "healthy" }`
- [ ] Test `POST /api/auth/login` with valid credentials
- [ ] Test `POST /api/auth/admin-login` with admin email → verify 403 for non-whitelisted email
- [ ] Test `GET /api/leads` unauthenticated → expect 401
- [ ] Test IDOR: authenticated as User A, attempt `GET /api/projects/:idOwnedByUserB` → expect 403
- [ ] Submit 21 login attempts in 15 min → expect 429
- [ ] Upload a document → verify UUID filename in `storage/private/`
- [ ] Complete Razorpay checkout in test mode → verify `Payment.status = "captured"`
- [ ] Check `GET /api/industries` has `Cache-Control: public, max-age=900` header
