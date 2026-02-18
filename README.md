# Occasia — Event Rentals & Catering Platform

Full-stack web application for renting event items (marquees, canopies, stage setups, lighting, floral designs) and catering services. Built with React + Express + MongoDB.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 3.4 |
| Backend | Node.js, Express 4, Mongoose 8, JWT |
| Payments | PayHere Payment Gateway (LKR) |
| Auth | Email/password + Google OAuth (GSI SDK) |
| Database | MongoDB (with in-memory fallback via mongodb-memory-server) |

## Project Structure

```
client/          → React frontend (Vite)
  src/
    components/  → Reusable UI (Navbar, Footer, ItemCard, ItemModal, etc.)
    contexts/    → AuthContext, CartContext
    pages/       → HomePage, CatalogPage, CartCheckoutPage, DashboardPage, etc.
    services/    → API client (Axios)
server/          → Express API
  src/
    config/      → Database connection
    middleware/   → Auth, error handler
    models/      → User, Item, Booking, Review, Wishlist, PromoCode, Notification
    routes/      → Auth, items, bookings, admin, payments, wishlist, promos, finance
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (optional — falls back to in-memory MongoDB automatically)

### 1) Backend

```bash
cd server
npm install
cp .env.example .env   # Edit with your credentials
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173` — Backend: `http://localhost:5000`

### Default Seed Accounts

When the database is empty, it auto-seeds with sample data:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@occasia.com | admin123 |
| Customer | jane@example.com | customer123 |

## Environment Variables

### `server/.env`

| Variable | Description |
|----------|------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |
| `CLIENT_URL` | Frontend URL for CORS |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `PAYHERE_MERCHANT_ID` | PayHere merchant ID |
| `PAYHERE_MERCHANT_SECRET` | PayHere merchant secret |

### `client/.env`

| Variable | Description |
|----------|------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_PAYHERE_SANDBOX` | `true` for sandbox mode |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

## Features

### Customer Experience
- Hero landing page with search, featured items, testimonials, and newsletter
- Catalog with filtering (category, price range, availability) and search
- Item detail modal with image gallery, fullscreen zoom, tabs (details/availability/reviews)
- Wishlist with heart toggle on every item card
- Cart with quantity controls, remove button, and promo code validation
- 3-step checkout (cart → details → PayHere payment) with date validation
- Order confirmation page
- User dashboard with profile editing, upcoming & past orders
- Google Sign-In + email/password login with password strength meter
- Account lockout after 5 failed login attempts (15-min cooldown)

### Admin Experience
- Admin dashboard with inventory, revenue, booking, and customer management
- Booking status & tracking updates
- Promo code creation, toggle, delete
- Finance metrics with top-performing items

### Technical Highlights
- JWT access tokens (1h) + refresh tokens (7d) with silent rotation
- PayHere payment gateway with server-side hash verification
- Scroll-to-top on route change + floating back-to-top button
- React Error Boundary for crash recovery
- Loading skeletons on homepage
- Responsive design with mobile hamburger menu
- CORS configured for multiple dev ports

## License

MIT
