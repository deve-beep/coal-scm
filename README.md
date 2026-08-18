# Coal SCM Dashboard — Government Coal Supply Chain & Distribution Monitoring System

A full-stack **MERN** (MongoDB, Express, React, Node.js) prototype built as a 6-month training
project: a government coal supply chain monitoring dashboard covering national production
targets, stockyard levels, e-auctions, bulk dispatch and rail rake logistics, fuel supply
agreements, coking coal import dependencies, and shortage alert reporting — all behind
role-based access control for **Admins**, **Logistics Managers**, and **Industrial Consumers**.

---

## 1. Features

| Module | Description |
|---|---|
| **Auth & RBAC** | JWT-based login; three roles (admin, logistics_manager, consumer) with route- and field-level permission checks on every endpoint. |
| **Production Dashboard** | National production target-vs-actual charts (monthly, by company), stock-level summaries, and e-auction status breakdowns — all backed by real MongoDB aggregation pipelines. |
| **Coalfields & Production** | Coalfield master data (company, state, grade, annual target) with monthly production records logged against target. |
| **Stockyards** | Depot-level stock tracking with capacity, fill %, and automatic **CRITICAL/LOW/HEALTHY** status. Dropping stock at or below the minimum threshold **automatically raises a shortage alert** — no manual step required. |
| **E-Auctions** | Spot, linkage and forward e-auctions. Consumers place bids (validated against reserve price and lot size); admins allot to the highest bidder, with ties broken by earliest bid placed. |
| **Logistics — Dispatches** | Bulk dispatch records across rail, road and MGR modes. Creating a dispatch validates and deducts from the source stockyard's live stock automatically. |
| **Logistics — Rail Rake Tracker** | Individual rake movements (PLACED → LOADING → LOADED → IN_TRANSIT → ARRIVED → UNLOADED) with a full timestamped event timeline per rake. |
| **Fuel Supply Agreements (FSA)** | Long-term supply contracts between coalfields and consumers, tracked with a live fulfillment percentage. |
| **Coking Coal Imports** | Import contracts for steel-plant coking coal dependencies — source country, supplier, port of entry, and status from contract through customs to delivery, with a per-country volume/value summary. |
| **Shortage Alerts** | Auto-generated from stock threshold breaches, or manually reported by consumers/logistics managers, with a full status timeline (OPEN → ACKNOWLEDGED → RESOLVED). |

---

## 2. Tech Stack

- **Frontend:** React 19 (Vite), React Router, Tailwind CSS, Recharts, Axios, lucide-react
- **Backend:** Node.js, Express, Mongoose (MongoDB), JWT, bcrypt, Helmet, rate limiting
- **Database:** MongoDB (local, Docker, or Atlas). Also auto-falls back to an in-memory MongoDB for zero-config local demos.

---

## 3. Project Structure

```
coal-scm-dashboard/
├── backend/
│   ├── config/db.js              # MongoDB connection (+ in-memory fallback)
│   ├── models/                   # User, Coalfield, ProductionRecord, Stockyard, Auction,
│   │                              # Dispatch, RailRake, FuelSupplyAgreement, CokingCoalImport, ShortageAlert
│   ├── controllers/               # Business logic per module
│   ├── routes/                    # Express routers
│   ├── middleware/                # JWT auth, role-based access, error handling
│   ├── seed/                      # Demo data seeding
│   └── server.js                  # App entry point
└── frontend/
    └── src/
        ├── api/client.js
        ├── context/AuthContext.jsx
        ├── components/            # Layout (role-aware sidebar) + reusable UI kit
        └── pages/                  # Landing, auth, dashboard, coalfields, stockyards,
                                     # auctions, logistics (dispatches/rakes), FSA, imports, alerts, users
```

---

