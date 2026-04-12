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

> Schema migrations can also be applied via the **Neon MCP server** (`prepare_database_migration` → `complete_database_migration`) without needing `DATABASE_URL_UNPOOLED`. Neon project ID: `restless-resonance-74035977`.

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

### Backend
- Next.js 16 API Routes (App Router)
- Clerk v7 — auth + middleware. **NO webhooks. NO CLERK_WEBHOOK_SECRET.**
- Drizzle ORM — type-safe schema-first SQL (`src/lib/schema.ts`, `src/lib/db.ts`)
- Neon PostgreSQL — serverless, connection pooling

### AI + Automation
- **Gemini 3.1 Flash-Lite Preview** — model string: `gemini-3.1-flash-lite-preview`. Do NOT use `gemini-2.0-flash` (shuts down June 1, 2026).
- Inngest — 3 durable background functions (**fully implemented**)
- Resend + React Email — transactional email (**3 templates fully implemented**)
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

`.db-select` / `.db-select-light` classes in `globals.css` — use for all `<select>` elements in the dashboard. `.db-select-light` is for the light-background dashboard forms.

## Auth — CRITICAL
- `src/proxy.ts` runs `clerkMiddleware()` — must be inside `src/` (not project root) when using `src/` directory layout. All routes are public by default.
- `<ClerkProvider>` wraps children inside `<body>` in `src/app/layout.tsx`
- Use `<Show when="signed-in">` / `<Show when="signed-out">` from `@clerk/nextjs` — **NOT** deprecated `<SignedIn>` / `<SignedOut>`
- Use `useUser()` hook in client components to read auth state
- Call `getOrCreateUser()` from `src/lib/auth.ts` at the top of every authenticated API route — lazy DB user creation on first API call, no webhook sync needed

## Database — 8 Tables (live on Neon)

Schema: `src/lib/schema.ts` | Client: `src/lib/db.ts` (Neon HTTP driver) | Config: `drizzle.config.ts`

- **users** — Clerk userId (text PK), email, name, businessName, plan (`planEnum`: `'free' | 'starter' | 'pro'` — `'starter'` is the DB value for the "Plus" plan shown in UI), timezone
- **customers** — uuid PK, userId FK, name, email (required), shopName (required), phone, gstin (15-char GSTIN format), **lastEmailSentAt** (timestamp, nullable — stamped every time an email is sent to this buyer)
- **suppliers** — uuid PK, userId FK, name, shopName, phone, gstin — reusable supplier records; selected in the product form to auto-fill supplierShop/Phone/Gstin
- **products** — uuid PK, userId FK, name, description, rate (selling price), unit, quantity (stock), gstRate, purchaseRate, purchaseDate, supplierShop, supplierPhone, supplierGstin, hsnCode
- **invoices** — uuid PK, userId FK, customerId FK, invoiceNumber, amount, currency, dueDate, issueDate, status (pending/due_soon/overdue/paid/cancelled), discountType/discountAmount, taxRate/taxAmount, paymentType, paidAmount, paidCash, paidOnline, balanceAmount, paidAt, lastPaymentAt, paymentReference, paymentNotes, notes, extractedData (jsonb — stores line items array), paymentHistory (jsonb array of `{amount, type, reference, notes, paidAt}`), fileUrl, aiConfidence
- **reminders** — uuid PK, invoiceId FK, type, channel (email/whatsapp/both), scheduledAt, sentAt, status, messageBody, error
- **reminder_settings** — uuid PK, userId FK (unique), 7 boolean timing toggles (day30/14/7/3/1, dueDay, overdue), emailEnabled, whatsappEnabled, customMessage, senderName
- **notifications** — email audit log, uuid PK, userId FK, reminderId FK (nullable), channel, recipient, subject, status (delivered/bounced/failed/read), externalId (Resend email ID), sentAt. **Written after every successful Inngest email send. Also used to enforce the free plan 3-email-per-buyer-per-month cap.**
*(zoho_integrations table — not yet created in schema; needed when Zoho integration is implemented)*

