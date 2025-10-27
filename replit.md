# School Management Dashboard

## Overview

This project is a comprehensive Arabic-first school management system designed for "مدرسة النور الأهلية" (Al-Noor Private School). It provides a full-stack solution for managing students, teachers, classes, grades, attendance, payments, and communications. The system features a modern glass-morphism UI, is optimized for RTL (right-to-left) Arabic layouts, and supports multi-currency financial operations. Its core purpose is to streamline administrative tasks and enhance communication within the school environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application features a modern glass-morphism design with translucent cards, backdrop blur effects, and vibrant gradient accents. It supports both light and dark modes with theme persistence via localStorage. The design is RTL-first, optimized for Arabic text rendering using the Cairo font family. A responsive grid ensures consistent layout across devices, complemented by a fixed 320px sidebar navigation. Key UI patterns include dialog-based forms for CRUD operations, real-time data fetching, and toast notifications.

**Dark Mode Implementation:**
- Full dark mode support with semantic color tokens
- Theme toggle button in dashboard header
- CSS variables defined in `index.css` for both `:root` (light) and `.dark` (dark mode)
- ThemeContext manages theme state with localStorage persistence
- All components use semantic tokens (bg-background, text-foreground, etc.) for automatic theme adaptation
- Dark mode colors: Deep blue-gray backgrounds (--background: 220 15% 12%) with light text for optimal contrast

### Technical Implementations

**Frontend:**
- **Framework:** React with TypeScript, using Vite for fast development and Wouter for client-side routing.
- **Styling:** Tailwind CSS with custom RTL configuration and Shadcn/ui components for accessible UI.
- **State Management:** TanStack Query for server state, React Context API for global settings (e.g., dynamic currency, theme), and React Hook Form with Zod for form handling and validation.
- **Localization:** Arabic-first design with comprehensive country code selector for phone numbers supporting bilingual search.
- **Educational Structure:** Implements a hierarchical education structure (Education Level, Grade, Section) with cascading filters and selectors.
- **Student Management:** Features include student enrollment, grade and attendance tracking, and a delete confirmation dialog with cascade delete for all related records.
- **Teacher Management:** Includes attendance tracking with automatic salary deductions for unpaid leave.

**Backend:**
- **Server:** Express.js with TypeScript and ESM.
- **API Design:** RESTful endpoints with Zod schemas for request validation, centralized error handling, and CORS.
- **Database:** PostgreSQL accessed via Drizzle ORM for type-safe queries and schema management, with Neon Serverless for cloud deployment.
- **Authentication:** Passport.js with Local Strategy for secure login, express-session with PostgreSQL store for session management, and scrypt for password hashing.
- **Data Models:** Comprehensive models for Users, Students, Teachers, Education Levels, Classes, Subjects, Grades, Attendance, Payments, Student Accounts, Payment Transactions, Teacher Salaries, Teacher Advances, School Expenses, and Notifications.
- **Financials:** Dynamic multi-currency support with automatic updates across the system, configurable via school settings.
- **Teacher Attendance:** Tracks various statuses (present, absent, paid/unpaid leave, sick leave) and automatically calculates salary deductions.

### Feature Specifications

- **Authentication System:** Secure role-based access control with three user types:
  - **Admin (إدارة المدرسة):** Full system access to all features and data
  - **Teacher (المعلمين):** Access to add grades for their assigned students
  - **Parent (الأهالي):** View-only access to their children's reports and grades
- **Multi-currency Support:** Dynamic currency selection (SAR, EGP, AED) affecting all financial displays.
- **Hierarchical Education:** Manages Education Levels, Grades, and Sections with cascading UI elements.
- **Student Management:** Full CRUD for students, linked to classes and education levels, with cascade deletion for all associated data.
- **Teacher Attendance & Payroll:** Detailed teacher attendance tracking integrated with automatic salary deductions for unpaid leave.
- **Comprehensive Financials:** Tracks student payments, teacher salaries, advances, and school expenses.
- **PDF Generation:** Utilizes `html2pdf.js` for generating student grade reports with Arabic/RTL support.

## External Dependencies

- **Database:** `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`
- **Frontend Framework:** `react`, `react-dom`, `wouter`
- **Backend Framework:** `express`
- **Authentication:** `passport`, `passport-local`, `express-session`, `connect-pg-simple`
- **State Management:** `@tanstack/react-query`
- **UI Components & Styling:** `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`, `embla-carousel-react`
- **Form & Validation:** `react-hook-form`, `@hookform/resolvers`, `zod`
- **Build Tools:** `vite`, `tsx`, `esbuild`, `@replit/vite-plugin-*`
- **Date Handling:** `date-fns`
- **PDF Generation:** `html2pdf.js`