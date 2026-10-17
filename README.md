# NEGI TUTORIALS — Enterprise Coaching Management System

> **"Learn • Grow • Succeed"**  
> *Architected & Migrated from Python Flask to Angular 19 + Node.js (Express) + PostgreSQL (Prisma ORM)*  
> *Watermark: Made by Sachin Mehta*

---

## 🏛️ System Architecture

This project is structured as a clean, production-grade monorepo containing two fully decoupled services:

```text
NEGI TUTORIALS/
├── backend/                  # Node.js + Express + TypeScript REST API
│   ├── prisma/
│   │   ├── schema.prisma     # PostgreSQL Prisma schema (16 models)
│   │   └── seed.ts           # Foundational seeder
│   ├── src/
│   │   ├── config/           # Prisma, JWT & Env config
│   │   ├── controllers/      # REST API route handlers
│   │   ├── middlewares/      # JWT auth, role authorization, error handling
│   │   ├── routes/           # Express modular routers
│   │   ├── services/         # Core business logic (fees, grading, attendance)
│   │   └── index.ts          # Server bootstrap & CORS
│   ├── package.json          # Runs via "npm run dev" with nodemon
│   └── tsconfig.json
│
├── frontend/                 # Angular 19 SPA (Standalone, Reactive Forms)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # Services, models, guards, interceptors
│   │   │   ├── shared/       # 4-file UI widgets (Sidebar, Header, Modal, Toast)
│   │   │   └── modules/      # Auth, Mentor/Owner, Student domains
│   │   ├── styles.scss       # Global SaaS design system & theme
│   │   └── ...
│   ├── package.json          # Runs via "npm run dev" (ng serve)
│   └── angular.json
│
├── task.md                   # Real-time migration task tracker
└── README.md
```

---

## ⚡ How to Run the Application

### 1. Backend Service (`backend/`)
The backend REST API is powered by Express and TypeScript, configured to run with `nodemon` for instant hot-reload:

```bash
cd backend

# 1. Install dependencies (if not already installed)
npm install

# 2. Setup your PostgreSQL database in .env
# DATABASE_URL="postgresql://user:password@localhost:5432/negi_tutorials?schema=public"

# 3. Generate Prisma client & push schema to DB
npx prisma generate
npx prisma db push

# 4. (Optional) Seed demo institute data
npm run seed

# 5. Start the backend development server
npm run dev
```

* Backend runs at: **`http://localhost:5000`**
* Health check endpoint: **`http://localhost:5000/api/health`**

---

### 2. Frontend Application (`frontend/`)
The frontend is a single-page application built on Angular 19:

```bash
cd frontend

# 1. Install dependencies (if not already installed)
npm install

# 2. Start the Angular development server
npm run dev
```

* Frontend application opens at: **`http://localhost:4200`**

---

## 🔑 Demo Login Accounts

Foundational seed data creates the following test credentials:

| Role | Username | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | `owner` | `owner@negitutorials.com` | `Password123` | Institute analytics, faculty management, streams/subjects CRUD, settings |
| **Mentor** | `mentor` | `mentor@negitutorials.com` | `Password123` | Attendance register, marksheet entry, fee verification, homework |
| **Student** | `student` / `aarav12` | `aarav@example.com` | `Password123` | Student dashboard, fee ledger & online receipt, attendance, timetable |

---

## 🛡️ Business Logic & Features Preserved

1. **100% Dynamic UI**: Everything is managed via interactive UI dialogs—admit students, create academic streams, add curriculum subjects, assign fees, approve payment receipts, and publish examinations.
2. **Statutory Fee Recalculation**: Only verified payments (`isVerified: true`) reduce student dues and increment collected revenue. Student online submissions enter a verification queue for mentor approval.
3. **Academic Grade Computation**: Automatic letter grades:
   - $\ge 90\% \rightarrow \text{A+}$
   - $\ge 80\% \rightarrow \text{A}$
   - $\ge 70\% \rightarrow \text{B+}$
   - $\ge 60\% \rightarrow \text{B}$
   - $\ge 50\% \rightarrow \text{C}$
   - $\ge 33\% \rightarrow \text{D}$
   - $< 33\% \rightarrow \text{F}$
   - Absent $\rightarrow \text{Ab}$
4. **Attendance Formula**: `(Present + Late) / Total * 100.0` with statutory 75% threshold monitoring.
5. **Printable Fee Receipts**: Official computerized fee receipts with institute branding, receipt number, student enrollment details, ledger audit breakdown, and authorized signature.
6. **Data Exports**: Instant CSV download for Student Roster, Fee Financials, Marksheets, and Attendance Logs.
7. **Strict 4-File Component Architecture**: Every Angular component is strictly organized into `.ts`, `.html`, `.scss`, and `.spec.ts`.
