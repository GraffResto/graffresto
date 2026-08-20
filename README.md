# 🍷 DineFlow — Next-Gen 3D Spatial Digital Twin & Restaurant Booking Ecosystem

![DineFlow Banner](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop)

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

> **Live Production URL:** [https://dineflow-ruby.vercel.app/](https://dineflow-ruby.vercel.app/)

**DineFlow** is an enterprise-grade spatial commerce and table reservation platform. It transforms standard smartphone video sweeps, 360° panoramic photos, or external virtual tour embeds (TeliportMe, Kuula, Matterport, Google Maps) into interactive **3D Digital Twins**. Guests can explore physical dining environments, inspect precise table locations, view real-time seating availability, and execute atomic reservations with pre-ordered meals.

---

## 🌟 Key Features & Ecosystem Highlights

### 1. 🌐 360° Spatial Digital Twin & 3D WebGL Engine
- **Inside-Out Spherical Panorama Projection:** Driven by React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), and Three.js.
- **Universal Media Engine:** Supports HTML5 Video Textures (`.mp4`, `.mov`, `.webm`), 360° Equirectangular Images (`.jpg`, `.png`), and GLB/GLTF 3D mesh assets.
- **Universal Embed Ingestion:** Integrates direct 360° virtual tour share links from **TeliportMe**, **Kuula**, **Matterport**, **CloudPano**, and **Google Street View**.
- **Cartesian 3D Hotspot Overlays:** Dynamic radar rings with live status indicators (**Emerald `#10B981`** Available, **Rose `#EF4444`** Occupied, **Amber `#F59E0B`** Pending) triggering atomic reservation modals.

### 2. 👥 Multi-Role Enterprise Portals
- **Guest / Customer Panel (`/user`):** Explore approved restaurants, navigate interactive 3D digital twins, select specific table nodes, pre-order menu items, and track live booking status.
- **Partner / Restaurant Panel (`/partner`):** Comprehensive ERP dashboard featuring 2D/3D Floor Plan Mapper, Table Status Controller, Real-time Order KDS (Kitchen Display System), Menu Management, Inventory & Stock Tracking, CRM & Guest Notes, Staff Roster, Financial Analytics, and Promotions.
- **Platform Admin Panel (`/admin`):** Review pending partner restaurant registrations, manage STIR/tax verification, audit platform staff, and toggle approval statuses.

### 3. 🌐 Native Multi-Language Localization (UZ / RU / EN)
- Instant context-aware language switching across all pages and modals supporting **O'zbekcha**, **Русский**, and **English**.

---

## 📐 System Architecture & Module Map

```
DineFlow Ecosystem Architecture
 ├── Public Landing Page (/)
 ├── 360° Spatial Portal (/spatial/upload)
 ├── Authentication (/login, /register/customer, /register/partner)
 ├── Customer Portal (/user)
 │    ├── Explorer & Search (/user/explore)
 │    ├── Restaurant Detail & 3D Twin (/user/restaurants/[id])
 │    └── Booking History (/user/bookings)
 ├── Partner ERP Panel (/partner)
 │    ├── 2D/3D Floor Plan Mapper (/partner/floor-plan)
 │    ├── Kitchen Display KDS (/partner/kitchen)
 │    ├── Menu & Dishes Editor (/partner/menu)
 │    ├── CRM & Guest Notes (/partner/crm)
 │    ├── Finance & Inventory (/partner/finance, /partner/inventory)
 │    └── Staff & Settings (/partner/staff, /partner/settings)
 └── Platform Admin Panel (/admin)
      ├── Partner Approvals (/admin/partners)
      └── System User Management (/admin)
```

---

## 🔒 Security Model & Zero-Trust Access Control

DineFlow enforces a zero-trust client security architecture. Role checks in React UI components are for user convenience, while **Cloud Firestore Security Rules (`firestore.rules`)** serve as the strict authorization boundary:

- **Self-Promotion Guard:** Users cannot alter their own `role` or `partner_status` fields.
- **Admin-Only Approval:** `approval_status` on restaurants can strictly be updated by platform administrators.
- **Tenant Isolation:** Restaurant-scoped collections (`tables`, `menu_items`, `bookings`, `inventory`, `staff`, `kitchen_orders`) are strictly scoped via `restaurant_id`.
- **Atomic Locking:** Reservation table locks are verified and executed with time-bound concurrency protection via `/api/reservations/atomic-lock`.

---

## 🗄 Data Schema (Firestore Collections)

| Collection | Description | Key Fields |
| --- | --- | --- |
| `profiles` | User Account Profiles | `uid`, `email`, `full_name`, `role` (`customer` \| `partner` \| `admin`), `phone` |
| `restaurants` | Partner Restaurants | `owner_id`, `name`, `city`, `approval_status`, `spatial_model_url`, `is_3d_enabled` |
| `tables` | Spatial & 2D Floor Tables | `restaurant_id`, `table_name`, `seats`, `x_pos`, `y_pos`, `z_pos`, `status` |
| `menu_items` | Dishes & Drinks Menu | `restaurant_id`, `name`, `category`, `price`, `image_url` |
| `bookings` | Table Reservations | `customer_id`, `restaurant_id`, `table_id`, `booking_date`, `booking_time`, `status` |
| `kitchen_orders` | Real-time KDS Tickets | `restaurant_id`, `booking_id`, `items`, `status` (`pending` \| `cooking` \| `served`) |

---

## 🛠 Local Setup & Installation

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GraffResto/graffresto.git
   cd graffresto
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📜 Available NPM Scripts

- `npm run dev` — Starts Next.js Turbopack development server.
- `npm run build` — Generates optimized production build.
- `npm run start` — Serves production build locally.
- `npm run lint` — Runs ESLint code quality audits.
- `npm run make-admin` — Script to set initial admin privileges in Firestore.

---

## 📄 License & Ownership

Developed with ❤️ for **DineFlow Platform**. All rights reserved.
