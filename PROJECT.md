# PROJECT: Inisio — Greenfield Project Advisory & Debt Syndication Platform

> **Enterprise-grade, high-performance B2B platform empowering Indian industrial entrepreneurs, project promoters, and corporate developers to structure, evaluate, and secure institutional debt financing (₹5 Cr to ₹500+ Cr) with AI-powered feasibility underwriting, multi-role stakeholder collaboration, and instant executive teaser generation.**

---

## 1. Project Overview

**Inisio** is a comprehensive full-stack MERN (MongoDB, Express, React, Node.js) web application engineered specifically for India's capital-intensive industrial manufacturing and infrastructure project ecosystem. The platform bridges the gap between project promoters seeking long-term credit and scheduled commercial banks, non-banking financial companies (NBFCs), and development financial institutions (DFIs such as SIDBI).

The platform coordinates the entire capital syndication lifecycle across six specialized user roles:

1. **Project Promoters & Corporate Borrowers**: Evaluate greenfield/expansion project bankability via a 6-step underwriting wizard, calculate Debt-to-Equity ratios with automated 70:30 Capex balancing, determine Debt Service Coverage Ratios (DSCR), generate AI Project Teasers in PDF and Word DOCX, and track loan syndication pipelines.
2. **Empanelled Chartered Accountants (CAs / CMAs)**: Conduct financial due diligence, audit Credit Monitoring Arrangement (CMA) projections, review audited balance sheets, and validate debt-service sustainability.
3. **CA Network Administration**: Manage nation-wide CA onboarding, digitize physical business cards via Optical Character Recognition (OCR with Tesseract.js), issue automated token-based invitation emails (`WOFA-2026`), and activate verified practitioner profiles.
4. **DPR (Detailed Project Report) Consultants**: Author technical feasibility reports, upload engineering blueprints, track pollution control and environmental clearances, and perform techno-economic viability (TEV) validation.
5. **ProSync Banking Desk**: Manage multi-lender credit consortiums, track term sheet negotiations, log information memorandum (IM) dispatches, and expedite sanction letter issuances.
6. **Executive Board & Super Administrators**: Comprehensive platform intelligence, pipeline conversion analytics, audit logging, cross-portal supervisor access, and global system health monitoring.

### Core Value Propositions & Architectural Pillars

* **Dynamic Data with High-Resilience Fallback**: All platform statistics, industry benchmarks, testimonials, FAQs, and project leads are backed by MongoDB Atlas collections. For local development or database outages, an integrated in-memory state engine (`memoryUserStore.js`, `leadStore.ts`) ensures 100% feature availability without crashing.
* **6-Step AI Feasibility & Underwriting Engine**: Proprietary algorithm evaluates 100-point institutional bankability matrices, assessing sponsor creditworthiness, execution risk, market risk, financial leverage, and collateral adequacy against RBI/PSU lending benchmarks.
* **Automated 70:30 Capex Balancer**: Eliminates user drop-off and form freeze by dynamically computing and allocating Debt and Equity means of finance to match total capital expenditure with a single click.
* **Dual Document Generation (PDF + Word DOCX)**: Client-side generation of high-resolution executive teasers via `jspdf` and fully editable Office Open XML documents via `docx`, complete with institutional branding, credit risk radar, and debt syndication roadmaps.
* **Business Card OCR Pipeline**: Integrates client-side and server-side Tesseract.js OCR to scan physical visiting cards, extract contact parameters (Name, Email, Phone, ICAI Membership No, Firm, City), and dispatch automated verification invites.
* **Full-Screen Distraction-Free Workspace**: Both the 6-step assessment wizard and all logged-in role dashboards automatically transition to full-screen mode, removing marketing headers and footers for maximum operational productivity.
* **Multi-Tier Administrative Authentication**: Super-admin and CA admin logins feature strict allowlist enforcement, bcrypt database verification, Resend 6-digit email OTPs, and developer testing convenience credentials (`password26@gmail.com`).

---

## 2. Full Technology Stack

### Frontend Ecosystem
* **Core Framework**: React 19 (`v19.1.1`), React DOM (`v19.1.1`)
* **Build Tool & Dev Server**: Vite 7 (`v7.3.7`) with `@vitejs/plugin-react` (`v5.0.0`)
* **Type System**: TypeScript (`~5.8.3`) with strict typing across all data models and utilities
* **Styling & Design System**: Tailwind CSS v4 (`v4.1.12`) via native `@tailwindcss/vite` integration
* **UI Components & Primitives**:
  * Radix UI: `@radix-ui/react-accordion` (`v1.3.1`), `@radix-ui/react-dialog` (`v1.3.1`), `@radix-ui/react-select` (`v2.4.1`), `@radix-ui/react-checkbox` (`v1.4.1`), `@radix-ui/react-toast` (`v1.3.1`)
  * Layout & Styling Utilities: `clsx` (`v2.1.1`), `tailwind-merge` (`v3.7.1`), `class-variance-authority` (`v0.7.1`)
* **Animation & Carousels**: Framer Motion (`v12.43.0`), `motion` (`v12.43.0`), `embla-carousel-react` (`v8.6.0`)
* **Document Generation & Export**:
  * PDF Export: `jspdf` (`v4.2.1`) for vector-rendered AI project teasers
  * Word Export: `docx` (`v9.7.1`) and `file-saver` (`v2.0.5`) for editable corporate DOCX teasers
* **Computer Vision & OCR**: `tesseract.js` (`v7.0.0`) for visiting card character extraction, `jsqr` (`v1.4.0`) for QR parsing
* **Icons**: Lucide React (`v0.541.0`)
* **Linting & Code Quality**: ESLint 9 (`v9.34.0`) with `eslint-plugin-react-hooks` (`v5.2.0`) and `eslint-plugin-react-refresh` (`v0.4.20`)

