"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

/* ─── Feature data ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    number: "01",
    title: "Smart Invoice Creation",
    description:
      "Create detailed invoices with line items, GST rates, discounts (flat or percentage), and taxes — all computed live before saving. A full preview modal shows the final layout before it's committed.",
    bullets: [
      "Select a saved buyer → fields auto-fill instantly",
      "Preview Invoice before committing to the database",
      "Stock quantities auto-decrement on every save",
      "Supports INR and multiple currencies",
    ],
    imageUrl:
      "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962361/feature1_iyhz5u.png",
    gradFrom: "#818CF8",
    gradTo: "#6366F1",
    icon: "🧾",
    comingSoon: false,
  },
  {
    number: "02",
    title: "Automated Payment Reminders",
    description:
      "DueMate automatically sends payment reminders to buyers when invoices go overdue — every day at 11:00 AM IST, without any manual action from you. Reminders are grouped by buyer into a single consolidated email.",
    bullets: [
      "Daily background scan at 11 AM IST for all overdue invoices",
      "One reminder per buyer listing all outstanding bills",
      "Red badge (>7 days) · Amber badge (≤7 days overdue)",
      "Powered by Inngest — survives server restarts, never drops a job",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962372/feature2_ggiuos.png",
    gradFrom: "#6366F1",
    gradTo: "#4338CA",
    icon: "⏰",
    comingSoon: false,
  },
  {
    number: "03",
    title: "Instant Email Notifications",
    description:
      "Every key transaction triggers a professionally designed email to the buyer — no manual sending required. Three beautifully crafted templates cover the full payment lifecycle.",
    bullets: [
      "Invoice Created → indigo-themed email with full line items table",
      "Payment Recorded → green receipt with PAID / PARTIAL banner",
      "Overdue → amber reminder listing all outstanding invoices",
      "Owner's email is always set as reply-to",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962372/feature3_sxfist.png",
    gradFrom: "#10B981",
    gradTo: "#059669",
    icon: "✉️",
    comingSoon: false,
  },
  {
    number: "04",
    title: "Payment Recording & History",
    description:
      "Record partial or full payments against any invoice directly from the dashboard. Each payment is logged with its mode, date, amount, and reference — building a complete payment history per invoice.",
    bullets: [
      "Expand any invoice → click '+ Record Payment'",
      "Cash and Online payments tracked separately",
      "Balance auto-updates; status flips to Paid when cleared",
      "Payment receipt email fires automatically on every record",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962368/feature4_lqpdee.png",
    gradFrom: "#8B5CF6",
    gradTo: "#7C3AED",
    icon: "💳",
    comingSoon: false,
  },
  {
    number: "05",
    title: "Buyer Management",
    description:
      "Save buyer details once — name, shop name, email, phone, GSTIN — and reuse them across all invoices with a single dropdown selection. Indian GSTIN format validated automatically.",
    bullets: [
      "Add buyers with full GSTIN format validation",
      "Select buyer on invoice → all fields auto-fill instantly",
      "Edit buyer details inline at any time",
      "Free: 10 buyers · Plus: 200 · Pro: unlimited",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962361/feature5_teornq.png",
    gradFrom: "#0EA5E9",
    gradTo: "#0284C7",
    icon: "👥",
    comingSoon: false,
  },
  {
    number: "06",
    title: "Product Catalogue & Inventory",
    description:
      "Maintain a catalogue of products with selling rate, purchase rate, GST rate, HSN code, and live stock count. Stock decrements automatically when a product is saved on an invoice.",
    bullets: [
      "Purchase Total auto-computes: rate × qty × (1 + GST%)",
      "Margin % shown on every product card",
      "Stock badge: Green · Amber (≤5 left) · Red (out of stock)",
      "Supports pcs, kg, litre, box, metre, dozen and more",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962364/feature6_z0w8xr.png",
    gradFrom: "#14B8A6",
    gradTo: "#0D9488",
    icon: "📦",
    comingSoon: false,
  },
  {
    number: "07",
    title: "Supplier Management",
    description:
      "Save your supplier details once and auto-fill them when adding new products. No more retyping the same shop name, phone, and GSTIN for every product from the same supplier.",
    bullets: [
      "Add suppliers in the Saved Suppliers section (Products tab)",
      "Select supplier when adding a product → auto-fills instantly",
      "Override any field manually if needed",
      "Completely separate from the buyers system",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962368/feature7_cupiiy.png",
    gradFrom: "#F97316",
    gradTo: "#EA580C",
    icon: "🏭",
    comingSoon: false,
  },
  {
    number: "08",
    title: "Business Insights & Analytics",
    description:
      "Visual dashboard with charts showing revenue trends, invoice status distribution, and payment behaviour — giving you a clear picture of your cash flow health at a glance.",
    bullets: [
      "Line chart: revenue collected over time",
      "Bar chart: invoices created per month",
      "Pie chart: Paid / Pending / Overdue / Cancelled",
      "Summary cards: total invoiced, collected, and overdue",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962367/feature8_hmeqwx.png",
    gradFrom: "#A855F7",
    gradTo: "#9333EA",
    icon: "📊",
    comingSoon: false,
  },
  {
    number: "09",
    title: "Free Plan with Smart Limits",
    description:
      "Start for free with no credit card required. Progress bars show your usage in real time. When a limit is reached, a clear upgrade card explains the cap — nothing breaks silently.",
    bullets: [
      "4 invoices / month · 10 buyers · 10 products",
      "3 emails per buyer per month, intelligently distributed",
      "Slot 3 always reserved for the overdue reminder",
      "Upgrade prompt links directly to the pricing page",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962373/feature9_bdx9ol.png",
    gradFrom: "#F59E0B",
    gradTo: "#D97706",
    icon: "🔓",
    comingSoon: false,
  },
  {
    number: "10",
    title: "Multi-tier Subscription Plans",
    description:
      "Three plans designed to scale with your business. Free for getting started, Plus ($9/mo) for growing businesses, and Pro ($29/mo) for power users needing full automation and team access.",
    bullets: [
      "FREE — 4 invoices/mo · 10 buyers · 10 products",
      "PLUS $9/mo — 100 invoices · 200 buyers · WhatsApp · AI",
      "PRO $29/mo — Unlimited + Zoho sync + 5 team members",
      "Plan badge (FREE / PLUS / PRO) shown in navbar at all times",
    ],
    imageUrl: 
        "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775962375/feature10_tq8ysg.png",
    gradFrom: "#10B981",
    gradTo: "#047857",
    icon: "🚀",
    comingSoon: false,
  },
];

/* ─── Gradient placeholder visual ─────────────────────────────────── */
function FeaturePlaceholder({
  gradFrom,
  gradTo,
  icon,
  comingSoon,
}: {
  gradFrom: string;
  gradTo: string;
  icon: string;
  comingSoon: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "24px",
        background: `linear-gradient(135deg, ${gradFrom}18 0%, ${gradTo}30 100%)`,
        border: `1px solid ${gradFrom}30`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "55%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${gradFrom}20 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-8%",
          width: "45%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${gradTo}18 0%, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <span style={{ fontSize: "clamp(3.5rem, 6vw, 5rem)", lineHeight: 1 }}>
        {icon}
      </span>

      {comingSoon && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#F59E0B",
            border: "1px solid #F59E0B55",
            borderRadius: "9999px",
            padding: "4px 14px",
            background: "#FEF3C711",
          }}
        >
          Coming Soon
        </span>
      )}
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────── */
export default function FeaturesPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const throttleRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = FEATURES.length;
  const feature = FEATURES[activeIndex];

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      setDirection(next > activeIndex ? 1 : -1);
      setActiveIndex(next);
    },
    [activeIndex, total]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  /* Mouse wheel → horizontal pan */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (throttleRef.current) return;
      throttleRef.current = true;
      setTimeout(() => {
        throttleRef.current = false;
      }, 350);
      if (e.deltaY > 0 || e.deltaX > 0) goNext();
      else goPrev();
    },
    [goNext, goPrev]
  );

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  /* Focus container so keyboard works immediately */
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  /* Variants */
  const panelVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div
      style={{
        height: "100svh",
        overflow: "hidden",
        background: "#FAFAF9",
        position: "relative",
      }}
    >
      {/* Navbar stays dark and fixed — existing component */}
      <Navbar />

      {/* Full-viewport scroll container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onWheel={handleWheel}
        style={{
          height: "100svh",
          outline: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Panel ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "stretch",
                paddingTop: "clamp(5rem, 10vh, 7rem)",
                paddingBottom: "4.5rem",
                paddingLeft: "clamp(1.5rem, 6vw, 7rem)",
                paddingRight: "clamp(1.5rem, 6vw, 7rem)",
                gap: "clamp(2rem, 4vw, 5rem)",
              }}
            >
              {/* ── Left: text ── */}
              <div
                style={{
                  flex: "0 0 44%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "1.4rem",
                  minWidth: 0,
                }}
              >
                {/* Number */}
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                    color: "#F59E0B",
                    letterSpacing: "0.08em",
                  }}
                >
                  {feature.number} — {feature.comingSoon ? "Coming Soon" : "Feature"}
                </span>

                {/* Title */}
                <h1
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(2.6rem, 4.5vw, 5.5rem)",
                    color: feature.gradFrom,
                    lineHeight: 0.95,
                    letterSpacing: "0.02em",
                    margin: 0,
                  }}
                >
                  {feature.title}
                </h1>

                {/* Divider */}
                <div
                  style={{
                    width: "3rem",
                    height: "2px",
                    background: feature.gradFrom,
                    borderRadius: "2px",
                  }}
                />

                {/* Description */}
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(0.9rem, 1.1vw, 1.05rem)",
                    color: "#374151",
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: "520px",
                  }}
                >
                  {feature.description}
                </p>

                {/* Bullets */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.55rem",
                  }}
                >
                  {feature.bullets.map((b, i) => (
                    <li
                      key={i}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "clamp(0.8rem, 0.95vw, 0.925rem)",
                        color: "#4B5563",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.65rem",
                        lineHeight: 1.55,
                      }}
                    >
                      <span
                        style={{
                          color: feature.gradFrom,
                          fontWeight: 700,
                          marginTop: "0.15em",
                          flexShrink: 0,
                        }}
                      >
                        ›
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Right: image / placeholder ── */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {feature.imageUrl ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: "20px",
                      overflow: "hidden",
                      boxShadow:
                        "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Image
                      src={feature.imageUrl}
                      alt={feature.title}
                      fill
                      style={{ objectFit: "contain", objectPosition: "center" }}
                      priority
                      sizes="(max-width: 768px) 100vw, 55vw"
                    />
                    {feature.comingSoon && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(255,255,255,0.55)",
                          backdropFilter: "blur(3px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: 700,
                            fontSize: "1rem",
                            letterSpacing: "0.15em",
                            color: "#F59E0B",
                            border: "1.5px solid #F59E0B",
                            borderRadius: "9999px",
                            padding: "8px 22px",
                            background: "#fff",
                          }}
                        >
                          COMING SOON
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ width: "100%", height: "100%", minHeight: "300px" }}>
                    <FeaturePlaceholder
                      gradFrom={feature.gradFrom}
                      gradTo={feature.gradTo}
                      icon={feature.icon}
                      comingSoon={feature.comingSoon}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom navigation ── */}
        <div
          style={{
            height: "4.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            paddingLeft: "clamp(1.5rem, 6vw, 7rem)",
            paddingRight: "clamp(1.5rem, 6vw, 7rem)",
            position: "relative",
          }}
        >
          {/* Counter — left */}
          <span
            style={{
              position: "absolute",
              left: "clamp(1.5rem, 6vw, 7rem)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "0.85rem",
              color: "#9CA3AF",
              letterSpacing: "0.05em",
              minWidth: "3.5rem",
            }}
          >
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          {/* Arrow prev */}
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label="Previous feature"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid #E5E7EB",
              background: "transparent",
              cursor: activeIndex === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: activeIndex === 0 ? 0.3 : 1,
              transition: "border-color 0.2s, opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              if (activeIndex !== 0)
                e.currentTarget.style.borderColor = "#818CF8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E5E7EB";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 11L5 7l4-4"
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dot indicators */}
          <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
            {FEATURES.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to feature ${i + 1}`}
                style={{
                  width: i === activeIndex ? "22px" : "7px",
                  height: "7px",
                  borderRadius: "9999px",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background:
                    i === activeIndex
                      ? FEATURES[i].gradFrom
                      : f.comingSoon
                      ? "#D1D5DB"
                      : "#9CA3AF",
                  transition: "width 0.3s ease, background 0.3s ease",
                  opacity: i === activeIndex ? 1 : 0.55,
                }}
              />
            ))}
          </div>

          {/* Arrow next */}
          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === total - 1}
            aria-label="Next feature"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid #E5E7EB",
              background: "transparent",
              cursor: activeIndex === total - 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: activeIndex === total - 1 ? 0.3 : 1,
              transition: "border-color 0.2s, opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              if (activeIndex !== total - 1)
                e.currentTarget.style.borderColor = "#818CF8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E5E7EB";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 3l4 4-4 4"
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Feature name — right */}
          <span
            style={{
              position: "absolute",
              right: "clamp(1.5rem, 6vw, 7rem)",
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              color: "#9CA3AF",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              maxWidth: "180px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {feature.title}
          </span>
        </div>
      </div>

      {/* Subtle top-edge gradient to blend with the fixed dark navbar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "90px",
          background:
            "linear-gradient(to bottom, rgba(7,10,18,0.35) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
    </div>
  );
}
