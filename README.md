# NEGI TUTORIALS — Enterprise Coaching Management System

> **"Learn • Grow • Succeed"**  
> *Architected & Migrated from Python Flask to Angular 19 + Node.js (Express) + MySQL (Sequelize ORM)*  
> *Watermark: Made by Sachin Mehta*

---

## 🏛️ System Architecture

This project is structured as a clean, production-grade monorepo containing two fully decoupled services:

```text
NEGI TUTORIALS/
├── backend/                  # Node.js + Express + TypeScript REST API (MySQL + Sequelize ORM)
│   ├── src/
│   │   ├── config/           # Database (Sequelize MySQL) & Env config
│   │   ├── controllers/      # REST API route handlers
│   │   ├── middlewares/      # JWT auth, role authorization, error handling
│   │   ├── models/           # 17 Sequelize relational models for MySQL
│   │   ├── routes/           # Express modular routers
│   │   ├── services/         # Core business logic (fees, grading, attendance)
│   │   ├── seed.ts           # Foundational seeder script for MySQL
│   │   └── index.ts          # Server bootstrap & MySQL Sequelize sync
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
The backend REST API is powered by Express, TypeScript, and Sequelize ORM connecting to MySQL:

```bash
cd backend

# 1. Install dependencies (if not already installed)
npm install

# 2. Configure your MySQL database credentials in .env:
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=negi_erp
# DB_USER=root
# DB_PASSWORD=root@123

# 3. Seed foundational catalog & master administrator to MySQL
npm run seed

# 4. Start the backend development server
npm run dev
```

* Backend runs at: **`http://localhost:5000`**
* Health check endpoint: **`http://localhost:5000/api/health`**
* Sequelize automatically verifies and syncs all 17 MySQL tables on server start (`sequelize.sync({ alter: true })`).

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

## 🛡️ Database Architecture & Business Logic Preserved

1. **MySQL + Sequelize ORM Engine**: Complete relational schema with 17 relational tables (`users`, `streams`, `subjects`, `student_profiles`, `student_subjects`, `subject_change_requests`, `attendance`, `fee_structures`, `fee_payments`, `exams`, `exam_marks`, `timetable`, `announcements`, `homework`, `student_homework_status`, `institute_settings`, `testimonials`) and cross-table associations.
2. **100% Dynamic UI**: Everything is managed via interactive UI dialogs—admit students, create academic streams, add curriculum subjects, assign fees, approve payment receipts, and publish examinations.
3. **Statutory Fee Recalculation**: Only verified payments (`isVerified: true`) reduce student dues and increment collected revenue. Student online submissions enter a verification queue for mentor approval.
4. **Academic Grade Computation**: Automatic letter grades:
   - $\ge 90\% \rightarrow \text{A+}$
   - $\ge 80\% \rightarrow \text{A}$
   - $\ge 70\% \rightarrow \text{B+}$
   - $\ge 60\% \rightarrow \text{B}$
   - $\ge 50\% \rightarrow \text{C}$
   - $\ge 33\% \rightarrow \text{D}$
   - $< 33\% \rightarrow \text{F}$
   - Absent $\rightarrow \text{Ab}$
5. **Attendance Formula**: `(Present + Late) / Total * 100.0` with statutory 75% threshold monitoring.
6. **Printable Fee Receipts**: Official computerized fee receipts with institute branding, receipt number, student enrollment details, ledger audit breakdown, and authorized signature.
7. **Data Exports**: Instant CSV download for Student Roster, Fee Financials, Marksheets, and Attendance Logs.
8. **Strict 4-File Component Architecture**: Every Angular component is strictly organized into `.ts`, `.html`, `.scss`, and `.spec.ts`.
