"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const VIDEOS = [
  "https://res.cloudinary.com/dkqbzwicr/video/upload/q_auto/f_auto/v1775562834/video2_lvfcfh.webm",
  "https://res.cloudinary.com/dkqbzwicr/video/upload/q_auto/f_auto/v1775556989/video3_dzpexe.webm",
];

const HEADLINE = ["GET PAID.", "ON TIME.", "EVERY TIME."];

const FLIP_DURATION = 0.9; // seconds

export default function HeroSection() {
  const { isSignedIn, user } = useUser();
  const displayName = user?.username ?? user?.firstName ?? "there";
  const [muted, setMuted] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // When active video changes: restart it from 0, manage loop & mute for all videos
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIdx) {
        v.loop = false;       // play once — ended event triggers the flip
        v.currentTime = 0;   // always start from beginning
        v.muted = muted;
        v.play().catch(() => {});
      } else {
        v.loop = true;        // inactive video loops silently, stays warm
        v.muted = true;
        v.play().catch(() => {});
      }
    });
  }, [activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep active video mute state in sync when user toggles
  useEffect(() => {
    const v = videoRefs.current[activeIdx];
    if (v) v.muted = muted;
  }, [muted, activeIdx]);

  // Pause ALL videos when tab hidden, resume when visible — no stale closure
  useEffect(() => {
    const handleVisibility = () => {
      videoRefs.current.forEach((v) => {
        if (!v) return;
        if (document.hidden) {
          v.pause();
        } else {
          v.play().catch(() => {});
        }
      });
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Trigger page flip when active video naturally ends
  useEffect(() => {
    const v = videoRefs.current[activeIdx];
    if (!v) return;
    const handleEnded = () => {
      setFlipping(true);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % VIDEOS.length);
      }, (FLIP_DURATION / 2) * 1000);
    };
    v.addEventListener("ended", handleEnded);
    return () => v.removeEventListener("ended", handleEnded);
  }, [activeIdx]);

  const toggleMute = () => setMuted((prev) => !prev);

  return (
    <section className="relative w-full overflow-hidden flex flex-col" style={{ height: "100svh" }}>
      {/* Video backgrounds — active one sits on top */}
      {VIDEOS.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          src={src}
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            zIndex: activeIdx === i ? 1 : 0,
            opacity: 1,
          }}
        />
      ))}

      {/* Dark cinematic gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,10,18,0.6) 0%, rgba(7,10,18,0.15) 35%, rgba(7,10,18,0.65) 65%, rgba(7,10,18,0.97) 100%)",
          zIndex: 2,
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(7,10,18,0.55) 100%)",
          zIndex: 2,
        }}
      />

      {/* Book page-turn transition overlay */}
      <AnimatePresence>
        {flipping && (
          <motion.div
            key="page-flip"
            initial={{ x: "102%", skewX: "-2deg" }}
            animate={{ x: "-102%", skewX: "-2deg" }}
            exit={{}}
            transition={{ duration: FLIP_DURATION, ease: [0.76, 0, 0.24, 1] }}
            onAnimationComplete={() => setFlipping(false)}
            className="absolute inset-0"
            style={{ zIndex: 3 }}
          >
            {/* Page body */}
            <div className="absolute inset-0" style={{ background: "#070A12" }} />
            {/* Fold shadow — leading left edge (dark crease like paper fold) */}
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: "90px",
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
              }}
            />
            {/* Highlight — trailing right edge (paper catching light) */}
            <div
              className="absolute inset-y-0 right-0"
              style={{
                width: "50px",
                background:
                  "linear-gradient(to left, rgba(129,140,248,0.12) 0%, transparent 100%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome message — absolutely positioned, zero layout impact */}
      <AnimatePresence>
        {isSignedIn && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute w-full text-center px-4"
            style={{
              bottom: "11rem",
              zIndex: 11,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              letterSpacing: "0.05em",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              color: "var(--color-secondary)",
            }}
          >
            Welcome back, {displayName} —
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hero content — bottom-anchored like pendragoncycle */}
      <div
        className="relative flex flex-col justify-end h-full px-4 sm:px-8 lg:px-14 pb-20 sm:pb-20 lg:pb-24"
        style={{ zIndex: 10 }}
      >
        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-xs sm:text-sm font-medium tracking-[0.22em] uppercase mb-3 sm:mb-5"
          style={{ color: "var(--color-primary)" }}
        >
          AI-Powered Payment Reminders
        </motion.p>

        {/* Main headline — Bebas Neue, cinematic stagger */}
        <div className="flex flex-col leading-none mb-4 sm:mb-7">
          {HEADLINE.map((word, i) => (
            <div key={word} className="overflow-hidden">
              <motion.h1
                initial={{ y: "105%", skewY: 3 }}
                animate={{ y: "0%", skewY: 0 }}
                transition={{
                  delay: 0.55 + i * 0.13,
                  duration: 0.75,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="font-heading tracking-tight"
                style={{
                  fontSize: "clamp(2.2rem, 1.5rem + 4vw, 5rem)",
                  lineHeight: 0.92,
                  color:
                    i === HEADLINE.length - 1
                      ? "var(--color-primary)"
                      : "var(--color-text)",
                }}
              >
                {word}
              </motion.h1>
            </div>
          ))}
        </div>

        {/* Sub-copy + CTA row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="max-w-[18rem] sm:max-w-[22rem] text-sm sm:text-base leading-relaxed"
            style={{ color: "rgba(196, 207, 238, 0.6)" }}
          >
            Upload invoices, let AI extract data, then sit back as smart
            reminders go out via email &amp; WhatsApp — automatically.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.7 }}
            className="flex items-center gap-5 sm:gap-6"
          >
            <Link
              href="/sign-up"
              className="group flex items-center gap-3 font-semibold text-sm sm:text-base tracking-wide"
              style={{ color: "var(--color-text)" }}
            >
              <span>Start Free</span>
              <span
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group-hover:scale-110"
                style={{
                  border: "1px solid rgba(196, 207, 238, 0.35)",
                  fontSize: "1.1rem",
                }}
              >
                →
              </span>
            </Link>

            <div
              className="hidden sm:block w-px h-5 opacity-25"
              style={{ background: "var(--color-text)" }}
            />

            <Link
              href="#features"
              className="hidden sm:inline text-sm font-medium transition-colors duration-200"
              style={{ color: "rgba(196, 207, 238, 0.55)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(196, 207, 238, 0.9)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(196, 207, 238, 0.55)")
              }
            >
              See how it works
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Mute / Unmute toggle */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        onClick={toggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-20 right-4 sm:bottom-16 sm:right-8 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "rgba(13, 20, 38, 0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(196, 207, 238, 0.15)",
          color: "rgba(196, 207, 238, 0.75)",
        }}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
        <span className="text-[11px] font-medium tracking-wide">
          {muted ? "Sound Off" : "Sound On"}
        </span>
      </motion.button>

      {/* Right-side vertical label (desktop) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="hidden lg:flex absolute right-8 bottom-14 flex-col items-center gap-3"
        style={{ zIndex: 10 }}
      >
        <div
          className="w-px"
          style={{
            height: "3rem",
            background:
              "linear-gradient(to bottom, transparent, rgba(196, 207, 238, 0.25))",
          }}
        />
        <span
          className="text-[9px] tracking-[0.3em] uppercase"
          style={{
            color: "rgba(196, 207, 238, 0.35)",
            writingMode: "vertical-rl",
          }}
        >
          Scroll to explore
        </span>
      </motion.div>
    </section>
  );
}
