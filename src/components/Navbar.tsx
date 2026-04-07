"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
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

        {/* Desktop center links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium tracking-wide"
                style={{ color: "rgba(196, 207, 238, 0.6)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(196, 207, 238, 1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(196, 207, 238, 0.6)")
                }
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop right CTAs */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/sign-in"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: "rgba(196, 207, 238, 0.6)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(196, 207, 238, 1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(196, 207, 238, 0.6)")
            }
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-bg)",
            }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 min-w-[44px] min-h-[44px] items-center justify-center rounded-lg"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0, y: open ? 8 : 0 }}
            className="block w-5 h-0.5 rounded-full origin-center"
            style={{ background: "var(--color-text)" }}
            transition={{ duration: 0.25 }}
          />
          <motion.span
            animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }}
            className="block w-5 h-0.5 rounded-full"
            style={{ background: "var(--color-text)" }}
            transition={{ duration: 0.25 }}
          />
          <motion.span
            animate={{ rotate: open ? -45 : 0, y: open ? -8 : 0 }}
            className="block w-5 h-0.5 rounded-full origin-center"
            style={{ background: "var(--color-text)" }}
            transition={{ duration: 0.25 }}
          />
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-3 rounded-2xl p-6 md:hidden"
            style={{
              background: "rgba(13, 20, 38, 0.96)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(129, 140, 248, 0.15)",
            }}
          >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block text-base font-medium py-3 px-2 rounded-lg"
                    style={{ color: "rgba(196, 207, 238, 0.75)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="block text-center py-3 px-6 rounded-full font-medium text-sm"
                style={{
                  color: "var(--color-text)",
                  border: "1px solid rgba(129, 140, 248, 0.3)",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="block text-center py-3.5 px-6 rounded-full font-semibold text-sm active:scale-95 transition-transform"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-bg)",
                }}
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
