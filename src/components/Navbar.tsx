"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, Show, useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/#features",     label: "Features",     numeral: "I" },
  { href: "/#how-it-works", label: "How It Works", numeral: "II" },
  { href: "/pricing",       label: "Pricing",      numeral: "III" },
  { href: "/dashboard",     label: "Dashboard",    numeral: "IV" },
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function useTextScramble(original: string) {
  const [text, setText] = useState(original);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scramble = useCallback(() => {
    let iteration = 0;
    const totalFrames = original.length * 3;

    clearInterval(frameRef.current as unknown as number);
    frameRef.current = setInterval(() => {
      setText(
        original
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < Math.floor(iteration / 3)) return original[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      iteration++;
      if (iteration >= totalFrames) {
        clearInterval(frameRef.current as unknown as number);
        setText(original);
      }
    }, 40);
  }, [original]);

  const reset = useCallback(() => {
    clearInterval(frameRef.current as unknown as number);
    setText(original);
  }, [original]);

  useEffect(() => () => clearInterval(frameRef.current as unknown as number), []);

  return { text, scramble, reset };
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { text: menuText, scramble, reset } = useTextScramble("Menu");
  const { isSignedIn } = useUser();
  const { has } = useAuth();
  const router = useRouter();

  const planLabel = has?.({ plan: "pro" })
    ? "PRO"
    : has?.({ plan: "plus" })
    ? "PLUS"
    : "FREE";
  const planColor =
    planLabel === "PRO"
      ? "#10B981"
      : planLabel === "PLUS"
      ? "#818CF8"
      : "#F59E0B";

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    router.push(href);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-14 pt-5 sm:pt-7">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-10 flex-shrink-0">
            <Image
              src="https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775557266/logo_y06zwe.png"
              alt="DueMate"
              width={180}
              height={48}
              priority
              className="h-10 sm:h-12 w-auto"
            />
          </Link>

          {/* Menu button — right side */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            onMouseEnter={scramble}
            onMouseLeave={reset}
            className="flex flex-col items-start gap-1 group"
            aria-label="Open menu"
          >
            <span
              className="text-xs tracking-[0.18em] uppercase font-medium transition-colors duration-200 font-mono"
              style={{
                color: "rgba(196, 207, 238, 0.6)",
                minWidth: "3rem",
                display: "inline-block",
              }}
            >
              {menuText}
            </span>
            <span
              className="block h-px w-5 transition-all duration-300 group-hover:w-7"
              style={{ background: "rgba(196, 207, 238, 0.4)" }}
            />
          </button>

          {/* Plan badge + UserButton — visible when signed in */}
          <Show when="signed-in">
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: planColor,
                  border: `1px solid ${planColor}`,
                  borderRadius: "9999px",
                  padding: "2px 9px",
                  lineHeight: 1.6,
                  textShadow: `0 0 10px ${planColor}99`,
                  boxShadow: `0 0 6px ${planColor}33`,
                }}
              >
                {planLabel}
              </span>
              <UserButton />
            </div>
          </Show>
        </nav>
      </header>

      {/* Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-[100]"
              style={{
                background: "rgba(7, 10, 18, 0.85)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 h-full z-[101] flex flex-col"
              style={{
                width: "min(420px, 88vw)",
                background: "var(--color-surface)",
                borderLeft: "1px solid rgba(129, 140, 248, 0.12)",
              }}
            >
              {/* Close button */}
              <div className="flex justify-end px-8 pt-7 pb-2">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200"
                  style={{ color: "rgba(196, 207, 238, 0.5)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "rgba(196, 207, 238, 1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(196, 207, 238, 0.5)")
                  }
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5l10 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 flex flex-col justify-center px-10 pb-8 gap-1">
                <ul className="flex flex-col">
                  {NAV_LINKS.map((link, index) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 32 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.15 + index * 0.08,
                        duration: 0.42,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleNavClick(link.href)}
                        className="flex items-baseline gap-5 py-5 w-full text-left group/item"
                        style={{
                          background: "none",
                          border: "none",
                          borderBottom: index < NAV_LINKS.length - 1
                            ? "1px solid rgba(129, 140, 248, 0.08)"
                            : "none",
                        }}
                      >
                        {/* Roman numeral */}
                        <span
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            letterSpacing: "0.05em",
                            color: "var(--color-secondary)",
                            fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
                            minWidth: "2rem",
                            opacity: 0.9,
                          }}
                        >
                          {link.numeral}.
                        </span>

                        {/* Label */}
                        <span
                          className="transition-colors duration-200"
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            letterSpacing: "0.05em",
                            color: "rgba(196, 207, 238, 0.75)",
                            fontSize: "clamp(1.6rem, 4vw, 2.1rem)",
                            lineHeight: 1.15,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color =
                              "rgba(196, 207, 238, 1)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color =
                              "rgba(196, 207, 238, 0.75)")
                          }
                        >
                          {link.label}
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>

              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
