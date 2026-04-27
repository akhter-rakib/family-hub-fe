# Family Hub - Frontend

React + TypeScript SPA for household management.

## Tech Stack
- React 18, TypeScript 5.6
- Vite 5, TailwindCSS 3
- TanStack Query, Zustand, React Router 6
- react-hook-form + Zod, Recharts, Axios

## Prerequisites
- Node.js 20+

## Quick Start

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

> The Vite dev server proxies `/api` requests to `http://localhost:8080` (the backend).

## Scripts
| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start dev server         |
| `npm run build` | Type-check & build       |
| `npm run preview` | Preview production build |
| `npm run lint`  | Run ESLint               |

## Project Structure
```
src/
├── api/           # Axios client & React Query hooks
├── components/    # Reusable UI components
├── pages/         # Route pages
├── store/         # Zustand auth store
└── types/         # TypeScript type definitions
```

## Pages
- Login / Register
- Families (create & select)
- Dashboard, Members, Shopping, Purchases
- Bills, Gas, Inventory, Reports, Notifications
