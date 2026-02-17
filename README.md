# Event Goods Rental Website

Full-stack MVP for renting event goods (canopies, chairs, tables, etc.) with customer and admin workflows.

## Tech Stack

- Frontend: React (Vite), React Router, Tailwind CSS
- Backend: Node.js, Express, MongoDB (Mongoose), JWT
- Payments: Stripe payment intent endpoint (with mock fallback if Stripe key not configured)

## Project Structure

- `client/`: Customer + Admin frontend
- `server/`: API, auth, inventory, bookings, finance

## Quick Start

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend default URL: `http://localhost:5173`  
Backend default URL: `http://localhost:5000`

## Environment Variables

### `server/.env`

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `STRIPE_SECRET_KEY`
- `CLIENT_URL`

### `client/.env`

- `VITE_API_URL`

## Key Features Implemented

### Customer Experience

- Home page with hero CTA, search bar, featured items, and footer links
- Catalog page with filter sidebar (item type, price range, availability)
- Product cards with lazy-loaded images, hover states, and add-to-cart
- Item details modal with specs, reviews summary, and availability calendar
- Cart and 3-step checkout UX (review, delivery/pickup, payment)
- Confirmation page with unique order ID
- User dashboard with upcoming orders and order history

### Admin Experience

- Admin login page (JWT-based auth from backend)
- Inventory summary cards (total stock, rented, pending repairs)
- Booking management list
- Customer management list with spending info
- Finance dashboard with revenue, paid bookings, and top items

### Backend APIs

- Auth: register, login, me
- Items: list/filter, availability, admin create/update/disable
- Bookings: payment intent, create booking, my bookings
- Admin: inventory summary, bookings list/update, customers, notifications
- Finance: dashboard metrics, invoice payload per booking

## Notes

- Stripe endpoint returns a mock client secret when `STRIPE_SECRET_KEY` is missing.
- To access admin pages, log in with a user whose role is `admin` in MongoDB.
- This is an MVP scaffold intended to match the provided roadmap and can be extended with media upload (S3), richer review models, and production payment/webhook handling.
