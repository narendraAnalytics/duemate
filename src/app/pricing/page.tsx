import { PricingTable } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PricingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div
      style={{
        height: "100svh",
        overflowY: "auto",
        background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0f9ff 100%)",
        padding: "4rem 1.5rem 6rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Back link */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "#818CF8",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            textDecoration: "none",
            marginBottom: "2.5rem",
            opacity: 0.75,
          }}
        >
          ← Back
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          {/* Eyebrow */}
          <span
            style={{
              display: "inline-block",
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#818CF8",
              background: "rgba(129, 140, 248, 0.1)",
              border: "1px solid rgba(129, 140, 248, 0.25)",
              borderRadius: "9999px",
              padding: "4px 14px",
              marginBottom: "1rem",
            }}
          >
            Simple Pricing
          </span>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3rem, 6vw, 5rem)",
              color: "#1e1b4b",
              marginBottom: "0.75rem",
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            CHOOSE YOUR PLAN
          </h1>

          <p
            style={{
              color: "#4b5563",
              fontFamily: "var(--font-body)",
              fontSize: "1.05rem",
              maxWidth: "440px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Start free. Upgrade when your business grows.
          </p>
        </div>

        {/* Pricing Table — full width so all 3 plans are visible */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <PricingTable />
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            marginTop: "3rem",
            color: "#9ca3af",
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
          }}
        >
          All prices in USD · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  );
}
