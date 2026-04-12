"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowLeft,
  Zap,
  Bell,
  CreditCard,
  FileText,
  ChevronRight,
} from "lucide-react";

const VIDEO_URL =
  "https://res.cloudinary.com/dkqbzwicr/video/upload/q_auto/f_auto/v1776003656/duematevideowebm_ojggt5.webm";

const STEPS = [
  {
    icon: FileText,
    number: "01",
    title: "Create an Invoice",
    description:
      "Add your buyer details and products. Our AI auto-extracts line items from uploaded bills in seconds — no manual entry needed.",
    accent: "#818CF8",
  },
  {
    icon: Bell,
    number: "02",
    title: "Set Smart Reminders",
    description:
      "Configure when to remind — 30, 14, 7, 3, or 1 day before due. DueMate handles the schedule automatically so you never forget to follow up.",
    accent: "#F59E0B",
  },
  {
    icon: Zap,
    number: "03",
    title: "Auto-Deliver via Email & WhatsApp",
    description:
      "Reminders go out over email and WhatsApp at exactly the right time. Personalised, professional, and on-brand — every single time.",
    accent: "#818CF8",
  },
  {
    icon: CreditCard,
    number: "04",
    title: "Record Payments Instantly",
    description:
      "When payment arrives, log it in one tap. Track partial payments, cash vs. online splits, and get a real-time outstanding balance.",
    accent: "#F59E0B",
  },
];

export default function HowItWorksPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      setStarted(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <main
      className="min-h-svh w-full"
      style={{
        background: "linear-gradient(160deg, #F0F4FF 0%, #EEF2FF 50%, #F5F3FF 100%)",
        height: "100svh",
        overflowY: "auto",
      }}
    >
      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-6 pt-6 md:px-12 md:pt-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
          style={{ color: "#6366F1" }}
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </motion.div>

      {/* Hero header */}
      <section className="px-6 pt-12 pb-8 text-center md:px-12 md:pt-16 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{
              background: "rgba(129, 140, 248, 0.12)",
              color: "#6366F1",
              border: "1px solid rgba(99, 102, 241, 0.25)",
            }}
          >
            Product walkthrough
          </span>

          <h1
            className="font-heading text-4xl md:text-6xl lg:text-7xl leading-none tracking-tight mb-5"
            style={{ color: "#312E81" }}
          >
            See DueMate
            <br />
            <span style={{ color: "#6366F1" }}>in action.</span>
          </h1>

          <p
            className="max-w-xl mx-auto text-base md:text-lg leading-relaxed"
            style={{ color: "#5B62A4" }}
          >
            Watch how DueMate turns late payments into a thing of the past —
            from invoice creation to automatic reminders and instant payment
            tracking.
          </p>
        </motion.div>
      </section>

      {/* Video player */}
      <section className="px-4 pb-10 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              "0 0 0 1px rgba(99,102,241,0.15), 0 24px 80px rgba(99,102,241,0.18), 0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src={VIDEO_URL}
            muted={muted}
            playsInline
            className="w-full block"
            style={{ aspectRatio: "16/9", objectFit: "cover", background: "#1E1B4B" }}
            onEnded={() => setPlaying(false)}
          />

          {/* Play overlay — shown until first play */}
          {!started && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(30,27,75,0.45)", backdropFilter: "blur(2px)" }}
            >
              <motion.button
                type="button"
                onClick={togglePlay}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 72,
                  height: 72,
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
                }}
              >
                <Play size={28} style={{ color: "#6366F1", marginLeft: 3 }} />
              </motion.button>
            </div>
          )}

          {/* Controls bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3"
            style={{
              background:
                "linear-gradient(to top, rgba(30,27,75,0.7) 0%, transparent 100%)",
            }}
          >
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-2 text-sm font-medium transition-opacity duration-150 hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? "Pause" : "Play"}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="transition-opacity duration-150 hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </motion.div>

        {/* Subtle caption */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center text-xs mt-4"
          style={{ color: "#9CA3C8" }}
        >
          Full product demo · ~2 minutes
        </motion.p>
      </section>

      {/* Steps */}
      <section className="px-6 py-12 md:px-12 md:py-16 max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl md:text-3xl font-heading mb-12"
          style={{ color: "#312E81" }}
        >
          How it works — step by step
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(129,140,248,0.18)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.07)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-xl"
                    style={{
                      width: 44,
                      height: 44,
                      background: `${step.accent}18`,
                      border: `1px solid ${step.accent}30`,
                    }}
                  >
                    <Icon size={20} style={{ color: step.accent }} />
                  </div>
                  <div>
                    <span
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color: step.accent }}
                    >
                      Step {step.number}
                    </span>
                    <h3
                      className="text-base font-semibold mt-1 mb-2"
                      style={{ color: "#312E81" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#5B62A4" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 text-center md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex flex-col items-center gap-5"
        >
          <p className="text-base font-medium" style={{ color: "#5B62A4" }}>
            Ready to get paid on time, every time?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            }}
          >
            Open Dashboard
            <ChevronRight size={15} />
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
