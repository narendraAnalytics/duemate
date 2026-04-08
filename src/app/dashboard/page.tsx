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
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  rate: string;
  unit: string | null;
  quantity: number;
  createdAt: string;
};

type Tab = "customers" | "products" | "sales";

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

function CustomersSection() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", shopName: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    if (!form.name.trim()) return setError("Buyer name is required.");
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
      setForm({ name: "", email: "", shopName: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      fetchList();
    } else {
      setError(typeof json.error === "string" ? json.error : "Failed to save.");
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
            />
          </div>
          <InputField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="buyer@example.com"
          />

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
                gridTemplateColumns: "1fr 1fr 1fr",
                padding: "12px 24px",
                background: D.surfaceAlt,
                borderBottom: `1px solid ${D.borderFaint}`,
              }}
            >
              {["Buyer", "Email", "Added"].map((h) => (
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
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  padding: "16px 24px",
                  alignItems: "center",
                  borderBottom:
                    i < list.length - 1
                      ? `1px solid ${D.borderFaint}`
                      : "none",
                  background:
                    i % 2 === 0 ? D.surface : "rgba(244,240,232,0.4)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      color: D.text,
                      fontSize: "14px",
                    }}
                  >
                    {c.name}
                  </p>
                  {c.shopName && (
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: D.amber,
                        marginTop: "2px",
                        fontWeight: 500,
                      }}
                    >
                      {c.shopName}
                    </p>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: D.textMid,
                  }}
                >
                  {c.email || "—"}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: D.textFaint,
                  }}
                >
                  {new Date(c.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
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
  });

  const UNITS = ["pcs","kg","g","litre","ml","box","dozen","metre","bag","ton"];

  async function handleSave() {
    if (!draft.name.trim()) return setEditErr("Name required.");
    if (!draft.rate || Number(draft.rate) <= 0) return setEditErr("Enter a valid rate.");
    if (isNaN(Number(draft.quantity)) || Number(draft.quantity) < 0) return setEditErr("Quantity must be 0 or more.");
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
                onClick={() => { setDraft({ name: product.name, description: product.description ?? "", rate: product.rate, unit: product.unit ?? "pcs", quantity: String(product.quantity) }); setEditing(true); setEditErr(""); }}
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
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: D.textFaint, marginBottom: "12px", lineHeight: 1.4 }}>
                {product.description}
              </p>
            )}
            <div style={{ marginTop: product.description ? 0 : "12px", display: "flex", alignItems: "baseline", gap: "3px", marginBottom: "10px" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,2.5vw,2rem)", color: D.amber, letterSpacing: "0.02em", lineHeight: 1 }}>
                ₹{Number(product.rate).toLocaleString("en-IN")}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: D.textFaint, fontWeight: 500 }}>
                /{product.unit}
              </span>
            </div>
            <StockBadge quantity={product.quantity} unit={product.unit} />
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
              <input
                id={`edit-desc-${product.id}`}
                className="db-edit-input"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Optional"
              />
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
    if (!form.rate || isNaN(Number(form.rate)) || Number(form.rate) <= 0)
      return setError("Enter a valid rate.");
    if (form.quantity && (isNaN(Number(form.quantity)) || Number(form.quantity) < 0))
      return setError("Quantity must be 0 or more.");
    setError("");
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        rate: Number(form.rate),
        quantity: form.quantity ? Number(form.quantity) : 0,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setForm({ name: "", description: "", rate: "", unit: "pcs", quantity: "" });
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "20px",
            }}
          >
            <InputField
              label="Product Name"
              name="pname"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Mens Shorts"
              required
            />
            <InputField
              label="Rate (₹)"
              name="rate"
              type="number"
              value={form.rate}
              onChange={(v) => setForm((f) => ({ ...f, rate: v }))}
              placeholder="180.00"
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
              <label
                htmlFor="unit"
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  color: D.textMid,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                }}
              >
                Unit
              </label>
              <select
                id="unit"
                className="db-select-light"
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
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

// ─── Sales Section ────────────────────────────────────────────────────────────

function SalesSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProducts(json.data);
        setFetching(false);
      });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      <SectionHeading
        title="Create Invoice"
        sub="Coming soon — generate invoices and send automated reminders"
      />

      {/* Coming soon banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${D.primaryLight} 0%, rgba(217,119,6,0.06) 100%)`,
          border: `1.5px solid ${D.border}`,
          borderRadius: D.radius,
          padding: "48px 40px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(91,94,244,0.05)",
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "12px",
            color: D.primary,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          Coming Soon
        </p>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
            color: D.text,
            letterSpacing: "0.04em",
            marginBottom: "12px",
            lineHeight: 1,
          }}
        >
          Invoice & Reminder Engine
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: D.textMid,
            maxWidth: "420px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Pick a buyer, select from your product list, set a due date — and let
          DueMate handle the rest via email reminders automatically.
        </p>
      </div>

      {/* Price list reference */}
      {!fetching && products.length > 0 && (
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
              Price List
            </h3>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "13px",
                color: D.textFaint,
              }}
            >
              for reference while creating a sale
            </span>
          </div>

          <div
            style={{
              background: D.surface,
              borderRadius: D.radius,
              boxShadow: D.shadow,
              border: `1px solid ${D.borderFaint}`,
              overflow: "hidden",
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
                padding: "12px 24px",
                background: D.surfaceAlt,
                borderBottom: `1px solid ${D.borderFaint}`,
              }}
            >
              {["Product", "Description", "Rate", "Unit", "Stock"].map((h) => (
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

            {products.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
                  padding: "14px 24px",
                  alignItems: "center",
                  borderBottom:
                    i < products.length - 1
                      ? `1px solid ${D.borderFaint}`
                      : "none",
                  background:
                    i % 2 === 0 ? D.surface : "rgba(244,240,232,0.5)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: D.text,
                  }}
                >
                  {p.name}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: D.textFaint,
                  }}
                >
                  {p.description || "—"}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.1rem",
                    color: D.amber,
                    letterSpacing: "0.02em",
                  }}
                >
                  ₹{Number(p.rate).toLocaleString("en-IN")}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: D.textMid,
                    fontWeight: 500,
                  }}
                >
                  {p.unit}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: p.quantity === 0
                      ? "#DC2626"
                      : p.quantity <= 5
                      ? D.amber
                      : "#16A34A",
                  }}
                >
                  {p.quantity === 0 ? "Out of stock" : p.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
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
