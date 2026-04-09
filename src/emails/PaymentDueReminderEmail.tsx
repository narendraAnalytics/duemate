import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface OverdueInvoice {
  invoiceNumber: string;
  amount: number;
  daysOverdue: number;
  dueDate: string;
  currency?: string;
}

export interface PaymentDueReminderEmailProps {
  customerName: string;
  businessName: string;
  ownerEmail: string;
  overdueInvoices: OverdueInvoice[];
  appUrl?: string;
}

export function PaymentDueReminderEmail({
  customerName,
  businessName,
  ownerEmail,
  overdueInvoices,
  appUrl = 'https://duemate-opal.vercel.app',
}: PaymentDueReminderEmailProps) {
  const totalDue = overdueInvoices.reduce((s, i) => s + i.amount, 0);

  const fmt = (n: number, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {`Friendly reminder from ${businessName} — ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} pending payment (${fmt(totalDue)})`}
      </Preview>
      <Body style={body}>
        <Container style={container}>

          {/* ── Header ── */}
          <Section style={header}>
            <Row>
              <Column>
                <Text style={brandName}>{businessName}</Text>
                <Text style={brandSub}>powered by DueMate</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={reminderLabel}>PAYMENT REMINDER</Text>
                <Text style={reminderDate}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Alert Banner ── */}
          <Section style={alertBanner}>
            <Text style={alertText}>⚠️ Friendly Payment Reminder</Text>
          </Section>

          <Hr style={divider} />

          {/* ── Greeting ── */}
          <Section style={greetSection}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={greetBody}>
              We hope you are doing well! This is a gentle reminder that the following
              invoice{overdueInvoices.length > 1 ? 's are' : ' is'} past the due date.
              We would appreciate your prompt attention to clear the outstanding balance.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ── Invoice List ── */}
          <Section style={invoiceSection}>
            <Text style={sectionTitle}>Outstanding Invoices</Text>

            {/* Table header */}
            <Row style={tableHead}>
              <Column style={{ ...thCell, width: '30%' }}>Invoice #</Column>
              <Column style={{ ...thCell, width: '28%' }}>Due Date</Column>
              <Column style={{ ...thCell, width: '22%', textAlign: 'right' }}>Amount</Column>
              <Column style={{ ...thCell, width: '20%', textAlign: 'center' }}>Status</Column>
            </Row>

            {overdueInvoices.map((inv, i) => (
              <Row key={inv.invoiceNumber} style={i % 2 === 0 ? rowEven : rowOdd}>
                <Column style={{ ...tdCell, width: '30%' }}>
                  <Text style={invNumText}>#{inv.invoiceNumber}</Text>
                </Column>
                <Column style={{ ...tdCell, width: '28%' }}>
                  <Text style={tdText}>{fmtDate(inv.dueDate)}</Text>
                </Column>
                <Column style={{ ...tdCell, width: '22%', textAlign: 'right' }}>
                  <Text style={amountText}>{fmt(inv.amount, inv.currency ?? 'INR')}</Text>
                </Column>
                <Column style={{ ...tdCell, width: '20%', textAlign: 'center' }}>
                  <Text style={overdueBadge(inv.daysOverdue)}>
                    {`${inv.daysOverdue}d late`}
                  </Text>
                </Column>
              </Row>
            ))}

            {/* Total row */}
            <Hr style={{ ...divider, margin: '8px 0 0' }} />
            <Row style={totalRow}>
              <Column style={totalLabelCell}>Total Outstanding</Column>
              <Column style={totalAmountCell}>{fmt(totalDue)}</Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Incentive: Pay on time = discount ── */}
          <Section style={incentiveSection}>
            <Text style={incentiveHeading}>💰 Pay On Time &amp; Save!</Text>
            <Text style={incentiveBody}>
              As a valued customer, we want to reward your loyalty. Settle your outstanding
              dues promptly and{' '}
              <span style={{ color: '#15803D', fontWeight: '700' }}>
                enjoy a special discount on your next bill!
              </span>
              {' '}On-time payments help us serve you better with priority service and
              exclusive offers.
            </Text>
            <Section style={discountBadgeSection}>
              <Text style={discountBadge}>🎁 DISCOUNT ON NEXT BILL</Text>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* ── New Stock Section ── */}
          <Section style={stockSection}>
            <Text style={stockHeading}>🛍️ New Arrivals Just For You!</Text>
            <Text style={stockBody}>
              We have added exciting new products to our collection that we think you will love.
              Clear your dues today and come visit us to explore the latest arrivals — fresh
              stock, great quality, just for our valued customers like you!
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ── Warm Close ── */}
          <Section style={closeSection}>
            <Text style={closeText}>
              We truly value your business and the trust you place in us.
              Please reply to this email or contact us directly if you have any questions
              about your invoices or need to discuss payment arrangements.
            </Text>
            <Text style={closeSignoff}>
              Warm regards,{'\n'}
              <span style={{ color: '#D97706', fontWeight: '700' }}>{businessName}</span>
            </Text>
            <Text style={contactText}>
              📧 <span style={{ color: '#4F46E5' }}>{ownerEmail}</span>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ── Footer ── */}
          <Section style={footer}>
            <Text style={footerText}>
              This is a friendly payment reminder sent on behalf of{' '}
              <span style={{ color: '#D97706' }}>{businessName}</span>.
              Reply to this email to reach them directly.
            </Text>
            <Text style={footerPowered}>
              Sent via{' '}
              <a href={appUrl} style={{ color: '#818CF8', textDecoration: 'none' }}>
                DueMate
              </a>{' '}
              · Payment tracking for modern businesses
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default PaymentDueReminderEmail;

