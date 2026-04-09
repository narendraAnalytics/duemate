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

export interface PaymentReceiptEmailProps {
  invoiceNumber: string;
  paymentAmount: number;
  paymentType: 'cash' | 'online';
  paymentReference?: string;
  paymentDate: string;
  totalPaid: number;
  invoiceTotal: number;
  balanceRemaining: number;
  isPaidInFull: boolean;
  customerName: string;
  customerEmail: string;
  businessName: string;
  ownerEmail: string;
  currency?: string;
  appUrl?: string;
}

export function PaymentReceiptEmail({
  invoiceNumber,
  paymentAmount,
  paymentType,
  paymentReference,
  paymentDate,
  totalPaid,
  invoiceTotal,
  balanceRemaining,
  isPaidInFull,
  customerName,
  businessName,
  ownerEmail,
  currency = 'INR',
  appUrl = 'https://duemate-opal.vercel.app',
}: PaymentReceiptEmailProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);

  const paidOn = new Date(paymentDate);
  const formattedDate = paidOn.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const formattedTime = paidOn.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {isPaidInFull
          ? `Payment confirmed — Invoice #${invoiceNumber} fully settled by ${businessName}`
          : `${fmt(paymentAmount)} received — Invoice #${invoiceNumber} from ${businessName}`}
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
                <Text style={receiptLabel}>PAYMENT RECEIPT</Text>
                <Text style={receiptNum}>#{invoiceNumber}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Status Banner ── */}
          <Section style={isPaidInFull ? paidBanner : partialBanner}>
            <Text style={isPaidInFull ? paidBannerText : partialBannerText}>
              {isPaidInFull ? '✓ INVOICE FULLY PAID' : '✓ PAYMENT RECEIVED'}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ── Greeting ── */}
          <Section style={greetSection}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={greetBody}>
              {isPaidInFull
                ? `Your payment has been received and Invoice #${invoiceNumber} is now fully settled. Thank you!`
                : `We've received your payment of ${fmt(paymentAmount)} for Invoice #${invoiceNumber}. The remaining balance is shown below.`}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ── Payment Details ── */}
          <Section style={detailSection}>
            <Text style={sectionTitle}>Payment Details</Text>

            <Row style={detailRow}>
              <Column style={labelCol}>Amount Paid</Column>
              <Column style={{ ...valueCol, color: '#16A34A', fontSize: '18px', fontWeight: '800' }}>
                {fmt(paymentAmount)}
              </Column>
            </Row>
            <Hr style={innerDivider} />

            <Row style={detailRow}>
              <Column style={labelCol}>Payment Mode</Column>
              <Column style={valueCol}>
                {paymentType === 'cash' ? '💵 Cash' : '💳 Online Transfer'}
              </Column>
            </Row>
            <Hr style={innerDivider} />

            <Row style={detailRow}>
              <Column style={labelCol}>Date</Column>
              <Column style={valueCol}>{formattedDate}</Column>
            </Row>
            <Hr style={innerDivider} />

            <Row style={detailRow}>
              <Column style={labelCol}>Time</Column>
              <Column style={valueCol}>{formattedTime}</Column>
            </Row>

            {paymentReference ? (
              <>
                <Hr style={innerDivider} />
                <Row style={detailRow}>
                  <Column style={labelCol}>Reference</Column>
                  <Column style={{ ...valueCol, color: '#4F46E5' }}>{paymentReference}</Column>
                </Row>
              </>
            ) : null}
          </Section>

          <Hr style={divider} />

          {/* ── Balance Summary ── */}
          <Section style={detailSection}>
            <Text style={sectionTitle}>Account Summary</Text>

            <Row style={detailRow}>
              <Column style={labelCol}>Invoice Total</Column>
              <Column style={valueCol}>{fmt(invoiceTotal)}</Column>
            </Row>
            <Hr style={innerDivider} />

            <Row style={detailRow}>
              <Column style={labelCol}>Total Paid</Column>
              <Column style={{ ...valueCol, color: '#16A34A', fontWeight: '700' }}>{fmt(totalPaid)}</Column>
            </Row>
            <Hr style={innerDivider} />

            <Row style={detailRow}>
              <Column style={labelCol}>Balance Due</Column>
              <Column
                style={{
                  ...valueCol,
                  color: isPaidInFull ? '#16A34A' : '#DC2626',
                  fontWeight: '700',
                  fontSize: '15px',
                }}
              >
                {isPaidInFull ? 'NIL — Fully Settled ✓' : fmt(balanceRemaining)}
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Thank You ── */}
          <Section style={thankYouSection}>
            <Text style={thankYouHeading}>Thank you for your payment! 🙏</Text>
            <Text style={thankYouBody}>
              We appreciate your prompt payment,{' '}
              <span style={{ color: '#4F46E5', fontWeight: '600' }}>{customerName}</span>.
              {isPaidInFull
                ? ' Your account is fully clear. We look forward to doing business with you again!'
                : ' Please make the remaining payment at your earliest convenience.'}
            </Text>
            <Text style={thankYouTagline}>
              Come back anytime ·{' '}
              <span style={{ color: '#0369A1' }}>{businessName}</span>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* ── Footer ── */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Contact{' '}
              <span style={{ color: '#4F46E5' }}>{ownerEmail}</span>
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