### Dynamic Route Params — Next.js 15
In `[id]` API routes, `params` is a **Promise** and must be awaited:
```ts
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```
Forgetting `await params` causes silent "Not found" errors as `id` resolves to undefined.

## Dashboard (`src/app/dashboard/page.tsx`)
Large client component (`'use client'`). All tabs live in one file. Redirects to `/sign-in` if not authenticated.

### Tab Architecture
Four tabs (`Tab` type: `"customers" | "products" | "sales" | "insights"`) managed by `activeTab` state + a `TABS` config array. Each tab is its own function component defined in the same file:

- **I. Buyers (`CustomersSection`)** — Add/edit/list buyers. Inline row edit with `editingId` state. Validation: phone must be 10 digits (`/^\d{10}$/`), GSTIN must match `/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/`. `validateBuyerFields()` is a module-level shared validator.
- **II. Products (`ProductsSection` + `ProductCard`)** — Includes a **Saved Suppliers** sub-section (add/edit/list) above the product form, plus a "Auto-fill from Saved Supplier" dropdown that fills supplierShop/Phone/Gstin on select. Add products via form; each saved product renders as a `ProductCard` with inline edit (`editing` state inside the card). Form order: Purchase Rate → Selling Rate. Purchase Total auto-computes from `purchaseRate × quantity × (1 + gstRate/100)`. ProductCard view shows margin % (selling − purchase rate).
- **III. Sales (`SalesSection` + `InvoiceList`)** — Invoice creation form with preview modal before saving. `InvoiceList` renders saved invoices as expandable rows. Expanded panel shows full financial breakdown + **Record Payment** inline form (calls `PATCH /api/invoices/[id]`).
- **IV. Insights (`InsightsSection`)** — Read-only analytics dashboard. Computes revenue, collection rate, outstanding balance, overdue stats, top customer/product from the loaded invoice list. Calls `POST /api/analytics/ai-summary` to display a Gemini-generated business health summary (temperature 0.4, re-fetchable via ↻ button). Renders visual charts/stat cards; only shown when at least one invoice exists.

### Dashboard Internal Components
Defined inside `page.tsx`, not as separate files:
- `InputField` — label with amber `*` when `required`, focus border color via `focused` state
- `SubmitButton` — loading spinner state
- `SectionHeading` — title + italic serif subtitle
- `StockBadge` — green/amber/red stock level pill
- `ProductCard` — card with `AnimatePresence` between view/edit mode
- `InvoiceList` — takes `{ invoiceList, fetching, onRefresh }` props; manages `expanded`, `payingId`, `payDraft` state internally
- `PlanUsageBar` — shows used/limit progress bar per section (blue/amber/red based on % used); rendered above each section's form
- `PlanLimitCard` — light-blue card with 🔒 icon shown when a free plan API block (`planLimit: true`) is returned; includes "Upgrade to Plus →" link to `/pricing`

### Invoice Form Flow
1. User fills form → clicks "Preview Invoice" → `handlePreview()` validates → sets `showPreview = true`
2. Preview modal shows full invoice layout with computed totals
3. "Save Invoice" in modal → `handleSave()` → `POST /api/invoices` → stock quantities decremented server-side → `fetchAll()` refreshes all three data sets
4. Saved invoices appear in `InvoiceList` below the form, expandable for full detail

### Computed Invoice Values
All calculated client-side before preview and display:
```ts
const subtotal = lineItems.reduce((s, li) => s + li.subtotal, 0);
const discountAmt = discountType === "flat" ? flat : subtotal * (pct/100);
const afterDiscount = Math.max(0, subtotal - discountAmt);
const taxAmt = afterDiscount * (taxRate / 100);
const total = afterDiscount + taxAmt;
```

## API Routes
All routes call `getOrCreateUser()` first, validate with Zod, return `{ success, data?, error? }`.

