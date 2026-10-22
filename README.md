# Bloom Bar and Restaurant   Café Plc Stock — Hotel Stock Management System

A full-stack stock/inventory management system for a hotel, built with **React (Vite + Tailwind)** on the frontend and **Node.js/Express + MongoDB** on the backend.

## Features

- **Role-based login** — Admin, Manager, Store Keeper (JWT authentication)
- **Suppliers** — add, edit, and search supplier records
- **Raw materials** — track every item in the store with unit, reorder level, and cost
- **Purchases** — record purchases from suppliers; receiving a purchase automatically increases stock
- **Stock movements** — record stock in/out (kitchen use, housekeeping use, damage, returns, adjustments) with automatic stock level updates
- **Dashboard** — attractive overview with stat cards, a 7-day stock movement chart, low-stock alerts, and recent activity
- **Reports** — daily report, current stock levels, and purchase history (with print support)
- **Staff accounts** — admins can create and disable staff logins

## Project structure

```
hotel-stock-system/
├── server/      Node.js + Express + MongoDB API
└── client/      React (Vite) + Tailwind frontend
```

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hotel_stock_db
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Make sure MongoDB is running locally, or use a MongoDB Atlas connection string for `MONGO_URI`.

Seed a default admin account and a few sample records:
```bash
npm run seed
```
This creates: **admin@hotel.com / admin123** — change this password after first login.

Start the API:
```bash
npm run dev
```
The API runs at `http://localhost:5000/api`.

## 2. Frontend setup

```bash
cd client
npm install
cp .env.example .env
```

`.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Start the app:
```bash
npm run dev
```
Open `http://localhost:5173` and log in with the seeded admin account.

## Roles & permissions

| Action                          | Admin | Manager | Store Keeper |
|----------------------------------|:---:|:---:|:---:|
| View dashboard & stock levels    | ✅ | ✅ | ✅ |
| Record stock in / out            | ✅ | ✅ | ✅ |
| Manage raw materials             | ✅ | ✅ | view only |
| Manage suppliers                 | ✅ | ✅ | — |
| Record purchases                 | ✅ | ✅ | — |
| View reports                     | ✅ | ✅ | — |
| Manage staff accounts            | ✅ | — | — |
| Delete records                   | ✅ | — | — |

## Notes

- Stock levels update automatically: receiving a purchase adds stock; recording a "stock out" transaction subtracts it, and blocks the action if there isn't enough stock available.
- The dashboard's 7-day trend, low-stock alerts, and stock value are all computed live from your data — no demo data is hardcoded into the UI.
- For production, deploy the API (e.g. Render, Railway) and the frontend (e.g. Vercel, Netlify) separately, and set `VITE_API_URL` / `CLIENT_URL` to the deployed URLs.
