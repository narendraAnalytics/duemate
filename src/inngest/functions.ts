import { Resend } from 'resend';
import * as React from 'react';
import { and, eq, inArray, lte, sql, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { invoices, customers, users, notifications } from '@/lib/schema';
import { inngest } from './client';
import { InvoiceCreatedEmail, InvoiceCreatedEmailProps } from '@/emails/InvoiceCreatedEmail';
import { PaymentReceiptEmail, PaymentReceiptEmailProps } from '@/emails/PaymentReceiptEmail';
import { PaymentDueReminderEmail, OverdueInvoice } from '@/emails/PaymentDueReminderEmail';

// Free plan: max 3 emails per buyer per month
const FREE_EMAIL_CAP = 3;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
  const name = process.env.RESEND_FROM_NAME ?? 'DueMate';
  const email = process.env.RESEND_FROM_EMAIL ?? 'admin@buildflows.shop';
  return `${name} <${email}>`;
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Count emails sent to a buyer from a specific user this month */
async function emailCountThisMonth(userId: string, recipient: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.recipient, recipient),
      gte(notifications.sentAt, startOfCurrentMonth()),
    ));
  return total;
}

/** Log a sent email to the notifications audit table and stamp lastEmailSentAt on the buyer */
async function logEmail(userId: string, recipient: string, subject: string, externalId?: string | null) {
  const now = new Date();
  await Promise.all([
    db.insert(notifications).values({
      userId,
      channel: 'email',
      recipient,
      subject,
      status: 'delivered',
      externalId: externalId ?? null,
    }),
    db.update(customers)
      .set({ lastEmailSentAt: now })
      .where(and(eq(customers.userId, userId), eq(customers.email, recipient))),
  ]);
}

/** Check if user is on free plan and has hit the monthly cap for this buyer */
async function isEmailCapped(userId: string, recipient: string): Promise<boolean> {
  const rows = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!rows.length || rows[0].plan !== 'free') return false;
  const count = await emailCountThisMonth(userId, recipient);
  return count >= FREE_EMAIL_CAP;
}

/* ── 1. Invoice Created ───────────────────────────────────────────── */
export const notifyOwnerOnInvoiceCreated = inngest.createFunction(
  { id: 'notify-owner-invoice-created', triggers: [{ event: 'invoice/created' }] },
  async ({ event, step }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = event.data as any;
    const userId: string = d.userId;
    const customerEmail: string = d.customerEmail;
    const subject = `Invoice #${d.invoiceNumber} from ${d.businessName}`;

    // Step 1: Check free plan monthly email cap
    const capped = await step.run('check-email-cap', async () =>
      isEmailCapped(userId, customerEmail)
    );
    if (capped) {
      return { skipped: true, reason: 'free_plan_cap', cap: FREE_EMAIL_CAP };
    }

    // Step 2: Send email
    const externalId = await step.run('send-invoice-created-email', async () => {
      const resend = getResend();
      const result = await resend.emails.send({
        from: fromAddress(),
        to: customerEmail,
        replyTo: d.ownerEmail as string,
        subject,
        react: React.createElement(InvoiceCreatedEmail, d as InvoiceCreatedEmailProps),
      });
      return result.data?.id ?? null;
    });

    // Step 3: Log to notifications
    await step.run('log-notification', async () =>
      logEmail(userId, customerEmail, subject, externalId)
    );
  }
);

/* ── 2. Payment Recorded ──────────────────────────────────────────── */
export const notifyOwnerOnPayment = inngest.createFunction(
  { id: 'notify-owner-payment-recorded', triggers: [{ event: 'invoice/payment.recorded' }] },
  async ({ event, step }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = event.data as any;
    const userId: string = d.userId;
    const customerEmail: string = d.customerEmail;
    const subject = d.isPaidInFull
      ? `Payment confirmed — Invoice #${d.invoiceNumber} fully settled`
      : `Payment of ${d.paymentAmount} received — Invoice #${d.invoiceNumber}`;

    // Step 1: Check free plan monthly email cap
    const capped = await step.run('check-email-cap', async () =>
      isEmailCapped(userId, customerEmail)
    );
    if (capped) {
      return { skipped: true, reason: 'free_plan_cap', cap: FREE_EMAIL_CAP };
    }

    // Step 2: Send email
    const externalId = await step.run('send-payment-receipt-email', async () => {
      const resend = getResend();
      const result = await resend.emails.send({
        from: fromAddress(),
        to: customerEmail,
        replyTo: d.ownerEmail as string,
        subject,
        react: React.createElement(PaymentReceiptEmail, d as PaymentReceiptEmailProps),
      });
      return result.data?.id ?? null;
    });

    // Step 3: Log to notifications
    await step.run('log-notification', async () =>
      logEmail(userId, customerEmail, subject, externalId)
    );
  }
);

