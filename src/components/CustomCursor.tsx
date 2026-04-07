"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const springConfig = { damping: 28, stiffness: 280, mass: 0.5 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Dot follows mouse precisely (no spring lag)
  const dotX = mouseX;
  const dotY = mouseY;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    document.documentElement.style.cursor = "none";
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.style.cursor = "";
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Outer circle — spring-lagged */}
      <motion.div
        style={{
          position: "fixed",
          left: x,
          top: y,
          translateX: "-50%",
          translateY: "-50%",
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1.5px solid #818CF8",
          pointerEvents: "none",
          zIndex: 99999,
        }}
      />

      {/* Center dot — snaps to cursor precisely */}
      <motion.div
        style={{
          position: "fixed",
          left: dotX,
          top: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#F59E0B",
          pointerEvents: "none",
          zIndex: 99999,
          boxShadow: "0 0 6px 2px rgba(245, 158, 11, 0.7)",
        }}
      />
    </>
  );
}