## 4. Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance — **or** leave `MONGO_URI` blank (see note below).

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set MONGO_URI to your MongoDB connection string, e.g.:
#   mongodb://localhost:27017/coal_scm_db
#   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/coal_scm_db
npm run dev          # starts on http://localhost:5002
```

**No MongoDB handy?** Leave `MONGO_URI` blank. The server automatically spins up an in-memory
MongoDB instance (via `mongodb-memory-server`) on first boot and **auto-seeds it** with demo
accounts and realistic sample data — production records, stockyards (including one intentionally
critical, to demonstrate the auto-alert flow), auctions, dispatches, a rail rake in transit, FSAs
and import contracts. Data in this mode does **not** persist across restarts — set a real
`MONGO_URI` for real use. (First run needs outbound internet once, to download the MongoDB binary.)

To reset/reseed a **real** database with fresh demo data at any time:
```bash
npm run seed
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL defaults to http://localhost:5002/api
npm run dev               # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 5. Demo Accounts

After seeding, these accounts are ready to use (also shown as one-click buttons on the login page):

| Role | Email | Password |
|---|---|---|
| Admin (Ministry) | `admin@coalscm.gov.in` | `Admin@123` |
| Logistics Manager | `logistics@coalscm.gov.in` | `Logistics@123` |
| Consumer (Steel) | `consumer@steelcorp.com` | `Consumer@123` |
| Consumer (Power) | `priya@powergrid-thermal.com` | `Consumer@123` |

---

## 6. Key API Endpoints

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

```
POST   /auth/register                    Public — consumer self-registration
POST   /auth/login

GET    /coalfields/production/national-summary   Monthly + by-company target vs actual
POST   /coalfields/:id/production                admin, logistics_manager — log a monthly record

GET    /stockyards/summary/national               Total stock, capacity, status breakdown
PATCH  /stockyards/:id/stock                       admin, logistics_manager — update stock (auto-raises alert if critical)

POST   /auctions/:id/bid                           consumer — place a bid on a LIVE auction
POST   /auctions/:id/allot                         admin — close bidding, allot to highest bidder

POST   /dispatches                                 admin, logistics_manager — creates dispatch, deducts stock
PATCH  /dispatches/:id/status

POST   /rakes                                      admin, logistics_manager — register a rake movement
PATCH  /rakes/:id/status                           advance through PLACED → ... → UNLOADED

GET    /fsa                                        Role-aware fuel supply agreement listing
GET    /imports/summary                            admin, logistics_manager — import volume/value by country

POST   /alerts                                      Any role — report a shortage
PATCH  /alerts/:id/status                            admin, logistics_manager

GET    /dashboard/summary                           admin, logistics_manager — KPI tiles
GET    /dashboard/auction-status-breakdown
GET    /dashboard/dispatch-mode-breakdown
```

---

## 7. Notes on Core Business Logic

Several rules were directly unit-tested during development (see the build notes below) rather
than just written and assumed correct:

- **Auction allotment**: highest price-per-tonne wins; ties are broken by earliest bid timestamp.
- **Bid validation**: rejects bids on non-`LIVE` auctions, bids below the reserve price, and bids exceeding the lot size.
- **Stockyard status**: `CRITICAL` at or below the minimum threshold, `LOW` up to 1.5× threshold, `HEALTHY` above that — with both boundaries inclusive on the lower side.
- **Dispatch stock deduction**: a dispatch is rejected if it would exceed the source stockyard's current stock; on success, the stockyard's stock is atomically reduced.
- **Auto shortage alerts**: updating a stockyard's stock to at/below its threshold automatically opens a `CRITICAL` or `HIGH` severity alert (skipped if one is already open, to avoid duplicates).

---

## 8. Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT auth with configurable expiry
- Helmet HTTP headers, CORS, per-IP rate limiting
- Role-based middleware on every mutating route
- Mongoose schema validation + centralized error handling (duplicate keys, cast errors, validation errors)

---

## 9. What's Included vs. What You'd Add for Production

This is a complete, working reference implementation — the backend was booted for real and
tested with live HTTP requests (health check, 404 handling, 401/400 validation) in addition to
unit tests of the core business logic above. Before a real deployment you'd typically add:
automated test suites, HTTPS/reverse proxy config, environment-specific secrets management,
SMS/email notifications for alerts and auction outcomes, audit logging for compliance, and
pagination-tuned indexes for very large historical datasets. The data model and API are
structured to make all of these straightforward additions.
