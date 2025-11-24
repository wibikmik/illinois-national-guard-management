# Illinois National Guard RP Management System

## Overview

This is a comprehensive roleplay management system for the Illinois National Guard, designed to manage personnel, duty tracking, disciplinary records, promotions, merit points, and mission reports. The application integrates with Discord for authentication and provides role-based access control based on military rank and position.

The system is built as a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence (via Drizzle ORM), with a focus on military hierarchy, data-heavy workflows, and enterprise-grade information architecture following Carbon Design System principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite for development and production bundling.

**UI Framework**: Combination of shadcn/ui components (based on Radix UI primitives) with custom styling following Carbon Design System principles. The design emphasizes clarity, hierarchical information architecture, and professional military aesthetics.

**Styling**: Tailwind CSS with custom design tokens defined in CSS variables. Uses IBM Plex Sans as the primary typeface. The theme system supports light/dark modes with comprehensive color tokens for semantic use (primary, secondary, destructive, muted, accent).

**State Management**: React Query (TanStack Query) for server state management, with local storage for client-side authentication state. No global state management library is used beyond React Query's cache.

**Routing**: wouter for lightweight client-side routing with protected routes that check authentication before rendering.

**Form Handling**: React Hook Form with Zod schema validation for type-safe form management and validation.

**Design System Choices**:
- Carbon Design System inspired for enterprise/military context
- IBM Plex Sans typography
- Hierarchical spacing using Tailwind's spacing scale (2, 4, 6, 8, 12, 16 units)
- Fixed 16rem sidebar width with 12-column grid layout
- Component padding ranges from p-4 to p-6
- Professional color scheme with subtle elevations

### Backend Architecture

**Framework**: Express.js running on Node.js with TypeScript, using ES modules.

**Data Storage**: Currently using JSON file-based storage (`data/database.json`) as the primary data store, with a storage interface abstraction that allows future migration to PostgreSQL. The codebase is structured to use Drizzle ORM with PostgreSQL, but currently operates in a flat-file mode.

**Authentication**: Simple header-based authentication using `x-user-id` header. Users authenticate via Discord ID lookup against the stored user database. Sessions are maintained client-side in localStorage.

**Authorization**: Role-based permissions system with four roles (Admin, General, Colonel, MP, Soldier) and granular permissions for each feature (manage_users, manage_duty, view_disciplinary, etc.). Military rank hierarchy is separate from system roles but influences access patterns.

**API Design**: RESTful API with endpoints organized by resource type (users, duty-logs, disciplinary-records, promotions, merit-points, missions, audit-logs). All mutations require authentication and authorization checks.

**Data Validation**: Zod schemas shared between frontend and backend (in `shared/schema.ts`) ensure type safety and validation consistency across the stack.

**Seed Data**: Initial database seeding creates admin, general, colonel, MP, and sample soldier accounts for development/testing.

### Data Models

**Users**: Core entity storing Discord/Roblox identifiers, personal information (name, rank, role, unit, callsign), status (active/inactive), merit points, and activity timestamps. Rank codes follow US Army hierarchy (enlisted, warrant, officer).

**Duty Logs**: Track on/off duty timestamps for personnel with automatic duration calculation. Links to user, stores location, and supports reporting by timeframe.

**Disciplinary Records**: MP-issued records with categories (minor, moderate, severe), reason, evidence links, status tracking (active, appealed, closed), and appeal workflow.

**Promotions**: Track rank changes with old/new rank, approver, reason, and timestamps. Enforces valid rank progression rules.

**Merit Point Transactions**: Credit/debit system for rewarding performance with full audit trail (amount, reason, awarded by, timestamp).

**Missions**: Mission reports with code, title, description, outcome (success/partial/failed), participants, merit points awarded, and duration.

**Units**: Organizational structure for grouping personnel (not fully implemented in current codebase).

**Audit Logs**: System-wide activity logging for all critical operations (user actions, entity/field/old value/new value).

### Permission Model

**Roles**:
- Admin: Full system access, user creation, all features
- General: Manage promotions, view all data, approve requests
- Colonel: MP permissions + limited admin functions
- MP (Military Police): Manage disciplinary records
- Soldier: View own records only

**Permission Hierarchy**: Permissions cascade (General has Colonel permissions, Colonel has MP permissions). Rank influences some permissions (e.g., colonels get MP access automatically).

## External Dependencies

### Third-Party Services

**Discord**: Used for user authentication. Users log in with Discord ID, which is matched against stored user records. No OAuth flow is currently implemented—authentication is simplified to Discord ID lookup.

**Roblox**: User identifiers (roblox_user_id, roblox_username) are stored but not actively integrated. Intended for future game integration.

### Database

**Drizzle ORM**: Configured for PostgreSQL with migrations support (`drizzle.config.ts`), but currently the application uses a JSON file storage implementation. The schema is defined in `shared/schema.ts` and the storage interface in `server/storage.ts` is designed to be swappable.

**Neon Database**: Package dependency suggests intention to use Neon's serverless PostgreSQL, but not currently active.

**PostgreSQL**: Target database (not currently used; JSON file storage is active).

### Key NPM Packages

**Frontend**:
- React 18 with React DOM
- TanStack React Query for data fetching
- wouter for routing
- React Hook Form + Zod for forms
- Radix UI primitives (35+ component packages)
- Tailwind CSS + class-variance-authority for styling
- date-fns and dayjs for date manipulation
- shadcn/ui component library

**Backend**:
- Express.js web server
- Drizzle ORM (configured but not actively used)
- connect-pg-simple for session management
- Zod for validation
- nanoid for ID generation

**Build Tools**:
- Vite for frontend bundling
- esbuild for backend bundling
- TypeScript compiler
- Tailwind CSS + PostCSS
- Replit-specific plugins (runtime error overlay, cartographer, dev banner)

### Design Assets

**Fonts**: IBM Plex Sans, DM Sans, Fira Code, Geist Mono (loaded via Google Fonts CDN in index.html)

**Icons**: Lucide React icon library used throughout the application

### Configuration Notes

- Environment variable `DATABASE_URL` is required but currently unused (prepared for PostgreSQL migration)
- TypeScript configured for strict mode with ES modules
- Path aliases configured: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`
- Build outputs to `dist/` directory