# Design Guidelines: Illinois National Guard RP Management System

## Design Approach

**Selected System:** Carbon Design System (IBM)

**Rationale:** This military roleplay management system is a data-heavy, enterprise-grade application requiring robust information architecture, complex data tables, multi-step workflows, and role-based interfaces. Carbon Design excels at structured content presentation, form design, and hierarchical data visualization—perfect for managing personnel records, duty logs, disciplinary records, and promotion workflows.

**Key Principles:**
- Clarity and precision in data presentation
- Hierarchical information architecture reflecting military structure
- Efficient workflows for frequent tasks (duty on/off, record creation)
- Professional, authoritative aesthetic appropriate for military context

## Typography

**Font Family:** IBM Plex Sans (via Google Fonts CDN)

**Type Scale:**
- Display (Page Titles): text-4xl (36px), font-semibold
- Heading 1 (Section Headers): text-2xl (24px), font-semibold
- Heading 2 (Subsections): text-xl (20px), font-medium
- Heading 3 (Card Titles): text-lg (18px), font-medium
- Body (Primary Text): text-base (16px), font-normal
- Caption (Metadata, Labels): text-sm (14px), font-normal
- Helper Text: text-xs (12px), font-normal

**Hierarchy Application:**
- User names/callsigns: font-semibold
- Rank designations: font-medium, uppercase tracking-wide
- Status indicators: font-medium, text-sm
- Timestamps: text-xs, regular weight

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16

**Common Patterns:**
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-12
- Card gaps: gap-4 to gap-6
- Form field spacing: space-y-4
- Table cell padding: px-4 py-3

**Grid Structure:**
- Dashboard: 12-column grid with gap-6
- Sidebar navigation: Fixed 16rem (w-64) width
- Main content area: Remaining space with max-w-7xl container
- Form layouts: max-w-2xl for single-column forms, grid-cols-2 for side-by-side fields

**Responsive Breakpoints:**
- Mobile: Single column, collapsible sidebar
- Tablet (md:): 2-column grids for cards, expandable sidebar
- Desktop (lg:): Full multi-column layouts, persistent sidebar

## Component Library

### Navigation & Layout

**Top Navigation Bar:**
- Fixed height h-16
- Contains: Logo/unit insignia (left), user profile dropdown with rank badge (right)
- Search bar (center) for quick personnel lookup
- Notification bell icon with badge counter

**Sidebar Navigation:**
- Persistent left sidebar (w-64)
- Collapsible on mobile with hamburger menu
- Grouped navigation items with icons (Heroicons)
- Active state: Subtle background treatment
- Role-based menu items (conditional rendering based on permissions)

**Breadcrumbs:**
- Below top nav in main content area
- text-sm with chevron separators
- Links to parent pages in hierarchy

### Dashboard Components

**Stats Cards (for overview):**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each card: p-6, rounded-lg border
- Layout: Icon (top-left), Metric value (large, bold), Label (small, below), Trend indicator (optional)

**Activity Feed:**
- List layout with alternating items
- Each item: Avatar/icon, Action description, Timestamp, Status badge
- Infinite scroll or pagination

**Quick Actions Panel:**
- Prominent placement on dashboard
- Button group for frequent tasks: "Start Duty", "End Duty", "Submit Report"
- Large touch targets (h-12 to h-14)

### Data Display

**Tables:**
- Striped rows for readability
- Fixed header with sticky positioning
- Row actions (dropdown menu on right)
- Sortable columns with icon indicators
- Pagination footer (10/25/50/100 items per page)
- Empty state illustrations with helpful text
- Cell padding: px-4 py-3

**Data Grid (for personnel roster):**
- Avatar/rank badge column (fixed width)
- Name/callsign (expandable)
- Unit/assignment
- Status badge (Active/Inactive)
- Last activity timestamp
- Actions column

