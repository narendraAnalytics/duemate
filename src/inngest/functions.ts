import { Resend } from 'resend';
import * as React from 'react';
import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { invoices, customers, users } from '@/lib/schema';
import { inngest } from './client';
import { InvoiceCreatedEmail, InvoiceCreatedEmailProps } from '@/emails/InvoiceCreatedEmail';
import { PaymentReceiptEmail, PaymentReceiptEmailProps } from '@/emails/PaymentReceiptEmail';
import { PaymentDueReminderEmail, OverdueInvoice } from '@/emails/PaymentDueReminderEmail';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
  const name = process.env.RESEND_FROM_NAME ?? 'DueMate';
  const email = process.env.RESEND_FROM_EMAIL ?? 'admin@buildflows.shop';
  return `${name} <${email}>`;
}

/* ── 1. Invoice Created ───────────────────────────────────────────── */
export const notifyOwnerOnInvoiceCreated = inngest.createFunction(
  { id: 'notify-owner-invoice-created', triggers: [{ event: 'invoice/created' }] },
  async ({ event, step }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = event.data as any;
    await step.run('send-invoice-created-email', async () => {
      const resend = getResend();
      await resend.emails.send({
        from: fromAddress(),
        to: d.customerEmail as string,
        replyTo: d.ownerEmail as string,
        subject: `Invoice #${d.invoiceNumber} from ${d.businessName}`,
        react: React.createElement(InvoiceCreatedEmail, d as InvoiceCreatedEmailProps),
      });
    });
  }
);

/* ── 2. Payment Recorded ──────────────────────────────────────────── */
export const notifyOwnerOnPayment = inngest.createFunction(
  { id: 'notify-owner-payment-recorded', triggers: [{ event: 'invoice/payment.recorded' }] },
  async ({ event, step }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = event.data as any;
    await step.run('send-payment-receipt-email', async () => {
      const resend = getResend();
      await resend.emails.send({
        from: fromAddress(),
        to: d.customerEmail as string,
        replyTo: d.ownerEmail as string,
        subject: d.isPaidInFull
          ? `Payment confirmed — Invoice #${d.invoiceNumber} fully settled`
          : `Payment of ${d.paymentAmount} received — Invoice #${d.invoiceNumber}`,
        react: React.createElement(PaymentReceiptEmail, d as PaymentReceiptEmailProps),
      });
    });
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
          currency: invoices.currency,
          dueDate: invoices.dueDate,
          userId: invoices.userId,
          customerId: invoices.customerId,
          userEmail: users.email,
          userName: users.name,
          businessName: users.businessName,
          customerName: customers.name,
          customerEmail: customers.email,
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.userId, users.id))
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(and(eq(invoices.status, 'pending'), lte(invoices.dueDate, sql`NOW()`)));
    });

    if (overdueRows.length === 0) return { updated: 0, emailsSent: 0 };

    // Step 2: Mark all as overdue
    await step.run('mark-overdue', async () => {
      await db
        .update(invoices)
        .set({ status: 'overdue' })
        .where(inArray(invoices.id, overdueRows.map((r) => r.id)));
    });

    // Step 3: Group by buyer (customerId) — send one email per buyer
    const byCustomer = new Map<string, {
      email: string;
      name: string;
      businessName: string;
      ownerEmail: string;
      invoices: OverdueInvoice[];
    }>();

    const now = new Date();
    for (const row of overdueRows) {
      if (!row.customerEmail) continue; // skip buyers with no email
      const key = row.customerId ?? row.customerEmail;
      const dueDate = row.dueDate ? new Date(row.dueDate) : now;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000));
      const entry = byCustomer.get(key) ?? {
        email: row.customerEmail,
        name: row.customerName ?? 'Customer',
        businessName: row.businessName ?? row.userName ?? 'Business',
        ownerEmail: row.userEmail ?? '',
        invoices: [],
      };
      entry.invoices.push({
        invoiceNumber: row.invoiceNumber ?? '',
        amount: Number(row.amount ?? 0),
        daysOverdue,
        dueDate: dueDate.toISOString(),
        currency: row.currency ?? 'INR',
      });
      byCustomer.set(key, entry);
    }

    await step.run('send-overdue-emails', async () => {
      const resend = getResend();
      await Promise.all(
        Array.from(byCustomer.values()).map((buyer) =>
          resend.emails.send({
            from: fromAddress(),
            to: buyer.email,
            replyTo: buyer.ownerEmail,
            subject: `Friendly reminder: ${buyer.invoices.length} invoice${buyer.invoices.length > 1 ? 's' : ''} pending payment — ${buyer.businessName}`,
            react: React.createElement(PaymentDueReminderEmail, {
              customerName: buyer.name,
              businessName: buyer.businessName,
              ownerEmail: buyer.ownerEmail,
              overdueInvoices: buyer.invoices,
            }),
          })
        )
      );
    });

    return { updated: overdueRows.length, emailsSent: byCustomer.size };
  }
);