### Backend Ecosystem
* **Runtime**: Node.js (`>=20.0.0`, v24+ compatible), ES Modules (`"type": "module"`)
* **Web Framework**: Express 4 (`v4.21.2`)
* **Database & ODM**: MongoDB Atlas / Local MongoDB, Mongoose (`v8.12.0`)
* **Security & Hardening**:
  * `helmet` (`v8.3.0`): HTTP security headers and Content Security Policies
  * `cors` (`v2.8.5`): Dynamic CORS origin filtering supporting multi-domain environments
  * `express-rate-limit` (`v8.7.4`): Tiered rate limiters (General: 500 req/15min, Auth: 30 req/15min, Contact/Leads: 20 req/15min)
  * Payload Protection: Express JSON limit cap (`1mb`) preventing buffer exhaustion attacks
* **Authentication & Cryptography**:
  * `jsonwebtoken` (`v9.0.2`): Signed JWT tokens with custom 7-day expiration
  * `bcryptjs` (`v3.0.2`): 12 salt rounds password hashing
  * Node.js `crypto`: Cryptographically secure 6-digit numeric OTP generation and claim token creation
* **Validation**: Zod (`v4.6.7`) schema validation middleware across request bodies and query parameters
* **Performance & Network**: `compression` (`v1.8.2`) Gzip compression with 1KB threshold
* **File Uploads**: `multer` (`v2.4.0`) handling multipart document and visiting card uploads
* **Third-Party Integrations**:
  * **Resend API (`resend` `v6.38.0`)**: Transactional email dispatch for OTP verifications, password resets, and CA onboarding invitations
  * **Razorpay Node SDK (`razorpay` `v2.9.8`)**: Checkout orders, webhook verification, and subscription plan management
* **Development & Tooling**: `nodemon` (`v3.1.9`), custom dual dev runner `Scripts/dev.js`

---

## 3. High-Level Architecture & Request Flow

```mermaid
flowchart TD
    subgraph Client["Client Tier (Frontend - React 19 + Vite @ Port 5173)"]
        UI["Promoter UI / Role Dashboards / 6-Step Assessment Wizard"]
        ApiClient["apiClient (/api with Bearer Token & Timeout Handling)"]
        DocGen["Document Generator (jsPDF + docx)"]
        OcrClient["Client OCR Engine (Tesseract.js)"]
        UI --> ApiClient
        UI --> DocGen
        UI --> OcrClient
    end

    subgraph Gateway["Reverse Proxy / Dev Forwarder Tier"]
        ApiClient -->|/api/* Requests| ViteProxy["Vite Dev Proxy / Cloud Gateway"]
    end

    subgraph Server["Backend Tier (Express 4 @ Port 5000)"]
        ViteProxy --> Middleware["Security & Sanitization Middlewares\n(Helmet, CORS, Compression, Rate Limiters, Body Parser)"]
        Middleware --> Router["API Root Router (/api)"]

        Router --> AuthR["/api/auth (Login, Admin 2FA, OTP Reset, Register)"]
        Router --> UserR["/api/users (User Profiles, Passwords, Membership)"]
        Router --> LeadR["/api/leads (Debt Syndication Applications & Pipeline)"]
        Router --> ProjR["/api/projects (Project Metadata & Tracking)"]
        Router --> AssessR["/api/assessments (Feasibility & Underwriting Score)"]
        Router --> CaAdminR["/api/ca-admin (CA Card OCR, Token Claim, Activation)"]
        Router --> ConsultR["/api/consultations (Advisory Call Bookings)"]
        Router --> PayR["/api/payments (Razorpay Orders, Verification, Webhooks)"]
        Router --> DocR["/api/documents (Project Document Repository)"]
        Router --> NotifR["/api/notifications (Real-time System Alerts)"]
        Router --> ContactR["/api/contact (Enterprise Debt Enquiries)"]
        Router --> PublicR["/api/industries, /services, /testimonials, /stats, /blogs, /faqs"]
        Router --> VisitorR["/api/visitors (Analytics & Page Tracking)"]
        Router --> HealthR["/api/health (Database & Service Probes)"]

        AuthR & UserR & LeadR & ProjR & AssessR & CaAdminR & PayR & ConsultR --> Services["Service Business Logic Layer\n(authService, leadService, caProfileStore, razorpayService, emailService)"]
        Services --> Mongoose["Mongoose Models & Connection Pooling"]
        Services --> MemStore["In-Memory Resilient Store Fallback\n(memoryUserStore, memoryLeads, memoryProjects)"]
    end

    subgraph Persistence["Data Persistence Tier"]
        Mongoose --> MongoDB[("MongoDB Atlas Cluster / Local DB\n(inisio_new_db)")]
    end

    subgraph External["External Integrations Tier"]
        Services -->|Transactional OTP Emails| Resend["Resend Email API"]
        Services -->|Subscription Orders & Webhooks| Razorpay["Razorpay Gateway"]
    end
```

---

## 4. Frontend Architecture & Implementation