**Timeline View (for promotion history, duty logs):**
- Vertical timeline with connector line
- Event nodes with icons
- Date/time on left, content on right
- Expandable details for each entry

### Forms & Input

**Form Layout:**
- Single-column max-w-2xl for focused entry
- Two-column grid-cols-2 gap-4 for related fields
- Label above input, helper text below
- Required field indicator (asterisk)

**Input Fields:**
- Height: h-10 to h-12
- Padding: px-3
- Border radius: rounded-md
- Focus state: Ring outline
- Error state: Border treatment with error message below

**Select Dropdowns:**
- Chevron icon on right
- Search functionality for long lists (ranks, units)
- Multi-select with chips for tagging

**Date/Time Pickers:**
- Calendar popup for date selection
- Time picker with AM/PM toggle
- Timezone indicator where relevant

**Rich Text Editor (for mission reports, disciplinary notes):**
- Toolbar with basic formatting (bold, italic, lists, links)
- Character/word count
- Attachment upload zone

### Status & Feedback

**Badges:**
- Rounded-full px-3 py-1 text-xs font-medium
- Types: Active duty (green treatment), Offline (gray), Warning (yellow), Disciplinary (red)
- Positioned inline with text or in table cells

**Progress Indicators:**
- Merit points progress bar (toward next rank requirement)
- Service time completion bars
- Height: h-2, rounded-full

**Toast Notifications:**
- Fixed position top-right
- Auto-dismiss after 5 seconds
- Types: Success, Error, Warning, Info
- Icon + message + close button

**Modal Dialogs:**
- Centered overlay with backdrop blur
- Max-width: max-w-lg for alerts, max-w-4xl for complex forms
- Header with title and close X
- Footer with action buttons (Cancel left, Primary action right)

### Cards & Panels

**Personnel Card:**
- Avatar with rank insignia overlay
- Name and callsign (prominent)
- Current assignment/unit
- Status badges
- Quick stats (duty hours, merit points)
- Action buttons or dropdown

**Disciplinary Record Card:**
- Header: Severity badge, Date issued
- Body: Violation description, Evidence links
- Footer: Issuer info, Status (active/appealed/closed)
- Expandable details section

**Mission Report Card:**
- Title and mission code
- Participants count with avatars
- Date/duration
- Outcome badge
- Merit points awarded indicator

### Specialized Components

**Rank Hierarchy Visualizer:**
- Organizational chart style
- Three sections: Enlisted, Warrant Officers, Officers
- Visual progression with connecting lines
- Current user's rank highlighted
- Click to view personnel at each rank

**Duty Status Board:**
- Real-time grid of active personnel
- Filterable by unit/rank
- Duration counter for each active duty session
- Map view option (if Roblox location data available)

**Promotion Workflow Stepper:**
- Horizontal step indicator: Requirements → Review → Approval → Complete
- Current step highlighted
- Completed steps: Checkmark
- Requirement checklist with status icons

**Audit Log Viewer:**
- Filterable by action type, user, date range
- Expandable rows showing before/after values
- Export to CSV functionality
- Restricted to Admin/General roles

## Animations

**Minimal Use Only:**
- Page transitions: Simple fade (150ms)
- Modal entrance: Scale from 95% to 100% (200ms)
- Dropdown menus: Slide down (150ms)
- Loading states: Subtle pulse on skeleton loaders
- No hover animations on data tables
- No scroll-triggered effects

## Images

**No large hero images.** This is a data management application, not a marketing site.

**Where to use images:**
- Unit/battalion insignia (small, 48x48px) in navigation and headers
- User avatars (circular, 40x40px in lists, 80x80px in profiles)
- Rank badge icons (SVG, 24x24px inline with names)
- Empty state illustrations (centered, max 300px width, minimalist line art style)
- Evidence attachments (thumbnail previews in disciplinary records)

All imagery should be functional, not decorative. Prioritize clarity and rapid recognition over aesthetic appeal.