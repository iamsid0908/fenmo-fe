# Fenmo — Frontend

A production-ready expense tracking web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [System Design](#system-design)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Services](#api-services)
- [Pages & Routes](#pages--routes)
- [Component Architecture](#component-architecture)
- [Docker Deployment](#docker-deployment)
- [Development Guidelines](#development-guidelines)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 |
| HTTP | Native `fetch` with `credentials: "include"` |
| Auth | HTTP-only cookies (set by backend) + Google OAuth |
| Containerisation | Docker (multi-stage) + Docker Compose |

---

## Features

- **Authentication** — Register, email OTP verification, login, Google OAuth
- **Dashboard** — View all expense lists with paginated load-more
- **List Detail** — Per-list expense table with pagination
- **Expense Management** — Create expenses with category & list select-or-create inline dropdowns
- **Recent Expenses** — Global expense feed with category and list filters + pagination
- **Portal-based dropdowns** — All custom dropdowns render via `ReactDOM.createPortal` to escape stacking-context clipping
- **401 guard** — Every page auto-redirects to `/login` on session expiry

---

## Project Structure

```
my-app/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, global styles)
│   ├── page.tsx                  # Root redirect → /dashboard
│   ├── dashboard/
│   │   └── page.tsx              # List grid with load-more pagination
│   ├── expenses/
│   │   └── page.tsx              # Global recent expenses with filters
│   ├── lists/
│   │   └── [id]/
│   │       └── page.tsx          # Per-list expense detail + add expense
│   ├── login/
│   │   └── page.tsx              # Login page (email/password + Google)
│   ├── register/
│   │   └── page.tsx              # Registration page
│   └── verifyotp/
│       └── [id]/
│           └── [email]/
│               └── page.tsx      # OTP verification (6-digit input)
│
├── components/                   # Reusable UI components
│   ├── ui/
│   │   ├── Button.tsx            # Button: variants, sizes, loading spinner
│   │   └── Input.tsx             # Input: label, error, icons (forwardRef)
│   ├── auth/
│   │   ├── RegisterForm.tsx      # Registration form with validation
│   │   ├── LoginForm.tsx         # Login form with validation
│   │   ├── OTPForm.tsx           # 6-box OTP input, paste, resend cooldown
│   │   └── GoogleButton.tsx      # Google OAuth redirect button
│   ├── lists/
│   │   ├── CreateListModal.tsx   # Modal to create a new expense list
│   │   └── ListCard.tsx          # Card showing list name + total expense
│   └── expenses/
│       └── CreateExpenseModal.tsx # Full expense creation modal with
│                                  # portal-based SelectOrCreate dropdowns
│
├── lib/
│   └── api/
│       ├── client.ts             # Fetch wrapper, ApiError, credentials
│       ├── auth.service.ts       # register, verifyOTP, login, googleAuth
│       ├── list.service.ts       # createUserList, getUserList, getUserListExpenses
│       ├── category.service.ts   # createCategory, getCategories (normalised)
│       └── expense.service.ts    # createExpense, recentExpenses
│
├── types/
│   ├── auth.ts                   # Auth request/response types
│   ├── list.ts                   # UserList, UserListRaw, summaries
│   ├── category.ts               # Category, CategoryRaw
│   └── expense.ts                # Expense types, pagination meta
│
├── public/                       # Static assets
├── Dockerfile                    # Multi-stage production Docker image
├── docker-compose.yml            # Local container orchestration
├── .dockerignore
├── .env.example                  # Environment variable template
├── next.config.ts                # standalone output enabled
├── tsconfig.json                 # Path alias: @/ → project root
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## System Design

### Architecture Overview

```
Browser
  │
  ▼
Next.js App Router (SSR + Client Components)
  │
  ├── app/             ← Page-level components (route segments)
  ├── components/      ← Reusable client-side UI
  └── lib/api/         ← Typed service layer (fetch wrappers)
        │
        ▼ HTTP (credentials: include)
  Go Backend REST API  (http://localhost:8000/v1)
        │
        ▼
  PostgreSQL
```

### Authentication Flow

```
/register  ──POST /auth/register──►  backend creates user
     │                               sends OTP email
     ▼
/verifyotp/[id]/[email]
     │  ──POST /auth/verify-otp──►   backend verifies OTP
     ▼
/login  ──POST /auth/login──►        backend sets HTTP-only cookie
     │
     ▼
/dashboard  (all subsequent requests send cookie automatically)
```

Google OAuth:

```
/login  ──GET /auth/google──►  backend returns redirect URL
     │
     └─ window.location.href = url  (browser redirect preserves cookie)
```

### API Layer Design

All API calls go through `lib/api/client.ts`:

```
apiClient.get/post/put/patch/delete(url, body?)
  └── request<T>()
        ├── fetch(NEXT_PUBLIC_API_URL + url, { credentials: "include" })
        ├── throws ApiError({ status, message, data }) on non-2xx
        └── returns parsed JSON body
```

Each domain has its own service file:

```
auth.service.ts      →  /auth/*
list.service.ts      →  /user-list/*
category.service.ts  →  /category/*
expense.service.ts   →  /expense/*
```

### Go Backend Field Normalisation

The Go backend serialises structs with capitalised JSON fields (`ID`, `Name`, `CreatedAt`). Raw types (`CategoryRaw`, `UserListRaw`) capture these and normaliser functions map them to camelCase UI types before reaching components:

```
CategoryRaw { ID, Name }  ──normalizeCategory()──►  Category { id, name }
UserListRaw { ID, Name }  ──normalizeUserList()──►   UserList { id, name, description }
```

### Portal Dropdowns

Custom select-or-create dropdowns use `ReactDOM.createPortal` with `position: fixed` coordinates from `getBoundingClientRect()` to avoid being clipped by `overflow: hidden` / `overflow-y: auto` ancestor containers or stacking contexts from the sticky header.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Go backend running on `http://localhost:8000`

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/iamsid0908/fenmo-fe.git
cd fenmo-fe/my-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint |

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL — no trailing slash | `http://localhost:8000/v1` |

Copy `.env.example` to `.env.local` for local development. In production, pass `NEXT_PUBLIC_API_URL` as a Docker build argument — it is inlined at build time by Next.js.

> **Note:** `NEXT_PUBLIC_*` variables are embedded into the client bundle at **build time**. Do not store sensitive values here.

---

## API Services

### `auth.service.ts`

| Function | Method | Endpoint |
|---|---|---|
| `register(payload)` | POST | `/auth/register` |
| `resendOTP(payload)` | POST | `/auth/resend-otp` |
| `verifyOTP(payload)` | POST | `/auth/verify-otp` |
| `login(payload)` | POST | `/auth/login` |
| `getGoogleAuthURL()` | GET | `/auth/google` |

### `list.service.ts`

| Function | Method | Endpoint |
|---|---|---|
| `createUserList(payload)` | POST | `/user-list/create` |
| `getUserListExpenses(query)` | GET | `/user-list/get_expenses?page&limit` |
| `getUserList()` | GET | `/user-list/get` |

### `category.service.ts`

| Function | Method | Endpoint |
|---|---|---|
| `createCategory(payload)` | POST | `/category/create` |
| `getCategories()` | GET | `/category/list` |

### `expense.service.ts`

| Function | Method | Endpoint |
|---|---|---|
| `createExpense(payload)` | POST | `/expense` |
| `recentExpenses(query)` | GET | `/expense/list?page&limit&category_id&user_list_id` |

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Root — redirects to `/dashboard` |
| `/register` | User registration form |
| `/verifyotp/[id]/[email]` | OTP verification (dynamic, email URL-encoded) |
| `/login` | Login form + Google OAuth |
| `/dashboard` | Expense lists grid with load-more |
| `/lists/[id]` | Per-list expense table + add expense |
| `/expenses` | Global recent expenses with category/list filters |

---

## Component Architecture

### Primitives (`components/ui/`)

- **`Button`** — `variant`: `primary | secondary | ghost | danger`; `size`: `sm | md | lg`; built-in loading spinner
- **`Input`** — `forwardRef` wrapper with `label`, `error`, `leftIcon`, `rightIcon` slots

### Auth (`components/auth/`)

- **`RegisterForm`** / **`LoginForm`** — controlled forms with client-side validation and server error display
- **`OTPForm`** — 6 individual digit inputs with paste support, auto-focus advancement, keyboard backspace navigation, and 60-second resend cooldown
- **`GoogleButton`** — fetches the Google Auth URL from the backend and performs a full page navigation (`window.location.href`) to preserve the eventual HTTP-only cookie

### Lists (`components/lists/`)

- **`CreateListModal`** — accessible modal (Escape to close) for name + optional description
- **`ListCard`** — clickable card showing name, description, and total expense badge; navigates to `/lists/[id]`

### Expenses (`components/expenses/`)

- **`CreateExpenseModal`** — full expense creation form featuring:
  - `SelectOrCreate` — portal-based dropdown that lets users pick an existing item or type a new name to create inline
  - Two `SelectOrCreate` instances: one for lists, one for categories
  - Fields: list, category, amount, currency (INR/USD/EUR/GBP/AED/SGD/JPY), date (max = today), description

---

## Docker Deployment

The Docker setup uses a **3-stage build** to produce a minimal image via Next.js `standalone` output.

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:20-alpine` | `npm ci` — dependency layer (cached independently) |
| `builder` | `node:20-alpine` | `npm run build` — compiles the app |
| `runner` | `node:20-alpine` | Copies standalone bundle only, runs as non-root user |

### Build & Run

```bash
# Production image
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourprod.com/v1 \
  -t fenmo-fe .

docker run -p 3000:3000 fenmo-fe
```

### Docker Compose (local)

```bash
# Reads NEXT_PUBLIC_API_URL from your shell environment
NEXT_PUBLIC_API_URL=https://api.yourprod.com/v1 docker compose up --build
```

---

## Development Guidelines

### Adding a New Page

1. Create `app/<route>/page.tsx`
2. Server components are the default — add `"use client"` only when hooks or browser APIs are needed
3. Add a 401 guard: catch `ApiError` with `status === 401` and `router.push("/login")`

### Adding a New API Call

1. Add request/response types to the relevant file in `types/`
2. Add a function to the relevant service in `lib/api/`
3. If the backend returns capitalised Go struct fields, add a `*Raw` interface and a `normalize*()` function

### Code Style

- Strict TypeScript — no `any` except in normaliser escape hatches (annotated with eslint-disable)
- Components use named exports; pages use default exports
- Path alias `@/` maps to the project root (configured in `tsconfig.json`)
- Tailwind utility classes only — no custom CSS except `app/globals.css`
