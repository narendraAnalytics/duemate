"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Customer = {
  id: string;
  name: string;
  email: string | null;
  shopName: string | null;
  phone: string | null;
  gstin: string | null;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  rate: string;
  unit: string | null;
  quantity: number;
  gstRate: string | null;
  purchaseRate: string | null;
  purchaseDate: string | null;
  supplierShop: string | null;
  supplierPhone: string | null;
  supplierGstin: string | null;
  hsnCode: string | null;
  createdAt: string;
};

type Supplier = {
  id: string;
  name: string;
  shopName: string;
  phone: string | null;
  gstin: string | null;
  createdAt: string;
};

type Tab = "customers" | "products" | "sales" | "insights";

type InvoiceStatus = "pending" | "due_soon" | "overdue" | "paid" | "cancelled";

type PaymentHistoryEntry = {
  amount: number;
  type: "cash" | "online";
  reference: string;
  notes: string;
  paidAt: string;
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string | null;
  amount: string | null;
  currency: string | null;
  dueDate: string | null;
  issueDate: string | null;
  status: InvoiceStatus;
  paymentType: string | null;
  paidAmount: string | null;
  paidCash: string | null;
  paidOnline: string | null;
  balanceAmount: string | null;
  paidAt: string | null;
  lastPaymentAt: string | null;
  paymentReference: string | null;
  paymentNotes: string | null;
  notes: string | null;
  discountType: string | null;
  discountAmount: string | null;
  taxRate: string | null;
  taxAmount: string | null;
  extractedData: { lineItems: LineItem[] } | null;
  paymentHistory: PaymentHistoryEntry[] | null;
  createdAt: string;
  customerId: string | null;
  customerName: string | null;
  customerShopName: string | null;
  customerEmail: string | null;
};

type LineItem = {
  id: string;
  productId: string;
  name: string;
  rate: number;
  quantity: number;
  unit: string;
  subtotal: number;
};

// ─── Design tokens (light theme for dashboard) ────────────────────────────────

const D = {
  bg: "#F4F0E8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAF8F4",
  border: "rgba(129,140,248,0.18)",
  borderFaint: "rgba(0,0,0,0.06)",
  primary: "#5B5EF4",
  primaryLight: "rgba(91,94,244,0.08)",
  amber: "#D97706",
  amberLight: "rgba(217,119,6,0.1)",
  text: "#1C1B2E",
  textMid: "#6B7280",
  textFaint: "#9CA3AF",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
  shadowHover: "0 4px 24px rgba(0,0,0,0.1)",
  radius: "14px",
  radiusSm: "8px",
};

const CC = {
  indigo: "#5B5EF4",
  amber: "#D97706",
  green: "#16A34A",
  red: "#DC2626",
  slate: "#64748B",
  purple: "#9333EA",
  cyan: "#0891B2",
  orange: "#EA580C",
};

const STATUS_COLORS: Record<string, string> = {
  paid: CC.green,
  pending: CC.amber,
  overdue: CC.red,
  "due soon": CC.orange,
  cancelled: CC.slate,
};

// ─── Input Field ──────────────────────────────────────────────────────────────

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        htmlFor={name}
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          color: focused ? D.primary : D.textMid,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          transition: "color 0.2s",
        }}
      >
        {label}
        {required && (
          <span style={{ color: D.amber, marginLeft: "3px" }}>*</span>
        )}
      </label>
      <input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: focused ? D.surface : D.surfaceAlt,
          border: `1.5px solid ${focused ? D.primary : D.borderFaint}`,
          borderRadius: D.radiusSm,
          padding: "11px 14px",
          color: D.text,
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          outline: "none",
          transition: "all 0.2s",
          width: "100%",
          boxShadow: focused ? `0 0 0 3px rgba(91,94,244,0.1)` : "none",
        }}
      />
    </div>
  );
}

// ─── Submit Button ────────────────────────────────────────────────────────────

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        background: loading ? "#C7C9FB" : D.primary,
        color: "#fff",
        border: "none",
        borderRadius: D.radiusSm,
        padding: "11px 32px",
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        letterSpacing: "0.06em",
        transition: "all 0.2s",
        boxShadow: loading ? "none" : "0 2px 8px rgba(91,94,244,0.35)",
      }}
    >
      {loading ? "Saving…" : label}
    </button>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.6rem, 2vw, 2.2rem)",
          color: D.text,
          letterSpacing: "0.04em",
          lineHeight: 1,
          marginBottom: sub ? "6px" : 0,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "14px",
            color: D.textFaint,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Plan Usage Bar ───────────────────────────────────────────────────────────

function PlanUsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isAtLimit = pct >= 100;
  const isWarning = pct >= 75 && !isAtLimit;
  const barColor = isAtLimit ? "#EF4444" : isWarning ? "#F59E0B" : "#3B82F6";
  const bg = isAtLimit ? "#FEF2F2" : isWarning ? "#FFFBEB" : "#EFF6FF";
  const border = isAtLimit ? "#FECACA" : isWarning ? "#FDE68A" : "#BFDBFE";
  const textColor = isAtLimit ? "#991B1B" : isWarning ? "#92400E" : "#1E40AF";

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: "10px", padding: "10px 14px", marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: textColor, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Free Plan · {label}
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: textColor, fontWeight: 700 }}>
          {used} / {limit}
        </span>
      </div>
      <div style={{ background: "rgba(0,0,0,0.07)", borderRadius: "9999px", height: "5px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "9999px", transition: "width 0.4s ease" }} />
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: textColor, marginTop: "5px", opacity: 0.85 }}>
        {isAtLimit ? "Limit reached — upgrade to add more" : `${limit - used} ${label.toLowerCase()} remaining this ${label === "Invoices this month" ? "month" : "plan"}`}
      </p>
    </div>
  );
}

// ─── Plan Limit Card ──────────────────────────────────────────────────────────

