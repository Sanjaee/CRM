# Wahana Travel CRM & Invoice Management System
**Enterprise Full-Stack Application — Single Docker Compose Deployment**

---

## 1. Executive Summary & Architecture Overview

The **Wahana Travel CRM & Invoice Management System** is a full-stack enterprise platform developed through complete reverse engineering of the Wahana Travel administrative operations, reference architecture, and backend systems.

### Core Stack
- **Frontend**: Next.js 14 App Router, React 18, TypeScript (Strict Mode), Tailwind CSS, shadcn/ui components, TanStack Query, Zustand, Lucide React, Sonner toast notifications, date-fns.
- **Backend API**: ASP.NET Core Web API (.NET 9 LTS), Entity Framework Core 9, PostgreSQL provider (`Npgsql.EntityFrameworkCore.PostgreSQL`), JWT authentication, Policy-based RBAC, Swagger/OpenAPI, Health Checks.
- **Database**: PostgreSQL 16 Alpine, persistent volume storage (`wahana_postgres_data`), isolated internal Docker network (`wahana_internal_network`).
- **Orchestration**: Single root-level `docker-compose.yml` with multi-stage production builds and automatic database migrations and seeds.

```
wahana-crm/
├── apps/
│   ├── web/                    # Next.js 14 App Router frontend
│   │   ├── src/
│   │   │   ├── app/            # App entry point & global layout
│   │   │   ├── components/     # UI views (Dashboard, Customers, Invoices, Payments, Departments, Branches, RBAC)
│   │   │   │   └── ui/         # shadcn/ui primitives (Button, Card, Table, Dialog, Badge, Input, etc.)
│   │   │   └── lib/            # TanStack Query client, Zustand authStore, typed apiClient
│   │   ├── Dockerfile          # Multi-stage Next.js standalone runner
│   │   └── next.config.mjs     # Standalone output & same-origin internal proxy rewrites
│   └── api/                    # ASP.NET Core Web API (.NET 9)
│       ├── Domain/             # Entities: Department, Branch, Customer, Invoice, Payment, User, RolePermission
│       ├── Infrastructure/     # AppDbContext, DbSeeder, EF Migrations
│       ├── DTOs/               # Strongly-typed records for API contracts
│       ├── Services/           # AuthService, Token generator, Password hasher
│       ├── Controllers/        # Customers, Invoices, Payments, Departments, Branches, Users, Dashboard
│       └── Dockerfile          # Multi-stage .NET 9 SDK builder & hardened runtime
├── docker-compose.yml          # Single root deployment configuration
├── .env.example                # Environment variables template
├── .env                        # Local execution variables
├── .dockerignore
└── README.md
```

---

## 2. Reverse Engineering Findings

### 2.1 Domain & Business Rules
1. **Department Hierarchy**:
   - Discovered 10 standard departmental divisions:
     - `FAT`: Finance, Accounting, and Tax (Parent Department)
     - `ACP`: Accounts Payable (Child of FAT)
     - `ACR`: Accounts Receivable (Child of FAT)
     - `TAX`: Tax Division (Child of FAT)
     - `INV`: Invoicing Division (Child of FAT)
     - `TKT`: Ticketing Operations
     - `TUR`: Tour Operations
     - `CNT`: Content & Media Management
     - `IT`: Information Technology & Infrastructure
     - `MGT`: Executive Management
2. **Branch Network**:
   - `PL`: Wahana Pluit (Head Office) — Penjaringan, Jakarta Utara
   - `WK`: Wahana Kuningan — Menara Kuningan Lt. 10, Setiabudi, Jakarta Selatan
   - `PO`: Wahana Palem — Ruko Taman Palem Lestari, Cengkareng, Jakarta Barat
   - `KO`: Wahana PU (Kebayoran) — Gedung Heritage PU, Kebayoran Baru, Jakarta Selatan
   - `RO`: Wahana Roxy — Ruko Roxy Mas, Gambir, Jakarta Pusat
3. **Invoicing & Tax Regulations**:
   - `NetFare`: Sum of all flight / hotel line items `(UnitPrice * Quantity - Discount)`.
   - `GST (PPN)`: Evaluated at 1.1% on net travel fare pursuant to Indonesian travel agency tax regulations (`Math.Round(TaxableBase * 0.011m)`).
   - `Stamp Duty (Bea Meterai)`: Imposed at Rp 10.000 for invoice balances >= Rp 5.000.000.
   - `Billing Amount Formula`: `NetFare + ServiceFee - Discount + GST + StampDutyFee`.
   - **Lifecycle Transitions**: `Draft` → `Submitted` → `Confirmed` → `Finalized` → `Paid` (upon full payment allocation).