| Route | Methods | Purpose |
|---|---|---|
| `/api/customers` | GET, POST | List / create buyers |
| `/api/customers/[id]` | PATCH | Update buyer details |
| `/api/products` | GET, POST | List / create products |
| `/api/products/[id]` | PATCH | Update product + stock |
| `/api/invoices` | GET, POST | List (with customer join) / create invoices |
| `/api/invoices/[id]` | PATCH | Record payment — adds `additionalPayment` to `paidAmount`/`paidCash`/`paidOnline`, appends to `paymentHistory`, sets `lastPaymentAt`, optionally stores `paymentReference`/`paymentNotes`. Sets status to `"paid"` when balance reaches zero. Returns `emailSkipped: boolean` to indicate whether the receipt email was suppressed by the free plan cap. |
| `/api/suppliers` | GET, POST | List / create suppliers |
| `/api/suppliers/[id]` | PATCH | Update supplier details |
| `/api/analytics/ai-summary` | POST | Gemini-powered business health summary — accepts aggregated invoice stats (revenue, collected, outstanding, overdueCount, overdueAmount, topCustomer, topProduct, invoiceCount), returns 2–3 sentence advisory string |

### Free Plan Enforcement
POST routes for customers, products, and invoices check `user.plan === 'free'` and return a 403 with `{ success: false, planLimit: true, limit, used, remaining, resource }` when limits are hit. Dashboard detects `json.planLimit` and shows `PlanLimitCard` instead of a plain error.

| Resource | Free Limit | Scope |
|---|---|---|
| Invoices | 4 | per month (counts `createdAt >= start of month`) |
| Customers | 10 | total |
| Products | 10 | total |
| Emails per buyer | 3 | per month (checked via `notifications` table count) |

The `PATCH /api/invoices/[id]` route pre-checks the email cap synchronously before firing the Inngest event, so `emailSkipped` is known at response time without waiting for Inngest.

## Key File Paths
| File | Purpose |
|---|---|
| `src/proxy.ts` | Clerk middleware — must be inside `src/` when using `src/` directory layout |
| `drizzle.config.ts` | Drizzle Kit config (uses `DATABASE_URL_UNPOOLED`) |
| `src/lib/schema.ts` | All 7 Drizzle table schemas + exported types |
| `src/lib/db.ts` | Neon HTTP driver → Drizzle client |
| `src/lib/auth.ts` | `getOrCreateUser()` — Clerk→DB lazy sync |
| `src/app/globals.css` | Color system, fluid type scale, `.db-select` / `.db-select-light` classes |
| `src/app/layout.tsx` | Fonts (3 families), ClerkProvider, metadata |
| `src/app/page.tsx` | Landing page |
| `src/app/pricing/page.tsx` | Pricing page — server component, requires auth (`auth()` redirect), renders Clerk `<PricingTable />` |
| `src/app/features/page.tsx` | Features marketing page — client component, animated feature slider with Cloudinary images |
| `src/app/api/analytics/ai-summary/route.ts` | Gemini business health summary — POST, no plan gating, uses `GEMINI_MODEL` env var |
| `src/app/dashboard/page.tsx` | Dashboard — all tabs + internal components (1 large file) |
| `src/app/api/customers/route.ts` | Buyers list + create (free plan: blocks at 10 total) |
| `src/app/api/suppliers/route.ts` | Suppliers list + create |
| `src/app/api/suppliers/[id]/route.ts` | Supplier PATCH |
| `src/app/api/customers/[id]/route.ts` | Buyer PATCH |
| `src/app/api/products/route.ts` | Products list + create (free plan: blocks at 10 total) |
| `src/app/api/products/[id]/route.ts` | Product PATCH |
| `src/app/api/invoices/route.ts` | Invoices list (left-joins customers) + create (free plan: blocks at 4/month) |
| `src/app/api/invoices/[id]/route.ts` | Invoice payment PATCH — pre-checks email cap, returns `emailSkipped` |
| `src/components/Navbar.tsx` | Menu, scramble animation, slide-in panel. All links require auth when signed out. Plan badge (FREE/PLUS/PRO) shown next to UserButton via `useAuth().has()` |
| `src/components/HeroSection.tsx` | Video hero, flip transition, welcome overlay |
| `src/components/CustomCursor.tsx` | Spring-physics custom cursor |
| `src/inngest/client.ts` | Inngest client (`id: 'duemate'`) |
| `src/inngest/functions.ts` | 3 background functions — each checks free plan email cap before sending, logs to `notifications` table + stamps `customers.lastEmailSentAt` after every send |
| `src/app/api/inngest/route.ts` | Inngest webhook handler — serves all 3 functions |
| `src/emails/InvoiceCreatedEmail.tsx` | Invoice notification email template |
| `src/emails/PaymentReceiptEmail.tsx` | Payment receipt email template |
| `src/emails/PaymentDueReminderEmail.tsx` | Daily overdue reminder email template |
| `next.config.ts` | Cloudinary image domain whitelist |

