export interface SkillItem {
  name: string;
  category: "backend" | "frontend" | "architecture" | "database";
  level: string;
  description: string;
  badge?: string;
}

export interface PanelDetail {
  id: "admin" | "chef" | "cashier" | "customer";
  name: string;
  roleTitle: string;
  route: string;
  summary: string;
  badge: string;
  screenshot: string;
  responsibilities: string[];
  keyFeatures: string[];
  techStack: string[];
  userFlow: string;
  screenshotCaption: string;
}

export interface GalleryImage {
  id: string;
  category: "admin" | "chef" | "cashier" | "customer" | "booking" | "auth" | "mobile" | "tablet";
  title: string;
  caption: string;
  detail: string;
  image: string;
  width: number;
  height: number;
  viewport: string;
}

export interface CaseStudyItem {
  id: string;
  title: string;
  category: string;
  problem: string;
  analysis: string;
  solution: string;
  verifiedImpact: string;
}

export interface MilestoneItem {
  step: string;
  title: string;
  focus: string;
  details: string[];
}

export const PORTFOLIO_DATA = {
  profile: {
    name: "Darshan Jalondhara",
    title: "Python Backend & Next.js Frontend Developer",
    email: "darshanjalondhara75@gmail.com",
    mobile: "8347950652",
    education: {
      institution: "Veer Narmad South Gujarat University",
      period: "01/2023 – 05/2026",
    },
    tagline:
      "Developer focused on building modern web applications with Python backend systems and Next.js frontend experiences.",
    overview:
      "Full-stack software developer with hands-on expertise building production-ready web applications using Python FastAPI on the backend and Next.js 16 (React 19) on the frontend. Architected and engineered GourmetOS — a multi-panel restaurant management and ordering system featuring real-time Server-Sent Events (SSE), atomic dining session tokenization, role-based access control across four operational panels (Admin, Chef, Cashier, Customer), two-stage inventory auditing, and an emerald liquid-glass design system with light and dark theme support.",
  },

  metrics: [
    { label: "Role-Based Panels", value: "4", note: "Admin, Chef, Cashier, Customer" },
    { label: "Backend API Modules", value: "14", note: "FastAPI REST & Event Routers" },
    { label: "Frontend App Views", value: "25+", note: "Next.js App Router Pages" },
    { label: "Order Lifecycle Stages", value: "7", note: "Pending through Completed" },
    { label: "Real-Time Sync", value: "SSE", note: "Authenticated Event Streams" },
    { label: "Theme Editions", value: "2", note: "Emerald Light & Dark Glass" },
  ],

  skills: [
    // Backend
    {
      name: "Python 3",
      category: "backend",
      level: "Core Language",
      description: "Structured async backend logic, business domain modeling, and service layer utilities.",
      badge: "Primary Backend",
    },
    {
      name: "FastAPI",
      category: "backend",
      level: "Framework",
      description: "High-performance async REST endpoints, dependency injection, CORS handling, and middleware.",
      badge: "Primary Framework",
    },
    {
      name: "Pydantic v2",
      category: "backend",
      level: "Data Validation",
      description: "Strict payload schemas, type coercion, field constraints, and JSON response models.",
    },
    {
      name: "PyJWT & Security",
      category: "backend",
      level: "Authentication",
      description: "Access token issuance (short-lived), refresh token rotation, and password hashing.",
    },
    {
      name: "Server-Sent Events (SSE)",
      category: "backend",
      level: "Real-Time",
      description: "In-process pub/sub event bus streaming live database updates to connected client terminals.",
    },
    {
      name: "Razorpay SDK",
      category: "backend",
      level: "Payment Gateway",
      description: "Server-side order creation, key management, and multi-currency (USD/INR) conversion.",
    },

    // Frontend
    {
      name: "Next.js 16",
      category: "frontend",
      level: "App Router",
      description: "Server & client components, layout hierarchies, dynamic route segments, and proxy routing.",
      badge: "Primary Frontend",
    },
    {
      name: "React 19",
      category: "frontend",
      level: "UI Library",
      description: "Custom hooks, Context API providers, optimistic status updates, and lifecycle management.",
    },
    {
      name: "TypeScript 5",
      category: "frontend",
      level: "Type Safety",
      description: "Strict domain interfaces, generic API fetchers, type guards, and error typing.",
    },
    {
      name: "Tailwind CSS 3.4",
      category: "frontend",
      level: "Styling",
      description: "Responsive utility classes, CSS grid, flex layouts, and custom design tokens.",
    },
    {
      name: "Lucide React",
      category: "frontend",
      level: "Iconography",
      description: "Modern SVG iconography tailored for restaurant stations, metrics, and navigation.",
    },

    // Architecture & Database
    {
      name: "MongoDB & Motor",
      category: "database",
      level: "Database",
      description: "Async document storage, compound index creation, and aggregation pipelines.",
      badge: "Primary Database",
    },
    {
      name: "Role-Based Access Control (RBAC)",
      category: "architecture",
      level: "Architecture",
      description: "Separation of concerns across Admin, Chef, Cashier, and Customer access tiers.",
    },
    {
      name: "Atomic Dining Session Tokenization",
      category: "architecture",
      level: "System Design",
      description: "Single-use cryptographically secure dining tokens preventing order duplication.",
    },
    {
      name: "Emerald Liquid-Glass Design System",
      category: "architecture",
      level: "UI/UX System",
      description: "Tailored color palettes, backdrop blurs, high-contrast light mode tokens, and dark mode.",
    },
  ] as SkillItem[],

  panels: [
    {
      id: "admin",
      name: "Admin Command Center",
      roleTitle: "Administrator Operational Workspace",
      route: "/admin/dashboard",
      badge: "Executive Oversight",
      screenshot: "/images/dashboard_screen.png",
      summary:
        "The central management hub enabling restaurant managers to oversee live revenue, shift assignments, table occupancy, inventory health, and audit approvals in real time.",
      responsibilities: [
        "Engineered dashboard KPI aggregations calculating total sales, order volume, and table utilization.",
        "Implemented role-based protected navigation and collapsible sidebar layout.",
        "Built inventory overview summaries identifying low-stock and out-of-stock items requiring replenishment.",
        "Developed staff shift roster management and daily operational sales reports.",
        "Constructed two-stage audit approval interface allowing managers to review physical stock variances.",
      ],
      keyFeatures: [
        "Live Revenue & Order Counters",
        "Staff Roster & Shift Schedules",
        "Table Layout & Capacity Monitor",
        "Inventory Requisitions & Audit Approval",
        "Popular Menu Items Analytics",
        "Role-Based User Account Management",
      ],
      techStack: ["Next.js 16", "FastAPI Aggregations", "MongoDB Motor", "Lucide React", "CSS Design Tokens"],
      userFlow: "Admin logs in -> Views live dashboard -> Reviews pending orders and tables -> Approves chef audit submissions -> Generates sales reports.",
      screenshotCaption: "Live revenue metrics, order activity, table occupancy, and inventory health in the administrator workspace.",
    },
    {
      id: "chef",
      name: "Chef Line & Kitchen Display",
      roleTitle: "Kitchen Display System (KDS)",
      route: "/chef/kitchen",
      badge: "Real-Time Station",
      screenshot: "/images/chef_screen.png",
      summary:
        "High-visibility kitchen operations terminal that organizes orders by status, tracks cooking timers, allows status transitions, and manages raw ingredient stock and audits.",
      responsibilities: [
        "Built state machine for ticket lifecycle: Pending -> Accepted -> Cooking/Preparing -> Ready.",
        "Integrated Server-Sent Events listener updating ticket queues instantaneously without page reloads.",
        "Engineered ticket cancellation dialog requiring mandatory chef explanation.",
        "Developed ingredient usage logging and physical stock audit submission interface.",
        "Created shared inventory panel operating in chef submission mode.",
      ],
      keyFeatures: [
        "Status-Grouped Ticket Pipeline",
        "Preparation Elapsed Timer",
        "Item Quantity & Special Note Callouts",
        "Kitchen Order Cancellation with Reason",
        "Raw Ingredient Usage Logging",
        "Chef Stock Audit Submission Form",
      ],
      techStack: ["React 19 Hooks", "Server-Sent Events", "FastAPI Endpoints", "Tailwind CSS", "Audit Schemas"],
      userFlow: "New ticket arrives via SSE -> Chef clicks Accept -> Moves ticket to Cooking -> Flags dish as Ready -> Logs ingredient consumption.",
      screenshotCaption: "Kitchen tickets grouped by preparation status with clear order details and live queue updates.",
    },
    {
      id: "cashier",
      name: "Cashier POS & Billing Terminal",
      roleTitle: "Front-of-House Point-of-Sale (POS)",
      route: "/cashier/tables",
      badge: "Billing & Settlement",
      screenshot: "/images/cashier_screen.png",
      summary:
        "Front-of-house terminal providing a floor layout view of all dining tables, itemized unpaid bills, multi-currency payment settlement, and thermal/web receipt printing.",
      responsibilities: [
        "Engineered live table occupancy visual floor grid (Available, Occupied, Reserved, Cleaning).",
        "Built unpaid bills filter allowing cashiers to review order breakdown by table number.",
        "Integrated multi-currency settlement handling both USD and INR using precise decimal calculations.",
        "Created printable receipt template with itemized costs, taxes, and payment confirmation.",
        "Implemented table release logic freeing tables back to Available immediately upon bill settlement.",
      ],
      keyFeatures: [
        "Color-Coded Dining Floor Grid",
        "Unpaid Bill Review & Itemization",
        "Cash, Card & Online Payment Settlement",
        "Formatted Printable Receipts",
        "Multi-Currency Support (USD / INR)",
        "Automatic Table Release on Payment",
      ],
      techStack: ["Next.js App Router", "Decimal Precision Utility", "FastAPI Payment APIs", "Print Styles"],
      userFlow: "Cashier opens table grid -> Selects occupied table -> Inspects unpaid bill -> Collects payment -> Generates receipt -> Releases table.",
      screenshotCaption: "Dining floor table availability and occupancy at a glance in the cashier workspace.",
    },
    {
      id: "customer",
      name: "Customer QR Dining & Booking",
      roleTitle: "Touchless Guest Ordering Experience",
      route: "/user/orders",
      badge: "Touchless Dining",
      screenshot: "/images/customer_dashboard.png",
      summary:
        "Frictionless guest dining interface supporting online table reservations, touchless QR-code menu browsing, dietary filtering, shopping cart custom notes, and live preparation tracking.",
      responsibilities: [
        "Developed table reservation engine allowing diners to reserve tables with party size and time slots.",
        "Built table QR scanning URL handler attaching one-time session tokens to prevent order duplicates.",
        "Engineered digital menu browsing with category sorting, search, and Veg/Non-Veg indicators.",
        "Created shopping cart with quantity controls, custom kitchen instructions, and total calculations.",
        "Implemented live order status tracking view with real-time progression indicator.",
      ],
      keyFeatures: [
        "Party-Size Table Reservation",
        "Touchless QR-Code Menu Mapping",
        "Dietary Filter Tags (Veg / Non-Veg)",
        "Dynamic Cart with Chef Notes",
        "One-Time Dining Session Tokenization",
        "Live Order Status Progression Bar",
      ],
      techStack: ["Next.js 16", "TypeScript 5", "FastAPI Session Handlers", "Real-Time Tracking", "Mobile First"],
      userFlow: "Guest books table or scans QR -> Browses digital menu -> Adds dishes with notes -> Places order -> Watches live order status update.",
      screenshotCaption: "Customer home page with order tracking and dedicated customer navigation.",
    },
  ] as PanelDetail[],

  features: [
    {
      title: "PyJWT Authentication & Security",
      desc: "Robust token authentication with short-lived access tokens, refresh token rotation, and bcrypt password hashing.",
      tag: "Security",
    },
    {
      title: "Granular Role-Based Access Control",
      desc: "Strict access control separating Admin, Chef, Cashier, and Customer capabilities across frontend and backend.",
      tag: "Architecture",
    },
    {
      title: "Touchless Table Booking & Reservation",
      desc: "Interactive table booking engine with party size validation, date/time scheduling, and automated reservation records.",
      tag: "Customer",
    },
    {
      title: "QR-Code Dining Session Tokenization",
      desc: "Table-specific QR mapping issuing one-time atomic session tokens to guarantee only one active order per dining cycle.",
      tag: "Innovation",
    },
    {
      title: "Digital Menu Catalog & Dietary Tags",
      desc: "Categorized menu browsing with instant keyword search, high-res dish photography, and Vegetarian/Non-Veg badges.",
      tag: "Menu",
    },
    {
      title: "Dynamic Shopping Cart & Custom Notes",
      desc: "Seamless cart drawer with increment/decrement counters, pricing subtotal, and custom kitchen preparation notes.",
      tag: "Ordering",
    },
    {
      title: "Real-Time Order Lifecycle Tracking",
      desc: "Live order tracking view for customers updating automatically via Server-Sent Events from Pending to Ready.",
      tag: "Real-Time",
    },
    {
      title: "Kitchen Display System (KDS)",
      desc: "Dedicated chef line board grouping tickets by stage, elapsed prep timers, and order cancellation with required reason.",
      tag: "Kitchen",
    },
    {
      title: "Cashier POS & Multi-Method Billing",
      desc: "Front-of-house point-of-sale terminal handling unpaid tickets, cash/card/online settlement, and instant table release.",
      tag: "Billing",
    },
    {
      title: "Printable Thermal & Web Receipts",
      desc: "Formatted receipt generation providing itemized breakdown, tax computation, table number, and payment status.",
      tag: "Receipts",
    },
    {
      title: "Ingredient Inventory & Stock Tracking",
      desc: "Raw supply tracking with measurement units (kg, liters, units), opening stock, minimum threshold alerts, and real-time levels.",
      tag: "Inventory",
    },
    {
      title: "Two-Tier Stock Auditing & Admin Approval",
      desc: "Physical audit workflow where chefs submit counted quantities and administrators review computed variances before balance adjustment.",
      tag: "Audit",
    },
    {
      title: "Usage & Purchase Procurement Logs",
      desc: "Detailed audit trail logging daily kitchen consumption against incoming vendor purchase invoices and costs.",
      tag: "Logs",
    },
    {
      title: "Staff Shift Roster & Daily Scheduling",
      desc: "Staff shift management allowing administrators to schedule, monitor active shifts, and track duty hours.",
      tag: "Operations",
    },
    {
      title: "Server-Sent Events (SSE) Synchronization",
      desc: "Authenticated event streaming updating Admin, Chef, Cashier, and Customer screens simultaneously without polling.",
      tag: "Real-Time",
    },
    {
      title: "Dual Emerald Liquid-Glass Theme System",
      desc: "Crafted CSS design tokens supporting emerald light and dark themes with WCAG-compliant high-contrast visibility.",
      tag: "UI/UX",
    },
  ],

  caseStudies: [
    {
      id: "responsive",
      title: "Multi-Device Responsive Layout Architecture",
      category: "Frontend & Layout",
      problem:
        "The restaurant system comprises complex data tables, live order pipelines, and extensive inventory tables that caused severe horizontal overflow, truncated headers, and inaccessible dialog buttons on 320px–390px mobile screens.",
      analysis:
        "Traditional HTML tables with 7+ columns cannot fit mobile screens without horizontal dragging, which breaks touch workflows for busy kitchen and cashier staff.",
      solution:
        "Engineered a fluid `.app-shell` architecture utilizing CSS custom properties (`--app-gutter-x`, `--app-gutter-y`), responsive grid/flex fallbacks, card-based alternative layouts on viewport widths < 768px, and touch-friendly collapsible drawers.",
      verifiedImpact:
        "Clean, zero-overflow experience tested across 320px, 375px, 390px, 768px, 1024px, 1280px, and 1440px viewports with 100% accessible touch targets.",
    },
    {
      id: "theme-contrast",
      title: "Light Mode High-Contrast Token System & Input Readability",
      category: "UI/UX & Accessibility",
      problem:
        "Applying liquid-glass aesthetics directly across light and dark modes resulted in washed-out input fields, low-contrast text, and unreadable form borders under bright ambient lighting.",
      analysis:
        "Semi-transparent glass surfaces that appear crisp on dark backgrounds fail WCAG contrast guidelines on light backgrounds due to background color bleed.",
      solution:
        "Formulated a semantic CSS token system in `globals.css` with dedicated surface variables (`--bg-main: #F5F7FA`, `--bg-card: #FFFFFF`, `--border-light: #E2E8F0`, `--text-primary: #172033`), substituting transparent backdrops with solid high-contrast surfaces for dialogs and form controls in light mode.",
      verifiedImpact:
        "Crystal clear form inputs, visible error messages, and verified high contrast verified across login, inventory forms, and checkout screens.",
    },
    {
      id: "nav-persistence",
      title: "Navigation State & Active Indicator Persistence",
      category: "Frontend State Management",
      problem:
        "Navigating between sub-panels or refreshing the browser frequently caused the active navigation indicator to reset to default or flash briefly before resolving.",
      analysis:
        "Client-side navigation states kept only in transient component memory desynchronize with browser URL changes and history traversal.",
      solution:
        "Coupled the active navigation indicator directly with Next.js `usePathname()` hook and window hash listeners, with a smooth fallback intersection observer tracking page scroll anchors.",
      verifiedImpact:
        "Instantaneous, rock-solid active navigation indicators that remain accurate after hard refresh, direct link entry, and deep-link scrolling.",
    },
    {
      id: "session-security",
      title: "Atomic Dining Session Tokenization & Duplicate Order Prevention",
      category: "Backend & Concurrency",
      problem:
        "When guests scanned a table QR code or refreshed the menu page, concurrent requests risked creating duplicate orders or attaching orders to expired sessions.",
      analysis:
        "Stateless QR URLs without atomic server-side session consumption allow multiple clients or browser reloads to submit overlapping order payloads.",
      solution:
        "Engineered server-side dining sessions in FastAPI with atomic token invalidation via MongoDB Motor's `find_one_and_update`, ensuring each dining session token can only be consumed once when the order is officially placed.",
      verifiedImpact:
        "Guaranteed 1:1 mapping between dining session and placed order, preventing duplicate kitchen tickets and eliminating stale session pollution.",
    },
    {
      id: "realtime-sync",
      title: "Low-Latency Multi-Terminal Event Synchronization via SSE",
      category: "Real-Time Systems",
      problem:
        "Synchronizing four separate terminals (Customer menu, Kitchen display, Cashier POS, Admin command center) using HTTP polling generated excessive server overhead and introduced notification lag.",
      analysis:
        "Interval polling every 2-3 seconds creates high server request volume and database read pressure, while WebSocket connections introduce bidirectional handshake complexity.",
      solution:
        "Implemented an authenticated Server-Sent Events (SSE) streaming endpoint (`/api/realtime/events`) with automatic exponential backoff reconnection, JWT token refresh before reconnection, and targeted category subscriptions (`orders`, `tables`, `bookings`).",
      verifiedImpact:
        "Sub-second order dispatch from diner to chef, instantaneous cashier table status updates, and reduced backend CPU and query load.",
    },
    {
      id: "stock-audit",
      title: "Two-Tier Inventory Variance & Physical Audit Reconciliation",
      category: "Business Logic & Inventory",
      problem:
        "Discrepancies naturally arise between theoretical ingredient deductions from orders and actual physical kitchen inventory due to spoilage, preparation waste, or portion variations.",
      analysis:
        "Permitting line chefs to unilaterally overwrite database stock quantities compromises accountability, while requiring admins to count stock manually in the kitchen is unfeasible.",
      solution:
        "Designed a two-tier auditing workflow: line chefs perform and submit physical stock counts via `/chef/inventory`; the system automatically computes variances against theoretical opening stock minus consumption; admins review and authorize adjustments in `/admin/inventory`.",
      verifiedImpact:
        "Accurate, tamper-proof inventory ledgers, clear audit trails with timestamps, and automated low-stock procurement requisitions.",
    },
  ] as CaseStudyItem[],

  journey: [
    {
      step: "01",
      title: "Planning & Workflow Mapping",
      focus: "Requirements & System Boundaries",
      details: [
        "Mapped the end-to-end restaurant lifecycle: table reservation, QR ordering, kitchen prep, cashier billing, and inventory tracking.",
        "Defined data schemas, entity relationships, and operational boundaries for four distinct user roles.",
      ],
    },
    {
      step: "02",
      title: "UI Architecture & Design Tokens",
      focus: "Emerald Liquid-Glass System",
      details: [
        "Crafted a cohesive visual identity featuring emerald accents, glassmorphic cards, and custom CSS variables.",
        "Built semantic design tokens ensuring seamless light and dark mode switching with WCAG contrast compliance.",
      ],
    },
    {
      step: "03",
      title: "Authentication & Security",
      focus: "PyJWT & Route Protection",
      details: [
        "Implemented FastAPI JWT authentication issuing short-lived access tokens and persistent refresh tokens.",
        "Integrated client-side automatic token refresh middleware in Next.js with graceful session recovery.",
      ],
    },
    {
      step: "04",
      title: "Role-Based Panels Architecture",
      focus: "RBAC & App Layouts",
      details: [
        "Built segregated workspaces: Admin Command Center, Chef Kitchen Display, Cashier POS, and Customer Dining.",
        "Implemented route guards, role redirection handlers, and unified AppShell sidebar navigation.",
      ],
    },
    {
      step: "05",
      title: "Digital Menu & Shopping Cart",
      focus: "Interactive Catalog",
      details: [
        "Developed categorized menu browsing with category pills, instant keyword search, and Veg/Non-Veg badges.",
        "Created an interactive cart drawer with quantity adjustments, custom chef instructions, and subtotal calculation.",
      ],
    },
    {
      step: "06",
      title: "Table Booking & QR Engine",
      focus: "Touchless Dining Integration",
      details: [
        "Engineered table reservation engine with party size validation and live status updates.",
        "Generated table-specific QR endpoints with atomic dining session tokens preventing order reuse.",
      ],
    },
    {
      step: "07",
      title: "Chef Workflow & Kitchen Display",
      focus: "Real-Time KDS Station",
      details: [
        "Constructed a status-driven ticket board: Pending, Accepted, Cooking/Preparing, and Ready.",
        "Added elapsed preparation timers and mandatory cancellation prompts for kitchen transparency.",
      ],
    },
    {
      step: "08",
      title: "Cashier Workflow & POS Billing",
      focus: "Order Settlement & Receipts",
      details: [
        "Built visual floor table occupancy grid (Available, Occupied, Reserved, Cleaning).",
        "Implemented multi-payment handling (Cash, Card, Razorpay), multi-currency logic, and printable receipts.",
      ],
    },
    {
      step: "09",
      title: "Inventory & Stock Audit Workflow",
      focus: "Two-Tier Stock Reconciliation",
      details: [
        "Engineered ingredient tracking with unit metrics, minimum threshold alerts, and usage logging.",
        "Created a two-stage audit system: chef physical count submission and admin variance approval.",
      ],
    },
    {
      step: "10",
      title: "Responsive Design & Mobile Optimization",
      focus: "Fluid Multi-Device Layouts",
      details: [
        "Refined UI layouts across 320px, 375px, 768px, 1024px, and 1440px viewports without horizontal overflow.",
        "Replaced wide tables with adaptive card layouts and built touch-optimized navigation drawers.",
      ],
    },
    {
      step: "11",
      title: "Theme System Polish",
      focus: "High-Contrast Light & Dark Modes",
      details: [
        "Resolved light mode input and text washout issues with solid background tokens for dialogs and form elements.",
        "Verified error dialogs, badges, and dropdowns across both themes.",
      ],
    },
    {
      step: "12",
      title: "Real-Time SSE Synchronization & Polish",
      focus: "Performance, Accessibility & Verification",
      details: [
        "Integrated authenticated Server-Sent Events (SSE) stream for live updates across all panels without polling.",
        "Verified semantic HTML, keyboard focus states, prefers-reduced-motion support, and production stability.",
      ],
    },
  ] as MilestoneItem[],
};