export default PaymentReceiptEmail;

/* ── Styles ─────────────────────────────────────────────────── */
const body: React.CSSProperties = {
  backgroundColor: '#F0FDF4',
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
  boxShadow: '0 2px 8px rgba(22,163,74,0.10)',
};
const header: React.CSSProperties = { padding: '28px 32px 20px' };
const brandName: React.CSSProperties = {
  fontSize: '21px', fontWeight: '800', color: '#16A34A', margin: '0 0 2px', letterSpacing: '-0.3px',
};
const brandSub: React.CSSProperties = {
  fontSize: '11px', color: '#86EFAC', margin: 0, letterSpacing: '0.3px',
};
const receiptLabel: React.CSSProperties = {
  fontSize: '11px', color: '#86EFAC', letterSpacing: '2px', margin: '0 0 2px', textAlign: 'right',
};
const receiptNum: React.CSSProperties = {
  fontSize: '18px', fontWeight: '800', color: '#15803D', margin: 0, textAlign: 'right',
};
const divider: React.CSSProperties = { borderColor: '#DCFCE7', margin: '0' };
const innerDivider: React.CSSProperties = { borderColor: '#F0FDF4', margin: '0' };

/* Status banner */
const paidBanner: React.CSSProperties = {
  backgroundColor: '#DCFCE7', padding: '12px 32px', textAlign: 'center',
};
const paidBannerText: React.CSSProperties = {
  fontSize: '13px', fontWeight: '800', color: '#15803D',
  letterSpacing: '1.5px', margin: 0,
};
const partialBanner: React.CSSProperties = {
  backgroundColor: '#EFF6FF', padding: '12px 32px', textAlign: 'center',
};
const partialBannerText: React.CSSProperties = {
  fontSize: '13px', fontWeight: '800', color: '#1D4ED8',
  letterSpacing: '1.5px', margin: 0,
};

/* Greeting */
const greetSection: React.CSSProperties = { padding: '20px 32px' };
const greeting: React.CSSProperties = {
  fontSize: '17px', fontWeight: '700', color: '#15803D', margin: '0 0 8px',
};
const greetBody: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.65', margin: 0,
};

/* Details */
const detailSection: React.CSSProperties = { padding: '16px 32px' };
const sectionTitle: React.CSSProperties = {
  fontSize: '11px', color: '#86EFAC', letterSpacing: '1.5px',
  textTransform: 'uppercase', margin: '0 0 12px', fontWeight: '700',
};
const detailRow: React.CSSProperties = { padding: '2px 0' };
const labelCol: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', padding: '9px 0', width: '40%',
};
const valueCol: React.CSSProperties = {
  fontSize: '14px', color: '#1D4ED8', fontWeight: '600', padding: '9px 0',
};

/* Thank You */
const thankYouSection: React.CSSProperties = {
  backgroundColor: '#F0FDF4', padding: '24px 32px', textAlign: 'center',
};
const thankYouHeading: React.CSSProperties = {
  fontSize: '18px', fontWeight: '800', color: '#15803D',
  margin: '0 0 10px', letterSpacing: '-0.2px',
};
const thankYouBody: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 10px',
};
const thankYouTagline: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', margin: 0, fontStyle: 'italic',
};

/* Footer */
const footer: React.CSSProperties = {
  backgroundColor: '#F9FAFB', padding: '20px 32px', textAlign: 'center',
};
const footerText: React.CSSProperties = {
  fontSize: '13px', color: '#374151', margin: '0 0 6px',
};
const footerPowered: React.CSSProperties = {
  fontSize: '11px', color: '#9CA3AF', margin: 0,
};