## Coding Standards
- TypeScript strict mode throughout
- Server components by default — `'use client'` only when needed
- Zod validation on all API inputs
- All API routes return `{ success: boolean, data?, error? }`
- No inline styles on form elements — use CSS classes (`.db-select-light`)
- All `<select>` elements must have accessible name via linked `<label htmlFor>` + `id`, or `aria-label`
- Buttons outside `<form>` must have `type="button"`
- No `twilio` package anywhere

## Inngest — 3 Functions (fully implemented)

Client: `src/inngest/client.ts` — `new Inngest({ id: 'duemate' })`
Route: `src/app/api/inngest/route.ts` — `serve()` handler (GET, POST, PUT)
Functions: `src/inngest/functions.ts`

**Local dev:** `INNGEST_DEV=1` must be in `.env` locally (Inngest CLI at port 8288). Do NOT set `INNGEST_DEV` on Vercel.
**Production sync:** After deploying, register `https://<your-domain>/api/inngest` in Inngest Cloud (app.inngest.com → Apps → Sync).

| Function ID | Trigger | Action |
|---|---|---|
| `notify-owner-invoice-created` | event `invoice/created` | Checks email cap → sends `InvoiceCreatedEmail` → logs to notifications + stamps `lastEmailSentAt` |
| `notify-owner-payment-recorded` | event `invoice/payment.recorded` | Checks email cap → sends `PaymentReceiptEmail` → logs to notifications + stamps `lastEmailSentAt` |
| `check-overdue-invoices` | cron `30 5 * * *` (11:00 AM IST) | Marks pending→overdue; checks email cap per buyer; sends `PaymentDueReminderEmail` grouped by customerId; logs each send |

Events are fired **non-blocking** from API routes: `inngest.send({...}).catch(...)` — email failure never breaks the API response. Events are skipped silently if the buyer has no email.

### Inngest Email Cap (Free Plan)
`isEmailCapped(userId, recipientEmail, cap = FREE_EMAIL_CAP)` is called as the first step in each function:
1. Fetches `users.plan` — if not `'free'`, skips cap check entirely
2. Counts `notifications` rows for `(userId, recipient, sentAt >= startOfMonth)`
3. If `count >= cap` → returns `{ skipped: true, reason: 'free_plan_cap' }` without sending

**Reserved slot logic:** `notify-owner-payment-recorded` passes `cap = FREE_EMAIL_CAP - 1` (= **2**), reserving the 3rd monthly slot exclusively for the overdue reminder cron. The PATCH `/api/invoices/[id]` pre-check mirrors this (`total >= 2` → `emailSkipped = true`). Effective per-buyer email sequence on free plan: slot 1 = invoice created, slot 2 = payment receipt (max 1), slot 3 = due reminder.