### 4.1 Folder Organization (`Frontend/src/`)
```
Frontend/src/
├── assets/                  # Brand imagery, partner logos, vector icons
├── components/              # Modular UI components, dialogs, and dashboards
│   ├── common.tsx           # Reusable UI primitives (Button, Card, Badge, Modal, Input, Spinner)
│   ├── Navbar.tsx           # Global responsive navigation with role switcher & CTA triggers
│   ├── Footer.tsx           # Corporate footer, regulatory notices, quick links, and contact details
│   ├── SEOHead.tsx          # Dynamic title, OpenGraph, meta description, and schema markup
│   ├── Hero.tsx             # Homepage hero with dynamic debt statistics & CTA buttons
│   ├── BankLogosCarousel.tsx # Partner lending banks marquee (SBI, PNB, Canara, BoB, ICICI, etc.)
│   ├── TrustNumbers.tsx     # Dynamic metrics display (Total Debt ₹ Cr, Bank Partners, Success %)
│   ├── HowItWorks.tsx       # 4-stage debt syndication walkthrough
│   ├── WhyChooseInisio.tsx  # Platform competitive differentiators & institutional benefits
│   ├── IndustriesSection.tsx# 12+ greenfield industry sectors with benchmark Capex baselines
│   ├── ProjectActionCards.tsx# Quick-start action tiles (Assessment, Consultation, DPR Drafting)
│   ├── Testimonials.tsx     # Verified promoter reviews with sanctioned loan values
│   ├── FAQSection.tsx       # Searchable accordion FAQ component
│   ├── LatestBlogs.tsx      # Advisory insights & policy research cards
│   ├── BlogsPage.tsx        # Paginated knowledge hub and detailed article view
│   ├── ContactSection.tsx   # Enterprise advisory inquiry form
│   ├── FinalCTA.tsx         # Bottom conversion banner
│   ├── FloatingContactButtons.tsx # Persistent WhatsApp & phone hotline triggers
│   ├── ProjectAssessmentPage.tsx # 6-Step Project Assessment & Underwriting Wizard
│   ├── DetailedRiskProfileForm.tsx# 5-Pillar Risk Radar (Sponsor, Execution, Market, Finance, Collateral)
│   ├── LocationDropdowns.tsx# Comprehensive 28 Indian States & UTs with industrial district clusters
│   ├── PdfPreviewModal.tsx  # In-browser canvas preview for generated AI Project Teaser
│   ├── UserDashboard.tsx    # Promoter / Borrower Portfolio Dashboard
│   ├── CADashboard.tsx      # Chartered Accountant Audit Desk
│   ├── CAAdminDashboard.tsx # CA Empanelment & Business Card OCR Management Desk
│   ├── DPRConsultantDashboard.tsx # Technical Project Report & Viability Desk
│   ├── ProsyncDashboard.tsx # ProSync Banking Consortium Management Desk
│   ├── AdminDashboardView.tsx # Executive Analytics & Supervisor Dashboard
│   ├── AdminPanel.tsx       # Quick-access Admin Slide-over Panel (Ctrl+Shift+S)
│   ├── AuthModal.tsx        # Customer Sign-in, Sign-up, and Password Reset Modal
│   ├── InternalPortalLogin.tsx # Dedicated login gateway for all professional desks
│   ├── MembershipPlansModal.tsx # Razorpay subscription upgrade dialog
│   ├── ConsultationModal.tsx# Debt advisory booking calendar
│   ├── CaActivationModal.tsx# CA invitation claim and profile activation dialog
│   ├── AdminLeadsModal.tsx  # Administrative lead inspection and assignment modal
│   ├── LeadEditModal.tsx    # Promoter project parameter editing modal
│   ├── UserProfileDetailModal.tsx # Detailed user activity and geo-IP inspection modal
│   ├── ErrorBoundary.tsx    # Graceful React runtime error boundary
│   └── ForbiddenPage.tsx    # 403 Access Denied presentation screen
├── config/
│   └── adminAccess.ts       # Administrative email allowlists, roles, and validation rules
├── utils/
│   ├── apiClient.ts         # Axios/Fetch client with base URL resolution, timeout, and JWT bearer headers
│   ├── pdfGenerator.ts      # Multi-page jsPDF generator with custom typography, tables, and branding
│   ├── docxGenerator.ts     # OpenXML Word (.docx) generator building editable project summaries
│   ├── underwritingScorer.ts# 100-point institutional bankability credit rating engine
│   ├── cardOcrScanner.ts    # Tesseract.js optical character scanner for visiting cards
│   ├── financialUtils.ts    # DSCR, working capital, interest during construction (IDC), debt-equity math
│   ├── validation.ts        # Strict Indian phone number, IFSC, PAN, and GST validation rules
│   ├── leadStore.ts         # Client-side project draft and lead synchronization store
│   ├── userStore.ts         # Active user session and credentials store
│   ├── membershipStore.ts   # Quota tracking and assessment plan verification
│   ├── otpService.ts        # Client OTP dispatch and cooldown management
│   └── visitorStore.ts      # Unique session identifier and page view tracking
├── types.ts                 # Central TypeScript type definitions and interfaces
├── index.css                # Tailwind CSS v4 design tokens, color variables, and custom utilities
├── main.tsx                 # React 19 root bootstrap and DOM render
├── App.tsx                  # Master routing, view switching, role access guards, and full-screen workspace controller
└── vite-env.d.ts            # Vite client environment type declarations
```