/**
 * Complete categorized screenshot gallery for the Project Showcase section.
 * Every capture is mapped to its exact product category with detail-wise
 * titles, captions, and viewport metadata.
 */
export const PROJECT_GALLERY: GalleryImage[] = [
  // ─── Admin Panel ────────────────────────────────────────────────
  {
    id: "admin-dashboard",
    category: "admin",
    title: "Admin Command Center Dashboard",
    caption: "Live executive analytics: revenue counters, order volume, table occupancy, shift roster, and low-stock alerts.",
    detail:
      "Primary administrator workspace rendered at full desktop width — KPI aggregation cards, live order stream, table utilization monitor, and inventory health sidebar, all refreshed in real time over Server-Sent Events.",
    image: "/images/dashboard_screen.png",
    width: 2160,
    height: 1350,
    viewport: "2160×1350 · 16:10 Desktop",
  },
  // ─── Chef Kitchen ───────────────────────────────────────────────
  {
    id: "chef-kds",
    category: "chef",
    title: "Chef Kitchen Display System (KDS)",
    caption: "Status-grouped ticket pipeline with elapsed prep timers, item callouts, and ingredient usage logging.",
    detail:
      "High-visibility kitchen terminal grouping tickets by Pending, Accepted, Cooking, and Ready stages. Tickets arrive instantly via SSE, each carrying quantity, special notes, and a mandatory-reason cancellation dialog.",
    image: "/images/chef_screen.png",
    width: 2160,
    height: 1350,
    viewport: "2160×1350 · 16:10 Desktop",
  },

  // ─── Cashier POS ────────────────────────────────────────────────
  {
    id: "cashier-pos",
    category: "cashier",
    title: "Cashier POS & Billing Terminal",
    caption: "Color-coded dining floor grid with unpaid bill review and multi-currency settlement.",
    detail:
      "Front-of-house terminal showing Available / Occupied / Reserved / Cleaning table states, itemized unpaid bills per table, and Cash / Card / Razorpay settlement with precise USD & INR decimal handling.",
    image: "/images/cashier_screen.png",
    width: 2160,
    height: 1350,
    viewport: "2160×1350 · 16:10 Desktop",
  },

  // ─── Booking & QR Engine ────────────────────────────────────────
  {
    id: "booking-engine",
    category: "booking",
    title: "Touchless Table Reservation Engine",
    caption: "Patron booking workflow with capacity calculation, time scheduling, and dynamic session token generation.",
    detail:
      "Reservation flow capturing guest name, party size, and arrival slot while validating against per-table capacity. On confirmation the table transitions to Reserved and the record broadcasts to every panel instantly.",
    image: "/images/booking_screen.png",
    width: 2160,
    height: 1350,
    viewport: "2160×1350 · 16:10 Desktop",
  },
  // ─── Security & Auth ────────────────────────────────────────────
  {
    id: "auth-portal",
    category: "auth",
    title: "Dual-Theme Authentication Portal",
    caption: "PyJWT login interface with role-based routing (Admin, Chef, Cashier, User) and emerald liquid-glass styling.",
    detail:
      "Secure entry point issuing short-lived access tokens with automatic refresh-token rotation, bcrypt-hashed credentials, and per-role redirect handling into the four protected workspaces.",
    image: "/images/login_screen.png",
    width: 2160,
    height: 1350,
    viewport: "2160×1350 · 16:10 Desktop",
  },
  {
    id: "auth-error-dark",
    category: "auth",
    title: "Auth Error Handling — Dark Theme",
    caption: "Verified invalid-credential feedback with accessible error messaging.",
    detail:
      "Dark theme verification of authentication failure states: a clear error banner, preserved form state, and a keyboard-accessible retry path — no layout shift on failed submissions.",
    image: "/images/login_error_verified.png",
    width: 1262,
    height: 704,
    viewport: "1262×704 · Desktop",
  },
  {
    id: "auth-error-light",
    category: "auth",
    title: "Auth Error Handling — Light Theme",
    caption: "High-contrast light-mode error states meeting WCAG readability.",
    detail:
      "Light theme verification confirming error text, input borders, and focus rings remain crisp under bright ambient lighting via the solid high-contrast token system.",
    image: "/images/login_error_light_verified.png",
    width: 1262,
    height: 704,
    viewport: "1262×704 · Desktop",
  },

  // ─── Mobile ─────────────────────────────────────────────────────
  {
    id: "mobile-menu",
    category: "mobile",
    title: "Mobile Ordering Experience",
    caption: "Verified 390px layout with touch-friendly controls, fluid grids, and accessible actions.",
    detail:
      "Guest menu on a real 375×812 viewport: single-column stacked layout, floating cart drawer, sticky action buttons, and zero horizontal overflow on touch devices.",
    image: "/images/mobile_menu_screen.png",
    width: 585,
    height: 1266,
    viewport: "585×1266 · Mobile Portrait",
  },

  // ─── Tablet ─────────────────────────────────────────────────────
  {
    id: "tablet-layout",
    category: "tablet",
    title: "Tablet & iPad Layout",
    caption: "Dual-column adaptive cards with touch-optimized dialogs and gestural navigation.",
    detail:
      "768px–1152px tablet layout with a compact header bar, slide-in drawer, contained modal scrolling, and adaptive cards that replace rigid multi-column tables.",
    image: "/images/tablet_screen.png",
    width: 1152,
    height: 1536,
    viewport: "1152×1536 · Tablet Portrait",
  },
];
