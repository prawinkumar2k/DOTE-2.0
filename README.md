<div align="center">

# 🎓 DOTE Admission Portal 2.0

### Directorate of Technical Education — Integrated Online Admission Management System

[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite 5](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express 4](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![TailwindCSS 4](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![JWT Auth](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

> **Modern, full-stack admission management platform** designed to digitize and streamline the technical education admission process in Tamil Nadu.

**[Overview](#-overview) • [Features](#-key-features) • [Tech Stack](#-tech-stack) • [Project Structure](#-project-structure) • [Setup Guide](#-installation--setup)**

</div>

---

## 📖 Overview

The **DOTE Admission Portal 2.0** is a comprehensive solution developed for the **Directorate of Technical Education (DOTE)**. It replaces traditional paper-based admission processes with a secure, efficient, and transparent digital workflow.

The platform provides dedicated portals for three main stakeholders:
1.  **Students**: Seamlessly apply for admissions, upload documents, and track status.
2.  **Colleges**: Review applications, manage admissions, and access detailed analytics.
3.  **Administrators**: Overlook the entire system, manage master data, and generate system-wide reports.

---

## ✨ Key Features

### 🎓 Student Lifecycle
- **Unified Registration**: Simple signup with email and mobile verification.
- **9-Step Progressive Form**: A guided admission form that auto-saves progress across multiple sessions.
- **Academic Profile**: Comprehensive sections for personal, parent, and detailed academic history (SSLC/HSC/ITI).
- **Document Management**: Secure upload of Photo, Transfer Certificate, Marksheets, and Community Certificates.
- **College Preference System**: Rank institutions based on preference for automated allotment processing.
- **Printable Reports**: Generate professional PDF application reports using `jsPDF`.
- **Status Dashboard**: Real-time tracking from "Submitted" to "Approved" or "Rejected".

### 🏛️ Institution Dashboard
- **Analytics Overview**: Visual breakdown of total applications and status distributions.
- **Application Inbox**: Advanced filtering and search for managing thousands of applicants.
- **Profile Reviewer**: Detailed view of student information and high-resolution document previews.
- **One-Click Actions**: Instant approval/rejection workflow with notification triggers.
- **Data Export**: Export student lists and reports directly to Excel (XLSX).

### 🛡️ Administrative Control
- **Master Data Management**: Centralized control over Institutions, Communities, Castes, and Boards.
- **System Analytics**: High-level dashboards showing demographic trends and submission timelines.
- **Role-Based Access**: Granular control ensuring data security across different user levels.
- **Institution Registry**: CRUD operations for managing participating colleges and departments.

---

## 🛠️ Tech Stack

### Frontend (Modern React SPA)
- **Library**: React 18.2.0
- **Build Tool**: Vite 5.2.0 (with HMR)
- **Styling**: Tailwind CSS 4.x (Utility-first, responsive design)
- **State & Routing**: React Router 6.14.2
- **Animations**: Framer Motion 10.16.4
- **Charts**: Recharts 2.8.0
- **Icons**: Lucide React
- **Data Export**: jsPDF, XLSX

### Backend (Robust Node.js API)
- **Runtime**: Node.js 20+
- **Framework**: Express 4.18.2
- **Database**: MySQL 8.0 (Driver: mysql2)
- **Security**: JWT (jsonwebtoken), bcryptjs, Helmet, CORS
- **Storage**: Multer (File uploads)
- **Mail**: Nodemailer (SMTP integration)
- **Logging**: Morgan

---

## 📂 Project Structure

```bash
DOTE_2.0/
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page views (Admin, College, Student, Auth)
│   │   ├── routes/      # AppRoutes and ProtectedRoute guards
│   │   └── utils/       # PDF generators, formatters
│   └── tailwind.config.js
├── server/              # Node.js Backend (Express)
│   ├── config/          # Database & Env configurations
│   ├── controllers/     # Business logic for all roles
│   ├── models/          # MySQL database queries
│   ├── routes/          # API endpoints definitions
│   ├── middleware/      # Auth & Role verification
│   ├── services/        # Email & Reporting services
│   └── uploads/         # Local file storage for documents
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v20 or higher
- **MySQL**: v8.0 or higher
- **npm**: v10 or higher

### 1. Database Setup
1. Create a MySQL database named `dote_admission`.
2. Run the provided SQL migration files (if any) or create tables based on the models.

### 2. Backend Configuration
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=dote_admission
JWT_SECRET=your_super_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Frontend Configuration
```bash
cd client
npm install
```

### 4. Running the Project
**Start Backend (Development Mode):**
```bash
cd server
npm run dev
```

**Start Frontend:**
```bash
cd client
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 🚀 Deployment

- **Frontend**: Build using `npm run build` and serve via Nginx or Vercel.
- **Backend**: Deploy on PM2 or Docker.
- **Database**: Managed RDS or local MySQL instance.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Built with ❤️ for Technical Education in Tamil Nadu
</div>
