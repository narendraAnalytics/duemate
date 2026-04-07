# DueMate — Claude Code Context (v1.1 Final)

## Project
AI-powered payment reminder SaaS. Users create or upload invoices, Gemini 3.1 Flash-Lite extracts data, Inngest schedules multi-channel reminders, Resend + Meta WhatsApp Cloud API deliver them automatically.

## Design Skill
For ALL frontend/UI work — landing page, dashboard, components, emails — use the skill at:
`C:\Users\ES\.claude\skills\reactwebsite.skill`

This skill defines the color system, typography, animation stack, component patterns, and quality standards. Read it before writing any UI code. Do not deviate from its rules.

## Stack

### Frontend
- Next.js 15 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4 — `@import 'tailwindcss'` syntax, no config file needed
- Framer Motion — page/component animations
- GSAP + Lenis — feature slider sweeps, smooth scroll
- Fonts: **Bebas Neue** (headings) + **Space Grotesk** (body) via Google Fonts
- shadcn/ui — accessible pre-built components
- Lucide React — icons
- React Hook Form + Zod — type-safe form validation
- Recharts — dashboard charts

### Backend
- Next.js 15 API Routes (App Router)
- Clerk — auth, middleware route protection. **NO webhooks. NO CLERK_WEBHOOK_SECRET.**
- Drizzle ORM — type-safe schema-first SQL
- Neon PostgreSQL — serverless, connection pooling

### AI + Automation
- **Gemini 3.1 Flash-Lite Preview** — model string: `gemini-3.1-flash-lite-preview`. Native multimodal OCR for invoices. Do NOT use `gemini-2.0-flash` (shuts down June 1, 2026).
- Inngest — 3 durable background functions
- Resend + React Email — transactional email
- Meta WhatsApp Cloud API (direct, no Twilio, no BSP markup)

### Infrastructure
- Vercel — hosting + CI/CD
- ImageKit — CDN + file storage for invoice PDFs/images

## Auth — CRITICAL
- NO Clerk webhooks anywhere in the codebase
- Call `getOrCreateUser()` from `lib/auth.ts` at the top of every authenticated API route
- This lazily creates a DB user row on the user's first API call — no sync needed at sign-up

## Gemini
- Model: `gemini-3.1-flash-lite-preview`
- Config: `responseMimeType: 'application/json'`, `temperature: 0.1`
- File: `lib/gemini.ts` → `extractInvoiceData(fileBase64, mimeType)`
- Handles both digital PDFs and scanned images natively — no external OCR tool

## Inngest — 3 Functions
1. **notifyOwner** — event: `invoice/created`, immediate confirmation email to the invoice owner
2. **scheduleReminders** — event: `invoice/created`, uses `step.sleepUntil()` for up to 7 reminder slots (before_due_7d/3d/1d, on_due, after_due_3d/7d/14d)
3. **checkOverdue** — cron: `0 9 * * *`, marks pending past-due invoices as overdue

Trigger flow: User submits invoice → DB insert → `inngest.send('invoice/created')` → [parallel] notifyOwner + scheduleReminders

## Database — 6 Tables (Drizzle + Neon)
- **users** — Clerk userId as PK, email, name, businessName, plan (free/starter/pro), timezone
- **customers** — userId FK, name, email, phone (E.164 format: +919876543210), company
- **invoices** — userId FK, customerId FK, invoiceNumber, amount, currency, dueDate, issueDate, description, status (pending/due_soon/overdue/paid/cancelled), fileUrl, extractedData (jsonb), aiConfidence, paidAt, notes
- **reminders** — invoiceId FK, type, channel (email/whatsapp/both), scheduledAt, sentAt, status (pending/sent/failed/skipped), messageBody, error
- **reminder_settings** — userId FK, 7 boolean timing toggles, emailEnabled, whatsappEnabled, customMessage, senderName
- **notifications** — audit log, userId FK, reminderId FK, channel, recipient, subject, status (delivered/bounced/failed/read), externalId (Resend/Meta message ID), sentAt

Run migrations with: `npx drizzle-kit push` (use `DATABASE_URL_UNPOOLED`)