/* ── 3. Daily Overdue Check (cron: 11:00 AM IST = 5:30 AM UTC) ───── */
export const checkOverdueInvoices = inngest.createFunction(
  { id: 'check-overdue-invoices', triggers: [{ cron: '30 5 * * *' }] },
  async ({ step }) => {

    // Step 1: Find pending invoices past their due date
    const overdueRows = await step.run('find-overdue-invoices', async () => {
      return db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          amount: invoices.amount,
          balanceAmount: invoices.balanceAmount,
          currency: invoices.currency,
          dueDate: invoices.dueDate,
          userId: invoices.userId,
          customerId: invoices.customerId,
          userEmail: users.email,
          userName: users.name,
          businessName: users.businessName,
          userPlan: users.plan,
          customerName: customers.name,
          customerEmail: customers.email,
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.userId, users.id))
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(and(eq(invoices.status, 'pending'), lte(invoices.dueDate, sql`NOW()`)));
    });

    if (overdueRows.length === 0) return { updated: 0, emailsSent: 0, skipped: 0 };

    // Step 2: Mark all as overdue
    await step.run('mark-overdue', async () => {
      await db
        .update(invoices)
        .set({ status: 'overdue' })
        .where(inArray(invoices.id, overdueRows.map((r) => r.id)));
    });

    // Step 3: Group by buyer — one email per buyer
    const byCustomer = new Map<string, {
      userId: string;
      userPlan: string;
      email: string;
      name: string;
      businessName: string;
      ownerEmail: string;
      invoices: OverdueInvoice[];
    }>();

    const now = new Date();
    for (const row of overdueRows) {
      if (!row.customerEmail) continue;
      const key = row.customerId ?? row.customerEmail;
      const dueDate = row.dueDate ? new Date(row.dueDate) : now;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000));
      const entry = byCustomer.get(key) ?? {
        userId: row.userId ?? '',
        userPlan: row.userPlan ?? 'free',
        email: row.customerEmail,
        name: row.customerName ?? 'Customer',
        businessName: row.businessName ?? row.userName ?? 'Business',
        ownerEmail: row.userEmail ?? '',
        invoices: [],
      };
      entry.invoices.push({
        invoiceNumber: row.invoiceNumber ?? '',
        amount: Number(row.balanceAmount ?? row.amount ?? 0),
        daysOverdue,
        dueDate: dueDate.toISOString(),
        currency: row.currency ?? 'INR',
      });
      byCustomer.set(key, entry);
    }

    // Step 4: Send emails (skip free plan buyers over monthly cap)
    const results = await step.run('send-overdue-emails', async () => {
      const resend = getResend();
      let emailsSent = 0;
      let skipped = 0;

      await Promise.all(
        Array.from(byCustomer.values()).map(async (buyer) => {
          // Check free plan cap
          if (buyer.userPlan === 'free') {
            const count = await emailCountThisMonth(buyer.userId, buyer.email);
            if (count >= FREE_EMAIL_CAP) {
              skipped++;
              return;
            }
          }

          const subject = `Friendly reminder: ${buyer.invoices.length} invoice${buyer.invoices.length > 1 ? 's' : ''} pending payment — ${buyer.businessName}`;

          const result = await resend.emails.send({
            from: fromAddress(),
            to: buyer.email,
            replyTo: buyer.ownerEmail,
            subject,
            react: React.createElement(PaymentDueReminderEmail, {
              customerName: buyer.name,
              businessName: buyer.businessName,
              ownerEmail: buyer.ownerEmail,
              overdueInvoices: buyer.invoices,
            }),
          });

          // Log to notifications
          if (buyer.userId) {
            await logEmail(buyer.userId, buyer.email, subject, result.data?.id ?? null);
          }
          emailsSent++;
        })
      );

      return { emailsSent, skipped };
    });

    return {
      updated: overdueRows.length,
      emailsSent: results.emailsSent,
      skipped: results.skipped,
    };
  }
);
