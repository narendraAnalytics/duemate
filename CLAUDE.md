# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project
AI-powered payment reminder SaaS. Users manage buyers and products, create invoices, Gemini 3.1 Flash-Lite extracts data, Inngest schedules multi-channel reminders, Resend + Meta WhatsApp Cloud API deliver them automatically.

## Design Skill
For ALL frontend/UI work — landing page, dashboard, components, emails — use the skill at:
`C:\Users\ES\.claude\skills\reactwebsite.skill`

This skill defines the color system, typography, animation stack, component patterns, and quality standards. Read it before writing any UI code. Do not deviate from its rules.

When examining UI references, use the Playwright MCP server to screenshot and inspect the target site.

## Dev Commands
```bash
npm run dev            # Next.js dev server (Turbopack) — port 3000
npx inngest-cli dev    # Inngest dev server — port 8288 (required locally)
npx drizzle-kit push   # Push schema changes to Neon (requires DATABASE_URL_UNPOOLED in .env)
npx drizzle-kit studio # Visual DB browser
npx tsc --noEmit       # Type-check without building
```

> Schema migrations can also be applied via the **Neon MCP server** (`prepare_database_migration` → `complete_database_migration`) without needing `DATABASE_URL_UNPOOLED`.

## Stack

### Frontend
- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4 — `@import 'tailwindcss'` syntax, no config file needed
- Framer Motion — page/component animations
- GSAP + Lenis — feature slider sweeps, smooth scroll
- Fonts via `next/font/google`:
  - **Bebas Neue** → `--font-display` / `font-heading` (headlines)
  - **Space Grotesk** → `--font-body` / `font-sans` (body)
  - **Cormorant Garamond** → `--font-serif` (menu numerals, italic accent text)
- shadcn/ui — accessible pre-built components
- Lucide React — icons
- React Hook Form + Zod — type-safe form validation
- Recharts — dashboard charts

### Backend
- Next.js 16 API Routes (App Router)
- Clerk v7 — auth + middleware. **NO webhooks. NO CLERK_WEBHOOK_SECRET.**
- Drizzle ORM — type-safe schema-first SQL (`src/lib/schema.ts`, `src/lib/db.ts`)
- Neon PostgreSQL — serverless, connection pooling (project: `restless-resonance-74035977`)

### AI + Automation
- **Gemini 3.1 Flash-Lite Preview** — model string: `gemini-3.1-flash-lite-preview`. Do NOT use `gemini-2.0-flash` (shuts down June 1, 2026).
- Inngest — 3 durable background functions *(not yet implemented)*
- Resend + React Email — transactional email
- Meta WhatsApp Cloud API (direct, no Twilio, no BSP markup)

### Infrastructure
- Vercel — hosting + CI/CD
- ImageKit — CDN + file storage for invoice PDFs/images
- Cloudinary — video/image CDN for landing page assets (`res.cloudinary.com` whitelisted in `next.config.ts`)

## Implemented Design System (`src/app/globals.css`)

```css
--color-bg: #070A12        /* dark navy page background */
--color-surface: #0D1426   /* card/panel surface */
--color-primary: #818CF8   /* indigo — brand accent */
--color-secondary: #F59E0B /* amber/gold — supporting accent */
--color-text: #C4CFEE      /* cool lavender-white body text */
```

Fluid type scale in `:root` via `clamp()` — `--text-xs` through `--text-hero`. Use these for headings, not fixed `px` values.

`html, body` have `overflow: hidden` — the landing page uses fullscreen sections (`height: 100svh`). Dashboard and other scrollable pages must use `height: 100svh; overflow-y: auto` on their **wrapper div**, not on body.

`.db-select` class in `globals.css` — use for all `<select>` elements in the dashboard (avoids inline styles, includes focus state and option background).

