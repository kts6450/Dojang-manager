# Dojang Manager

All-in-one operations platform for martial arts studios — attendance, tuition, belt promotions, CRM, contracts, and more.

Benchmarked against MAS9, MyStudio, and Spark Membership, designed for modern US-market SaaS standards.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Feature Modules](#feature-modules)
5. [API Endpoints](#api-endpoints)
6. [Database Models](#database-models)
7. [Environment Variables](#environment-variables)
8. [Local Development](#local-development)
9. [Seed Data](#seed-data)
10. [Roadmap](#roadmap)

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB + Mongoose |
| **Auth** | NextAuth.js v5 beta (Credentials + JWT) |
| **Validation** | Zod v4 |
| **Data Fetching** | TanStack React Query v5 |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | Tailwind CSS v3 |
| **Charts** | Recharts v3 |
| **Icons** | Lucide React |
| **Email** | Nodemailer (SMTP) |
| **Excel Export** | SheetJS (xlsx) |
| **QR Code** | qrcode + html5-qrcode + BarcodeDetector API |
| **E-Signature** | signature_pad |
| **PDF** | @react-pdf/renderer |
| **Date Utilities** | date-fns |
| **Toast Notifications** | Sonner |
| **Logging** | Custom structured logger (`src/lib/logger.ts`) |

---

## Architecture

The project follows a **BFF (Backend for Frontend)** pattern — UI and API coexist in the same Next.js repository.

### Request Flow

```
Browser (React Client)
  → Next.js API Route      (thin controller — validate input, call service, return response)
  → Service Layer          (business logic — src/services/*.service.ts)
  → Mongoose Model         (data access)
  → MongoDB
```

### Key Architectural Decisions

| Pattern | Implementation |
|---|---|
| **Thin Controllers** | API routes only validate input with Zod and delegate to services |
| **Service Layer** | All business logic lives in `src/services/` |
| **Zod Validation** | Every API route validates with schemas from `src/lib/validations/` |
| **Structured Logging** | `logger.ts` wraps `console` with level, context, and timestamp |
| **Singleton DB Connection** | `src/lib/db/connect.ts` caches the Mongoose connection |
| **Edge-compatible Auth** | `auth.config.ts` (middleware) separated from `auth.ts` (Node.js runtime) |
| **React Query** | Client-side data fetching and caching via `QueryProvider` |

---

## Project Structure

```
dojang-manager/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout (fonts, providers, Toaster)
│   │   ├── page.tsx                    # Dashboard (main)
│   │   ├── login/                      # Login page
│   │   ├── members/                    # Members management
│   │   ├── attendance/
│   │   │   └── qr-scan/               # QR check-in page
│   │   ├── tuition/                    # Tuition & billing
│   │   ├── belt-rank/                  # Belt promotions
│   │   ├── inventory/                  # Inventory
│   │   ├── contracts/
│   │   │   └── [id]/                  # Contract detail (e-signature + PDF)
│   │   ├── after-school/               # After-school program
│   │   ├── events/                     # Events
│   │   ├── online-classes/             # Online classes
│   │   ├── reports/                    # Analytics & exports
│   │   ├── crm/                        # CRM / Lead pipeline
│   │   └── api/                        # REST API routes
│   │       ├── auth/                  # NextAuth handler + register
│   │       ├── members/               # CRUD + [id]
│   │       ├── attendance/            # CRUD + /qr + /stats + [id]
│   │       ├── tuition/               # CRUD + [id]
│   │       ├── belt-rank/             # CRUD + /auto-promote + [id]
│   │       ├── inventory/             # CRUD + [id]
│   │       ├── contracts/             # CRUD + [id]
│   │       ├── events/                # CRUD + [id]
│   │       ├── online-classes/        # CRUD + [id]
│   │       ├── after-school/          # CRUD + [id]
│   │       ├── leads/                 # CRUD + [id]
│   │       ├── reports/               # Stats + /download
│   │       ├── email/                 # Email dispatch
│   │       └── seed/                  # Dev seed endpoint
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── DashboardLayout.tsx    # Shell: sidebar + mobile drawer + PageTransition
│   │   │   ├── DashboardCharts.tsx    # Recharts charts for dashboard
│   │   │   ├── Header.tsx             # Sticky top bar (title, search hint, notifications, avatar)
│   │   │   ├── Sidebar.tsx            # Desktop sidebar + collapsible nav
│   │   │   ├── PageTransition.tsx     # CSS fade-in on navigation (no DOM remount)
│   │   │   ├── QueryProvider.tsx      # TanStack React Query context
│   │   │   ├── SessionProvider.tsx    # NextAuth session context
│   │   │   ├── MemberQRCode.tsx       # QR code generation + download
│   │   │   └── SignaturePad.tsx       # E-signature canvas
│   │   └── ui/                        # shadcn/ui components
│   │
│   ├── services/                       # Business logic layer
│   │   ├── member.service.ts
│   │   ├── attendance.service.ts
│   │   ├── tuition.service.ts
│   │   ├── contract.service.ts
│   │   ├── belt-rank.service.ts
│   │   ├── event.service.ts
│   │   ├── inventory.service.ts
│   │   ├── lead.service.ts
│   │   ├── report.service.ts
│   │   ├── after-school.service.ts
│   │   ├── online-class.service.ts
│   │   ├── email-campaign.service.ts
│   │   └── auth.service.ts
│   │
│   └── lib/
│       ├── auth.ts                    # NextAuth config (Node.js runtime, DB)
│       ├── auth.config.ts             # NextAuth config (Edge-compatible, middleware)
│       ├── utils.ts                   # cn(), formatCurrency, formatDate, formatRelativeTime
│       ├── logger.ts                  # Structured logger (info / warn / error)
│       ├── db/
│       │   ├── connect.ts             # Mongoose singleton connection
│       │   └── models/                # 10 Mongoose models
│       ├── validations/               # Zod schemas (one file per domain)
│       │   ├── common.ts
│       │   ├── member.ts
│       │   ├── attendance.ts
│       │   ├── tuition.ts
│       │   ├── contract.ts
│       │   ├── belt-rank.ts
│       │   ├── event.ts
│       │   ├── inventory.ts
│       │   ├── lead.ts
│       │   ├── after-school.ts
│       │   ├── online-class.ts
│       │   └── register.ts
│       ├── email/
│       │   └── service.ts             # Nodemailer email dispatch
│       └── payment/
│           └── interface.ts           # Payment module abstraction (Phase 2)
│
├── middleware.ts                       # Route protection + callbackUrl normalization
├── .env.local                         # Environment variables (not committed)
├── tailwind.config.ts
├── next.config.mjs
└── components.json                    # shadcn/ui config
```

---

## Feature Modules

### Dashboard
- KPI cards: total members, today's attendance, unpaid tuition, upcoming events
- Month-over-month trend badges
- 6-month charts: attendance, revenue, new members (Recharts Area + Bar)
- Studio overview hero section

### CRM / Leads
- Kanban board: New → Contacted → Trial → Converted → Lost
- Table view
- Lead sources: Walk-in / Referral / Social / Website / Event / Other
- Trial and follow-up date tracking
- Conversion rate stats

### Members
- Full CRUD (name, email, phone, DOB, address)
- Roles: Admin / Instructor / Member / Student
- Status: Active / Inactive / Pending
- Belt grade tracking (White → Black)
- Per-member QR code generation and download
- Search and role filter

### Attendance
- Manual check-in (Present / Absent / Late / Excused)
- QR code check-in via camera (BarcodeDetector API)
  - Duplicate prevention (same member, same day)
- Date range filter
- Attendance stats summary

### Tuition
- Register, mark paid, overdue auto-conversion
- Statuses: Pending / Paid / Overdue / Cancelled
- Bulk overdue email notification
- Monthly summary (paid / unpaid / overdue / this month's revenue)

### Belt & Rank
- Exam records: register, pass/fail
- Auto-promote tab: eligibility based on attendance count + enrollment duration
  - Per-belt thresholds (e.g., White → 20 check-ins + 30 days)
  - One-click promotion when conditions met

### Contracts
- Draft / Pending Signature / Signed / Expired
- Contract detail page with e-signature canvas
- PDF export (browser print)
- 30-day expiry alerts

### Inventory
- Item CRUD with stock-in / stock-out adjustments
- Minimum quantity alerts
- Category management

### After-School
- Program registration and student enrollment
- Schedule management (days + time slots)

### Events
- Event types: Tournament / Seminar / Exam / Other
- Participant count, fee, location
- Broadcast email to all members

### Online Classes
- Class links and schedules (Zoom etc.)
- Copy link shortcut

### Reports
- Annual charts: attendance, revenue, member roles, belt distribution
- Excel export: members / attendance / tuition / belt records
- Year selector

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handler |

### Members
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/members` | List (search, role filter) |
| `POST` | `/api/members` | Create |
| `GET` | `/api/members/:id` | Get one |
| `PATCH` | `/api/members/:id` | Update |
| `DELETE` | `/api/members/:id` | Delete |

### Attendance
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/attendance` | List (date filter) |
| `POST` | `/api/attendance` | Create |
| `PATCH` | `/api/attendance/:id` | Update status |
| `DELETE` | `/api/attendance/:id` | Delete |
| `POST` | `/api/attendance/qr` | QR check-in (public) |
| `GET` | `/api/attendance/stats` | Period stats |

### Tuition
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tuition` | List (status filter) |
| `POST` | `/api/tuition` | Create |
| `PATCH` | `/api/tuition/:id` | Update |
| `DELETE` | `/api/tuition/:id` | Delete |

### Belt & Rank
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/belt-rank` | Exam records |
| `POST` | `/api/belt-rank` | Create exam record |
| `PATCH` | `/api/belt-rank/:id` | Update result (auto-updates member belt on pass) |
| `GET` | `/api/belt-rank/auto-promote` | Get eligible members |
| `POST` | `/api/belt-rank/auto-promote` | Process auto-promotion |

### CRM / Leads
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/leads` | List + status stats |
| `POST` | `/api/leads` | Create lead |
| `PATCH` | `/api/leads/:id` | Update status / info |
| `DELETE` | `/api/leads/:id` | Delete |

### Contracts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/contracts` | List |
| `POST` | `/api/contracts` | Create |
| `GET` | `/api/contracts/:id` | Get one |
| `PATCH` | `/api/contracts/:id` | Update (includes signature data) |
| `DELETE` | `/api/contracts/:id` | Delete |

### Email
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/email` | Send email (`type`: `overdue` / `contract_expiry` / `event` / `single`) |

### Reports
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/reports?year=2025` | Annual stats |
| `GET` | `/api/reports/download?type=members` | Excel export (`members` / `attendance` / `tuition` / `belt`) |

### Other
| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/inventory` | Inventory CRUD |
| `PATCH` | `/api/inventory/:id` | Adjust stock |
| `GET/POST` | `/api/events` | Events CRUD |
| `GET/POST` | `/api/online-classes` | Online classes CRUD |
| `GET/POST` | `/api/after-school` | After-school CRUD |
| `POST` | `/api/seed` | Seed dev data (disabled in production) |

---

## Database Models

| Model | File | Key Fields |
|---|---|---|
| `User` | `models/User.ts` | name, email, password (bcrypt), role, belt, beltLevel, status |
| `Attendance` | `models/Attendance.ts` | userId, classType, date, status (present/absent/late/excused), method (manual/qr) |
| `Tuition` | `models/Tuition.ts` | userId, amount, dueDate, status (pending/paid/overdue/cancelled), paidAt |
| `BeltRank` | `models/BeltRank.ts` | userId, belt, beltLevel, examDate, examResult (pass/fail/pending) |
| `Contract` | `models/Contract.ts` | userId, title, terms, startDate, endDate, amount, status, signatureData (base64) |
| `InventoryItem` | `models/InventoryItem.ts` | name, category, quantity, minQuantity, price |
| `Event` | `models/Event.ts` | title, type, date, location, maxParticipants, fee, status |
| `OnlineClass` | `models/OnlineClass.ts` | title, instructor, platform, meetingUrl, scheduledAt |
| `AfterSchool` | `models/AfterSchool.ts` | studentId, programName, schedule, startDate, endDate |
| `Lead` | `models/Lead.ts` | name, email, phone, source, status, trialDate, followUpDate, interestedIn |

### Role Values
| Value | Description |
|---|---|
| `admin` | Full access |
| `instructor` | Attendance and class management |
| `member` | Standard member |
| `student` | After-school / youth student |

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/dojang-manager
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Email notifications (optional — Gmail app password required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Dojang Manager" <your-email@gmail.com>
```

> **Gmail app password**: Google Account → Security → 2-Step Verification → App Passwords

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Start MongoDB
```bash
# Homebrew
brew services start mongodb-community

# Or run directly
mongod --dbpath /usr/local/var/mongodb
```

### 3. Configure environment
Create `.env.local` with the values above.

### 4. Start the dev server
```bash
npm run dev
# runs on http://localhost:3010
```

### 5. Open the app
```
http://localhost:3010
```

---

## Seed Data

Populate the database with test accounts and sample data:

```bash
curl -X POST http://localhost:3010/api/seed
```

Accounts created:

| Email | Password | Role |
|---|---|---|
| `admin@dojang.com` | `admin1234` | Admin |
| `instructor@dojang.com` | `inst1234` | Instructor |
| `member@dojang.com` | `member1234` | Member |

> The seed endpoint is disabled when `NODE_ENV=production`.

---

## Roadmap

### Phase 2 — Payments
- `src/lib/payment/interface.ts` abstraction is already in place
- Stripe or Toss Payments integration
- Recurring subscription billing

### Planned Features
- [ ] SMS notifications (Twilio)
- [ ] Zoom API integration (auto-create meetings)
- [ ] Member self-service portal (attendance history, tuition payment)
- [ ] DocuSign or similar for external e-signature
- [ ] Pagination for large member datasets
- [ ] Dark mode
- [ ] PWA / mobile app
- [ ] Multi-tenant support (multiple studios per account)

---

## License

Private — unauthorized distribution or commercial use prohibited.
