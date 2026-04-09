"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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

type Tab = "customers" | "products" | "sales";

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

  const fetchList = useCallback(async () => {
    setFetching(true);
    const res = await fetch("/api/products");
    const json = await res.json();
    if (json.success) setList(json.data);
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchList();
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
                Status: <span style={{ fontWeight: 700, color: inv.status === "paid" ? "#16A34A" : inv.status === "overdue" ? "#DC2626" : "#D97706", textTransform: "capitalize" }}>{inv.status.replace("_", " ")}</span>
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

                            {/* Print Receipt prompt (shown after successful payment) */}
                            {lastPaidId === inv.id && (
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "13px", color: "#16A34A" }}>Payment recorded!</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setPrintInvoice(inv); setLastPaidId(null); }}
                                  style={{ background: D.primaryLight, color: D.primary, border: `1px solid ${D.border}`, borderRadius: "7px", padding: "6px 14px", fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
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
  const [success, setSuccess] = useState(false);

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
      setForm({ customerId: "", buyerGstin: "", invoiceNumber: genInvoiceNumber(), dueDate: "", currency: "INR", notes: "", discountType: "flat", discountValue: "", taxRate: "", paymentType: "", paidAmount: "" });
      setLineItems([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchAll();
    } else {
      setShowPreview(false);
      setError(typeof json.error === "string" ? json.error : "Failed to create invoice.");
    }
  }

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
            {success && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  fontFamily: "var(--font-serif)", fontStyle: "italic",
                  fontSize: "14px", color: "#16A34A",
                }}
              >
                Invoice created!
              </motion.span>
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

// ─── Dashboard Page ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; numeral: string }[] = [
  { id: "customers", label: "Buyers", numeral: "I" },
  { id: "products", label: "Products", numeral: "II" },
  { id: "sales", label: "Sales", numeral: "III" },
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
          maxWidth: "920px",
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
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
