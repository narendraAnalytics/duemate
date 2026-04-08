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
  createdAt: string;
};

type Tab = "customers" | "products" | "sales";

// ─── Small reusable components ────────────────────────────────────────────────

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
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-primary)",
          fontFamily: "var(--font-body)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
        {required && <span style={{ color: "var(--color-secondary)" }}> *</span>}
      </label>
      <input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "rgba(13,20,38,0.8)",
          border: "1px solid rgba(129,140,248,0.2)",
          borderRadius: "8px",
          padding: "10px 14px",
          color: "var(--color-text)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          outline: "none",
          transition: "border-color 0.2s",
          width: "100%",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--color-primary)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(129,140,248,0.2)";
        }}
      />
    </div>
  );
}

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        background: loading
          ? "rgba(129,140,248,0.3)"
          : "linear-gradient(135deg, #818CF8 0%, #6366f1 100%)",
        color: loading ? "rgba(196,207,238,0.5)" : "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "11px 28px",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        letterSpacing: "0.04em",
      }}
    >
      {loading ? "Saving…" : label}
    </button>
  );
}

// ─── Customers Section ────────────────────────────────────────────────────────

function CustomersSection() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", shopName: "" });
  const [error, setError] = useState("");

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
      fetchList();
    } else {
      setError(typeof json.error === "string" ? json.error : "Failed to save.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Add form */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid rgba(129,140,248,0.12)",
          borderRadius: "16px",
          padding: "28px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            color: "var(--color-text)",
            marginBottom: "20px",
            letterSpacing: "0.04em",
          }}
        >
          Add Buyer
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <InputField
              label="Buyer Name"
              name="name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Rajesh Kumar"
              required
            />
            <InputField
              label="Shop Name"
              name="shopName"
              value={form.shopName}
              onChange={(v) => setForm((f) => ({ ...f, shopName: v }))}
              placeholder="e.g. Kumar Traders"
            />
          </div>
          <InputField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="buyer@example.com"
          />
          {error && (
            <p style={{ color: "#f87171", fontSize: "var(--text-xs)", fontFamily: "var(--font-body)" }}>
              {error}
            </p>
          )}
          <div>
            <SubmitButton loading={loading} label="Save Buyer" />
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            color: "rgba(196,207,238,0.5)",
            marginBottom: "16px",
            letterSpacing: "0.04em",
          }}
        >
          {fetching ? "Loading…" : `${list.length} Buyer${list.length !== 1 ? "s" : ""}`}
        </h3>
        {!fetching && list.length === 0 ? (
          <p style={{ color: "rgba(196,207,238,0.3)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
            No buyers yet. Add one above.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {list.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid rgba(129,140,248,0.08)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--color-text)", fontSize: "var(--text-sm)" }}>
                    {c.name}
                  </p>
                  {c.shopName && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--color-secondary)", marginTop: "2px" }}>
                      {c.shopName}
                    </p>
                  )}
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "rgba(196,207,238,0.5)" }}>
                  {c.email || "—"}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "rgba(196,207,238,0.3)", textAlign: "right" }}>
                  {new Date(c.createdAt).toLocaleDateString("en-IN")}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────