### 4.2 Client-Side Routing & View Management (`App.tsx`)
Inisio implements a custom, high-speed single-page router in [App.tsx](file:///c:/Users/Suraj/Desktop/26U/Inisio-Latest/inisio-website/Frontend/src/App.tsx) utilizing the browser `History` API (`pushState` and `popstate`) for instantaneous transitions without page reloads:
* `/` : Public Marketing Homepage (Hero, Trust Numbers, How It Works, Industries, Testimonials, FAQ, Contact)
* `/assessment` : Full-Screen 6-Step Project Assessment & Underwriting Wizard
* `/dashboard`, `/user-dashboard`, `/promoter-portal` : Promoter / Borrower Project Dashboard
* `/ca-dashboard` : Chartered Accountant Audit Desk
* `/ca-admin`, `/ca-admin-dashboard` : CA Empanelment Operations Portal (Keyboard shortcut: `Ctrl+Shift+C`)
* `/dpr-dashboard` : Detailed Project Report Consultant Desk
* `/prosync-dashboard` : ProSync Banking Syndication Desk
* `/admin-dashboard`, `/admin`, `/admin-panel` : Executive Super Admin Panel (Keyboard shortcut: `Ctrl+Shift+S`)
* `/blogs`, `/blogs/:slug` : Knowledge Hub & Detailed Industrial Advisory Articles
* `/#solutions`, `/#industries`, `/#faqs`, `/#contact` : Bi-directional anchor scrolling with automatic 72px offset for the fixed navbar

### 4.3 Full-Screen Workspace Controller
When a user navigates to any professional dashboard or initiates the Free Project Assessment flow, `isFullScreenMode` evaluates to `true`:
* The public marketing `<Navbar>` and `<Footer>` are completely removed from the DOM.
* The container locks to `h-screen overflow-hidden` with zero margin/padding, rendering an distraction-free workspace.
* Returning to home or logging out seamlessly restores the public marketing layout and header navigation.

### 4.4 The 6-Step Project Assessment Wizard
Located in [ProjectAssessmentPage.tsx](file:///c:/Users/Suraj/Desktop/26U/Inisio-Latest/inisio-website/Frontend/src/components/ProjectAssessmentPage.tsx):
1. **Step 1 — Project Identity & Industry**: Project name, greenfield vs. expansion categorization, sector selection (12+ industrial presets).
2. **Step 2 — Location & Land Infrastructure**: State & District selection (28 Indian states/UTs), land ownership status (Allotted, Purchased, Under Agreement, Unidentified), total acreage, and industrial corridor proximity.
3. **Step 3 — Promoters & Banking Channel**: Promoter credentials, shareholding percentage, existing banking relationships, home branch, IFSC code, and application reference number.
4. **Step 4 — Capacity & Statutory Approvals**: Plant production capacity, target domestic vs. export market, and statutory clearance tracking (Pollution Control, State Industry Directorate, Power Sanction, Water Allocation).
5. **Step 5 — Capex & Means of Finance**:
   * Breakup of Land, Civil Works, Plant & Machinery, Pre-operative Expenses, and Contingencies.
   * Means of finance split between Promoter Equity and Bank Debt.
   * **Auto-Balance 70:30 Button**: Automatically recalculates and equalizes Debt (70%) and Equity (30%) to balance Means of Finance against total Capex without manual math.
6. **Step 6 — Credit Underwriting, Risk Radar & Teaser Export**:
   * Evaluates institutional bankability rating (e.g. *High Bankability (88/100)*).
   * Computes projected Debt Service Coverage Ratio (DSCR) based on sector benchmarks.
   * Renders 5-pillar risk radar score.
   * Inline authentication/registration with JWT synchronization.
   * Instant download of **AI Project Teaser in PDF** (`generateProjectTeaserPDF`) or **Word DOCX** (`generateProjectTeaserDOCX`).

### 4.5 Styling & Design System
* Built on **Tailwind CSS v4** using modern CSS variables and color utilities:
  * Brand Primary Blue: `#1e3a8a` (Tailwind `blue-900`), `#2563eb` (Tailwind `blue-600`)
  * Accent Emerald: `#059669` (Tailwind `emerald-600`)
  * Warning Amber: `#d97706` (Tailwind `amber-600`)
  * Backgrounds: Pure white `#ffffff` and subtle slate `#f8fafc`
* **Zero Layout Shift**: Responsive skeleton loaders and explicit dimension attributes on all cards and tables prevent cumulative layout shift (CLS).
* **Cross-Device Viewport Handling**: Left-side process navigation in `ProjectAssessmentPage` features independent `overflow-y-auto max-h-full` scrolling, ensuring all steps remain accessible on laptop, tablet, and mobile screens.

---

## 5. Backend Architecture & API Specifications

### 5.1 Architecture Patterns
The backend is structured as a scalable, modular **RESTful Controller-Service-Repository** pattern:
* **Entry Point (`server.js`)**: Initializes Express, connects MongoDB with connection pooling, mounts security middleware, binds 19 modular sub-routers, mounts Vite dev middleware in development, and handles graceful shutdown.
* **Configuration (`config/`)**: Environment validation (`env.js`), database lifecycle (`db.js`), and logger initialization (`logger.js`).
* **Controllers (`controllers/`)**: Parse HTTP inputs, invoke service layer methods, and format responses via standardized JSON envelopes.
* **Services (`services/`)**: Encapsulate business logic, database queries, mathematical underwriting formulas, Resend email dispatches, and Razorpay interactions.
* **Middleware (`middleware/`)**: RBAC verification (`authMiddleware.js`), rate limiting (`rateLimitMiddleware.js`), multipart file uploads (`uploadMiddleware.js`), schema validation (`validateMiddleware.js`), and error formatting (`errorMiddleware.js`).
* **Resilient In-Memory Fallback (`utils/memoryUserStore.js`, `utils/caProfileStore.js`)**: Emulates MongoDB collections when running in offline mode or during cloud database outages.

### 5.2 Complete API Route Directory (19 Modular Sub-Routers)

#### 1. Root & Observability (`/api/health`, `/health`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Service metadata, status, version, and health link |
| `GET` | `/health` | Public | Root liveness check (200 healthy / 503 database disconnected) |
| `GET` | `/api/health` | Public | Comprehensive health probe reporting database status and timestamp |

#### 2. Authentication & Admin Authorization (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Register new promoter account with automatic welcome email |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Promoter login via email & password (supports admin test bypass) |
| `POST` | `/api/auth/admin-login` | Admin Allowlist | Executive Admin login; accepts real DB password or `password26@gmail.com` |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit email OTP for account activation |
| `POST` | `/api/auth/resend-otp` | Public | Re-dispatch verification code via Resend |
| `POST` | `/api/auth/forgot-password` | Public | Dispatch 6-digit password reset OTP to user email |
| `POST` | `/api/auth/verify-reset-otp` | Public | Validate reset OTP code |
| `POST` | `/api/auth/reset-password` | Public | Update password using verified OTP token |

#### 3. User Management (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Authenticated | Retrieve authenticated user profile and membership tier |
| `PUT` | `/api/users/profile` | Authenticated | Update user name, phone, company, or avatar |
| `PUT` | `/api/users/change-password`| Authenticated | Update account password after verifying current password |
| `GET` | `/api/users` | Admin Only | Paginated list of registered users with activity metadata |

#### 4. Project Leads & Syndication Pipeline (`/api/leads`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leads` | Public / Authenticated | Submit project assessment lead with Capex, bank details, and score |
| `GET` | `/api/leads` | Admin / Supervisor | Retrieve all platform project leads with status & industry filters |
| `GET` | `/api/leads/user/:email`| User / Admin | Retrieve all projects submitted by a specific user email |
| `GET` | `/api/leads/:id` | Authenticated | Retrieve complete project assessment dossier by ID |
| `PUT` | `/api/leads/:id` | Authenticated | Update lead parameters, Capex breakup, or means of finance |
| `DELETE`| `/api/leads/:id` | Admin Only | Delete project lead record |

#### 5. Project Metadata (`/api/projects`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Authenticated | Fetch active project files and loan syndication milestones |
| `POST` | `/api/projects` | Authenticated | Create structured corporate borrowing profile |
| `GET` | `/api/projects/:id` | Authenticated | Retrieve detailed borrowing project specification |
| `PUT` | `/api/projects/:id` | Authenticated | Update project milestone status |

#### 6. Feasibility & Assessments (`/api/assessments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/assessments/calculate`| Public | Compute 100-point institutional bankability score & DSCR |
| `POST` | `/api/assessments` | Authenticated | Persist comprehensive feasibility assessment result |
| `GET` | `/api/assessments/:id` | Authenticated | Fetch historical feasibility assessment by ID |

#### 7. CA Admin Empanelment Operations (`/api/ca-admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ca-admin/auth` | CA Admin Allowlist | CA Admin sign-in (supports DB password or `password26@gmail.com`) |
| `POST` | `/api/ca-admin/scan-card` | CA Admin | Multipart upload of visiting card for OCR parsing via Tesseract.js |
| `POST` | `/api/ca-admin/check-duplicate`| CA Admin | Check for duplicate CA registrations by email or phone |
| `POST` | `/api/ca-admin/create-profile` | CA Admin | Create pending CA profile record with extracted OCR data |
| `GET` | `/api/ca-admin/profiles` | CA Admin | Retrieve all CA profiles filtered by status (`pending`, `invited`, `claimed`, `activated`) |
| `POST` | `/api/ca-admin/send-invitation`| CA Admin | Dispatch token-based onboarding invite email via Resend (`WOFA-2026`) |
| `GET` | `/api/ca-admin/verify-claim` | Public | Validate token from email claim link |
| `POST` | `/api/ca-admin/activate-profile`| Public | Set password and activate CA practitioner account |
| `GET` | `/api/ca-admin/metrics` | CA Admin | Empanelment analytics and conversion metrics |
| `GET` | `/api/ca-admin/leads` | CA Admin | Project leads assigned to CA network for CMA audit |
| `GET` | `/api/ca-admin/consultants/nearest`| Public / Auth | Search nearest CAs by city/state coordinates |

#### 8. Advisory Consultations (`/api/consultations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/consultations` | Public | Book 1-on-1 debt syndication advisory call |
| `GET` | `/api/consultations` | Admin Only | View scheduled consultation pipeline with status filters |
| `PUT` | `/api/consultations/:id` | Admin Only | Update consultation status (`Scheduled`, `Completed`, `Cancelled`) |

#### 9. Payments & Subscriptions (`/api/payments`, `/api/payment`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payments/key` | Public | Retrieve public Razorpay Key ID |
| `POST` | `/api/payments/order` | Authenticated | Create Razorpay order for assessment membership tier |
| `POST` | `/api/payments/verify` | Authenticated | Verify HMAC-SHA256 payment signature and upgrade account |
| `POST` | `/api/payments/webhook` | Public | Asynchronous Razorpay webhook processing |

#### 10. Document Repository (`/api/documents`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/documents/upload` | Authenticated | Multipart upload of land titles, DPRs, CMA reports, or balance sheets |
| `GET` | `/api/documents/project/:id` | Authenticated | Retrieve all documents linked to a project |
| `DELETE`| `/api/documents/:id` | Authenticated | Remove uploaded document |

#### 11. Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Fetch active user notifications |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| `POST` | `/api/notifications/broadcast` | Admin Only | Dispatch system-wide broadcast announcement |

#### 12. Contact & Enterprise Enquiries (`/api/contact`, `/api/admin/contact`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/contact` | Public (Rate Limited) | Submit general or debt syndication enterprise enquiry |
| `GET` | `/api/contact` | Admin Only | View all incoming inquiries |
| `PUT` | `/api/contact/:id/status`| Admin Only | Update inquiry status (`New`, `In Discussion`, `Resolved`) |

#### 13. Public Marketing Content (`/api/industries`, `/services`, `/testimonials`, `/stats`, `/blogs`, `/faqs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/industries` | Public | 12+ greenfield industry sectors with benchmark debt metrics |
| `GET` | `/api/services` | Public | Advisory services catalog (TEV, DPR, Debt Syndication, Subsidies) |
| `GET` | `/api/testimonials` | Public | Verified client testimonials and sanctioned loan amounts |
| `GET` | `/api/stats` | Public | Platform aggregates (Total Debt Syndicated ₹ Cr, Partner Banks) |
| `GET` | `/api/blogs` | Public | Paginated advisory blog articles and research papers |
| `GET` | `/api/blogs/:slug` | Public | Single article retrieval by unique SEO slug |
| `GET` | `/api/faqs` | Public | Categorized frequently asked questions |

#### 14. Visitor Analytics (`/api/visitors`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/visitors/track` | Public | Log visitor session ID, page path, IP, user-agent, and timestamp |

---

## 6. Database Models & Schema Specifications

The MongoDB database (`inisio_new_db`) utilizes 17 Mongoose schemas:

### 1. `User` Schema (`Backend/models/User.js`)
* `name` (String, required), `email` (String, unique, indexed, lowercase).
* `password` (String, required, `select: false`, bcrypt hashed with 12 rounds).
* `role` (Enum: `'user'`, `'ca'`, `'ca_admin'`, `'superadmin'`, `'dpr'`, `'prosync'`, `'admin'`).
* `company`, `phone`, `avatarUrl`, `membershipTier` (Default: `'Free'`).
* `isVerified` (Boolean), `passwordInitialized` (Boolean).
* `resetPasswordOtp`, `resetPasswordExpires`, `verificationOtp`, `verificationExpires`.
* `lastLogin` (Object tracking login date, time, city, state, country, IP address, device, browser).

### 2. `Lead` Schema (`Backend/models/Lead.js`)
* `userId` (ObjectId, ref: `'User'`, indexed), `clientProjectId` (String).
* `fullName`, `mobile` (indexed), `email` (indexed).
* `projectName`, `industry`, `location`, `totalCostCr`, `loanRequiredCr`, `promoterContribCr`.
* `feasibilityScore` (Number, 0–100), `bankabilityRating` (String), `dscrEstimate` (Number).
* `landStatus`, `collateralStatus`, `promoterExp`, `status` (Default: `'In Appraisal'`).
* `assignedBank`, `branchLocation`, `bankIfscCode`, `bankAppRefNumber`.
* `financials` (Object: turnover, netProfit, existingDebt, projectedRevenue).
* `riskProfileData` (Object: 5-pillar risk ratings).
* `promotersList` (Array: promoter details, shareholding percentages, KYC status).
* `source` (String), `downloadedPDF` (Boolean).

### 3. `CaProfile` Schema (`Backend/models/CaProfile.js`)
* `name`, `email` (indexed), `phone` (indexed), `firmName`, `membershipNumber`.
* `city`, `state`, `cardImageUrl`, `ocrRawText`.
* `sourceTag` (String, default: `'WOFA-2026'`, indexed).
* `status` (Enum: `'pending'`, `'invited'`, `'claimed'`, `'activated'`, indexed).
* `claimToken` (String, indexed), `claimExpiresAt`, `claimedAt`, `activatedAt`.
* `userId` (ObjectId, ref: `'User'`), `notes`.

### 4. `Project` Schema (`Backend/models/Project.js`)
* `title`, `promoterId` (ObjectId, ref: `'User'`), `sector`, `totalCapex`.
* `termLoanRequested`, `syndicateStatus`, `leadBank`, `sanctionDate`.

### 5. `Assessment` Schema (`Backend/models/Assessment.js`)
* `leadId` (ObjectId, ref: `'Lead'`), `scoreBreakdown` (Object).
* `dscrRatio`, `breakEvenCapacity`, `underwritingRiskGrade`.

### 6. `Consultation` Schema (`Backend/models/Consultation.js`)
* `name`, `email`, `phone`, `preferredDate`, `preferredTime`.
* `projectName`, `fundingRange`, `notes`, `status` (`'Scheduled'`, `'Completed'`, `'Cancelled'`).

### 7. `Payment` Schema (`Backend/models/Payment.js`)
* `userId` (ObjectId, ref: `'User'`), `razorpayOrderId`, `razorpayPaymentId`.
* `amount`, `currency` (`'INR'`), `status` (`'created'`, `'authorized'`, `'captured'`, `'failed'`).
* `planType` (`'Starter'`, `'Growth'`, `'Enterprise'`).

### 8. `Document` Schema (`Backend/models/Document.js`)
* `projectId` (ObjectId, ref: `'Lead'`), `title`, `documentType` (`'DPR'`, `'CMA'`, `'LandTitle'`).
* `fileUrl`, `fileSize`, `uploadedBy`.

### 9. `Notification` Schema (`Backend/models/Notification.js`)
* `recipientId` (ObjectId, ref: `'User'`), `title`, `message`, `type`, `isRead`.

### 10. `BlogPost` Schema (`Backend/models/BlogPost.js`)
* `title`, `slug` (unique, indexed), `category`, `date`, `readTime`, `excerpt`, `content`, `author`, `featured`, `tags`.

### 11. `PlatformStat` Schema (`Backend/models/PlatformStat.js`)
* `statId` (unique), `value`, `prefix`, `suffix`, `label`, `icon`, `order`.

### 12. `Testimonial` Schema (`Backend/models/Testimonial.js`)
* `name`, `title`, `company`, `industry`, `quote`, `fundingAmount`, `rating`.

### 13. `Industry` Schema (`Backend/models/Industry.js`)
* `name`, `code`, `typicalDebtEquityRatio`, `benchmarkDSCR`, `growthRate`.

### 14. `Service` Schema (`Backend/models/Service.js`)
* `title`, `description`, `deliverables`, `icon`, `turnaroundWeeks`.

### 15. `FAQ` Schema (`Backend/models/FAQ.js`)
* `question`, `answer`, `category`, `order`.

### 16. `ContactEnquiry` & `ContactMessage` Schemas
* `fullName`, `email`, `phone`, `company`, `projectCost`, `message`, `status`.

---

## 7. Environment Variables Reference

### Backend Configuration (`Backend/.env`)

```env
# Server Settings
PORT=5000                                          # Backend API port
NODE_ENV=development                              # 'development' | 'production' | 'test'
CORS_ORIGIN=*                                     # Allowed CORS origins (* for dev; production URLs)
FRONTEND_URL=https://inisio-website.vercel.app     # Production frontend URL
APP_URL=https://inisio-website.vercel.app          # Base application URL

# Database & Authentication
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/inisio_new_db # MongoDB Atlas URI
JWT_SECRET=dummy_jwt_secret_token_2026_at_least_16_chars            # Secret key for JWT signing
JWT_EXPIRES_IN=7d                                                  # JWT token validity

# Administrative Access Control
ADMIN_EMAIL=pradeep.tanuku@gmail.com               # Primary Executive Administrator Gmail
SUPER_ADMIN_EMAIL=urbanicoapp@gmail.com            # Super Administrator Gmail
CA_ADMIN=caadmin@gmail.com                         # Primary CA Operations Administrator

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here         # Resend API key for transactional emails
EMAIL_FROM=Inisio Advisory <no-reply@inisio.in>    # Verified sender email address

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_dummy_key_id              # Razorpay Key ID
RAZORPAY_KEY_SECRET=dummy_razorpay_secret_key      # Razorpay Secret Key
RAZORPAY_WEBHOOK_SECRET=dummy_razorpay_webhook_secret # Razorpay Webhook Secret

# High-Resilience Fallback Mode
ALLOW_MEMORY_FALLBACK=true                         # Enables in-memory fallback during DB outages
```

### Frontend Configuration (`Frontend/.env`)

```env
# Backend API Base URL (Local Development uses Vite reverse proxy or direct port 5000)
VITE_BACKEND_URL=http://localhost:5000

# Administrative Access Configuration (Used for client-side navigation pre-checks)
VITE_ADMIN_EMAIL=pradeep.tanuku@gmail.com
VITE_SUPER_ADMIN_EMAIL=urbanicoapp@gmail.com
VITE_CA_ADMIN=caadmin@gmail.com
```

---

## 8. Setup and Installation

### Prerequisites
* **Node.js**: Version `20.0.0` or higher (`v22+` / `v24+` recommended).
* **NPM**: Version `10.0.0` or higher (utilizes root NPM workspaces).
* **MongoDB**: A running local MongoDB instance on port `27017` or a MongoDB Atlas connection string.

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/inisio-website.git
cd inisio-website
```

### Step 2: Install All Dependencies (Root Workspace)
The project utilizes npm workspaces (`Frontend` and `Backend`). Installing from the root installs dependencies across both tiers:
```bash
npm install
```

### Step 3: Configure Environment Files
1. Create `Backend/.env` matching the [Backend Configuration](#backend-configuration-backendenv) specification.
2. Create `Frontend/.env` matching the [Frontend Configuration](#frontend-configuration-frontendenv) specification.

---

## 9. How to Run

### Method 1: Concurrent Dev Runner (Recommended)
Launch both the Express backend API (port 5000) and the Vite frontend app (port 5173) simultaneously:
```bash
npm run dev
# or:
node Scripts/dev.js
```

* **Frontend Application**: [http://localhost:5173](http://localhost:5173)
* **Backend API Base**: [http://localhost:5000](http://localhost:5000)
* **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **Free Project Assessment**: [http://localhost:5173/assessment](http://localhost:5173/assessment)
* **Admin Portal**: [http://localhost:5173/admin](http://localhost:5173/admin) (or press `Ctrl+Shift+S`)
* **CA Admin Portal**: [http://localhost:5173/ca-admin](http://localhost:5173/ca-admin) (or press `Ctrl+Shift+C`)

### Method 2: Running Workspaces Independently

#### Terminal 1 — Backend:
```bash
npm run dev:backend
# Runs: nodemon Backend/server.js on http://localhost:5000
```

#### Terminal 2 — Frontend:
```bash
npm run dev:frontend
# Runs: vite Frontend on http://localhost:5173
```

---

## 10. Automated Testing, Building & Verification

### TypeScript Verification
Verify type integrity across all React components, hooks, and utilities:
```bash
npx tsc --noEmit --project Frontend
```

### Production Build
Generate optimized production bundles:
```bash
npm run build
# Compiles Vite client distribution into Frontend/dist
```

### Testing Admin Authentication
Verify administrative login functionality via curl or Node fetch:
```javascript
// Test Executive Admin Login
fetch('http://localhost:5000/api/auth/admin-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'pradeep.tanuku@gmail.com',
    password: 'password26@gmail.com' // Testing password or real DB password
  })
}).then(res => res.json()).then(console.log);
```

---

## 11. Complete Repository Folder Structure

```
inisio-website/
├── Backend/
│   ├── config/
│   │   ├── db.js                 # Mongoose connection pool & readiness checkers
│   │   └── env.js                # Environment variable resolution & startup validators
│   ├── controllers/
│   │   ├── assessmentController.js# Feasibility computation & storage
│   │   ├── authController.js     # User registration, JWT login, OTP verification
│   │   ├── blogController.js     # Blog retrieval & SEO slug endpoints
│   │   ├── caAdminController.js  # CA business card OCR, claim links, empanelment
│   │   ├── consultationController.js # Advisory call booking
│   │   ├── contactController.js  # Contact enquiries & CRM management
│   │   ├── documentController.js # Multipart document upload & retrieval
│   │   ├── faqController.js      # FAQ queries
│   │   ├── industryController.js # Industrial sectors & Capex baselines
│   │   ├── leadController.js     # Project syndication applications & audit trail
│   │   ├── notificationController.js # System alerts & broadcasts
│   │   ├── paymentController.js  # Razorpay orders, signatures, webhooks
│   │   ├── projectController.js  # Project specification tracking
│   │   ├── serviceController.js  # Advisory services catalog
│   │   ├── statController.js     # Trust numbers & platform metrics
│   │   ├── testimonialController.js # Verified client reviews
│   │   ├── userController.js     # User profiles & activity inspection
│   │   └── visitorController.js  # Session analytics & tracking
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification, RBAC, admin allowlist
│   │   ├── errorMiddleware.js    # Centralized 404 & error handlers
│   │   ├── rateLimitMiddleware.js# Tiered IP rate limiters (General, Auth, Contact)
│   │   ├── uploadMiddleware.js   # Multer file upload configuration
│   │   └── validateMiddleware.js # Zod request validation schemas
│   ├── models/
│   │   ├── Assessment.js         # Feasibility evaluation model
│   │   ├── BlogPost.js           # Advisory articles model
│   │   ├── CaProfile.js          # Chartered Accountant empanelment model
│   │   ├── Consultation.js       # Advisory meeting bookings model
│   │   ├── ContactEnquiry.js     # Enterprise debt enquiries model
│   │   ├── ContactMessage.js     # General messaging model
│   │   ├── Document.js           # Project document locker model
│   │   ├── FAQ.js                # Frequently asked questions model
│   │   ├── Industry.js           # Industry sector benchmarks model
│   │   ├── Lead.js               # Primary project debt application model
│   │   ├── Notification.js       # User notifications model
│   │   ├── Payment.js            # Razorpay transaction records model
│   │   ├── PlatformStat.js       # Dynamic metrics & counters model
│   │   ├── Project.js            # Corporate borrowing profile model
│   │   ├── Service.js            # Professional service listings model
│   │   ├── Testimonial.js        # Client endorsements model
│   │   └── User.js               # User identity, roles, and Geo-IP model
│   ├── routes/
│   │   ├── assessmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── blogRoutes.js
│   │   ├── caAdminRoutes.js
│   │   ├── consultationRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── faqRoutes.js
│   │   ├── index.js              # Central 19-route aggregator
│   │   ├── industryRoutes.js
│   │   ├── leadRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── statRoutes.js
│   │   ├── testimonialRoutes.js
│   │   ├── userRoutes.js
│   │   └── visitorRoutes.js
│   ├── services/
│   │   ├── assessmentService.js
│   │   ├── authService.js
│   │   ├── blogService.js
│   │   ├── consultationService.js
│   │   ├── contactService.js
│   │   ├── faqService.js
│   │   ├── industryService.js
│   │   ├── leadService.js
│   │   ├── notificationService.js
│   │   ├── projectService.js
│   │   ├── razorpayService.js
│   │   ├── serviceService.js
│   │   ├── statService.js
│   │   └── testimonialService.js
│   ├── templates/
│   │   ├── activationConfirmationEmail.js
│   │   └── claimInvitationEmail.js
│   ├── utils/
│   │   ├── caProfileStore.js     # In-memory CA profile fallback store
│   │   ├── emailService.js       # Resend email API integration
│   │   ├── geoIpService.js       # Geo-IP and device metadata capture
│   │   ├── logger.js             # Pino / custom structured logging
│   │   ├── memoryUserStore.js    # Resilient user memory fallback store
│   │   ├── otpService.js         # 6-digit OTP generation & verification
│   │   ├── responseHandler.js    # Standard JSON response envelope
│   │   └── tokenGenerator.js     # JWT signing utility
│   ├── .env                      # Backend environment variables
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Express server bootstrap
├── Frontend/
│   ├── public/                   # Static icons, sitemap.xml, robots.txt
│   ├── src/
│   │   ├── assets/               # Corporate imagery, SVG badges, bank logos
│   │   ├── components/           # 40+ modular React UI components & dashboards
│   │   ├── config/               # Admin allowlist & access validation
│   │   ├── utils/                # PDF/Word generators, underwriting engine, OCR, stores
│   │   ├── App.tsx               # Root SPA routing, access control, full-screen mode
│   │   ├── index.css             # Tailwind v4 theme tokens & styles
│   │   ├── main.tsx              # DOM render entry point
│   │   ├── types.ts              # Global TypeScript interfaces
│   │   └── vite-env.d.ts         # Vite client type definitions
│   ├── .env                      # Frontend environment variables
│   ├── package.json              # Frontend dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   └── vite.config.ts            # Vite build, plugins & proxy setup
├── Scripts/
│   └── dev.js                    # Concurrent dev runner for Backend & Frontend
├── vercel.json                   # Vercel deployment & SPA routing configuration
├── PROJECT.md                    # In-depth architectural & operational documentation
├── README.md                     # Repository documentation
└── package.json                  # Root npm workspaces configuration
```

---

## 12. Security & Compliance Highlights

1. **Role-Based Access Control (RBAC)**: Strict role barriers separate standard promoters (`user`), auditors (`ca`), technical consultants (`dpr`), banking specialists (`prosync`), and system administrators (`admin`, `superadmin`, `ca_admin`).
2. **Administrative Gmail Allowlist**: Admin portals enforce allowlists dynamically derived from environment configuration, rejecting unapproved emails before authentication processing.
3. **Dual Password Authentication for Admin Testing**: Supports both the real bcrypt password stored in the database and `password26@gmail.com` strictly for administrative portals, enabling secure and rapid QA testing without exposing standard accounts.
4. **Resend Email 2FA OTP**: Critical account actions (password reset, email verification, CA empanelment claim) require 6-digit numeric OTPs with 10-minute validity and attempt rate-limiting.
5. **No Data Loss with Auto-Save**: In-progress project assessments are continuously persisted to browser `sessionStorage`, protecting borrowers from lost input on accidental page refreshes.
6. **Payload & Memory Protection**: Explicit body parsing limits (`1mb`) defend against memory exhaustion attacks while permitting comprehensive multipart document transfers.

---

## 13. License & Support

* **Project**: Inisio — Greenfield Project Advisory & Debt Syndication Platform
* **Headquarters**: Hyderabad & Bangalore, India
* **Support Email**: `no-reply@inisio.in` / `support@inisio.in`
* **Official Website**: `https://inisio-website.vercel.app`
* **License**: Proprietary / Private commercial use. All rights reserved.