/* ── Styles ─────────────────────────────────────────────────── */
const body: React.CSSProperties = {
  backgroundColor: '#FFFBEB',
  margin: 0,
  padding: '32px 0',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};
const container: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  maxWidth: '600px',
  margin: '0 auto',
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(217,119,6,0.12)',
};

/* Header */
const header: React.CSSProperties = { padding: '28px 32px 20px' };
const brandName: React.CSSProperties = {
  fontSize: '21px', fontWeight: '800', color: '#D97706', margin: '0 0 2px', letterSpacing: '-0.3px',
};
const brandSub: React.CSSProperties = {
  fontSize: '11px', color: '#FCD34D', margin: 0, letterSpacing: '0.3px',
};
const reminderLabel: React.CSSProperties = {
  fontSize: '10px', color: '#FCD34D', letterSpacing: '2px', margin: '0 0 2px', textAlign: 'right',
};
const reminderDate: React.CSSProperties = {
  fontSize: '13px', fontWeight: '700', color: '#92400E', margin: 0, textAlign: 'right',
};

/* Alert Banner */
const alertBanner: React.CSSProperties = {
  backgroundColor: '#FEF3C7', padding: '12px 32px', textAlign: 'center',
};
const alertText: React.CSSProperties = {
  fontSize: '13px', fontWeight: '800', color: '#92400E', letterSpacing: '0.5px', margin: 0,
};

const divider: React.CSSProperties = { borderColor: '#FEF3C7', margin: '0' };

/* Greeting */
const greetSection: React.CSSProperties = { padding: '20px 32px' };
const greeting: React.CSSProperties = {
  fontSize: '17px', fontWeight: '700', color: '#92400E', margin: '0 0 8px',
};
const greetBody: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: 0,
};

/* Invoice table */
const invoiceSection: React.CSSProperties = { padding: '16px 32px' };
const sectionTitle: React.CSSProperties = {
  fontSize: '11px', color: '#D97706', letterSpacing: '1.5px',
  textTransform: 'uppercase', fontWeight: '700', margin: '0 0 12px',
};
const tableHead: React.CSSProperties = { backgroundColor: '#FFFBEB' };
const thCell: React.CSSProperties = {
  fontSize: '11px', color: '#92400E', letterSpacing: '0.5px',
  textTransform: 'uppercase', padding: '8px 0', fontWeight: '700',
};
const rowEven: React.CSSProperties = { backgroundColor: '#FFFFFF' };
const rowOdd: React.CSSProperties = { backgroundColor: '#FFFBEB' };
const tdCell: React.CSSProperties = { padding: '10px 0', verticalAlign: 'middle' };
const tdText: React.CSSProperties = { fontSize: '13px', color: '#374151', margin: 0 };
const invNumText: React.CSSProperties = {
  fontSize: '13px', color: '#D97706', fontWeight: '700', margin: 0,
};
const amountText: React.CSSProperties = {
  fontSize: '14px', color: '#DC2626', fontWeight: '700', margin: 0,
};
const overdueBadge = (days: number): React.CSSProperties => ({
  display: 'inline-block',
  backgroundColor: days > 7 ? '#FEF2F2' : '#FFFBEB',
  color: days > 7 ? '#DC2626' : '#D97706',
  fontSize: '11px',
  fontWeight: '700',
  padding: '3px 8px',
  borderRadius: '10px',
  border: `1px solid ${days > 7 ? '#FECACA' : '#FDE68A'}`,
  margin: 0,
});
const totalRow: React.CSSProperties = { padding: '4px 0' };
const totalLabelCell: React.CSSProperties = {
  fontSize: '14px', fontWeight: '700', color: '#92400E', padding: '10px 0', width: '80%',
};
const totalAmountCell: React.CSSProperties = {
  fontSize: '18px', fontWeight: '800', color: '#DC2626', padding: '10px 0', textAlign: 'right',
};

/* Incentive */
const incentiveSection: React.CSSProperties = {
  backgroundColor: '#F0FDF4', padding: '20px 32px',
};
const incentiveHeading: React.CSSProperties = {
  fontSize: '16px', fontWeight: '800', color: '#15803D', margin: '0 0 8px',
};
const incentiveBody: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 14px',
};
const discountBadgeSection: React.CSSProperties = { textAlign: 'center' };
const discountBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#DCFCE7',
  color: '#15803D',
  fontSize: '13px',
  fontWeight: '800',
  padding: '8px 24px',
  borderRadius: '20px',
  border: '2px dashed #86EFAC',
  letterSpacing: '0.5px',
  margin: 0,
};

/* New Stock */
const stockSection: React.CSSProperties = {
  backgroundColor: '#EEF2FF', padding: '20px 32px',
};
const stockHeading: React.CSSProperties = {
  fontSize: '16px', fontWeight: '800', color: '#4F46E5', margin: '0 0 8px',
};
const stockBody: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: 0,
};

/* Close */
const closeSection: React.CSSProperties = { padding: '20px 32px' };
const closeText: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 12px',
};
const closeSignoff: React.CSSProperties = {
  fontSize: '14px', color: '#374151', margin: '0 0 4px', whiteSpace: 'pre-line',
};
const contactText: React.CSSProperties = {
  fontSize: '13px', color: '#374151', margin: 0,
};

/* Footer */
const footer: React.CSSProperties = {
  backgroundColor: '#F9FAFB', padding: '20px 32px', textAlign: 'center',
};
const footerText: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', margin: '0 0 6px', lineHeight: '1.6',
};
const footerPowered: React.CSSProperties = {
  fontSize: '11px', color: '#9CA3AF', margin: 0,
};