## Auth — CRITICAL
- `src/middleware.ts` runs `clerkMiddleware()` — must be inside `src/` (not project root) when using `src/` directory layout. All routes are public by default.
- `<ClerkProvider>` wraps children inside `<body>` in `src/app/layout.tsx`
- Use `<Show when="signed-in">` / `<Show when="signed-out">` from `@clerk/nextjs` — **NOT** deprecated `<SignedIn>` / `<SignedOut>`
- Use `useUser()` hook in client components to read auth state
- Call `getOrCreateUser()` from `src/lib/auth.ts` at the top of every authenticated API route — lazy DB user creation on first API call, no webhook sync needed
- Sign-in: `/sign-in` → `src/app/sign-in/[[...sign-in]]/page.tsx`
- Sign-up: `/sign-up` → `src/app/sign-up/[[...sign-up]]/page.tsx`
- After sign-in/up both redirect to `/`

## Database — 7 Tables (live on Neon)

Schema: `src/lib/schema.ts` | Client: `src/lib/db.ts` (Neon HTTP driver) | Config: `drizzle.config.ts`

- **users** — Clerk userId (text PK), email, name, businessName, plan (free/starter/pro), timezone
- **customers** — uuid PK, userId FK, name, email, shopName. **No phone field.**
- **products** — uuid PK, userId FK, name, description, rate (numeric 10,2), unit (pcs/kg/litre etc.)
- **invoices** — uuid PK, userId FK, customerId FK, invoiceNumber, amount, currency, dueDate, issueDate, description, status, fileUrl, extractedData (jsonb), aiConfidence, paidAt, notes
- **reminders** — uuid PK, invoiceId FK, type, channel (email/whatsapp/both), scheduledAt, sentAt, status, messageBody, error
- **reminder_settings** — uuid PK, userId FK (unique), 7 boolean timing toggles (day30/14/7/3/1, dueDay, overdue), emailEnabled, whatsappEnabled, customMessage, senderName
- **notifications** — audit log, uuid PK, userId FK, reminderId FK, channel, recipient, subject, status (delivered/bounced/failed/read), externalId, sentAt

## Navbar Architecture
`src/components/Navbar.tsx` — Layout: **Logo (left) | Menu button + UserButton (right)**

- **Menu button**: "Menu" text + animated underline dash. Hover triggers `useTextScramble` (40ms interval, left-to-right).
- **Menu overlay**: Right-side slide-in panel (`min(420px, 88vw)`), Framer Motion spring. Backdrop click or Escape closes.
- **Panel items**: Roman numerals I–IV in Cormorant Garamond italic, amber `--color-secondary`. Staggered entrance.
  - I. Features → `#features`, II. How It Works → `#how-it-works`, III. Pricing → `#pricing`, IV. Dashboard → `/dashboard`
- **Auth guard**: `handleNavClick()` — redirects to `/sign-in` if not authenticated, navigates otherwise.
- **UserButton**: `<Show when="signed-in"><UserButton /></Show>` after the Menu button.

## Landing Page
`src/app/page.tsx` assembles: `<CustomCursor />` + `<Navbar />` + `<HeroSection />`

### HeroSection (`src/components/HeroSection.tsx`)
- Two Cloudinary `.webm` videos cycle with page-flip transition (Framer Motion skew sweep)
- Active video plays once (flip on `ended`); inactive loops silently in background
- Mute/unmute toggle bottom-right
- Animated headline stagger (Bebas Neue, `clamp` sizing)
- Signed-in state: `"Welcome back, {username} —"` overlay (Cormorant Garamond italic, amber) — priority: `username ?? firstName ?? "there"`
- "Start Free →" CTA → `/sign-up`

### CustomCursor (`src/components/CustomCursor.tsx`)
- Outer ring: 36px, indigo `#818CF8` border, spring-lagged (`useSpring`)
- Center dot: 5px, amber `#F59E0B` with glow, snaps precisely to mouse

## Dashboard (`src/app/dashboard/page.tsx`)
Client component. Redirects to `/sign-in` if not authenticated. Three tabs:

- **I. Buyers** — Add/list customers (name, email, shop name). POST/GET `/api/customers`
- **II. Products** — Add/list goods with rate (₹) and unit. POST/GET `/api/products`. Displayed as amber-rate cards.
- **III. Sales** — Coming soon placeholder + price list table (product name, description, rate, unit) for reference while writing a sale.

