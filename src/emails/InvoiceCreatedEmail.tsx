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

interface LineItem {
  productId?: string;
  name: string;
  rate: number;
  quantity: number;
  subtotal: number;
  unit?: string;
}

export interface InvoiceCreatedEmailProps {
  invoiceNumber: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  discountType: 'flat' | 'percent';
  discountAmount: number;
  discountAmt: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  customerName: string;
  customerShopName?: string;
  customerGstin?: string;
  customerEmail: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  notes?: string;
  appUrl?: string;
}

export function InvoiceCreatedEmail({
  invoiceNumber,
  currency = 'INR',
  issueDate,
  dueDate,
  lineItems = [],
  subtotal,
  discountType,
  discountAmount,
  discountAmt,
  taxRate,
  taxAmount,
  total,
  customerName,
  customerShopName,
  customerGstin,
  businessName,
  ownerEmail,
  notes,
  appUrl = 'https://duemate-opal.vercel.app',
}: InvoiceCreatedEmailProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const hasDiscount = discountAmt > 0;
  const hasTax = taxRate > 0 && taxAmount > 0;
  const discountLabel =
    discountType === 'percent' ? `Discount (${discountAmount}%)` : 'Discount';

  return (
    <Html lang="en">
      <Head />
      <Preview>{`Invoice #${invoiceNumber} from ${businessName} — ${fmt(total)} due ${fmtDate(dueDate)}`}</Preview>
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
                <Text style={invoiceLabel}>INVOICE</Text>
                <Text style={invoiceNum}>#{invoiceNumber}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Dates & Parties ── */}
          <Section style={metaSection}>
            <Row>
              <Column style={{ width: '50%', verticalAlign: 'top' }}>
                <Text style={metaLabel}>BILL TO</Text>
                <Text style={metaValue}>{customerName}</Text>
                {customerShopName ? (
                  <Text style={shopNameStyle}>{customerShopName}</Text>
                ) : null}
                {customerGstin ? (
                  <Text style={gstinStyle}>GSTIN: {customerGstin}</Text>
                ) : null}
              </Column>
              <Column style={{ width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                <Row>
                  <Column style={dateLabel}>Issue Date</Column>
                  <Column style={dateValue}>{fmtDate(issueDate)}</Column>
                </Row>
                <Row>
                  <Column style={dateLabel}>Due Date</Column>
                  <Column style={{ ...dateValue, color: '#DC2626', fontWeight: '600' }}>
                    {fmtDate(dueDate)}
                  </Column>
                </Row>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* ── Line Items Table ── */}
          {lineItems.length > 0 && (
            <Section>
              <Row style={tableHeaderRow}>
                <Column style={{ ...tableHeaderCell, width: '44%' }}>Item</Column>
                <Column style={{ ...tableHeaderCell, width: '14%', textAlign: 'center' }}>Qty</Column>
                <Column style={{ ...tableHeaderCell, width: '20%', textAlign: 'right' }}>Rate</Column>
                <Column style={{ ...tableHeaderCell, width: '22%', textAlign: 'right' }}>Amount</Column>
              </Row>

              {lineItems.map((item, i) => (
                <Row key={i} style={i % 2 === 0 ? tableRowEven : tableRowOdd}>
                  <Column style={{ ...tableCell, width: '44%' }}>
                    <Text style={itemName}>{item.name}</Text>
                    {item.unit ? <Text style={itemUnit}>{item.unit}</Text> : null}
                  </Column>
                  <Column style={{ ...tableCell, width: '14%', textAlign: 'center' }}>
                    <Text style={tableText}>{`${item.quantity}`}</Text>
                  </Column>
                  <Column style={{ ...tableCell, width: '20%', textAlign: 'right' }}>
                    <Text style={tableText}>{fmt(item.rate)}</Text>
                  </Column>
                  <Column style={{ ...tableCell, width: '22%', textAlign: 'right' }}>
                    <Text style={tableText}>{fmt(item.subtotal)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {/* ── Totals ── */}
          <Hr style={divider} />
          <Section style={totalsSection}>
            <Row style={totalRow}>
              <Column style={totalLabel}>Subtotal</Column>
              <Column style={totalValue}>{fmt(subtotal)}</Column>
            </Row>

            {hasDiscount && (
              <Row style={totalRow}>
                <Column style={totalLabel}>{discountLabel}</Column>
                <Column style={{ ...totalValue, color: '#16A34A' }}>− {fmt(discountAmt)}</Column>
              </Row>
            )}

            {hasTax && (
              <Row style={totalRow}>
                <Column style={totalLabel}>{`GST / Tax (${taxRate}%)`}</Column>
                <Column style={totalValue}>{fmt(taxAmount)}</Column>
              </Row>
            )}

            <Hr style={{ ...divider, margin: '8px 0' }} />

            <Row style={totalRow}>
              <Column style={grandTotalLabel}>Total Due</Column>
              <Column style={grandTotalValue}>{fmt(total)}</Column>
            </Row>
          </Section>

          {/* ── Notes ── */}
          {notes && (
            <>
              <Hr style={divider} />
              <Section style={notesSection}>
                <Text style={notesLabel}>Notes</Text>
                <Text style={notesText}>{notes}</Text>
              </Section>
            </>
          )}

          <Hr style={divider} />

          {/* ── Thank You ── */}
          <Section style={thankYouSection}>
            <Text style={thankYouHeading}>Thank you for your purchase! 🙏</Text>
            <Text style={thankYouBody}>
              We truly appreciate your business,{' '}
              <span style={{ color: '#4F46E5', fontWeight: '600' }}>{customerName}</span>.
              It was a pleasure serving you — we look forward to welcoming you back soon!
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
              Questions? Reply to this email or contact{' '}
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

export default InvoiceCreatedEmail;

/* ── Styles ─────────────────────────────────────────────────── */
const body: React.CSSProperties = {
  backgroundColor: '#EEF2FF',
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
  boxShadow: '0 2px 8px rgba(79,70,229,0.10)',
};

/* Header */
const header: React.CSSProperties = { padding: '28px 32px 20px' };
const brandName: React.CSSProperties = {
  fontSize: '21px', fontWeight: '800', color: '#4F46E5', margin: '0 0 2px', letterSpacing: '-0.3px',
};
const brandSub: React.CSSProperties = {
  fontSize: '11px', color: '#A5B4FC', margin: 0, letterSpacing: '0.3px',
};
const invoiceLabel: React.CSSProperties = {
  fontSize: '11px', color: '#A5B4FC', letterSpacing: '2px', margin: '0 0 2px', textAlign: 'right',
};
const invoiceNum: React.CSSProperties = {
  fontSize: '18px', fontWeight: '800', color: '#4F46E5', margin: 0, textAlign: 'right',
};

/* Divider */
const divider: React.CSSProperties = { borderColor: '#E0E7FF', margin: '0' };

/* Parties / Dates */
const metaSection: React.CSSProperties = { padding: '20px 32px' };
const metaLabel: React.CSSProperties = {
  fontSize: '10px', color: '#A5B4FC', letterSpacing: '1.5px',
  textTransform: 'uppercase', margin: '0 0 4px',
};
const metaValue: React.CSSProperties = {
  fontSize: '16px', fontWeight: '700', color: '#1D4ED8', margin: '0 0 2px',
};
const shopNameStyle: React.CSSProperties = {
  fontSize: '13px', color: '#0369A1', fontWeight: '500', margin: '0 0 2px',
};
const gstinStyle: React.CSSProperties = {
  fontSize: '11px', color: '#6366F1', fontWeight: '500', margin: 0, letterSpacing: '0.5px',
};
const dateLabel: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', padding: '2px 0', textAlign: 'right', paddingRight: '12px',
};
const dateValue: React.CSSProperties = {
  fontSize: '12px', color: '#1D4ED8', fontWeight: '600', padding: '2px 0', textAlign: 'right',
};

/* Table */
const tableHeaderRow: React.CSSProperties = { backgroundColor: '#EEF2FF', padding: '0 32px' };
const tableHeaderCell: React.CSSProperties = {
  fontSize: '11px', color: '#6366F1', letterSpacing: '0.8px', textTransform: 'uppercase',
  padding: '10px 8px 10px 32px', borderBottom: '1px solid #E0E7FF',
};
const tableRowEven: React.CSSProperties = { backgroundColor: '#FFFFFF' };
const tableRowOdd: React.CSSProperties = { backgroundColor: '#F5F7FF' };
const tableCell: React.CSSProperties = { padding: '10px 8px 10px 32px', verticalAlign: 'top' };
const tableText: React.CSSProperties = { fontSize: '13px', color: '#374151', margin: 0 };
const itemName: React.CSSProperties = {
  fontSize: '13px', color: '#1D4ED8', fontWeight: '600', margin: '0 0 1px',
};
const itemUnit: React.CSSProperties = { fontSize: '11px', color: '#A5B4FC', margin: 0 };

/* Totals */
const totalsSection: React.CSSProperties = { padding: '16px 32px 20px' };
const totalRow: React.CSSProperties = { marginBottom: '4px' };
const totalLabel: React.CSSProperties = {
  fontSize: '13px', color: '#6B7280', padding: '4px 0', width: '70%',
};
const totalValue: React.CSSProperties = {
  fontSize: '13px', color: '#374151', fontWeight: '500', textAlign: 'right', padding: '4px 0',
};
const grandTotalLabel: React.CSSProperties = {
  fontSize: '15px', color: '#1D4ED8', fontWeight: '700', padding: '8px 0', width: '70%',
};
const grandTotalValue: React.CSSProperties = {
  fontSize: '20px', color: '#4F46E5', fontWeight: '800', textAlign: 'right', padding: '8px 0',
};

/* Notes */
const notesSection: React.CSSProperties = { padding: '16px 32px' };
const notesLabel: React.CSSProperties = {
  fontSize: '11px', color: '#A5B4FC', letterSpacing: '1.5px',
  textTransform: 'uppercase', margin: '0 0 6px',
};
const notesText: React.CSSProperties = {
  fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.6',
};

/* Thank You */
const thankYouSection: React.CSSProperties = {
  backgroundColor: '#F5F3FF',
  padding: '24px 32px',
  textAlign: 'center',
};
const thankYouHeading: React.CSSProperties = {
  fontSize: '18px', fontWeight: '800', color: '#4F46E5',
  margin: '0 0 10px', letterSpacing: '-0.2px',
};
const thankYouBody: React.CSSProperties = {
  fontSize: '14px', color: '#374151', lineHeight: '1.7',
  margin: '0 0 10px',
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
