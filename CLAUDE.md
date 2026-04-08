# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project
AI-powered payment reminder SaaS. Users create or upload invoices, Gemini 3.1 Flash-Lite extracts data, Inngest schedules multi-channel reminders, Resend + Meta WhatsApp Cloud API deliver them automatically.

## Design Skill
For ALL frontend/UI work — landing page, dashboard, components, emails — use the skill at:
`C:\Users\ES\.claude\skills\reactwebsite.skill`

This skill defines the color system, typography, animation stack, component patterns, and quality standards. Read it before writing any UI code. Do not deviate from its rules.

When examining UI references, use the Playwright MCP server to screenshot and inspect the target site.

## Dev Commands
```bash
npm run dev            # Next.js dev server (Turbopack) — port 3000
npx inngest-cli dev    # Inngest dev server — port 8288 (required locally)
npx drizzle-kit push   # Push schema to Neon (use DATABASE_URL_UNPOOLED)
npx drizzle-kit studio # Visual DB browser
npx tsc --noEmit       # Type-check without building
```

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
- Drizzle ORM — type-safe schema-first SQL
- Neon PostgreSQL — serverless, connection pooling

### AI + Automation
- **Gemini 3.1 Flash-Lite Preview** — model string: `gemini-3.1-flash-lite-preview`. Do NOT use `gemini-2.0-flash` (shuts down June 1, 2026).
- Inngest — 3 durable background functions (not yet implemented)
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

`html, body` have `overflow: hidden` — the landing page uses fullscreen sections (`height: 100svh`), not traditional scroll.

## Auth — CRITICAL
- `middleware.ts` at project root runs `clerkMiddleware()` — all routes are public by default
- `<ClerkProvider>` wraps children inside `<body>` in `src/app/layout.tsx`
- Use `<Show when="signed-in">` / `<Show when="signed-out">` from `@clerk/nextjs` — **NOT** deprecated `<SignedIn>` / `<SignedOut>`
- Use `useUser()` hook in client components to read auth state
- Call `getOrCreateUser()` from `lib/auth.ts` at the top of every authenticated API route (lazy DB user creation on first API call — no webhook sync needed)
- Sign-in page: `/sign-in` → `src/app/sign-in/[[...sign-in]]/page.tsx`
- Sign-up page: `/sign-up` → `src/app/sign-up/[[...sign-up]]/page.tsx`
- After sign-in/up both redirect to `/` (set via `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`)

## Navbar Architecture
The navbar (`src/components/Navbar.tsx`) has no center nav links. Layout: **Logo (left) | Menu button + UserButton (right)**.

- **Menu button**: "Menu" text with animated underline dash. On hover, runs a character-scramble animation (`useTextScramble` hook, 40ms interval, left-to-right reveal).
- **Menu overlay**: Click opens a right-side slide-in panel (`min(420px, 88vw)`) with Framer Motion spring. Backdrop click or Escape closes it.
- **Panel items**: Roman numerals I. II. III. in Cormorant Garamond italic (`--font-serif`), amber `--color-secondary`. Staggered entrance animation.
- **Auth guard on nav links**: `handleNavClick()` checks `isSignedIn` — redirects to `/sign-in` if not authenticated, navigates to section anchor if authenticated.
- **UserButton**: `<Show when="signed-in"><UserButton /></Show>` appears after the Menu button when signed in.

## Landing Page — What's Built
`src/app/page.tsx` assembles: `<CustomCursor />` + `<Navbar />` + `<HeroSection />`

### HeroSection
- Two Cloudinary-hosted `.webm` videos cycle with a page-flip transition (Framer Motion, skew sweep)
- Active video plays once (triggers flip on `ended`); inactive video loops silently in background
- Mute/unmute toggle button bottom-right
- Animated headline stagger (Bebas Neue, `clamp` sizing)
- When signed in: shows `"Welcome back, {username} —"` as an absolutely positioned overlay (Cormorant Garamond italic, amber) — uses `user.username ?? user.firstName ?? "there"` priority
- "Start Free →" CTA links to `/sign-up`

### CustomCursor
`src/components/CustomCursor.tsx` — hides OS cursor globally, renders:
- Outer ring: 36px, indigo `#818CF8` border, spring-lagged (`useSpring`)
- Center dot: 5px, amber `#F59E0B` with glow, snaps precisely to mouse

## Gemini
- Model: `gemini-3.1-flash-lite-preview`
- Config: `responseMimeType: 'application/json'`, `temperature: 0.1`
- File: `lib/gemini.ts` → `extractInvoiceData(fileBase64, mimeType)` *(file not yet created)*

## Inngest — 3 Functions *(not yet implemented)*
1. **notifyOwner** — event: `invoice/created`, immediate confirmation email to invoice owner
2. **scheduleReminders** — event: `invoice/created`, `step.sleepUntil()` for up to 7 reminder slots
3. **checkOverdue** — cron: `0 9 * * *`, marks pending past-due invoices as overdue

## Database — 6 Tables (Drizzle + Neon) *(schema not yet created)*
- **users** — Clerk userId as PK, email, name, businessName, plan (free/starter/pro), timezone
- **customers** — userId FK, name, email, phone (E.164), company
- **invoices** — userId FK, customerId FK, invoiceNumber, amount, currency, dueDate, issueDate, description, status (pending/due_soon/overdue/paid/cancelled), fileUrl, extractedData (jsonb), aiConfidence, paidAt, notes
- **reminders** — invoiceId FK, type, channel (email/whatsapp/both), scheduledAt, sentAt, status, messageBody, error
- **reminder_settings** — userId FK, 7 boolean timing toggles, emailEnabled, whatsappEnabled, customMessage, senderName
- **notifications** — audit log, userId FK, reminderId FK, channel, recipient, subject, status (delivered/bounced/failed/read), externalId, sentAt

Run migrations: `npx drizzle-kit push` (use `DATABASE_URL_UNPOOLED`)

## WhatsApp
- Provider: Meta WhatsApp Cloud API — **NOT Twilio**
- Endpoint: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Auth: Bearer `META_WHATSAPP_ACCESS_TOKEN`
- Template: `payment_reminder` (UTILITY — must be Meta-approved)
- Code: `lib/whatsapp.ts` → `sendWhatsAppReminder()` *(file not yet created)*

## Key File Paths
| File | Purpose |
|---|---|
| `middleware.ts` | Clerk middleware — must be at project root, named exactly this |
| `src/app/globals.css` | Color system, fluid type scale, global resets |
| `src/app/layout.tsx` | Fonts (3 families), ClerkProvider, metadata |
| `src/app/page.tsx` | Landing page — CustomCursor + Navbar + HeroSection |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk SignIn component page |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk SignUp component page |
| `src/components/Navbar.tsx` | Menu button, scramble animation, slide-in panel, auth guard |
| `src/components/HeroSection.tsx` | Video hero, flip transition, welcome message |
| `src/components/CustomCursor.tsx` | Spring-physics custom cursor |
| `next.config.ts` | Cloudinary image domain whitelist |

## Coding Standards
- TypeScript strict mode throughout
- Server components by default — `'use client'` only when needed
- Zod validation on all API inputs
- All API routes return `{ success: boolean, data?, error? }`
- Phone numbers always E.164 format (`+919876543210`)
- Never expose secrets client-side
- No `twilio` package anywhere
- Buttons outside `<form>` must have `type="button"`

## Environment Variables
Stored in `.env` at project root (not `.env.local`). Must also be added to Vercel dashboard manually — this file is never committed.

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/`
- **Neon**: `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (for drizzle-kit push)
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