## API Routes
All routes call `getOrCreateUser()` first, validate input with Zod, return `{ success, data?, error? }`.

| Route | Methods | Purpose |
|---|---|---|
| `/api/customers` | GET, POST | List / create buyers |
| `/api/products` | GET, POST | List / create goods |

## Gemini *(not yet implemented)*
- Model: `gemini-3.1-flash-lite-preview`
- Config: `responseMimeType: 'application/json'`, `temperature: 0.1`
- File: `src/lib/gemini.ts` → `extractInvoiceData(fileBase64, mimeType)`

## Inngest — 3 Functions *(not yet implemented)*
1. **notifyOwner** — event: `invoice/created`, immediate confirmation email to invoice owner
2. **scheduleReminders** — event: `invoice/created`, `step.sleepUntil()` for up to 7 reminder slots
3. **checkOverdue** — cron: `0 9 * * *`, marks pending past-due invoices as overdue

## WhatsApp *(not yet implemented)*
- Provider: Meta WhatsApp Cloud API — **NOT Twilio**
- Endpoint: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Auth: Bearer `META_WHATSAPP_ACCESS_TOKEN`
- Template: `payment_reminder` (UTILITY — must be Meta-approved)
- File: `src/lib/whatsapp.ts` → `sendWhatsAppReminder()`

## Key File Paths
| File | Purpose |
|---|---|
| `src/middleware.ts` | Clerk middleware — must be inside `src/` when using `src/` directory layout |
| `drizzle.config.ts` | Drizzle Kit config (uses `DATABASE_URL_UNPOOLED`) |
| `src/lib/schema.ts` | All 7 Drizzle table schemas + exported types |
| `src/lib/db.ts` | Neon HTTP driver → Drizzle client |
| `src/lib/auth.ts` | `getOrCreateUser()` — Clerk→DB lazy sync |
| `src/app/globals.css` | Color system, fluid type scale, `.db-select` class |
| `src/app/layout.tsx` | Fonts (3 families), ClerkProvider, metadata |
| `src/app/page.tsx` | Landing page |
| `src/app/dashboard/page.tsx` | Dashboard — tabs: Buyers, Products, Sales |
| `src/app/api/customers/route.ts` | Buyers API |
| `src/app/api/products/route.ts` | Products API |
| `src/components/Navbar.tsx` | Menu, scramble animation, slide-in panel, auth guard |
| `src/components/HeroSection.tsx` | Video hero, flip transition, welcome overlay |
| `src/components/CustomCursor.tsx` | Spring-physics custom cursor |
| `next.config.ts` | Cloudinary image domain whitelist |

## Coding Standards
- TypeScript strict mode throughout
- Server components by default — `'use client'` only when needed
- Zod validation on all API inputs
- All API routes return `{ success: boolean, data?, error? }`
- No inline styles on form elements — use CSS classes (e.g. `.db-select`)
- All `<select>` elements must have an accessible name via linked `<label htmlFor>` + `id`
- Buttons outside `<form>` must have `type="button"`
- No `twilio` package anywhere
- Never expose secrets client-side

## Environment Variables
Stored in `.env` at project root (not `.env.local`). Add to Vercel dashboard manually — never committed.

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/`
- **Neon**: `DATABASE_URL` (pooled, used by app), `DATABASE_URL_UNPOOLED` (direct, for drizzle-kit push only)
- **Gemini**: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.1-flash-lite-preview`
- **Resend**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- **Meta WhatsApp**: `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`
- **Inngest**: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **ImageKit**: `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
- **App**: `NEXT_PUBLIC_APP_URL`

## Pricing Tiers
| Feature | Free | Starter $9/mo | Pro $29/mo |
|---|---|---|---|
| Invoices | 10/mo | 100/mo | Unlimited |
| Customers | 10 | 200 | Unlimited |
| Email Reminders | 3/invoice | 7/invoice | 7/invoice |
| WhatsApp | No | Yes | Yes |
| AI Extraction | No | 50/mo | Unlimited |
| QuickBooks Sync | No | No | Yes |
| Team Members | 1 | 1 | Up to 5 |