function PlanLimitCard({ resource, limit, onDismiss }: { resource: string; limit: number; onDismiss: () => void }) {
  const copy: Record<string, { title: string; detail: string }> = {
    customer: { title: "Buyer limit reached", detail: `You've used all ${limit} buyer slots on the Free plan.` },
    product: { title: "Product limit reached", detail: `You've used all ${limit} product slots on the Free plan.` },
    invoice: { title: "Invoice limit reached", detail: `You've created ${limit} invoices this month on the Free plan.` },
  };
  const { title, detail } = copy[resource] ?? { title: "Free plan limit reached", detail: "You've hit the Free plan limit." };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#EFF6FF",
        border: "1.5px solid #BFDBFE",
        borderRadius: "12px",
        padding: "16px 18px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        marginBottom: "16px",
      }}
    >
      <span style={{ fontSize: "1.4rem", lineHeight: 1, marginTop: "1px" }}>🔒</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "14px", color: "#1D4ED8", marginBottom: "4px" }}>
          {title}
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#2563EB", marginBottom: "12px", lineHeight: 1.5 }}>
          {detail} Upgrade to Plus for higher limits.
        </p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a
            href="/pricing"
            style={{ background: "#2563EB", color: "#fff", fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", padding: "7px 16px", borderRadius: "8px", textDecoration: "none" }}
          >
            Upgrade to Plus →
          </a>
          <button
            type="button"
            onClick={onDismiss}
            style={{ background: "none", border: "none", color: "#93C5FD", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Customers Section ────────────────────────────────────────────────────────

function validateBuyerFields(f: { name: string; shopName: string; email: string; phone: string; gstin: string }): string {
  if (!f.name.trim()) return "Buyer name is required.";
  if (!f.shopName.trim()) return "Shop / Business name is required.";
  if (!f.email.trim()) return "Email address is required.";
  if (f.phone && !/^\d{10}$/.test(f.phone)) return "Phone must be exactly 10 digits (numbers only).";
  if (f.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(f.gstin)) return "Invalid GSTIN format. Expected: 2-digit state code + PAN + entity + Z + checksum (e.g. 27ABCDE1234F2Z5).";
  return "";
}

function CustomersSection() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", shopName: "", phone: "", gstin: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", email: "", shopName: "", phone: "", gstin: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [planLimitInfo, setPlanLimitInfo] = useState<{ resource: string; limit: number } | null>(null);

  const fetchList = useCallback(async () => {
    setFetching(true);
    const res = await fetch("/api/customers");
    const json = await res.json();
    if (json.success) setList(json.data);
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateBuyerFields(form);
    if (err) return setError(err);
    setError("");
    setLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setForm({ name: "", email: "", shopName: "", phone: "", gstin: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchList();
    } else if (json.planLimit) {
      setPlanLimitInfo({ resource: json.resource, limit: json.limit });
    } else {
      setError(typeof json.error === "string" ? json.error : "Failed to save.");
    }
  }

  function startEdit(c: Customer) {
    setEditingId(c.id);
    setEditDraft({ name: c.name, email: c.email ?? "", shopName: c.shopName ?? "", phone: c.phone ?? "", gstin: c.gstin ?? "" });
    setEditError("");
  }

  async function handleEditSave() {
    const err = validateBuyerFields(editDraft);
    if (err) return setEditError(err);
    setEditError("");
    setEditLoading(true);
    const res = await fetch(`/api/customers/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    const json = await res.json();
    setEditLoading(false);
    if (json.success) {
      setEditingId(null);
      fetchList();
    } else {
      setEditError(typeof json.error === "string" ? json.error : "Update failed.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      <SectionHeading title="Add Buyer" sub="Save your customer details for quick invoice creation" />

      {/* Form card */}
      <div
        style={{
          background: D.surface,
          borderRadius: D.radius,
          padding: "32px",
          boxShadow: D.shadow,
          border: `1px solid ${D.borderFaint}`,
        }}
      >
        <PlanUsageBar used={list.length} limit={10} label="Buyers" />
        {planLimitInfo && (
          <PlanLimitCard resource={planLimitInfo.resource} limit={planLimitInfo.limit} onDismiss={() => setPlanLimitInfo(null)} />
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <InputField
              label="Buyer Name"
              name="name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Rajesh Kumar"
              required
            />
            <InputField
              label="Shop / Business Name"
              name="shopName"
              value={form.shopName}
              onChange={(v) => setForm((f) => ({ ...f, shopName: v }))}
              placeholder="e.g. Kumar Traders"
              required
            />
          </div>
          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="buyer@example.com"
            required
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <InputField
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v.replace(/\D/g, "").slice(0, 10) }))}
              placeholder="10-digit number"
            />
            <InputField
              label="GSTIN"
              name="gstin"
              value={form.gstin}
              onChange={(v) => setForm((f) => ({ ...f, gstin: v.toUpperCase().slice(0, 15) }))}
              placeholder="e.g. 27AAPFU0939F1ZV"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "4px" }}>
            <SubmitButton loading={loading} label="Save Buyer →" />
            {success && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "14px",
                  color: "#16A34A",
                }}
              >
                Buyer saved!
              </motion.span>
            )}
            {error && (
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "#DC2626",
                }}
              >
                {error}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Buyers list */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              color: D.text,
              letterSpacing: "0.03em",
            }}
          >
            {fetching ? "Loading…" : `${list.length} Buyer${list.length !== 1 ? "s" : ""}`}
          </h3>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "13px",
              color: D.textFaint,
            }}
          >
            registered
          </span>
        </div>

        {!fetching && list.length === 0 ? (
          <div
            style={{
              background: D.surfaceAlt,
              border: `1.5px dashed ${D.border}`,
              borderRadius: D.radius,
              padding: "40px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: D.textFaint,
                fontSize: "15px",
              }}
            >
              No buyers yet — add your first one above.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: D.surface,
              borderRadius: D.radius,
              boxShadow: D.shadow,
              border: `1px solid ${D.borderFaint}`,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
                padding: "12px 24px",
                background: D.surfaceAlt,
                borderBottom: `1px solid ${D.borderFaint}`,
              }}
            >
              {["Buyer", "Email", "GSTIN", "Added"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: D.textFaint,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {list.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  borderBottom: i < list.length - 1 ? `1px solid ${D.borderFaint}` : "none",
                  background: editingId === c.id ? D.primaryLight : i % 2 === 0 ? D.surface : "rgba(244,240,232,0.4)",
                }}
              >
                {editingId === c.id ? (
                  /* ── Inline edit form ── */
                  <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <InputField label="Buyer Name" name={`edit-name-${c.id}`} value={editDraft.name} onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))} placeholder="e.g. Rajesh Kumar" required />
                      <InputField label="Shop / Business Name" name={`edit-shop-${c.id}`} value={editDraft.shopName} onChange={(v) => setEditDraft((d) => ({ ...d, shopName: v }))} placeholder="e.g. Kumar Traders" required />
                    </div>
                    <InputField label="Email Address" name={`edit-email-${c.id}`} type="email" value={editDraft.email} onChange={(v) => setEditDraft((d) => ({ ...d, email: v }))} placeholder="buyer@example.com" required />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <InputField label="Phone Number" name={`edit-phone-${c.id}`} value={editDraft.phone} onChange={(v) => setEditDraft((d) => ({ ...d, phone: v.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit number" />
                      <InputField label="GSTIN" name={`edit-gstin-${c.id}`} value={editDraft.gstin} onChange={(v) => setEditDraft((d) => ({ ...d, gstin: v.toUpperCase().slice(0, 15) }))} placeholder="15 characters" />
                    </div>
                    {editError && (
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#DC2626" }}>{editError}</span>
                    )}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={handleEditSave}
                        disabled={editLoading}
                        style={{ background: D.primary, color: "#fff", border: "none", borderRadius: D.radiusSm, padding: "8px 18px", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, cursor: editLoading ? "not-allowed" : "pointer", opacity: editLoading ? 0.7 : 1 }}
                      >
                        {editLoading ? "Saving…" : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{ background: "transparent", color: D.textMid, border: `1px solid ${D.borderFaint}`, borderRadius: D.radiusSm, padding: "8px 16px", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View row ── */
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "16px 24px", alignItems: "center" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: D.text, fontSize: "14px" }}>{c.name}</p>
                      {c.shopName && (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: D.amber, marginTop: "2px", fontWeight: 500 }}>{c.shopName}</p>
                      )}
                      {c.phone && (
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint, marginTop: "2px" }}>{c.phone}</p>
                      )}
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.textMid }}>{c.email || "—"}</p>
                    <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: D.textMid, letterSpacing: "0.04em" }}>{c.gstin || "—"}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: D.textFaint }}>
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        style={{ background: D.primaryLight, border: "none", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: D.primary, letterSpacing: "0.04em", flexShrink: 0, marginLeft: "8px" }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Card (with inline edit) ─────────────────────────────────────────

function StockBadge({ quantity, unit }: { quantity: number; unit: string | null }) {
  const isOut = quantity === 0;
  const isLow = !isOut && quantity <= 5;
  const color = isOut ? "#DC2626" : isLow ? D.amber : "#16A34A";
  const bg = isOut ? "rgba(220,38,38,0.08)" : isLow ? "rgba(217,119,6,0.1)" : "rgba(22,163,74,0.08)";
  const border = isOut ? "rgba(220,38,38,0.2)" : isLow ? "rgba(217,119,6,0.25)" : "rgba(22,163,74,0.2)";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: bg, border: `1px solid ${border}`, borderRadius: "20px", padding: "3px 10px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color }}>
        {isOut ? "Out of stock" : `${quantity} ${unit ?? "pcs"} in stock`}
      </span>
    </div>
  );
}

function ProductCard({
  product,
  index,
  onUpdated,
}: {
  product: Product;
  index: number;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [draft, setDraft] = useState({
    name: product.name,
    description: product.description ?? "",
    rate: product.rate,
    unit: product.unit ?? "pcs",
    quantity: String(product.quantity),
    gstRate: product.gstRate ?? "0",
    purchaseRate: product.purchaseRate ?? "",
    purchaseDate: product.purchaseDate ? new Date(product.purchaseDate).toISOString().split("T")[0] : "",
    supplierShop: product.supplierShop ?? "",
    supplierPhone: product.supplierPhone ?? "",
    supplierGstin: product.supplierGstin ?? "",
    hsnCode: product.hsnCode ?? "",
  });

  const UNITS = ["pcs","kg","g","litre","ml","box","dozen","metre","bag","ton"];

  async function handleSave() {
    if (!draft.name.trim()) return setEditErr("Name required.");
    if (!draft.rate || Number(draft.rate) <= 0) return setEditErr("Enter a valid rate.");
    if (isNaN(Number(draft.quantity)) || Number(draft.quantity) < 0) return setEditErr("Quantity must be 0 or more.");
    if (draft.supplierPhone && !/^\d{10}$/.test(draft.supplierPhone)) return setEditErr("Supplier phone must be exactly 10 digits.");
    if (draft.supplierGstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(draft.supplierGstin)) return setEditErr("Invalid supplier GSTIN format.");
    setEditErr("");
    setSaving(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description || null,
        rate: Number(draft.rate),
        unit: draft.unit,
        quantity: Number(draft.quantity),
        gstRate: Number(draft.gstRate),
        purchaseRate: draft.purchaseRate ? Number(draft.purchaseRate) : null,
        purchaseDate: draft.purchaseDate || null,
        supplierShop: draft.supplierShop || null,
        supplierPhone: draft.supplierPhone || null,
        supplierGstin: draft.supplierGstin || null,
        hsnCode: draft.hsnCode || null,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      setEditing(false);
      onUpdated();
    } else {
      setEditErr(typeof json.error === "string" ? json.error : "Update failed.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        background: D.surface,
        borderRadius: D.radius,
        boxShadow: editing ? D.shadowHover : D.shadow,
        border: `1px solid ${editing ? D.border : D.borderFaint}`,
        overflow: "hidden",
        position: "relative",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Amber top stripe */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${D.amber}, #F59E0B)` }} />

      <AnimatePresence mode="wait">
        {!editing ? (
          /* ── View mode ── */
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "18px 20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, color: D.text, fontSize: "14px" }}>
                {product.name}
              </p>
              <button
                type="button"
                onClick={() => { setDraft({ name: product.name, description: product.description ?? "", rate: product.rate, unit: product.unit ?? "pcs", quantity: String(product.quantity), gstRate: product.gstRate ?? "0", purchaseRate: product.purchaseRate ?? "", purchaseDate: product.purchaseDate ? new Date(product.purchaseDate).toISOString().split("T")[0] : "", supplierShop: product.supplierShop ?? "", supplierPhone: product.supplierPhone ?? "", supplierGstin: product.supplierGstin ?? "", hsnCode: product.hsnCode ?? "" }); setEditing(true); setEditErr(""); }}
                style={{
                  background: D.primaryLight,
                  border: "none",
                  borderRadius: "6px",
                  padding: "3px 10px",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: D.primary,
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                  marginLeft: "8px",
                }}
              >
                Edit
              </button>
            </div>
            {product.description && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: D.textFaint, marginBottom: "8px", lineHeight: 1.4 }}>
                {product.description}
              </p>
            )}
            <div style={{ marginTop: product.description ? 0 : "8px", display: "flex", alignItems: "baseline", gap: "3px", marginBottom: "8px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,2.5vw,2rem)", color: D.amber, letterSpacing: "0.02em", lineHeight: 1 }}>
                ₹{Number(product.rate).toLocaleString("en-IN")}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint, fontWeight: 500 }}>
                /{product.unit}
              </span>
              {product.gstRate && Number(product.gstRate) > 0 && (
                <span style={{ marginLeft: "8px", background: D.amberLight, border: `1px solid rgba(217,119,6,0.25)`, borderRadius: "10px", padding: "1px 7px", fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: D.amber }}>
                  GST {product.gstRate}%
                </span>
              )}
            </div>
            {/* Margin */}
            {product.purchaseRate && (
              (() => {
                const margin = Number(product.rate) - Number(product.purchaseRate);
                const marginPct = (margin / Number(product.purchaseRate)) * 100;
                const color = margin >= 0 ? "#16A34A" : "#DC2626";
                return (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color, fontWeight: 600, marginBottom: "6px" }}>
                    Margin: ₹{Math.abs(margin).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({marginPct >= 0 ? "+" : "-"}{Math.abs(marginPct).toFixed(1)}%)
                  </p>
                );
              })()
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              <StockBadge quantity={product.quantity} unit={product.unit} />
              {product.hsnCode && (
                <span style={{ fontFamily: "monospace", fontSize: "10px", color: D.textFaint, background: D.surfaceAlt, border: `1px solid ${D.borderFaint}`, borderRadius: "6px", padding: "2px 6px" }}>
                  HSN {product.hsnCode}
                </span>
              )}
            </div>
            {(product.supplierShop || product.supplierPhone) && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint, marginTop: "2px" }}>
                {[product.supplierShop, product.supplierPhone].filter(Boolean).join(" · ")}
              </p>
            )}
            {product.purchaseDate && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: D.textFaint, marginTop: "2px" }}>
                Purchased: {new Date(product.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </motion.div>
        ) : (
          /* ── Edit mode ── */
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: D.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px" }}>
              Editing
            </p>

            {/* Name */}
            <div>
              <label htmlFor={`edit-name-${product.id}`} className="db-edit-label">Name</label>
              <input
                id={`edit-name-${product.id}`}
                className="db-edit-input"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Product name"
              />
            </div>

            {/* Rate + Qty */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label htmlFor={`edit-rate-${product.id}`} className="db-edit-label">Rate (₹)</label>
                <input
                  id={`edit-rate-${product.id}`}
                  className="db-edit-input"
                  type="number"
                  value={draft.rate}
                  onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor={`edit-qty-${product.id}`} className="db-edit-label-qty">Stock Qty</label>
                <input
                  id={`edit-qty-${product.id}`}
                  className="db-edit-input-qty"
                  type="number"
                  value={draft.quantity}
                  onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor={`unit-${product.id}`} className="db-edit-label">Unit</label>
              <select
                id={`unit-${product.id}`}
                className="db-select-light"
                value={draft.unit}
                onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor={`edit-desc-${product.id}`} className="db-edit-label">Description</label>
              <input id={`edit-desc-${product.id}`} className="db-edit-input" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Optional" />
            </div>

            {/* GST Rate + HSN */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label htmlFor={`edit-gst-${product.id}`} className="db-edit-label">GST Rate</label>
                <select id={`edit-gst-${product.id}`} className="db-select-light" value={draft.gstRate} onChange={(e) => setDraft((d) => ({ ...d, gstRate: e.target.value }))}>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div>
                <label htmlFor={`edit-hsn-${product.id}`} className="db-edit-label">HSN Code</label>
                <input id={`edit-hsn-${product.id}`} className="db-edit-input" value={draft.hsnCode} onChange={(e) => setDraft((d) => ({ ...d, hsnCode: e.target.value }))} placeholder="e.g. 6203" />
              </div>
            </div>

            {/* Purchase Rate + Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label htmlFor={`edit-pr-${product.id}`} className="db-edit-label">Purchase Rate (₹)</label>
                <input id={`edit-pr-${product.id}`} className="db-edit-input" type="number" value={draft.purchaseRate} onChange={(e) => setDraft((d) => ({ ...d, purchaseRate: e.target.value }))} placeholder="Cost per unit" />
              </div>
              <div>
                <label htmlFor={`edit-pd-${product.id}`} className="db-edit-label">Purchase Date</label>
                <input id={`edit-pd-${product.id}`} className="db-edit-input" type="date" value={draft.purchaseDate} onChange={(e) => setDraft((d) => ({ ...d, purchaseDate: e.target.value }))} />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label htmlFor={`edit-ss-${product.id}`} className="db-edit-label">Supplier Shop</label>
              <input id={`edit-ss-${product.id}`} className="db-edit-input" value={draft.supplierShop} onChange={(e) => setDraft((d) => ({ ...d, supplierShop: e.target.value }))} placeholder="e.g. Sharma Textiles" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label htmlFor={`edit-sp-${product.id}`} className="db-edit-label">Supplier Phone</label>
                <input id={`edit-sp-${product.id}`} className="db-edit-input" value={draft.supplierPhone} onChange={(e) => setDraft((d) => ({ ...d, supplierPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit" />
              </div>
              <div>
                <label htmlFor={`edit-sg-${product.id}`} className="db-edit-label">Supplier GSTIN</label>
                <input id={`edit-sg-${product.id}`} className="db-edit-input" value={draft.supplierGstin} onChange={(e) => setDraft((d) => ({ ...d, supplierGstin: e.target.value.toUpperCase().slice(0, 15) }))} placeholder="15 chars" />
              </div>
            </div>

            {editErr && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#DC2626" }}>{editErr}</p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? "#C7C9FB" : D.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "7px",
                  padding: "8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditErr(""); }}
                style={{
                  flex: 1,
                  background: D.surfaceAlt,
                  color: D.textMid,
                  border: `1px solid ${D.borderFaint}`,
                  borderRadius: "7px",
                  padding: "8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────

function ProductsSection() {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: "",
    description: "",
    rate: "",
    unit: "pcs",
    quantity: "",
    gstRate: "18",
    purchaseRate: "",
    purchaseDate: "",
    supplierShop: "",
    supplierPhone: "",
    supplierGstin: "",
    hsnCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [planLimitInfo, setPlanLimitInfo] = useState<{ resource: string; limit: number } | null>(null);

  // Supplier state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierForm, setSupplierForm] = useState({ name: "", shopName: "", phone: "", gstin: "" });
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [supplierError, setSupplierError] = useState("");
  const [supplierSuccess, setSupplierSuccess] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editSupplierDraft, setEditSupplierDraft] = useState({ name: "", shopName: "", phone: "", gstin: "" });
  const [editSupplierLoading, setEditSupplierLoading] = useState(false);
  const [editSupplierError, setEditSupplierError] = useState("");

  const fetchList = useCallback(async () => {
    setFetching(true);
    const res = await fetch("/api/products");
    const json = await res.json();
    if (json.success) setList(json.data);
    setFetching(false);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const json = await res.json();
    if (json.success) setSuppliers(json.data);
  }, []);

  useEffect(() => {
    fetchList();
    fetchSuppliers();
  }, [fetchList, fetchSuppliers]);

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierForm.name.trim()) return setSupplierError("Supplier name is required.");
    if (!supplierForm.shopName.trim()) return setSupplierError("Shop name is required.");
    if (supplierForm.phone && !/^\d{10}$/.test(supplierForm.phone))
      return setSupplierError("Phone must be exactly 10 digits.");
    if (supplierForm.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(supplierForm.gstin))
      return setSupplierError("Invalid GSTIN format (e.g. 27ABCDE1234F2Z5).");
    setSupplierError("");
    setSavingSupplier(true);
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierForm),
    });
    const json = await res.json();
    setSavingSupplier(false);
    if (json.success) {
      setSupplierForm({ name: "", shopName: "", phone: "", gstin: "" });
      setSupplierSuccess(true);
      setTimeout(() => setSupplierSuccess(false), 2000);
      fetchSuppliers();
    } else {
      setSupplierError(typeof json.error === "string" ? json.error : "Failed to save supplier.");
    }
  }

  function startEditSupplier(s: Supplier) {
    setEditingSupplierId(s.id);
    setEditSupplierDraft({ name: s.name, shopName: s.shopName, phone: s.phone ?? "", gstin: s.gstin ?? "" });
    setEditSupplierError("");
  }

  async function handleEditSupplierSave() {
    if (!editSupplierDraft.name.trim()) return setEditSupplierError("Supplier name is required.");
    if (!editSupplierDraft.shopName.trim()) return setEditSupplierError("Shop name is required.");
    if (editSupplierDraft.phone && !/^\d{10}$/.test(editSupplierDraft.phone))
      return setEditSupplierError("Phone must be exactly 10 digits.");
    if (editSupplierDraft.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(editSupplierDraft.gstin))
      return setEditSupplierError("Invalid GSTIN format.");
    setEditSupplierError("");
    setEditSupplierLoading(true);
    const res = await fetch(`/api/suppliers/${editingSupplierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSupplierDraft),
    });
    const json = await res.json();
    setEditSupplierLoading(false);
    if (json.success) {
      setEditingSupplierId(null);
      fetchSuppliers();
    } else {
      setEditSupplierError(typeof json.error === "string" ? json.error : "Update failed.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.purchaseRate || isNaN(Number(form.purchaseRate)) || Number(form.purchaseRate) <= 0)
      return setError("Enter a valid purchase rate.");
    if (!form.rate || isNaN(Number(form.rate)) || Number(form.rate) <= 0)
      return setError("Enter a valid selling rate.");
    if (form.quantity && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0))
      return setError("Quantity must be 0 or more.");
    if (form.supplierPhone && !/^\d{10}$/.test(form.supplierPhone))
      return setError("Supplier phone must be exactly 10 digits.");
    if (form.supplierGstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(form.supplierGstin))
      return setError("Invalid supplier GSTIN format (e.g. 27ABCDE1234F2Z5).");
    setError("");
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        rate: Number(form.rate),
        unit: form.unit,
        quantity: form.quantity ? Number(form.quantity) : 0,
        gstRate: Number(form.gstRate),
        purchaseRate: Number(form.purchaseRate),
        purchaseDate: form.purchaseDate || undefined,
        supplierShop: form.supplierShop || undefined,
        supplierPhone: form.supplierPhone || undefined,
        supplierGstin: form.supplierGstin || undefined,
        hsnCode: form.hsnCode || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setForm({ name: "", description: "", rate: "", unit: "pcs", quantity: "", gstRate: "18", purchaseRate: "", purchaseDate: "", supplierShop: "", supplierPhone: "", supplierGstin: "", hsnCode: "" });
      setSelectedSupplierId("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchList();
    } else if (json.planLimit) {
      setPlanLimitInfo({ resource: json.resource, limit: json.limit });
    } else {
      setError(typeof json.error === "string" ? json.error : "Failed to save.");
    }
  }

  const UNITS = [
    "pcs","kg","g","litre","ml","box","dozen","metre","bag","ton",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      <SectionHeading
        title="Add Product"
        sub="Define the goods or materials you sell with their rates"
      />

      {/* ── Saved Suppliers sub-section ───────────────────────────────── */}
      <div style={{ background: D.surface, borderRadius: D.radius, padding: "24px 32px", boxShadow: D.shadow, border: `1px solid ${D.borderFaint}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "20px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: D.text, letterSpacing: "0.03em" }}>Saved Suppliers</h3>
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: D.textFaint }}>select when adding a product to auto-fill details</span>
        </div>

        {/* Add supplier form */}
        <form onSubmit={handleAddSupplier} style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${D.borderFaint}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
            <InputField label="Supplier Name" name="s-name" value={supplierForm.name} onChange={(v) => setSupplierForm((f) => ({ ...f, name: v }))} placeholder="e.g. Sharma Fabrics" required />
            <InputField label="Shop Name" name="s-shop" value={supplierForm.shopName} onChange={(v) => setSupplierForm((f) => ({ ...f, shopName: v }))} placeholder="e.g. Sharma Textiles" required />
            <InputField label="Phone (optional)" name="s-phone" value={supplierForm.phone} onChange={(v) => setSupplierForm((f) => ({ ...f, phone: v.replace(/\D/g, "").slice(0, 10) }))} placeholder="10-digit number" />
            <InputField label="GSTIN (optional)" name="s-gstin" value={supplierForm.gstin} onChange={(v) => setSupplierForm((f) => ({ ...f, gstin: v.toUpperCase().slice(0, 15) }))} placeholder="e.g. 27ABCDE1234F2Z5" />
            <button
              type="submit"
              disabled={savingSupplier}
              style={{ background: D.primary, color: "#fff", border: "none", borderRadius: D.radiusSm, padding: "11px 18px", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, cursor: savingSupplier ? "not-allowed" : "pointer", opacity: savingSupplier ? 0.7 : 1, whiteSpace: "nowrap" }}
            >
              {savingSupplier ? "Saving…" : "+ Add"}
            </button>
          </div>
          {supplierError && <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#DC2626", marginTop: "8px" }}>{supplierError}</p>}
          {supplierSuccess && <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: "#16A34A", marginTop: "8px" }}>Supplier saved!</p>}
        </form>

        {/* Supplier list */}
        {suppliers.length === 0 ? (
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: D.textFaint, fontSize: "13px" }}>No suppliers saved yet — add one above.</p>
        ) : (
          <div style={{ border: `1px solid ${D.borderFaint}`, borderRadius: D.radiusSm, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto", padding: "10px 16px", background: D.surfaceAlt, borderBottom: `1px solid ${D.borderFaint}` }}>
              {["Name", "Shop", "Phone", "GSTIN", ""].map((h, i) => (
                <span key={i} style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {suppliers.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ borderBottom: i < suppliers.length - 1 ? `1px solid ${D.borderFaint}` : "none", background: editingSupplierId === s.id ? D.primaryLight : i % 2 === 0 ? D.surface : "rgba(244,240,232,0.4)" }}
              >
                {editingSupplierId === s.id ? (
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
                      <InputField label="Name" name={`es-name-${s.id}`} value={editSupplierDraft.name} onChange={(v) => setEditSupplierDraft((d) => ({ ...d, name: v }))} placeholder="" required />
                      <InputField label="Shop" name={`es-shop-${s.id}`} value={editSupplierDraft.shopName} onChange={(v) => setEditSupplierDraft((d) => ({ ...d, shopName: v }))} placeholder="" required />
                      <InputField label="Phone" name={`es-phone-${s.id}`} value={editSupplierDraft.phone} onChange={(v) => setEditSupplierDraft((d) => ({ ...d, phone: v.replace(/\D/g, "").slice(0, 10) }))} placeholder="" />
                      <InputField label="GSTIN" name={`es-gstin-${s.id}`} value={editSupplierDraft.gstin} onChange={(v) => setEditSupplierDraft((d) => ({ ...d, gstin: v.toUpperCase().slice(0, 15) }))} placeholder="" />
                    </div>
                    {editSupplierError && <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#DC2626" }}>{editSupplierError}</span>}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="button" onClick={handleEditSupplierSave} disabled={editSupplierLoading} style={{ background: D.primary, color: "#fff", border: "none", borderRadius: D.radiusSm, padding: "8px 18px", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, cursor: editSupplierLoading ? "not-allowed" : "pointer", opacity: editSupplierLoading ? 0.7 : 1 }}>
                        {editSupplierLoading ? "Saving…" : "Save Changes"}
                      </button>
                      <button type="button" onClick={() => setEditingSupplierId(null)} style={{ background: "transparent", color: D.textMid, border: `1px solid ${D.borderFaint}`, borderRadius: D.radiusSm, padding: "8px 16px", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto", padding: "12px 16px", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: D.text, fontSize: "13px" }}>{s.name}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.amber, fontWeight: 500 }}>{s.shopName}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: D.textMid }}>{s.phone || "—"}</p>
                    <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: D.textMid, letterSpacing: "0.04em" }}>{s.gstin || "—"}</p>
                    <button type="button" onClick={() => startEditSupplier(s)} style={{ background: D.primaryLight, border: "none", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: D.primary }}>Edit</button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PlanUsageBar used={list.length} limit={10} label="Products" />
      {planLimitInfo && (
        <PlanLimitCard resource={planLimitInfo.resource} limit={planLimitInfo.limit} onDismiss={() => setPlanLimitInfo(null)} />
      )}

      {/* Form card */}
      <div
        style={{
          background: D.surface,
          borderRadius: D.radius,
          padding: "32px",
          boxShadow: D.shadow,
          border: `1px solid ${D.borderFaint}`,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {/* Row 1: Name + Purchase Rate* + Stock Qty + Unit */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "20px" }}>
            <InputField
              label="Product Name"
              name="pname"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Mens Shorts"
              required
            />
            <InputField
              label="Purchase Rate (₹)"
              name="purchaseRate"
              type="number"
              value={form.purchaseRate}
              onChange={(v) => setForm((f) => ({ ...f, purchaseRate: v }))}
              placeholder="Cost price"
              required
            />
            <InputField
              label="Stock Qty"
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={(v) => setForm((f) => ({ ...f, quantity: v }))}
              placeholder="0"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="unit" style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600, color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase" }}>Unit</label>
              <select id="unit" className="db-select-light" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: GST Rate + HSN Code + Selling Rate* */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="prod-gst" style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600, color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                GST Rate <span style={{ color: D.primary }}>*</span>
              </label>
              <select id="prod-gst" className="db-select-light" value={form.gstRate} onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))} required>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <InputField
              label="HSN Code (optional)"
              name="hsnCode"
              value={form.hsnCode}
              onChange={(v) => setForm((f) => ({ ...f, hsnCode: v }))}
              placeholder="e.g. 6203"
            />
            <InputField
              label="Selling Rate (₹)"
              name="rate"
              type="number"
              value={form.rate}
              onChange={(v) => setForm((f) => ({ ...f, rate: v }))}
              placeholder="180.00"
              required
            />
          </div>

          {/* Row 3: Date of Purchase */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="purchaseDate" style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600, color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase" }}>Date of Purchase</label>
              <input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                style={{ background: D.surfaceAlt, border: `1.5px solid ${D.borderFaint}`, borderRadius: D.radiusSm, padding: "11px 14px", fontFamily: "var(--font-body)", fontSize: "14px", color: D.text, outline: "none" }}
              />
            </div>
          </div>

          {/* Purchase total computed pill */}
          {form.purchaseRate && form.quantity && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.08em", textTransform: "uppercase" }}>Purchase Total</span>
              <span style={{ background: D.amberLight, border: `1px solid rgba(217,119,6,0.25)`, borderRadius: "20px", padding: "3px 12px", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, color: D.amber }}>
                ₹{(Number(form.purchaseRate) * Number(form.quantity) * (1 + Number(form.gstRate) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint }}>incl. {form.gstRate}% GST</span>
            </div>
          )}

          {/* Row 4: Supplier Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase" }}>Supplier Details (optional)</span>
            {suppliers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "4px" }}>
                <label htmlFor="select-supplier" style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 700, color: D.primary, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                  Auto-fill from Saved Supplier
                </label>
                <select
                  id="select-supplier"
                  className="db-select-light"
                  value={selectedSupplierId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSelectedSupplierId(sid);
                    if (sid) {
                      const sup = suppliers.find((s) => s.id === sid);
                      if (sup) setForm((f) => ({ ...f, supplierShop: sup.shopName, supplierPhone: sup.phone ?? "", supplierGstin: sup.gstin ?? "" }));
                    } else {
                      setForm((f) => ({ ...f, supplierShop: "", supplierPhone: "", supplierGstin: "" }));
                    }
                  }}
                >
                  <option value="">— type manually —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} · {s.shopName}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <InputField
                label="Supplier Shop"
                name="supplierShop"
                value={form.supplierShop}
                onChange={(v) => setForm((f) => ({ ...f, supplierShop: v }))}
                placeholder="e.g. Sharma Textiles"
              />
              <InputField
                label="Supplier Phone"
                name="supplierPhone"
                value={form.supplierPhone}
                onChange={(v) => setForm((f) => ({ ...f, supplierPhone: v.replace(/\D/g, "").slice(0, 10) }))}
                placeholder="10-digit number"
              />
              <InputField
                label="Supplier GSTIN"
                name="supplierGstin"
                value={form.supplierGstin}
                onChange={(v) => setForm((f) => ({ ...f, supplierGstin: v.toUpperCase().slice(0, 15) }))}
                placeholder="e.g. 27ABCDE1234F2Z5"
              />
            </div>
          </div>

          <InputField
            label="Description (optional)"
            name="desc"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="Short note about this product"
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              paddingTop: "4px",
            }}
          >
            <SubmitButton loading={loading} label="Add Product →" />
            {success && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "14px",
                  color: "#16A34A",
                }}
              >
                Product added!
              </motion.span>
            )}
            {error && (
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "#DC2626",
                }}
              >
                {error}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Product cards */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              color: D.text,
              letterSpacing: "0.03em",
            }}
          >
            {fetching ? "Loading…" : `${list.length} Product${list.length !== 1 ? "s" : ""}`}
          </h3>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "13px",
              color: D.textFaint,
            }}
          >
            in your catalogue
          </span>
        </div>

        {!fetching && list.length === 0 ? (
          <div
            style={{
              background: D.surfaceAlt,
              border: `1.5px dashed ${D.border}`,
              borderRadius: D.radius,
              padding: "40px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: D.textFaint,
                fontSize: "15px",
              }}
            >
              No products yet — add your first one above.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onUpdated={fetchList} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Print Invoice Modal ──────────────────────────────────────────────────────

function PrintInvoiceModal({ inv, onClose }: { inv: InvoiceRow; onClose: () => void }) {
  const sym = inv.currency === "USD" ? "$" : inv.currency === "EUR" ? "€" : "₹";
  const lineItems = (inv.extractedData as { lineItems?: LineItem[] } | null)?.lineItems ?? [];
  const history = (inv.paymentHistory ?? []) as PaymentHistoryEntry[];
  const paidCash = Number(inv.paidCash ?? 0);
  const paidOnline = Number(inv.paidOnline ?? 0);
  const subtotal = lineItems.reduce((s, li) => s + Number(li.subtotal), 0);
  const discountAmt = Number(inv.discountAmount ?? 0);
  const taxAmt = Number(inv.taxAmount ?? 0);
  const total = Number(inv.amount ?? 0);
  const balance = Number(inv.balanceAmount ?? 0);
  const paid = Number(inv.paidAmount ?? 0);

  function handlePrint() {
    const content = document.getElementById("duemate-print-body");
    if (!content) return;
    const win = window.open("", "_blank", "width=860,height=960");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${inv.invoiceNumber ?? ""}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1C1B2E; padding: 24px 32px; background: white; }
        @page { margin: 14mm; size: A4 portrait; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 350);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(7,10,18,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#FFFFFF", borderRadius: "14px", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", width: "100%", maxWidth: "700px", maxHeight: "92svh", overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid rgba(0,0,0,0.07)", position: "sticky", top: 0, background: "#FFFFFF", zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, color: "#1C1B2E", fontSize: "14px" }}>{inv.invoiceNumber ?? "Invoice"}</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#9CA3AF", marginTop: "1px" }}>{inv.customerName} {inv.customerShopName ? `· ${inv.customerShopName}` : ""}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={handlePrint} style={{ background: "#5B5EF4", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 20px", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(91,94,244,0.35)" }}>
              ⎙ Print
            </button>
            <button type="button" onClick={onClose} style={{ background: "#FAF8F4", color: "#6B7280", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "8px 16px", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>

        {/* Printable body */}
        <div id="duemate-print-body" style={{ padding: "36px 44px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#1C1B2E", letterSpacing: "0.04em" }}>DueMate</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "3px" }}>Tax Invoice</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase" }}>Invoice No.</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#5B5EF4", letterSpacing: "0.02em" }}>{inv.invoiceNumber ?? "—"}</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                Status: <span style={{ fontWeight: 700, color: paid === 0 ? "#DC2626" : balance <= 0.001 ? "#16A34A" : "#D97706" }}>
                  {paid === 0 ? "Unpaid" : balance <= 0.001 ? "Paid" : "Partial"}
                </span>
              </p>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(0,0,0,0.08)" }} />

          {/* Dates */}
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
              { label: "Issue Date", val: inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              { label: "Due Date", val: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              { label: "Created", val: new Date(inv.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>{label}</p>
                <p style={{ fontWeight: 600, fontSize: "13px", color: "#1C1B2E" }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Bill To */}
          <div style={{ background: "#FAF8F4", borderRadius: "8px", padding: "14px 18px", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "8px" }}>Bill To</p>
            <p style={{ fontWeight: 700, fontSize: "15px", color: "#1C1B2E" }}>{inv.customerName ?? "—"}</p>
            {inv.customerShopName && <p style={{ fontSize: "13px", color: "#D97706", marginTop: "3px" }}>{inv.customerShopName}</p>}
          </div>

          {/* Line Items */}
          {lineItems.length > 0 && (
            <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 60px 110px 110px", padding: "8px 14px", background: "#FAF8F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                {["Product", "Qty", "Rate", "Subtotal"].map((h, i) => (
                  <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", textAlign: i > 0 ? "right" as const : "left" as const }}>{h}</span>
                ))}
              </div>
              {lineItems.map((li, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 60px 110px 110px", padding: "10px 14px", borderBottom: idx < lineItems.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", background: idx % 2 === 0 ? "#fff" : "rgba(244,240,232,0.3)" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "13px", color: "#1C1B2E" }}>{li.name}</p>
                    {li.unit && <p style={{ fontSize: "11px", color: "#9CA3AF" }}>{li.unit}</p>}
                  </div>
                  <p style={{ fontSize: "13px", color: "#6B7280", textAlign: "right" }}>{li.quantity}</p>
                  <p style={{ fontSize: "13px", color: "#D97706", fontWeight: 600, textAlign: "right" }}>{sym}{Number(li.rate).toLocaleString("en-IN")}</p>
                  <p style={{ fontSize: "13px", color: "#1C1B2E", fontWeight: 700, textAlign: "right" }}>{sym}{Number(li.subtotal).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          )}

          {/* Financials */}
          <div style={{ alignSelf: "flex-end", minWidth: "280px", display: "flex", flexDirection: "column", gap: "6px", padding: "14px 18px", background: "#FAF8F4", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
            {[
              { label: "Subtotal", val: subtotal, show: true, color: "#6B7280" },
              { label: "Discount", val: -discountAmt, show: discountAmt > 0, color: "#16A34A" },
              { label: `GST (${inv.taxRate ?? 0}%)`, val: taxAmt, show: taxAmt > 0, color: "#5B5EF4" },
              { label: "Invoice Total", val: total, show: true, bold: true, color: "#1C1B2E", divider: true },
              { label: "Paid (Cash)", val: paidCash, show: paidCash > 0, color: "#16A34A" },
              { label: "Paid (Online)", val: paidOnline, show: paidOnline > 0, color: "#16A34A" },
              { label: "Balance Due", val: balance, show: paid > 0, bold: balance > 0, color: balance > 0 ? "#DC2626" : "#16A34A" },
            ].filter(r => r.show).map(({ label, val, bold, color, divider }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: divider ? "1px solid rgba(0,0,0,0.08)" : "none", paddingTop: divider ? "6px" : 0, marginTop: divider ? "4px" : 0 }}>
                <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{label}</span>
                <span style={{ fontSize: bold ? "1.15rem" : "0.93rem", fontWeight: bold ? 700 : 600, color }}>
                  {val < 0 ? "-" : ""}{sym}{Math.abs(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          {/* Payment History */}
          {history.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "10px" }}>
                Payment History — {history.length} payment{history.length !== 1 ? "s" : ""}
              </p>
              <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 70px 1fr", padding: "8px 14px", background: "#FAF8F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  {["Date & Time", "Amount", "Mode", "Ref / Notes"].map((h) => (
                    <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
                  ))}
                </div>
                {history.map((entry, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 70px 1fr", padding: "10px 14px", alignItems: "center", borderBottom: idx < history.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", background: idx % 2 === 0 ? "#fff" : "rgba(244,240,232,0.3)" }}>
                    <p style={{ fontSize: "12px", color: "#6B7280" }}>
                      {new Date(entry.paidAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#16A34A" }}>
                      {sym}{Number(entry.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: entry.type === "cash" ? "#D97706" : "#5B5EF4", textTransform: "capitalize" }}>
                      {entry.type}
                    </p>
                    <p style={{ fontSize: "11px", color: "#5B5EF4", letterSpacing: "0.03em" }}>
                      {[entry.reference, entry.notes].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Notes */}
          {inv.notes && (
            <div>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "6px" }}>Notes</p>
              <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6 }}>{inv.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "18px", textAlign: "center" }}>
            <p style={{ fontStyle: "italic", fontSize: "12px", color: "#9CA3AF" }}>
              Generated by DueMate · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Invoice List (expandable rows) ──────────────────────────────────────────

function InvoiceList({ invoiceList, fetching, onRefresh }: { invoiceList: InvoiceRow[]; fetching: boolean; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payDraft, setPayDraft] = useState({ amount: "", type: "cash" as "cash" | "online", reference: "", notes: "" });
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [printInvoice, setPrintInvoice] = useState<InvoiceRow | null>(null);
  const [lastPaidId, setLastPaidId] = useState<string | null>(null);
  const [paySuccessEmail, setPaySuccessEmail] = useState<string | null>(null);
  const [emailSkippedId, setEmailSkippedId] = useState<string | null>(null);

  async function handleRecordPayment(inv: InvoiceRow) {
    const amt = Number(payDraft.amount);
    if (!payDraft.amount || isNaN(amt) || amt <= 0) return setPayError("Enter a valid amount.");
    const balance = Number(inv.balanceAmount ?? inv.amount ?? 0);
    if (amt > balance + 0.001) return setPayError(`Amount exceeds balance due (₹${balance.toFixed(2)}).`);
    setPayError("");
    setPayLoading(true);
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ additionalPayment: amt, paymentType: payDraft.type, paymentReference: payDraft.reference || undefined, paymentNotes: payDraft.notes || undefined }),
    });
    const json = await res.json();
    setPayLoading(false);
    if (json.success) {
      setLastPaidId(inv.id);
      if (json.emailSkipped) {
        setEmailSkippedId(inv.id);
        setPaySuccessEmail(null);
      } else {
        setPaySuccessEmail(inv.customerEmail ?? null);
        setEmailSkippedId(null);
      }
      setPayingId(null);
      setPayDraft({ amount: "", type: "cash", reference: "", notes: "" });
      onRefresh();
    } else {
      setPayError(typeof json.error === "string" ? json.error : "Payment failed.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: D.text, letterSpacing: "0.03em" }}>
          {fetching ? "Loading…" : `${invoiceList.length} Invoice${invoiceList.length !== 1 ? "s" : ""}`}
        </h3>
        <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: D.textFaint }}>
          created
        </span>
      </div>

      {!fetching && invoiceList.length === 0 ? (
        <div style={{ background: "#FAF8F4", border: "1.5px dashed rgba(129,140,248,0.18)", borderRadius: "14px", padding: "40px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#9CA3AF", fontSize: "15px" }}>
            No invoices yet — create your first one above.
          </p>
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr 1fr 1fr 1fr 32px 28px", padding: "12px 20px", background: "#FAF8F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {["Invoice #", "Buyer", "Total", "Paid", "Balance", "Payment", "Print", "Expand"].map((h) => (
              <span key={h} style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase" }}></span>
            ))}
          </div>

          {invoiceList.map((inv, i) => {
            const sym = inv.currency === "USD" ? "$" : inv.currency === "EUR" ? "€" : "₹";
            const lineItems = (inv.extractedData as { lineItems?: LineItem[] } | null)?.lineItems ?? [];
            const isOpen = expanded === inv.id;

            // Due date urgency
            const dueMs = inv.dueDate ? new Date(inv.dueDate).getTime() - Date.now() : null;
            const dueDays = dueMs !== null ? Math.ceil(dueMs / 86400000) : null;
            const dueColor = inv.status === "paid" ? "#16A34A"
              : dueDays === null ? "#9CA3AF"
              : dueDays < 0 ? "#DC2626"
              : dueDays <= 7 ? "#EA580C"
              : "#6B7280";
            const dueLabel = inv.status === "paid" ? "Paid"
              : dueDays === null ? "—"
              : dueDays < 0 ? `${Math.abs(dueDays)}d overdue`
              : dueDays === 0 ? "Due today"
              : `Due in ${dueDays}d`;

            // Payment badge
            const paid = Number(inv.paidAmount ?? 0);
            const balance = Number(inv.balanceAmount ?? inv.amount ?? 0);
            const payBadge = paid === 0
              ? { label: "Unpaid", color: "#DC2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)" }
              : balance <= 0
              ? { label: "Paid", color: "#16A34A", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.2)" }
              : { label: "Partial", color: "#D97706", bg: "rgba(217,119,6,0.1)", border: "rgba(217,119,6,0.25)" };

            return (
              <div key={inv.id} style={{ borderBottom: i < invoiceList.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                {/* Main row */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr 1fr 1fr 1fr 32px 28px",
                    padding: "14px 20px", alignItems: "center",
                    background: isOpen ? "rgba(91,94,244,0.03)" : i % 2 === 0 ? "#FFFFFF" : "rgba(244,240,232,0.4)",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onClick={() => setExpanded(isOpen ? null : inv.id)}
                >
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, color: "#5B5EF4", fontSize: "13px" }}>
                      {inv.invoiceNumber ?? "—"}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: dueColor, marginTop: "2px", fontWeight: dueDays !== null && dueDays <= 7 && inv.status !== "paid" ? 700 : 400 }}>
                      {dueLabel}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "#1C1B2E", fontSize: "13px" }}>{inv.customerName ?? "—"}</p>
                    {inv.customerShopName && <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#D97706", marginTop: "1px" }}>{inv.customerShopName}</p>}
                  </div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "#D97706", letterSpacing: "0.02em" }}>
                    {sym}{inv.amount ? Number(inv.amount).toLocaleString("en-IN") : "0"}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#16A34A", fontWeight: 600 }}>
                    {paid > 0
                      ? `${sym}${paid.toLocaleString("en-IN")}`
                      : <span style={{ color: "#9CA3AF", fontWeight: 400 }}>—</span>}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: balance > 0 ? "#DC2626" : "#16A34A" }}>
                    {`${sym}${balance.toLocaleString("en-IN")}`}
                  </p>
                  {/* Payment badge */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    background: payBadge.bg, border: `1px solid ${payBadge.border}`,
                    borderRadius: "20px", padding: "3px 10px", width: "fit-content",
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: payBadge.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: payBadge.color }}>{payBadge.label}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPrintInvoice(inv); }}
                    title="Print Invoice"
                    style={{ background: "none", border: "none", cursor: "pointer", color: D.textFaint, fontSize: "15px", padding: "2px", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, borderRadius: "4px" }}
                  >
                    ⎙
                  </button>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#9CA3AF", textAlign: "center", userSelect: "none" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </motion.div>

                {/* Expanded detail panel */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      {(() => {
                        const subtotal = lineItems.reduce((s, li) => s + Number(li.subtotal), 0);
                        const discountAmt = Number(inv.discountAmount ?? 0);
                        const taxAmt = Number(inv.taxAmount ?? 0);
                        const total = Number(inv.amount ?? 0);
                        const paidCash = Number(inv.paidCash ?? 0);
                        const paidOnline = Number(inv.paidOnline ?? 0);
                        const modeLabel = paidCash > 0 && paidOnline > 0 ? "Cash + Online"
                          : paidCash > 0 ? "Cash"
                          : paidOnline > 0 ? "Online"
                          : null;
                        const isPayable = balance > 0.001 && inv.status !== "paid";
                        const isRecording = payingId === inv.id;
                        return (
                          <div style={{ padding: "16px 20px 20px", background: "rgba(91,94,244,0.02)", borderTop: "1px solid rgba(91,94,244,0.1)", display: "flex", flexDirection: "column", gap: "16px" }}>

                            {/* Info bar */}
                            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                              <div>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>Invoice Created</p>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#1C1B2E", fontWeight: 600 }}>
                                  {new Date(inv.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>Due Date</p>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#1C1B2E", fontWeight: 600 }}>
                                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>Payment Mode</p>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#1C1B2E", fontWeight: 600 }}>
                                  {modeLabel ?? <span style={{ color: "#9CA3AF", fontWeight: 400 }}>Not recorded</span>}
                                </p>
                              </div>
                              {inv.lastPaymentAt && (
                                <div>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>
                                    {inv.status === "paid" ? "Fully Paid On" : "Last Payment"}
                                  </p>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#16A34A", fontWeight: 600 }}>
                                    {new Date(inv.lastPaymentAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              )}
                              {inv.paymentReference && (
                                <div>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>Ref / TXN ID</p>
                                  <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px", color: "#5B5EF4", fontWeight: 600, letterSpacing: "0.04em" }}>
                                    {inv.paymentReference}
                                  </p>
                                </div>
                              )}
                              {inv.notes && (
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>Invoice Notes</p>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#6B7280" }}>{inv.notes}</p>
                                </div>
                              )}
                              {inv.paymentNotes && (
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>Payment Notes</p>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#6B7280" }}>{inv.paymentNotes}</p>
                                </div>
                              )}
                            </div>

                            {/* Line items */}
                            {lineItems.length > 0 && (
                              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", overflow: "hidden" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 60px 100px 100px", padding: "8px 14px", background: "#FAF8F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                                  {["Product", "Qty", "Rate", "Subtotal"].map((h) => (
                                    <span key={h} style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.09em", textTransform: "uppercase", textAlign: h !== "Product" ? "right" as const : "left" as const }}>{h}</span>
                                  ))}
                                </div>
                                {lineItems.map((li, idx) => (
                                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 60px 100px 100px", padding: "10px 14px", alignItems: "center", borderBottom: idx < lineItems.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none", background: idx % 2 === 0 ? "#FFFFFF" : "rgba(244,240,232,0.4)" }}>
                                    <div>
                                      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "13px", color: "#1C1B2E" }}>{li.name}</p>
                                      {li.unit && <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#9CA3AF" }}>{li.unit}</p>}
                                    </div>
                                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#6B7280", textAlign: "right", fontWeight: 600 }}>{li.quantity}</p>
                                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#D97706", fontWeight: 600, textAlign: "right" }}>{sym}{Number(li.rate).toLocaleString("en-IN")}</p>
                                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#1C1B2E", fontWeight: 700, textAlign: "right" }}>{sym}{Number(li.subtotal).toLocaleString("en-IN")}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Financial breakdown */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "12px 16px", background: "#FAF8F4", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)", alignSelf: "flex-end", minWidth: "260px" }}>
                              {[
                                { label: "Subtotal", val: subtotal, color: "#6B7280", show: true },
                                { label: `Discount${inv.discountType === "percent" ? "" : " (flat)"}`, val: -discountAmt, color: "#16A34A", show: discountAmt > 0 },
                                { label: "Taxable Amount", val: subtotal - discountAmt, color: "#6B7280", show: discountAmt > 0 },
                                { label: `GST (${inv.taxRate ?? 0}%)`, val: taxAmt, color: "#5B5EF4", show: taxAmt > 0 },
                                { label: "Invoice Total", val: total, color: "#1C1B2E", bold: true, show: true },
                                { label: "Paid (Cash)", val: paidCash, color: "#16A34A", show: paidCash > 0 },
                                { label: "Paid (Online)", val: paidOnline, color: "#16A34A", show: paidOnline > 0 },
                                { label: "Balance Due", val: balance, color: balance > 0 ? "#DC2626" : "#16A34A", show: paid > 0 },
                              ].filter(r => r.show).map(({ label, val, color, bold }) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: label === "Invoice Total" ? "1px solid rgba(0,0,0,0.06)" : "none", paddingTop: label === "Invoice Total" ? "6px" : 0, marginTop: label === "Invoice Total" ? "2px" : 0 }}>
                                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>{label}</span>
                                  <span style={{ fontFamily: "var(--font-display)", fontSize: bold ? "1.2rem" : "0.95rem", color, letterSpacing: "0.02em" }}>
                                    {val < 0 ? "-" : ""}{sym}{Math.abs(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Payment History */}
                            {(() => {
                              const history = (inv.paymentHistory ?? []) as PaymentHistoryEntry[];
                              if (history.length === 0) return null;
                              return (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                                    Payment History ({history.length})
                                  </p>
                                  <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", overflow: "hidden" }}>
                                    {history.map((entry, idx) => (
                                      <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px", background: idx % 2 === 0 ? "#FFFFFF" : "rgba(244,240,232,0.4)", borderBottom: idx < history.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                                        <div style={{ paddingTop: "4px", flexShrink: 0 }}>
                                          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: entry.type === "cash" ? D.amber : D.primary }} />
                                        </div>
                                        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                          <div>
                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, color: D.text }}>
                                                {sym}{Number(entry.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                              </span>
                                              <span style={{ background: entry.type === "cash" ? D.amberLight : D.primaryLight, color: entry.type === "cash" ? D.amber : D.primary, border: `1px solid ${entry.type === "cash" ? "rgba(217,119,6,0.25)" : D.border}`, borderRadius: "20px", padding: "1px 8px", fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}>
                                                {entry.type}
                                              </span>
                                            </div>
                                            {entry.reference && (
                                              <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.primary, marginTop: "3px", letterSpacing: "0.04em" }}>Ref: {entry.reference}</p>
                                            )}
                                            {entry.notes && (
                                              <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textMid, marginTop: "2px" }}>{entry.notes}</p>
                                            )}
                                          </div>
                                          <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint, flexShrink: 0, textAlign: "right" }}>
                                            {new Date(entry.paidAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Success banner + Print (shown after successful payment) */}
                            {lastPaidId === inv.id && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(22,163,74,0.10)", border: "1px solid rgba(22,163,74,0.28)", borderRadius: "8px", padding: "8px 14px" }}>
                                  <span style={{ fontSize: "15px", color: "#16A34A" }}>✓</span>
                                  <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#16A34A" }}>
                                    Payment recorded
                                    {paySuccessEmail && !emailSkippedId
                                      ? <> · Receipt sent to <strong>{paySuccessEmail}</strong></>
                                      : ""}
                                  </span>
                                </div>

                                {/* Free plan email cap notice */}
                                {emailSkippedId === inv.id && (
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "8px", padding: "10px 14px" }}>
                                    <span style={{ fontSize: "1rem", lineHeight: 1, marginTop: "1px" }}>🔒</span>
                                    <div>
                                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, color: "#1D4ED8", marginBottom: "2px" }}>
                                        Receipt email not sent — Free plan limit
                                      </p>
                                      <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#3B82F6", lineHeight: 1.5 }}>
                                        You&apos;ve reached 3 emails/buyer this month on the Free plan.{" "}
                                        <a href="/pricing" style={{ color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>
                                          Upgrade to Plus →
                                        </a>
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPrintInvoice(inv); setLastPaidId(null); setPaySuccessEmail(null); }}
                                  style={{ alignSelf: "flex-start", background: D.primaryLight, color: D.primary, border: `1px solid ${D.border}`, borderRadius: "7px", padding: "6px 14px", fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                >
                                  ⎙ Print Receipt
                                </button>
                              </div>
                            )}

                            {/* Record Payment */}
                            {isPayable && !isRecording && (
                              <div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPayingId(inv.id); setPayDraft({ amount: "", type: "cash", reference: "", notes: "" }); setPayError(""); }}
                                  style={{ background: "#5B5EF4", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em" }}
                                >
                                  + Record Payment
                                </button>
                              </div>
                            )}

                            {isRecording && (
                              <div style={{ background: "#fff", border: "1px solid rgba(91,94,244,0.2)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }} onClick={(e) => e.stopPropagation()}>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: "#5B5EF4", letterSpacing: "0.08em", textTransform: "uppercase" }}>Record Payment</p>
                                {(paidCash > 0 || paidOnline > 0) && (
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#6B7280" }}>
                                    Received so far:{paidCash > 0 && ` Cash ₹${paidCash.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}{paidCash > 0 && paidOnline > 0 && " ·"}{paidOnline > 0 && ` Online ₹${paidOnline.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                  </p>
                                )}
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                  <input
                                    type="number"
                                    min={0.01}
                                    step="0.01"
                                    value={payDraft.amount}
                                    onChange={(e) => setPayDraft((d) => ({ ...d, amount: e.target.value }))}
                                    placeholder={`Amount (max ${sym}${balance.toLocaleString("en-IN")})`}
                                    style={{ background: "#FAF8F4", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "7px", padding: "9px 12px", fontFamily: "var(--font-body)", fontSize: "14px", color: "#1C1B2E", outline: "none", flex: 1, minWidth: "140px" }}
                                  />
                                  <select
                                    aria-label="Payment type"
                                    className="db-select-light"
                                    value={payDraft.type}
                                    onChange={(e) => setPayDraft((d) => ({ ...d, type: e.target.value as "cash" | "online" }))}
                                    style={{ width: "110px" }}
                                  >
                                    <option value="cash">Cash</option>
                                    <option value="online">Online</option>
                                  </select>
                                </div>
                                <input
                                  type="text"
                                  value={payDraft.reference}
                                  onChange={(e) => setPayDraft((d) => ({ ...d, reference: e.target.value }))}
                                  placeholder="Transaction / UPI Ref ID (optional)"
                                  style={{ background: "#FAF8F4", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "7px", padding: "9px 12px", fontFamily: "var(--font-body)", fontSize: "13px", color: "#1C1B2E", outline: "none", width: "100%" }}
                                />
                                <textarea
                                  value={payDraft.notes}
                                  onChange={(e) => setPayDraft((d) => ({ ...d, notes: e.target.value }))}
                                  placeholder="Payment notes (optional)"
                                  rows={2}
                                  style={{ background: "#FAF8F4", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "7px", padding: "9px 12px", fontFamily: "var(--font-body)", fontSize: "13px", color: "#1C1B2E", outline: "none", width: "100%", resize: "none" }}
                                />
                                {payError && <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#DC2626" }}>{payError}</p>}
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button type="button" onClick={() => handleRecordPayment(inv)} disabled={payLoading} style={{ background: payLoading ? "#C7C9FB" : "#5B5EF4", color: "#fff", border: "none", borderRadius: "7px", padding: "8px 18px", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, cursor: payLoading ? "not-allowed" : "pointer" }}>
                                    {payLoading ? "Saving…" : "Save Payment"}
                                  </button>
                                  <button type="button" onClick={() => { setPayingId(null); setPayError(""); }} style={{ background: "transparent", color: "#6B7280", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "7px", padding: "8px 14px", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      {printInvoice && (
        <PrintInvoiceModal inv={printInvoice} onClose={() => setPrintInvoice(null)} />
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { color: string; bg: string; border: string; label: string }> = {
    pending:   { color: D.amber,   bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.25)",   label: "Pending" },
    due_soon:  { color: "#EA580C", bg: "rgba(234,88,12,0.1)",   border: "rgba(234,88,12,0.25)",   label: "Due Soon" },
    overdue:   { color: "#DC2626", bg: "rgba(220,38,38,0.08)",  border: "rgba(220,38,38,0.2)",    label: "Overdue" },
    paid:      { color: "#16A34A", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.2)",    label: "Paid" },
    cancelled: { color: D.textFaint, bg: "rgba(0,0,0,0.05)",   border: "rgba(0,0,0,0.1)",        label: "Cancelled" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: "20px", padding: "3px 10px",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: s.color }}>
        {s.label}
      </span>
    </span>
  );
}

// ─── Sales Section ────────────────────────────────────────────────────────────

function genInvoiceNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${rand}`;
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function SalesSection() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceList, setInvoiceList] = useState<InvoiceRow[]>([]);
  const [fetching, setFetching] = useState(true);

  // Form state
  const [form, setForm] = useState({
    customerId: "",
    buyerGstin: "",
    invoiceNumber: genInvoiceNumber(),
    dueDate: "",
    currency: "INR",
    notes: "",
    discountType: "flat" as "flat" | "percent",
    discountValue: "",
    taxRate: "",
    paymentType: "" as "" | "cash" | "online",
    paidAmount: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [planLimitInfo, setPlanLimitInfo] = useState<{ resource: string; limit: number } | null>(null);

  const fetchAll = useCallback(async () => {
    setFetching(true);
    const [cRes, pRes, iRes] = await Promise.all([
      fetch("/api/customers"),
      fetch("/api/products"),
      fetch("/api/invoices"),
    ]);
    const [cJson, pJson, iJson] = await Promise.all([cRes.json(), pRes.json(), iRes.json()]);
    if (cJson.success) setCustomers(cJson.data);
    if (pJson.success) setProducts(pJson.data);
    if (iJson.success) setInvoiceList(iJson.data);
    setFetching(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const discountAmt = form.discountType === "percent"
    ? subtotal * (Number(form.discountValue || 0) / 100)
    : Number(form.discountValue || 0);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxAmt = afterDiscount * (Number(form.taxRate || 0) / 100);
  const total = afterDiscount + taxAmt;

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: "", name: "", rate: 0, quantity: 1, unit: "pcs", subtotal: 0 },
    ]);
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  }

  function updateLineItem(id: string, patch: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== id) return li;
        const updated = { ...li, ...patch };
        updated.subtotal = updated.rate * updated.quantity;
        return updated;
      })
    );
  }

  function onProductSelect(lineId: string, productId: string) {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return updateLineItem(lineId, { productId: "", name: "", rate: 0, unit: "pcs", subtotal: 0 });
    updateLineItem(lineId, {
      productId: p.id,
      name: p.name,
      rate: Number(p.rate),
      unit: p.unit ?? "pcs",
      subtotal: Number(p.rate) * 1,
    });
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId) return setError("Please select a buyer.");
    if (form.taxRate === "") return setError("Please select a GST rate.");
    if (lineItems.length === 0) return setError("Add at least one product.");
    if (lineItems.some((li) => !li.productId)) return setError("Select a product for each line item.");
    if (!form.dueDate) return setError("Due date is required.");
    if (total <= 0) return setError("Total amount must be greater than zero.");
    if (form.paymentType && !form.paidAmount) return setError("Enter the amount paid if a payment mode is selected.");
    for (const li of lineItems) {
      const stock = products.find((p) => p.id === li.productId)?.quantity ?? 0;
      if (li.quantity > stock) return setError(`"${li.name}" only has ${stock} in stock.`);
    }
    setError("");
    setShowPreview(true);
  }

  async function handleCreate() {
    setLoading(true);
    const paidAmt = form.paidAmount ? Math.min(Number(form.paidAmount), total) : 0;

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: form.customerId,
        invoiceNumber: form.invoiceNumber,
        amount: total,
        currency: form.currency,
        issueDate: new Date().toISOString(),
        dueDate: form.dueDate,
        notes: form.notes || undefined,
        discountType: form.discountType,
        discountAmount: discountAmt,
        taxRate: Number(form.taxRate || 0),
        taxAmount: taxAmt,
        paymentType: form.paymentType || null,
        paidAmount: paidAmt,
        extractedData: { lineItems: lineItems.map(({ id: _id, ...rest }) => rest) },
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (json.success) {
      setShowPreview(false);
      const buyerEmail = selectedCustomer?.email ?? null;
      setForm({ customerId: "", buyerGstin: "", invoiceNumber: genInvoiceNumber(), dueDate: "", currency: "INR", notes: "", discountType: "flat", discountValue: "", taxRate: "", paymentType: "", paidAmount: "" });
      setLineItems([]);
      setSuccessEmail(buyerEmail ?? "");
      setTimeout(() => setSuccessEmail(null), 5000);
      fetchAll();
    } else if (json.planLimit) {
      setShowPreview(false);
      setPlanLimitInfo({ resource: json.resource, limit: json.limit });
    } else {
      setShowPreview(false);
      setError(typeof json.error === "string" ? json.error : "Failed to create invoice.");
    }
  }

  const now = new Date();
  const invoicesThisMonth = invoiceList.filter((inv) => {
    const d = new Date(inv.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const currSymbol = form.currency === "USD" ? "$" : form.currency === "EUR" ? "€" : "₹";
  const paidPreview = form.paidAmount ? Math.min(Number(form.paidAmount), total) : 0;
  const balancePreview = Math.max(0, total - paidPreview);
  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

      {/* ── Invoice Preview Modal ── */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "rgba(7,10,18,0.6)",
              backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={{
                background: D.surface, borderRadius: D.radius,
                boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                width: "100%", maxWidth: "620px",
                maxHeight: "90svh", overflowY: "auto",
              }}
            >
              {/* Modal header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 28px", borderBottom: `1px solid ${D.borderFaint}`,
                position: "sticky", top: 0, background: D.surface, zIndex: 1,
              }}>
                <div>
                  <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "11px", color: D.primary, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "2px" }}>
                    Invoice Preview
                  </p>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: D.text, letterSpacing: "0.03em", lineHeight: 1 }}>
                    {form.invoiceNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  style={{
                    background: D.surfaceAlt, border: `1px solid ${D.borderFaint}`,
                    borderRadius: "50%", width: "32px", height: "32px",
                    cursor: "pointer", color: D.textMid,
                    fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Dates row */}
                <div style={{ display: "flex", gap: "32px" }}>
                  {[
                    { label: "Issue Date", val: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                    { label: "Due Date", val: new Date(form.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                    { label: "Currency", val: form.currency },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "3px" }}>{label}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: D.text }}>{val}</p>
                    </div>
                  ))}
                  <div style={{ marginLeft: "auto" }}>
                    {(() => {
                      const b = paidPreview === 0
                        ? { label: "Unpaid", color: "#DC2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)" }
                        : paidPreview >= total
                        ? { label: "Paid", color: "#16A34A", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.2)" }
                        : { label: "Partial", color: "#D97706", bg: "rgba(217,119,6,0.1)", border: "rgba(217,119,6,0.25)" };
                      return (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: b.bg, border: `1px solid ${b.border}`, borderRadius: "20px", padding: "4px 12px" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: b.color, flexShrink: 0 }} />
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: b.color }}>{b.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Bill to */}
                <div style={{ background: D.surfaceAlt, borderRadius: D.radiusSm, padding: "16px 20px", border: `1px solid ${D.borderFaint}` }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "8px" }}>Bill To</p>
                  <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "15px", color: D.text }}>{selectedCustomer?.name ?? "—"}</p>
                  {selectedCustomer?.shopName && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.amber, marginTop: "2px" }}>{selectedCustomer.shopName}</p>
                  )}
                  {selectedCustomer?.email && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: D.textMid, marginTop: "4px" }}>{selectedCustomer.email}</p>
                  )}
                  {selectedCustomer?.phone && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: D.textMid, marginTop: "2px" }}>{selectedCustomer.phone}</p>
                  )}
                  {(form.buyerGstin || selectedCustomer?.gstin) && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint, marginTop: "4px", letterSpacing: "0.05em" }}>
                      GSTIN: {form.buyerGstin || selectedCustomer?.gstin}
                    </p>
                  )}
                </div>

                {/* Line items table */}
                <div style={{ border: `1px solid ${D.borderFaint}`, borderRadius: D.radiusSm, overflow: "hidden" }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "2fr 60px 100px 100px",
                    padding: "10px 16px", background: D.surfaceAlt, borderBottom: `1px solid ${D.borderFaint}`,
                  }}>
                    {["Product", "Qty", "Rate", "Subtotal"].map((h) => (
                      <span key={h} style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase", textAlign: h !== "Product" ? "right" : "left" }}>{h}</span>
                    ))}
                  </div>
                  {lineItems.map((li, i) => (
                    <div key={li.id} style={{
                      display: "grid", gridTemplateColumns: "2fr 60px 100px 100px",
                      padding: "12px 16px", alignItems: "center",
                      borderBottom: i < lineItems.length - 1 ? `1px solid ${D.borderFaint}` : "none",
                      background: i % 2 === 0 ? D.surface : "rgba(244,240,232,0.4)",
                    }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "13px", color: D.text }}>{li.name}</p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint }}>{li.unit}</p>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.textMid, textAlign: "right" }}>{li.quantity}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.amber, fontWeight: 600, textAlign: "right" }}>{currSymbol}{Number(li.rate).toLocaleString("en-IN")}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.text, fontWeight: 700, textAlign: "right" }}>{currSymbol}{li.subtotal.toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px 20px", background: D.surfaceAlt, borderRadius: D.radiusSm, border: `1px solid ${D.borderFaint}` }}>
                  {[
                    { label: "Subtotal", val: subtotal, color: D.textMid, large: false },
                    ...(discountAmt > 0 ? [{ label: `Discount${form.discountType === "percent" ? ` (${form.discountValue}%)` : ""}`, val: -discountAmt, color: "#16A34A", large: false }] : []),
                    ...(discountAmt > 0 ? [{ label: "Taxable Amount", val: afterDiscount, color: D.textMid, large: false }] : []),
                    ...(taxAmt > 0 ? [{ label: `GST (${form.taxRate}%)`, val: taxAmt, color: D.primary, large: false }] : []),
                    { label: "Invoice Total", val: total, color: D.text, large: true },
                    ...(paidPreview > 0 ? [
                      { label: `Amount Paid${form.paymentType ? ` (${form.paymentType})` : ""}`, val: paidPreview, color: "#16A34A", large: false },
                      { label: "Balance Due", val: balancePreview, color: balancePreview > 0 ? "#DC2626" : "#16A34A", large: false },
                    ] : []),
                  ].map(({ label, val, color, large }, idx, arr) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: label === "Invoice Total" && arr.length > 1 ? `1px solid ${D.borderFaint}` : "none", paddingTop: label === "Invoice Total" && arr.length > 1 ? "8px" : 0, marginTop: label === "Invoice Total" && arr.length > 1 ? "4px" : 0 }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.textMid, fontWeight: 500 }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: large ? "1.6rem" : "1.1rem", color, letterSpacing: "0.02em", lineHeight: 1 }}>
                        {val < 0 ? "-" : ""}{currSymbol}{Math.abs(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                {form.notes && (
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "6px" }}>Notes</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: D.textMid, lineHeight: 1.5 }}>{form.notes}</p>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div style={{
                display: "flex", gap: "12px", justifyContent: "flex-end",
                padding: "20px 28px", borderTop: `1px solid ${D.borderFaint}`,
                position: "sticky", bottom: 0, background: D.surface,
              }}>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  style={{
                    background: D.surfaceAlt, color: D.textMid,
                    border: `1px solid ${D.borderFaint}`, borderRadius: D.radiusSm,
                    padding: "10px 24px", fontFamily: "var(--font-body)", fontSize: "13px",
                    fontWeight: 600, cursor: "pointer",
                  }}
                >
                  ← Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  style={{
                    background: loading ? "#C7C9FB" : D.primary,
                    color: "#fff", border: "none", borderRadius: D.radiusSm,
                    padding: "10px 28px", fontFamily: "var(--font-body)", fontSize: "13px",
                    fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                    letterSpacing: "0.06em",
                    boxShadow: loading ? "none" : "0 2px 8px rgba(91,94,244,0.35)",
                  }}
                >
                  {loading ? "Creating…" : "Confirm & Create →"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeading
        title="Create Invoice"
        sub="Pick a buyer, add products, set a due date — DueMate handles the reminders"
      />

      <PlanUsageBar used={invoicesThisMonth} limit={4} label="Invoices this month" />
      {planLimitInfo && (
        <PlanLimitCard resource={planLimitInfo.resource} limit={planLimitInfo.limit} onDismiss={() => setPlanLimitInfo(null)} />
      )}

      {/* ── Invoice Form Card ── */}
      <div style={{
        background: D.surface,
        borderRadius: D.radius,
        padding: "32px",
        boxShadow: D.shadow,
        border: `1px solid ${D.borderFaint}`,
      }}>
        <form onSubmit={handlePreview} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Row 1: Buyer + Invoice Number (locked) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="inv-buyer" style={{
                fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
                color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
              }}>
                Buyer <span style={{ color: D.amber }}>*</span>
              </label>
              <select
                id="inv-buyer"
                className="db-select-light"
                value={form.customerId}
                onChange={(e) => {
                  const custId = e.target.value;
                  const cust = customers.find((c) => c.id === custId);
                  setForm((f) => ({ ...f, customerId: custId, buyerGstin: cust?.gstin ?? "" }));
                }}
                required
              >
                <option value="">— Select buyer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.shopName ? ` (${c.shopName})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{
                fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
                color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
              }}>
                Invoice Number
              </span>
              <div style={{
                background: D.surfaceAlt, border: `1.5px solid ${D.borderFaint}`,
                borderRadius: D.radiusSm, padding: "11px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, color: D.text, fontSize: "14px" }}>
                  {form.invoiceNumber}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: D.textFaint, letterSpacing: "0.06em" }}>
                  auto-generated
                </span>
              </div>
            </div>
          </div>

          {/* Buyer GSTIN */}
          <InputField
            label="Buyer GSTIN"
            name="buyerGstin"
            value={form.buyerGstin}
            onChange={(v) => setForm((f) => ({ ...f, buyerGstin: v.toUpperCase() }))}
            placeholder="Auto-filled from buyer — or enter manually"
          />

          {/* Row 2: Issue Date (locked) + Due Date + Currency */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{
                fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
                color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
              }}>
                Issue Date
              </span>
              <div style={{
                background: D.surfaceAlt, border: `1.5px solid ${D.borderFaint}`,
                borderRadius: D.radiusSm, padding: "11px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: D.text, fontSize: "14px" }}>
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: D.textFaint, letterSpacing: "0.06em" }}>
                  today
                </span>
              </div>
            </div>
            <InputField
              label="Due Date"
              name="inv-due"
              type="date"
              value={form.dueDate}
              onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))}
              required
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="inv-currency" style={{
                fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
                color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
              }}>
                Currency
              </label>
              <select
                id="inv-currency"
                className="db-select-light"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              >
                <option value="INR">INR — ₹</option>
                <option value="USD">USD — $</option>
                <option value="EUR">EUR — €</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
                color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
              }}>
                Products / Line Items <span style={{ color: D.amber }}>*</span>
              </span>
              {products.length === 0 && (
                <span style={{ fontSize: "12px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: D.textFaint }}>
                  Add products in the Products tab first
                </span>
              )}
            </div>

            {/* Column headers */}
            {lineItems.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 80px 100px 100px 32px",
                gap: "8px",
                padding: "0 4px",
              }}>
                {["Product", "Qty", "Rate", "Subtotal", ""].map((h) => (
                  <span key={h} style={{
                    fontSize: "10px", fontFamily: "var(--font-body)", fontWeight: 700,
                    color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase",
                  }}>{h}</span>
                ))}
              </div>
            )}

            {/* Line item rows */}
            {lineItems.map((li) => (
              <motion.div
                key={li.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 80px 100px 100px 32px",
                  gap: "8px",
                  alignItems: "center",
                  background: D.surfaceAlt,
                  borderRadius: D.radiusSm,
                  padding: "10px 12px",
                  border: `1px solid ${D.borderFaint}`,
                }}
              >
                {/* Product select */}
                <select
                  aria-label="Product"
                  className="db-select-light"
                  value={li.productId}
                  onChange={(e) => onProductSelect(li.id, e.target.value)}
                  style={{ padding: "8px 10px", fontSize: "13px" }}
                >
                  <option value="">— Choose product —</option>
                  {products.filter((p) => p.quantity > 0).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.quantity} {p.unit})
                    </option>
                  ))}
                </select>

                {/* Quantity */}
                {(() => {
                  const stock = products.find((p) => p.id === li.productId)?.quantity ?? 0;
                  const atMax = li.productId && li.quantity >= stock;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <input
                        aria-label="Quantity"
                        type="number"
                        min={1}
                        max={stock || undefined}
                        value={li.quantity}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(Number(e.target.value), stock || Infinity));
                          updateLineItem(li.id, { quantity: val });
                        }}
                        style={{
                          background: atMax ? "rgba(220,38,38,0.04)" : D.surface,
                          border: `1.5px solid ${atMax ? "rgba(220,38,38,0.3)" : D.borderFaint}`,
                          borderRadius: D.radiusSm, padding: "8px 10px",
                          fontFamily: "var(--font-body)", fontSize: "13px",
                          color: D.text, outline: "none", width: "100%", textAlign: "right",
                        }}
                      />
                      {li.productId && (
                        <span style={{
                          fontFamily: "var(--font-body)", fontSize: "10px", textAlign: "right",
                          color: atMax ? "#DC2626" : D.textFaint,
                          fontWeight: atMax ? 700 : 400,
                        }}>
                          {atMax ? "max reached" : `/ ${stock} in stock`}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Rate (read-only) */}
                <div style={{
                  background: D.surfaceAlt, border: `1px solid ${D.borderFaint}`,
                  borderRadius: D.radiusSm, padding: "8px 10px",
                  fontFamily: "var(--font-body)", fontSize: "13px",
                  color: li.rate ? D.amber : D.textFaint, textAlign: "right",
                  fontWeight: li.rate ? 600 : 400,
                }}>
                  {li.rate ? `${currSymbol}${Number(li.rate).toLocaleString("en-IN")}` : "—"}
                </div>

                {/* Subtotal */}
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "13px",
                  color: li.subtotal ? D.text : D.textFaint,
                  fontWeight: 600, textAlign: "right", padding: "0 2px",
                }}>
                  {li.subtotal ? `${currSymbol}${li.subtotal.toLocaleString("en-IN")}` : "—"}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeLineItem(li.id)}
                  style={{
                    background: "rgba(220,38,38,0.06)", border: "none",
                    borderRadius: "6px", width: "28px", height: "28px",
                    cursor: "pointer", color: "#DC2626",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", fontWeight: 700, lineHeight: 1,
                    flexShrink: 0,
                  }}
                  aria-label="Remove line item"
                >
                  ×
                </button>
              </motion.div>
            ))}

            {/* Add product button */}
            <button
              type="button"
              onClick={addLineItem}
              disabled={products.length === 0}
              style={{
                alignSelf: "flex-start",
                background: D.primaryLight,
                border: `1.5px dashed ${D.border}`,
                borderRadius: D.radiusSm,
                padding: "8px 18px",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 600,
                color: products.length === 0 ? D.textFaint : D.primary,
                cursor: products.length === 0 ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
              }}
            >
              + Add Product
            </button>
          </div>

          {/* Discount + GST */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Discount */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600, color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                Discount (optional)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  aria-label="Discount type"
                  className="db-select-light"
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "flat" | "percent", discountValue: "" }))}
                  style={{ width: "90px", flexShrink: 0 }}
                >
                  <option value="flat">₹ Flat</option>
                  <option value="percent">% Off</option>
                </select>
                <input
                  aria-label="Discount value"
                  type="number"
                  min={0}
                  max={form.discountType === "percent" ? 100 : undefined}
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  placeholder={form.discountType === "percent" ? "e.g. 10" : "e.g. 50"}
                  style={{
                    background: D.surfaceAlt, border: `1.5px solid ${D.borderFaint}`,
                    borderRadius: D.radiusSm, padding: "11px 14px",
                    fontFamily: "var(--font-body)", fontSize: "14px",
                    color: D.text, outline: "none", flex: 1,
                  }}
                />
              </div>
            </div>

            {/* GST */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="inv-gst" style={{ fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600, color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                GST Rate <span style={{ color: D.primary }}>*</span>
              </label>
              <select
                id="inv-gst"
                className="db-select-light"
                value={form.taxRate}
                onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
                required
              >
                <option value="">— Select rate —</option>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="18">18%</option>
                <option value="40">40%</option>
              </select>
            </div>
          </div>

          {/* Pricing breakdown (shown when discount or tax is set) */}
          {(discountAmt > 0 || taxAmt > 0) && (
            <div style={{ background: D.surfaceAlt, borderRadius: D.radiusSm, border: `1px solid ${D.borderFaint}`, padding: "14px 18px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
              {[
                { label: "Subtotal", val: subtotal, color: D.text },
                ...(discountAmt > 0 ? [{ label: `Discount${form.discountType === "percent" ? ` (${form.discountValue}%)` : ""}`, val: -discountAmt, color: "#16A34A" }] : []),
                ...(discountAmt > 0 ? [{ label: "Taxable", val: afterDiscount, color: D.textMid }] : []),
                ...(taxAmt > 0 ? [{ label: `GST (${form.taxRate}%)`, val: taxAmt, color: D.primary }] : []),
              ].map(({ label, val, color }, idx, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "2px" }}>{label}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color }}>
                      {val < 0 ? "-" : ""}{currSymbol}{Math.abs(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {idx < arr.length - 1 && <span style={{ color: D.borderFaint, fontSize: "18px" }}>→</span>}
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="inv-notes" style={{
              fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
              color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
            }}>
              Notes (optional)
            </label>
            <textarea
              id="inv-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes for this invoice…"
              rows={2}
              style={{
                background: D.surfaceAlt, border: `1.5px solid ${D.borderFaint}`,
                borderRadius: D.radiusSm, padding: "11px 14px",
                fontFamily: "var(--font-body)", fontSize: "14px",
                color: D.text, outline: "none", resize: "vertical",
                width: "100%", transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Payment */}
          <div style={{
            background: D.surfaceAlt, borderRadius: D.radiusSm,
            border: `1px solid ${D.borderFaint}`, padding: "20px",
            display: "flex", flexDirection: "column", gap: "16px",
          }}>
            <span style={{
              fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 700,
              color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
            }}>
              Payment at Invoice Creation
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Payment type */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="inv-ptype" style={{
                  fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
                  color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
                }}>
                  Payment Mode
                </label>
                <select
                  id="inv-ptype"
                  className="db-select-light"
                  value={form.paymentType}
                  onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value as "" | "cash" | "online" }))}
                >
                  <option value="">— Not paid yet —</option>
                  <option value="cash">Cash</option>
                  <option value="online">Online Transfer</option>
                </select>
              </div>

              {/* Amount paid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="inv-paid" style={{
                  fontSize: "11px", fontFamily: "var(--font-body)", fontWeight: 600,
                  color: D.textMid, letterSpacing: "0.09em", textTransform: "uppercase",
                }}>
                  Amount Paid ({currSymbol})
                </label>
                <input
                  id="inv-paid"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.paidAmount}
                  onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))}
                  placeholder="0.00"
                  style={{
                    background: D.surface, border: `1.5px solid ${D.borderFaint}`,
                    borderRadius: D.radiusSm, padding: "11px 14px",
                    fontFamily: "var(--font-body)", fontSize: "14px",
                    color: D.text, outline: "none", width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Summary row */}
            {(() => {
              const paid = form.paidAmount ? Math.min(Number(form.paidAmount), total) : 0;
              const balance = Math.max(0, total - paid);
              const isFullPaid = total > 0 && paid >= total;
              return (
                <div style={{
                  display: "flex", gap: "24px", flexWrap: "wrap",
                  paddingTop: "12px", borderTop: `1px solid ${D.borderFaint}`,
                }}>
                  {[
                    { label: "Invoice Total", val: total, color: D.amber },
                    { label: "Amount Paid", val: paid, color: "#16A34A" },
                    { label: "Balance Due", val: balance, color: balance > 0 ? "#DC2626" : "#16A34A" },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "10px", fontFamily: "var(--font-body)", fontWeight: 700, color: D.textFaint, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color, letterSpacing: "0.02em", lineHeight: 1 }}>
                        {currSymbol}{val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {isFullPaid && (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{
                        background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)",
                        borderRadius: "20px", padding: "4px 12px",
                        fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700,
                        color: "#16A34A", letterSpacing: "0.04em",
                      }}>
                        PAID IN FULL
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Footer: submit */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "flex-end", flexWrap: "wrap", gap: "16px",
            paddingTop: "8px",
          }}>
            {successEmail !== null && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(22,163,74,0.12)",
                  border: "1px solid rgba(22,163,74,0.3)",
                  borderRadius: "8px", padding: "8px 14px",
                }}
              >
                <span style={{ fontSize: "15px", color: "#16A34A" }}>✓</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#16A34A" }}>
                  Invoice created
                  {successEmail
                    ? <> · Email sent to <strong>{successEmail}</strong></>
                    : " successfully"}
                </span>
              </motion.div>
            )}
            {error && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#DC2626" }}>
                {error}
              </span>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#C7C9FB" : D.primary,
                color: "#fff", border: "none",
                borderRadius: D.radiusSm, padding: "11px 32px",
                fontFamily: "var(--font-body)", fontSize: "13px",
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.06em",
                boxShadow: loading ? "none" : "0 2px 8px rgba(91,94,244,0.35)",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Creating…" : "Preview Invoice →"}
            </button>
          </div>

        </form>
      </div>

      {/* ── Recent Invoices ── */}
      <InvoiceList invoiceList={invoiceList} fetching={fetching} onRefresh={fetchAll} />
    </div>
  );
}


// ─── Insights Section ─────────────────────────────────────────────────────────

function InsightsSection() {
  const [invoiceList, setInvoiceList] = useState<InvoiceRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const [invRes, custRes, prodRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/customers"),
        fetch("/api/products"),
      ]);
      const [invData, custData, prodData] = await Promise.all([
        invRes.json(),
        custRes.json(),
        prodRes.json(),
      ]);
      if (invData.success) setInvoiceList(invData.data ?? []);
      if (custData.success) setCustomers(custData.data ?? []);
      if (prodData.success) setProducts(prodData.data ?? []);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => invoiceList.reduce((s, inv) => s + parseFloat(inv.amount ?? "0"), 0),
    [invoiceList]
  );
  const totalCollected = useMemo(
    () => invoiceList.reduce((s, inv) => s + parseFloat(inv.paidAmount ?? "0"), 0),
    [invoiceList]
  );
  const totalOutstanding = useMemo(
    () => invoiceList.reduce((s, inv) => s + parseFloat(inv.balanceAmount ?? "0"), 0),
    [invoiceList]
  );
  const totalTax = useMemo(
    () => invoiceList.reduce((s, inv) => s + parseFloat(inv.taxAmount ?? "0"), 0),
    [invoiceList]
  );
  const totalDiscounts = useMemo(
    () => invoiceList.reduce((s, inv) => s + parseFloat(inv.discountAmount ?? "0"), 0),
    [invoiceList]
  );
  const paidCash = useMemo(
    () => invoiceList.reduce((s, inv) => s + parseFloat(inv.paidCash ?? "0"), 0),
    [invoiceList]
  );
  const paidOnline = useMemo(
    () => invoiceList.reduce((s, inv) => s + parseFloat(inv.paidOnline ?? "0"), 0),
    [invoiceList]
  );

  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
  const avgInvoiceValue = invoiceList.length > 0 ? Math.round(totalRevenue / invoiceList.length) : 0;

  const overdueInvoices = useMemo(
    () => invoiceList.filter((inv) => inv.status === "overdue"),
    [invoiceList]
  );
  const overdueAmount = useMemo(
    () => overdueInvoices.reduce((s, inv) => s + parseFloat(inv.balanceAmount ?? "0"), 0),
    [overdueInvoices]
  );

  // ── Days Sales Outstanding ─────────────────────────────────────────────────
  const dso = useMemo(() => {
    const paid = invoiceList.filter(
      (inv) => inv.status === "paid" && inv.issueDate && inv.paidAt
    );
    if (!paid.length) return 0;
    const total = paid.reduce((s, inv) => {
      const diff =
        (new Date(inv.paidAt!).getTime() - new Date(inv.issueDate!).getTime()) /
        86400000;
      return s + diff;
    }, 0);
    return Math.round(total / paid.length);
  }, [invoiceList]);

  // ── Status pie data ────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      paid: 0, pending: 0, overdue: 0, due_soon: 0, cancelled: 0,
    };
    invoiceList.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] ?? 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [invoiceList]);

  // ── Revenue over time ──────────────────────────────────────────────────────
  const revenueChartData = useMemo(() => {
    const map = new Map<string, { revenue: number; collected: number }>();
    invoiceList.forEach((inv) => {
      if (!inv.issueDate) return;
      let key: string;
      if (period === "monthly") {
        key = inv.issueDate.slice(0, 7);
      } else if (period === "quarterly") {
        const d = new Date(inv.issueDate);
        key = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
      } else {
        key = inv.issueDate.slice(0, 4);
      }
      const cur = map.get(key) ?? { revenue: 0, collected: 0 };
      cur.revenue += parseFloat(inv.amount ?? "0");
      cur.collected += parseFloat(inv.paidAmount ?? "0");
      map.set(key, cur);
    });
    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    const sliced = period === "monthly" ? sorted.slice(-12) : sorted;
    return sliced.map(([k, data]) => {
      let label = k;
      if (period === "monthly") {
        label = new Date(k + "-01").toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        });
      } else if (period === "quarterly") {
        const [yr, q] = k.split("-");
        label = `${q} ${yr}`;
      }
      return { period: label, revenue: Math.round(data.revenue), collected: Math.round(data.collected) };
    });
  }, [invoiceList, period]);

  // ── Quarterly revenue (always) ─────────────────────────────────────────────
  const quarterlyData = useMemo(() => {
    const map = new Map<string, number>();
    invoiceList.forEach((inv) => {
      if (!inv.issueDate) return;
      const d = new Date(inv.issueDate);
      const key = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      map.set(key, (map.get(key) ?? 0) + parseFloat(inv.amount ?? "0"));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, revenue]) => ({ period, revenue: Math.round(revenue) }));
  }, [invoiceList]);

  // ── Top customers ──────────────────────────────────────────────────────────
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>();
    invoiceList.forEach((inv) => {
      if (!inv.customerId) return;
      const name = inv.customerShopName ?? inv.customerName ?? "Unknown";
      const cur = map.get(inv.customerId) ?? { name, revenue: 0 };
      cur.revenue += parseFloat(inv.amount ?? "0");
      map.set(inv.customerId, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((c) => ({ ...c, revenue: Math.round(c.revenue) }));
  }, [invoiceList]);

  // ── Tax vs discounts by month ──────────────────────────────────────────────
  const taxDiscountData = useMemo(() => {
    const map = new Map<string, { tax: number; discount: number }>();
    invoiceList.forEach((inv) => {
      if (!inv.issueDate) return;
      const key = inv.issueDate.slice(0, 7);
      const cur = map.get(key) ?? { tax: 0, discount: 0 };
      cur.tax += parseFloat(inv.taxAmount ?? "0");
      cur.discount += parseFloat(inv.discountAmount ?? "0");
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([k, data]) => ({
        month: new Date(k + "-01").toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        tax: Math.round(data.tax),
        discount: Math.round(data.discount),
      }));
  }, [invoiceList]);

  // ── Top product by line-item revenue ──────────────────────────────────────
  const topProductName = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    invoiceList.forEach((inv) => {
      inv.extractedData?.lineItems?.forEach((li) => {
        const cur = map.get(li.productId) ?? { name: li.name, total: 0 };
        cur.total += li.subtotal;
        map.set(li.productId, cur);
      });
    });
    return (
      Array.from(map.values()).sort((a, b) => b.total - a.total)[0]?.name ?? ""
    );
  }, [invoiceList]);

  // ── Products by purchase investment ───────────────────────────────────────
  const topProductsByPurchase = useMemo(
    () =>
      products
        .filter((p) => p.purchaseRate && parseFloat(p.purchaseRate) > 0)
        .map((p) => ({
          name: p.name,
          investment: Math.round(
            parseFloat(p.purchaseRate ?? "0") *
              p.quantity *
              (1 + parseFloat(p.gstRate ?? "0") / 100)
          ),
          quantity: p.quantity,
          unit: p.unit ?? "",
        }))
        .sort((a, b) => b.investment - a.investment)
        .slice(0, 5),
    [products]
  );

  // ── AI summary ────────────────────────────────────────────────────────────
  const doFetchAiSummary = useCallback(async () => {
    if (totalRevenue === 0) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/analytics/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalRevenue: Math.round(totalRevenue),
          totalCollected: Math.round(totalCollected),
          totalOutstanding: Math.round(totalOutstanding),
          overdueCount: overdueInvoices.length,
          overdueAmount: Math.round(overdueAmount),
          topCustomer: topCustomers[0]?.name ?? "",
          topProduct: topProductName,
          invoiceCount: invoiceList.length,
        }),
      });
      const data = await res.json();
      if (data.success) setAiSummary(data.data);
      else setAiError("Could not generate summary.");
    } catch {
      setAiError("Could not connect to AI.");
    } finally {
      setAiLoading(false);
    }
  }, [totalRevenue, totalCollected, totalOutstanding, overdueInvoices.length, overdueAmount, topCustomers, topProductName, invoiceList.length]);

  useEffect(() => {
    if (!fetching && invoiceList.length > 0) doFetchAiSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetching]);

  const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const fmtK = (v: number) =>
    v >= 100000
      ? "₹" + (v / 100000).toFixed(1) + "L"
      : v >= 1000
      ? "₹" + Math.round(v / 1000) + "k"
      : "₹" + v;

  // ── Light theme tokens for Insights ──────────────────────────────────────
  const I = {
    card: "rgba(255,255,255,0.82)",
    cardBorder: "rgba(129,140,248,0.14)",
    text: "#1E1B3A",
    textMid: "#6B7280",
    textFaint: "#9CA3AF",
    indigo: "#5B5EF4", indigoBg: "rgba(91,94,244,0.08)",  indigoBorder: "rgba(91,94,244,0.2)",
    green: "#059669",  greenBg:  "rgba(5,150,105,0.08)",   greenBorder:  "rgba(5,150,105,0.2)",
    amber: "#D97706",  amberBg:  "rgba(217,119,6,0.08)",   amberBorder:  "rgba(217,119,6,0.2)",
    red: "#DC2626",    redBg:    "rgba(220,38,38,0.08)",   redBorder:    "rgba(220,38,38,0.2)",
    purple: "#7C3AED", purpleBg: "rgba(124,58,237,0.08)",  purpleBorder: "rgba(124,58,237,0.2)",
    cyan: "#0891B2",   cyanBg:   "rgba(8,145,178,0.08)",   cyanBorder:   "rgba(8,145,178,0.2)",
  };

  const tooltipStyle = {
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(129,140,248,0.18)",
    borderRadius: "10px",
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    color: I.text,
    boxShadow: "0 4px 20px rgba(91,94,244,0.1)",
  };

  const glassCard = (accent?: string) => ({
    background: accent ? accent : I.card,
    border: `1px solid ${I.cardBorder}`,
    borderRadius: "16px",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 2px 16px rgba(91,94,244,0.06)",
    overflow: "hidden" as const,
    position: "relative" as const,
  });

  const chartTick = { fontFamily: "var(--font-body)", fontSize: 11, fill: I.textFaint };

  if (fetching) {
    return (
      <div style={{
        background: "linear-gradient(160deg, #F5F3FF, #EEF2FF)",
        borderRadius: "20px",
        border: "1px solid rgba(129,140,248,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "340px", gap: "12px",
      }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: I.indigo }} />
        <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: I.textMid }}>Loading insights…</span>
      </div>
    );
  }

  if (invoiceList.length === 0) {
    return (
      <div style={{
        background: "linear-gradient(160deg, #F5F3FF, #EEF2FF)",
        borderRadius: "20px",
        border: "1px solid rgba(129,140,248,0.15)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "340px", gap: "14px",
      }}>
        <div style={{ fontSize: "40px", opacity: 0.25, color: I.indigo }}>✦</div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: I.text, letterSpacing: "0.06em" }}>INSIGHTS</p>
        <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "14px", color: I.textMid }}>Create your first invoice to see analytics</p>
      </div>
    );
  }

  const topShare =
    topCustomers.length > 0 && totalRevenue > 0
      ? topCustomers[0].revenue / totalRevenue
      : 0;

  return (
    <div style={{
      background: "linear-gradient(160deg, #F5F3FF 0%, #EEF2FF 45%, #F0F4FF 100%)",
      borderRadius: "20px",
      padding: "28px",
      border: "1px solid rgba(129,140,248,0.18)",
      boxShadow: "0 4px 40px rgba(91,94,244,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      marginBottom: "20px",
    }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem,2vw,1.9rem)", color: I.text, letterSpacing: "0.08em", lineHeight: 1 }}>
            INSIGHTS
          </h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: I.textMid, marginTop: "4px" }}>
            Visual analytics · {invoiceList.length} invoices · {customers.length} customers
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(91,94,244,0.07)", borderRadius: "10px", padding: "4px", border: "1px solid rgba(91,94,244,0.12)" }}>
          {(["monthly", "quarterly", "yearly"] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} style={{
              background: period === p ? `linear-gradient(135deg, ${I.indigo}, #7C3AED)` : "transparent",
              color: period === p ? "#fff" : I.textFaint,
              border: "none",
              borderRadius: "7px",
              padding: "5px 14px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.05em",
              textTransform: "capitalize",
              boxShadow: period === p ? "0 2px 10px rgba(91,94,244,0.35)" : "none",
              transition: "all 0.2s",
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 1: KPI Cards ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "Total Revenue", value: fmt(totalRevenue), sub: `${invoiceList.length} invoices`, accent: I.indigo, bg: I.indigoBg, border: I.indigoBorder },
          { label: "Collected", value: fmt(totalCollected), sub: `${collectionRate}% collected`, accent: I.green, bg: I.greenBg, border: I.greenBorder },
          { label: "Outstanding", value: fmt(totalOutstanding), sub: `${overdueInvoices.length} overdue`, accent: overdueInvoices.length > 0 ? I.amber : I.green, bg: overdueInvoices.length > 0 ? I.amberBg : I.greenBg, border: overdueInvoices.length > 0 ? I.amberBorder : I.greenBorder },
          { label: "Tax Collected", value: fmt(totalTax), sub: `₹${Math.round(totalDiscounts).toLocaleString("en-IN")} discounts`, accent: I.purple, bg: I.purpleBg, border: I.purpleBorder },
        ].map((card) => (
          <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: "14px", padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-16px", right: "-16px", width: "70px", height: "70px", background: `radial-gradient(circle, ${card.accent}33 0%, transparent 70%)`, pointerEvents: "none" }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 600, color: card.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", opacity: 0.85 }}>{card.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.55rem", color: I.text, letterSpacing: "0.02em", textShadow: `0 0 20px ${card.accent}55` }}>{card.value}</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: I.textFaint, marginTop: "5px" }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2: AI Business Health ─────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(91,94,244,0.06) 0%, rgba(124,58,237,0.04) 100%)",
        border: "1px solid rgba(91,94,244,0.18)",
        borderRadius: "14px",
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: "14px",
        boxShadow: "0 2px 20px rgba(91,94,244,0.07)",
      }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#5B5EF4,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "14px", color: "#fff", boxShadow: "0 2px 12px rgba(91,94,244,0.35)" }}>✦</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "9px", fontWeight: 700, color: I.indigo, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: "10px" }}>AI · Gemini</span>
          {aiLoading
            ? <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: I.textMid }}>Analysing your business…</span>
            : aiError
            ? <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: I.red }}>{aiError}</span>
            : <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: I.text, lineHeight: 1.6 }}>{aiSummary}</span>
          }
        </div>
        <button type="button" onClick={doFetchAiSummary} disabled={aiLoading} style={{ background: "rgba(91,94,244,0.08)", border: "1px solid rgba(91,94,244,0.2)", borderRadius: "8px", padding: "5px 12px", fontFamily: "var(--font-body)", fontSize: "11px", color: I.indigo, cursor: aiLoading ? "not-allowed" : "pointer", flexShrink: 0, fontWeight: 600 }}>↻</button>
      </div>

      {/* ── Row 3: Revenue chart (3fr) + Status pie (1fr) ────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "10px" }}>
        <div style={{ ...glassCard(), padding: "18px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "14px", letterSpacing: "0.04em" }}>Revenue vs Collected</p>
          <ResponsiveContainer width="100%" height={185}>
            <LineChart data={revenueChartData} margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={I.indigo} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={I.indigo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="period" tick={chartTick} axisLine={false} tickLine={false} />
              <YAxis tick={chartTick} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(Number(v ?? 0))} />
              <Legend wrapperStyle={{ fontFamily: "var(--font-body)", fontSize: "11px", color: I.textMid }} />
              <Line type="monotone" dataKey="revenue" stroke={I.indigo} strokeWidth={2.5} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="collected" stroke={I.green} strokeWidth={2.5} dot={false} name="Collected" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...glassCard(), padding: "18px 16px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "10px", letterSpacing: "0.04em" }}>Invoice Status</p>
          <ResponsiveContainer width="100%" height={185}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="45%" innerRadius={44} outerRadius={68} paddingAngle={4} dataKey="value">
                {statusCounts.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? I.cyan} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [Number(v ?? 0) + " inv", String(name)]} />
              <Legend wrapperStyle={{ fontFamily: "var(--font-body)", fontSize: "10px", color: I.textMid }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Top customers (2fr) + Quarterly (1fr) + Payment (1fr) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
        {topCustomers.length > 0 && (
          <div style={{ ...glassCard(), padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "12px", letterSpacing: "0.04em" }}>Top Customers</p>
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={topCustomers.slice(0,6)} layout="vertical" margin={{ top: 0, right: 50, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <YAxis type="category" dataKey="name" width={110} tick={{ ...chartTick, fill: I.textMid }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(Number(v ?? 0))} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue" label={{ position: "right", // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter: (v: any) => fmtK(Number(v ?? 0)), fontFamily: "var(--font-body)", fontSize: 10, fill: I.textFaint }}>
                  {topCustomers.slice(0,6).map((_, idx) => (
                    <Cell key={idx} fill={`rgba(129,140,248,${0.9 - idx * 0.12})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {quarterlyData.length > 0 && (
          <div style={{ ...glassCard(), padding: "18px 16px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "12px", letterSpacing: "0.04em" }}>Quarterly</p>
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={quarterlyData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="period" tick={{ ...chartTick, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={chartTick} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(Number(v ?? 0))} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Revenue">
                  {quarterlyData.map((_, idx) => (
                    <Cell key={idx} fill={[I.indigo, I.green, I.amber, I.purple][idx % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ ...glassCard(), padding: "18px 16px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "12px", letterSpacing: "0.04em" }}>Payment Split</p>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={[{ name: "Cash", value: Math.round(paidCash) }, { name: "Online", value: Math.round(paidOnline) }]} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={chartTick} axisLine={false} tickLine={false} />
              <YAxis tick={chartTick} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(Number(v ?? 0))} />
              <Bar dataKey="value" name="Amount" radius={[5, 5, 0, 0]}>
                <Cell fill={I.amber} />
                <Cell fill={I.indigo} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 5: Tax vs Discounts (1fr) ─────────────────────────── */}
      {taxDiscountData.length > 0 && (
        <div style={{ ...glassCard(), padding: "18px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "12px", letterSpacing: "0.04em" }}>Tax vs Discounts (Monthly)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={taxDiscountData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ ...chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ ...chartTick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(Number(v ?? 0))} />
              <Legend wrapperStyle={{ fontFamily: "var(--font-body)", fontSize: "11px", color: I.textMid }} />
              <Bar dataKey="tax" fill={I.purple} radius={[3, 3, 0, 0]} name="Tax" />
              <Bar dataKey="discount" fill={I.amber} radius={[3, 3, 0, 0]} name="Discount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Row 6: Products + Business Health ────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: topProductsByPurchase.length > 0 ? "1fr 1fr" : "1fr", gap: "10px" }}>

        {topProductsByPurchase.length > 0 && (
          <div style={{ ...glassCard(), padding: "18px 20px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "14px", letterSpacing: "0.04em" }}>Purchase Investment</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topProductsByPurchase.map((p, i) => {
                const accent = [I.indigo, I.green, I.amber, I.purple, I.cyan][i];
                const max = topProductsByPurchase[0].investment;
                const pct = max > 0 ? (p.investment / max) * 100 : 0;
                return (
                  <div key={p.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: I.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{p.name}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: accent }}>{fmt(p.investment)}</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}99)`, borderRadius: "2px", boxShadow: `0 0 8px ${accent}55` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ ...glassCard(), padding: "18px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: I.text, marginBottom: "14px", letterSpacing: "0.04em" }}>Business Health</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px" }}>
            {[
              { label: "Collection Rate", value: collectionRate + "%", color: collectionRate >= 80 ? I.green : collectionRate >= 50 ? I.amber : I.red, sub: collectionRate >= 80 ? "Excellent" : collectionRate >= 50 ? "Average" : "Low" },
              { label: "Avg Invoice", value: fmt(avgInvoiceValue), color: I.indigo, sub: "per invoice" },
              { label: "Days Outstanding", value: dso > 0 ? dso + "d" : "—", color: dso === 0 || dso <= 30 ? I.green : dso <= 60 ? I.amber : I.red, sub: dso === 0 ? "No paid yet" : dso <= 30 ? "Healthy" : dso <= 60 ? "Watch" : "Slow" },
              { label: "Overdue Balance", value: fmt(overdueAmount), color: overdueAmount > 0 ? I.red : I.green, sub: overdueInvoices.length + " invoices" },
              { label: "Customers", value: String(customers.length), color: I.cyan, sub: topCustomers[0]?.name?.slice(0, 14) ?? "—" },
              { label: "Top Share", value: topCustomers.length > 0 && totalRevenue > 0 ? Math.round(topShare * 100) + "%" : "—", color: topShare > 0.6 ? I.amber : I.green, sub: topShare > 0.6 ? "⚠ Concentrated" : "Spread" },
            ].map((m) => (
              <div key={m.label} style={{ borderLeft: `2px solid ${m.color}`, paddingLeft: "10px" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "9px", fontWeight: 700, color: I.textFaint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>{m.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: I.text, letterSpacing: "0.02em", textShadow: `0 0 12px ${m.color}44` }}>{m.value}</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "10px", color: m.color, marginTop: "1px" }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

const TABS: { id: Tab; label: string; numeral: string }[] = [
  { id: "customers", label: "Buyers", numeral: "I" },
  { id: "products", label: "Products", numeral: "II" },
  { id: "sales", label: "Sales", numeral: "III" },
  { id: "insights", label: "Insights", numeral: "IV" },
];

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("customers");

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div
      style={{
        background: D.bg,
        height: "100svh",
        overflowY: "auto",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${D.borderFaint}`,
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: D.textFaint,
              fontSize: "12px",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              letterSpacing: "0.06em",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← Home
          </button>
          <span
            style={{
              width: "1px",
              height: "18px",
              background: D.borderFaint,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              color: D.text,
              letterSpacing: "0.06em",
            }}
          >
            DueMate
          </span>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "13px",
              color: D.textFaint,
            }}
          >
            Dashboard
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: D.surfaceAlt,
            border: `1px solid ${D.borderFaint}`,
            borderRadius: "40px",
            padding: "6px 16px 6px 10px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${D.primary}, #818CF8)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            {(user.firstName ?? user.username ?? "U")[0].toUpperCase()}
          </div>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "14px",
              color: D.text,
            }}
          >
            {user.firstName ?? user.username ?? ""}
          </span>
        </div>
      </header>

      {/* Tab navigation */}
      <nav
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)",
          padding: "0 40px",
          display: "flex",
          gap: "4px",
          borderBottom: `1px solid ${D.borderFaint}`,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 20px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom:
                activeTab === tab.id
                  ? `2px solid ${D.primary}`
                  : "2px solid transparent",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "12px",
                color:
                  activeTab === tab.id ? D.amber : "rgba(217,119,6,0.35)",
                letterSpacing: "0.04em",
              }}
            >
              {tab.numeral}.
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? D.text : D.textFaint,
                letterSpacing: "0.04em",
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main
        style={{
          padding: "40px",
          maxWidth: activeTab === "insights" ? "1140px" : "920px",
          margin: "0 auto",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === "customers" && <CustomersSection />}
            {activeTab === "products" && <ProductsSection />}
            {activeTab === "sales" && <SalesSection />}
            {activeTab === "insights" && <InsightsSection />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