function ProductsSection() {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", rate: "", unit: "pcs" });
  const [error, setError] = useState("");

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
    setError("");
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rate: Number(form.rate) }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setForm({ name: "", description: "", rate: "", unit: "pcs" });
      fetchList();
    } else {
      setError(typeof json.error === "string" ? json.error : "Failed to save.");
    }
  }

  const UNITS = ["pcs", "kg", "g", "litre", "ml", "box", "dozen", "metre", "bag", "ton"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Add form */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid rgba(129,140,248,0.12)",
          borderRadius: "16px",
          padding: "28px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-xl)",
            color: "var(--color-text)",
            marginBottom: "20px",
            letterSpacing: "0.04em",
          }}
        >
          Add Product / Good
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <InputField
              label="Product Name"
              name="pname"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Basmati Rice"
              required
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <InputField
                label="Rate (₹)"
                name="rate"
                type="number"
                value={form.rate}
                onChange={(v) => setForm((f) => ({ ...f, rate: v }))}
                placeholder="50.00"
                required
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="unit"
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-primary)",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Unit
                </label>
                <select
                  id="unit"
                  className="db-select"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <InputField
            label="Description (optional)"
            name="desc"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="Short description of the product"
          />
          {error && (
            <p style={{ color: "#f87171", fontSize: "var(--text-xs)", fontFamily: "var(--font-body)" }}>
              {error}
            </p>
          )}
          <div>
            <SubmitButton loading={loading} label="Add Product" />
          </div>
        </form>
      </div>

      {/* Product grid */}
      <div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            color: "rgba(196,207,238,0.5)",
            marginBottom: "16px",
            letterSpacing: "0.04em",
          }}
        >
          {fetching ? "Loading…" : `${list.length} Product${list.length !== 1 ? "s" : ""}`}
        </h3>
        {!fetching && list.length === 0 ? (
          <p style={{ color: "rgba(196,207,238,0.3)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
            No products yet. Add one above.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {list.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid rgba(129,140,248,0.1)",
                  borderRadius: "14px",
                  padding: "18px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Subtle accent line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, var(--color-secondary), transparent)",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    fontSize: "var(--text-sm)",
                    marginBottom: "6px",
                  }}
                >
                  {p.name}
                </p>
                {p.description && (
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-xs)",
                      color: "rgba(196,207,238,0.4)",
                      marginBottom: "12px",
                    }}
                  >
                    {p.description}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "auto" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-xl)",
                      color: "var(--color-secondary)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    ₹{Number(p.rate).toLocaleString("en-IN")}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "rgba(196,207,238,0.4)" }}>
                    / {p.unit}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sales Section (placeholder + product list preview) ───────────────────────

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
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Coming soon card */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid rgba(245,158,11,0.15)",
          borderRadius: "16px",
          padding: "36px 28px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "var(--text-xs)",
            color: "var(--color-secondary)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Coming Soon
        </p>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            color: "var(--color-text)",
            letterSpacing: "0.04em",
            marginBottom: "10px",
          }}
        >
          Create Invoice / Sale
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "rgba(196,207,238,0.45)",
            maxWidth: "420px",
            margin: "0 auto",
          }}
        >
          Pick a buyer, select products from your list, and generate an invoice with automated payment reminders.
        </p>
      </div>

      {/* Product rate reference */}
      {!fetching && products.length > 0 && (
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              color: "rgba(196,207,238,0.5)",
              marginBottom: "16px",
              letterSpacing: "0.04em",
            }}
          >
            Your Price List
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
              }}
            >
              <thead>
                <tr>
                  {["Product", "Description", "Rate", "Unit"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 16px",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-primary)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        borderBottom: "1px solid rgba(129,140,248,0.12)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      background: i % 2 === 0 ? "transparent" : "rgba(13,20,38,0.4)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", color: "var(--color-text)", fontWeight: 500 }}>
                      {p.name}
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(196,207,238,0.45)" }}>
                      {p.description || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--color-secondary)",
                        fontWeight: 600,
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-base)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      ₹{Number(p.rate).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 16px", color: "rgba(196,207,238,0.4)" }}>
                      {p.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        background: "var(--color-bg)",
        height: "100svh",
        overflowY: "auto",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(129,140,248,0.1)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(7,10,18,0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(196,207,238,0.4)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.08em",
              padding: 0,
            }}
          >
            ← Home
          </button>
          <span style={{ color: "rgba(129,140,248,0.3)" }}>|</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              color: "var(--color-text)",
              letterSpacing: "0.06em",
            }}
          >
            Dashboard
          </h1>
        </div>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "var(--text-sm)",
            color: "var(--color-secondary)",
          }}
        >
          {user.firstName ?? user.username ?? ""}
        </p>
      </header>

      {/* Tab nav */}
      <nav
        style={{
          padding: "0 32px",
          borderBottom: "1px solid rgba(129,140,248,0.08)",
          display: "flex",
          gap: "0",
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
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === tab.id ? "var(--color-text)" : "rgba(196,207,238,0.35)",
              transition: "all 0.2s",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "var(--text-xs)",
                color: activeTab === tab.id ? "var(--color-secondary)" : "rgba(245,158,11,0.3)",
                letterSpacing: "0.04em",
              }}
            >
              {tab.numeral}.
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                letterSpacing: "0.04em",
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <main style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
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