## WhatsApp
- Provider: Meta WhatsApp Cloud API — **NOT Twilio, no BSP markup**
- Endpoint: `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- Auth: Bearer `META_WHATSAPP_ACCESS_TOKEN`
- Template: `payment_reminder` (UTILITY category — must be Meta-approved)
- Webhook: `GET /api/webhooks/whatsapp` (verify) + `POST` (delivery status)
- Code: `lib/whatsapp.ts` → `sendWhatsAppReminder()` — native fetch, no SDK

## Key File Paths
| File | Purpose |
|---|---|
| `lib/auth.ts` | `getOrCreateUser()` lazy sync |
| `lib/gemini.ts` | Gemini 3.1 extraction |
| `lib/email.ts` | Resend sender functions |
| `lib/whatsapp.ts` | Meta WhatsApp sender |
| `lib/db/schema.ts` | All 6 Drizzle table definitions |
| `lib/db/index.ts` | Drizzle client |
| `inngest/client.ts` | Inngest init |
| `inngest/functions/notifyOwner.ts` | Owner confirmation |
| `inngest/functions/scheduleReminders.ts` | Customer reminder scheduler |
| `inngest/functions/checkOverdue.ts` | Daily overdue cron |
| `app/api/invoices/route.ts` | POST: create invoice + fire inngest |
| `app/api/invoices/extract/route.ts` | POST: Gemini AI extraction |
| `app/api/inngest/route.ts` | Serve 3 Inngest functions |
| `app/api/webhooks/whatsapp/route.ts` | Meta webhook handler |
| `app/page.tsx` | Public landing page |

## Project Structure
```
app/
  (auth)/sign-in/[[...sign-in]]/page.tsx
  (auth)/sign-up/[[...sign-up]]/page.tsx
  (dashboard)/dashboard/page.tsx          # Stats + recent invoices
  (dashboard)/invoices/page.tsx           # Invoice list + filters
  (dashboard)/invoices/new/page.tsx       # Create form + file upload
  (dashboard)/invoices/[id]/page.tsx      # Detail + reminder timeline
  (dashboard)/customers/page.tsx
  (dashboard)/settings/page.tsx
  api/inngest/route.ts
  api/invoices/route.ts
  api/invoices/[id]/route.ts
  api/invoices/[id]/mark-paid/route.ts
  api/invoices/extract/route.ts
  api/customers/route.ts
  api/upload/route.ts
  api/webhooks/resend/route.ts
  api/webhooks/whatsapp/route.ts
  layout.tsx
  page.tsx                                # Public landing page
components/
  dashboard/StatsCards.tsx
  dashboard/InvoiceTable.tsx
  dashboard/InvoiceStatusBadge.tsx
  dashboard/ReminderTimeline.tsx
  invoices/InvoiceForm.tsx
  invoices/FileUpload.tsx
  invoices/ExtractedPreview.tsx
  ui/                                     # shadcn/ui components
emails/
  PaymentReminderEmail.tsx
  OwnerConfirmationEmail.tsx
  OverdueNoticeEmail.tsx
inngest/
  client.ts
  functions/notifyOwner.ts
  functions/scheduleReminders.ts
  functions/checkOverdue.ts
lib/
  auth.ts
  gemini.ts
  email.ts
  whatsapp.ts
  imagekit.ts
  utils.ts
  db/index.ts
  db/schema.ts
drizzle.config.ts
middleware.ts
```

## Coding Standards
- TypeScript strict mode throughout
- Server components by default — `'use client'` only when needed
- Zod validation on all API inputs
- All API routes return `{ success: boolean, data?, error? }`
- Phone numbers always E.164 format (`+919876543210`)
- Never expose secrets client-side
- No `twilio` package anywhere

## Dev Commands
```bash
npm run dev          # Next.js dev server (Turbopack)
npx inngest-cli dev  # Inngest dev server — port 8288 (required locally)
npx drizzle-kit push # Push schema to Neon (use DATABASE_URL_UNPOOLED)
npx drizzle-kit studio # Visual DB browser
```

## Environment Variables
See `.env.local` (never commit). Key groups:
- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, sign-in/up/redirect URLs
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
