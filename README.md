# DineFlow

Restaurant table booking and meal pre-order platform, built with Next.js (App Router),
React, Tailwind CSS, Firebase Authentication and Cloud Firestore.

Three roles share one app:

| Role | Entry point | What they do |
| --- | --- | --- |
| Customer | `/user` | Browse approved restaurants, pick a table on the floor map, pre-order meals |
| Partner | `/partner` | Manage their restaurant: bookings, floor plan, menu, staff, stock, promotions |
| Admin | `/admin` | Approve partner restaurants, search users, manage platform staff |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase web config
npm run dev
```

Open <http://localhost:3000>.

## Firebase setup

1. Create a Firebase project and add a **Web app**; copy its config into `.env.local`
   (see `.env.example` for the variable names).
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
3. In **Authentication → Settings → Authorized domains**, add the domains you deploy to.
4. Deploy the database rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

### Security model — read this before deploying

The app is entirely client-rendered and talks to Firestore directly from the browser.
Every role check written in React is a convenience only: anyone can call the Firestore
REST API with their own token and skip the UI completely.

**`firestore.rules` is the real access control.** It enforces that:

- a user can only read and write their own profile, and cannot change their own `role`
  or `partner_status` (no self-promotion to admin);
- `approval_status` on a restaurant is admin-only, so a partner cannot approve itself;
- a booking is readable only by the guest who made it and the restaurant that received it;
- staff, stock, kitchen tickets and CRM notes are scoped to the owning restaurant;
- everything not explicitly matched is denied.

Granting the first admin is a deliberate manual step: open the Firebase console and set
`role: "admin"` on that user's document in the `profiles` collection. There is no master
key, no bypass password and no "email contains admin" shortcut in the code.

Email verification and password resets use Firebase's own email links. The app never
generates, stores or displays verification codes.

## Data model (Firestore collections)

| Collection | Key fields |
| --- | --- |
| `profiles` | doc id = uid, `role`, `partner_status` |
| `restaurants` | `owner_id`, `approval_status`, `name`, `city`, `stir` |
| `tables` | `restaurant_id`, `table_name`, `seats`, position/shape for the floor map |
| `menu_items`, `dishes` | `restaurant_id`, `name`, `price`, `category` |
| `bookings` | `customer_id`, `restaurant_id`, `booking_date`, `booking_time`, `status` |
| `staff`, `inventory`, `kitchen_orders`, `customers_crm`, `promotions` | `restaurant_id` |
| `platform_staff` | admin-managed platform employees |

Every restaurant-scoped document must carry `restaurant_id` — both the queries and the
security rules depend on it.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```
