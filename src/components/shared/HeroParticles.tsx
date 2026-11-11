/**
 * HeroParticles.tsx — the rising gold particles (reference `.hero-particles`).
 *
 * Decorative only: `aria-hidden`, gated on `prefers-reduced-motion`, and
 * generated client-side after mount so the server HTML never contains (or
 * depends on) the random particle layout. Count matches the reference:
 * 14 below 640px, 28 above.
 */

"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

type Particle = {
  left: string;
  size: string;
  duration: string;
  delay: string;
  dx: string;
};

const MOBILE_BREAKPOINT = 640;
const COUNT_DESKTOP = 28;
const COUNT_MOBILE = 14;

function buildParticles(count: number): Particle[] {
  const float = (min: number, span: number) => (Math.random() * span + min).toFixed(1);
  return Array.from({ length: count }, () => ({
    left: (Math.random() * 100).toFixed(1) + "%",
    size: float(1.5, 3) + "px",
    duration: float(9, 10) + "s",
    delay: "-" + float(0, 18) + "s",
    dx: (Math.random() * 120 - 60).toFixed(0) + "px",
  }));
}

export function HeroParticles() {
  const reduce = useReducedMotion();
  const [particles, setParticles] = useState<readonly Particle[]>([]);

  useEffect(() => {
    // Read the live query here, not just the hook state: `useReducedMotion`
    // starts at its SSR default (false) and syncs one tick after mount, so the
    // effect's first run would otherwise generate — and never clear — the full
    // particle field under reduced motion. The typeof guard mirrors the hook:
    // environments without matchMedia keep the default instead of throwing.
    const reduceNow =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || reduceNow) {
      if (particles.length > 0) setParticles([]);
      return;
    }
    const count = window.innerWidth < MOBILE_BREAKPOINT ? COUNT_MOBILE : COUNT_DESKTOP;
    setParticles(buildParticles(count));
  }, [reduce, particles.length]);

  if (particles.length === 0) return null;

  return (
    <div className="hero-particles" aria-hidden="true">
      {particles.map((particle, index) => (
        <i
          key={index}
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDuration: particle.duration,
            animationDelay: particle.delay,
            // Custom property consumed by the keyframes (drift on the x axis).
            ["--dx" as string]: particle.dx,
          }}
        />
      ))}
    </div>
  );
}