After a successful send, `logEmail(userId, recipient, subject, externalId)` runs in parallel:
- Inserts into `notifications` (status: `'delivered'`, externalId = Resend's email ID)
- Updates `customers.lastEmailSentAt = now` where `userId + email` match

Both the `invoice/created` and `invoice/payment.recorded` events **must include `userId`** in their data payload — this is added in the respective API routes before calling `inngest.send()`.

## Email Templates (fully implemented)

All in `src/emails/`, using `@react-email/components`. Owner is always `replyTo`; buyer is always `to`.

| File | Theme | Sections |
|---|---|---|
| `InvoiceCreatedEmail.tsx` | Indigo/light (`#EEF2FF`) | Header, Bill To (name + shop + GSTIN), dates, line items table, totals, notes, thank you |
| `PaymentReceiptEmail.tsx` | Green (`#F0FDF4`) | Header, status banner (PAID/PARTIAL), payment details (mode/date/time/ref), account summary, thank you |
| `PaymentDueReminderEmail.tsx` | Amber (`#FFFBEB`) | Header, alert, invoice table with overdue badges, incentive ("💰 Pay on time & save"), new stock teaser, warm close |

`PaymentDueReminderEmail` `OverdueInvoice` interface: `{ invoiceNumber, amount, daysOverdue, dueDate (ISO), currency? }` — badge is red if `daysOverdue > 7`, amber if ≤7.

## Zoho Books Integration *(not yet implemented — files do not exist)*

OAuth 2.0 flow using Zoho India endpoints (`accounts.zoho.in`, `zohoapis.in`). Tokens to be stored in `zoho_integrations` table (not yet in schema).

Files to create:
- `src/lib/zoho.ts` → `syncInvoiceToZoho()` — OAuth token refresh + contact lookup/create + invoice create
- `src/app/api/integrations/zoho/connect/route.ts` — redirect to Zoho consent screen
- `src/app/api/integrations/zoho/callback/route.ts` — exchange code for tokens, upsert `zoho_integrations`
- `src/app/api/integrations/zoho/status/route.ts` — returns `{ connected, connectedAt }`
- `src/app/api/integrations/zoho/disconnect/route.ts` — deletes the row

**Scopes required:** `ZohoInvoice.invoices.CREATE`, `ZohoInvoice.contacts.CREATE`, `ZohoInvoice.contacts.READ`

## Gemini *(not yet implemented — file does not exist)*
- Model: `gemini-3.1-flash-lite-preview`
- Config: `responseMimeType: 'application/json'`, `temperature: 0.1`
- File to create: `src/lib/gemini.ts` → `extractInvoiceData(fileBase64, mimeType)`

## WhatsApp *(not yet implemented — file does not exist)*
- Provider: Meta WhatsApp Cloud API — **NOT Twilio**
- Endpoint: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Auth: Bearer `META_WHATSAPP_ACCESS_TOKEN`
- Template: `payment_reminder` (UTILITY — must be Meta-approved)
- File to create: `src/lib/whatsapp.ts` → `sendWhatsAppReminder()`

## Environment Variables
Stored in `.env` at project root (not `.env.local`). Add to Vercel dashboard manually — never committed.

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/`
- **Neon**: `DATABASE_URL` (pooled, used by app), `DATABASE_URL_UNPOOLED` (direct, for drizzle-kit push only)
- **Gemini**: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.1-flash-lite-preview`
- **Resend**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- **Meta WhatsApp**: `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`
- **Inngest**: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **ImageKit**: `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
- **Zoho Books**: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REDIRECT_URI` (must match OAuth app config), `ZOHO_ORG_ID` (Zoho Books organization ID — avoids needing settings.READ scope)
- **App**: `NEXT_PUBLIC_APP_URL`

## Pricing Tiers

Plans in UI: **Free / Plus / Pro**. DB `plan` enum: `'free' | 'starter' | 'pro'` — `'starter'` is the DB value for "Plus". Clerk Billing manages subscriptions; plans are configured in the Clerk Dashboard. The `/pricing` page uses Clerk's `<PricingTable />` component (requires auth).

| Feature | Free | Plus (DB: starter) $9/mo | Pro $29/mo |
|---|---|---|---|
| Invoices | **4/mo** | 100/mo | Unlimited |
| Customers | 10 total | 200 total | Unlimited |
| Products | 10 total | Unlimited | Unlimited |
| Emails per buyer | **3/month** | Unlimited | Unlimited |
| WhatsApp | No | Yes | Yes |
| AI Extraction | No | 50/mo | Unlimited |
| Zoho Books Sync | No | No | Yes |
| Team Members | 1 | 1 | Up to 5 |

**Enforcement is live in code.** The plan badge (FREE/PLUS/PRO glow pill) is shown in the Navbar next to `<UserButton />` using `useAuth().has({ plan: '...' })` from Clerk Billing.