4. **Payment Settlements**:
   - Bank receipts recorded atomically (`PaymentNo`, `ReceivedAmount`, `UnallocatedAmount`).
   - Multiple invoice allocation with balance deduction ensuring zero double-spending or negative balances.

---

## 3. Quick Start & Operator Commands

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+

### 1. Launch Entire Application
To build and start all containers (Database, Backend API, Frontend):
```bash
docker compose up -d --build
```

### 2. Check Container Health Status
```bash
docker compose ps
```
*Expected status: All 3 containers (`wahana_postgres`, `wahana_api`, `wahana_web`) report `Up` and `healthy`.*

### 3. Stream Container Logs
```bash
docker compose logs -f
```

### 4. Stop Application Stack
```bash
docker compose down
```
*(Persistent data inside named volume `wahana_postgres_data` is safely preserved).*

---

## 4. Default Credentials & Access

Access web application in your browser: **[http://localhost:3000](http://localhost:3000)**

| Role | Login ID | Password | Access Level |
|---|---|---|---|
| **System Administrator** | `admin` | `Admin123!` | Full Enterprise Access (All modules & RBAC) |
| **Finance Manager** | `siti.finance` | `Admin123!` | Invoices, Payments, Approvals, Audits |
| **Ticketing Staff** | `budi.ticketing` | `Admin123!` | Customers, Draft Invoices, Booking Line Items |

*A one-click "Quick Fill & Login" demo badge is also embedded on the login page.*

---

## 5. API Endpoint Documentation

All endpoints are hosted at `/api/v1/` and reverse-proxied through the Next.js same-origin gateway.

### Authentication
- `POST /api/v1/auth/login` — Authenticate user and receive JWT bearer token with claims.

### Customers CRM
- `GET /api/v1/customers?page=1&pageSize=10&search=` — Server-side paginated customer list.
- `GET /api/v1/customers/{id}` — Retrieve detailed customer profile with invoice history.
- `POST /api/v1/customers` — Create corporate or retail customer profile.
- `PUT /api/v1/customers/{id}` — Update customer details, credit limit, and terms.
- `DELETE /api/v1/customers/{id}` — Authorized soft-delete / archival.

### Invoices & Billing
- `GET /api/v1/invoices?page=1&pageSize=10&status=&search=` — Server-side paginated invoices.
- `GET /api/v1/invoices/{id}` — Detailed invoice with line items, tax, and audit trails.
- `POST /api/v1/invoices` — Create draft invoice with travel line items.
- `POST /api/v1/invoices/{id}/submit` — Submit draft invoice for managerial review.
- `POST /api/v1/invoices/{id}/approve` — Approve and finalize invoice.

### Payments & Allocation
- `GET /api/v1/payments?page=1&pageSize=10` — List received bank payments.
- `POST /api/v1/payments` — Record new incoming bank payment receipt.
- `POST /api/v1/payments/{id}/allocate` — Atomically allocate funds to one or more finalized invoices.

### Departments & Branches
- `GET /api/v1/departments` — List 10 departments with parent-child tree and staff counts.
- `POST /api/v1/departments` — Create new operational department.
- `GET /api/v1/branches` — List 5 official branches with head office designation.
- `POST /api/v1/branches` — Register new branch location.

### RBAC & User Administration
- `GET /api/v1/users` — Directory of registered back-office administrators.
- `POST /api/v1/users` — Provision new administrative user.
- `GET /api/v1/users/roles/permissions` — Fetch role-to-permission mapping matrix.
- `PUT /api/v1/users/roles/{role}/permissions` — Update granular permissions for a role.

### Dashboard & Health
- `GET /api/v1/dashboard/stats` — Operational dashboard metrics and receivables overview.
- `GET /healthz` — ASP.NET Core & PostgreSQL readiness health check.

---

## 6. Backup & Restore Procedures

### Database Backup
To create a timestamped SQL dump of the PostgreSQL database:
```bash
docker exec -t wahana_postgres pg_dump -U wahana -d wahanacrm > backup_wahanacrm_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
To restore database state from a backup file:
```bash
docker exec -i wahana_postgres psql -U wahana -d wahanacrm < backup_wahanacrm_20261026_000000.sql
```

---

## 7. Security & Compliance Highlights
1. **Network Isolation**: PostgreSQL port `5432` is not bound to the host machine. Only containers within `wahana_internal_network` can communicate with the database.
2. **Same-Origin Reverse Proxy**: The frontend Next.js server proxies `/api/*` and `/healthz` directly to `http://api:8080`, eliminating browser CORS issues and preventing leaking internal Docker URLs.
3. **Hardened Containers**: Containers run under unprivileged non-root users (`app` in .NET, `nextjs` in Node.js).
4. **Auditing**: All invoice status transitions (Submitted, Approved, Finalized, Rejected) create immutable rows in `InvoiceAuditLogs`.
