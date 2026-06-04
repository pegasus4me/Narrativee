"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "../../../lib/auth-client";
import { ArrowUpRight, Loader2 } from "lucide-react";

const words = ["LinkedIn", "Twitter/X", "Threads", "Bluesky"];

function BlurWord({ word, trigger }: { word: string; trigger: number }) {
  const letters = word.split("");
  const STAGGER = 45;      // ms between each letter
  const DURATION = 500;    // blur+opacity fade duration per letter
  const GRADIENT_HOLD = STAGGER * letters.length + DURATION + 200;

  const [letterStates, setLetterStates] = useState<{ opacity: number; blur: number }[]>(
    letters.map(() => ({ opacity: 0, blur: 20 }))
  );
  const [showGradient, setShowGradient] = useState(true);
  const framesRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // reset
    framesRef.current.forEach(cancelAnimationFrame);
    timersRef.current.forEach(clearTimeout);
    framesRef.current = [];
    timersRef.current = [];

    setLetterStates(letters.map(() => ({ opacity: 0, blur: 20 })));
    setShowGradient(true);

    // stagger each letter
    letters.forEach((_, i) => {
      const t = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setLetterStates(prev => {
            const next = [...prev];
            next[i] = { opacity: eased, blur: 20 * (1 - eased) };
            return next;
          });
          if (progress < 1) {
            const id = requestAnimationFrame(tick);
            framesRef.current.push(id);
          }
        };
        const id = requestAnimationFrame(tick);
        framesRef.current.push(id);
      }, i * STAGGER);
      timersRef.current.push(t);
    });

    // remove gradient once all letters are settled
    const gt = setTimeout(() => setShowGradient(false), GRADIENT_HOLD);
    timersRef.current.push(gt);

    return () => {
      framesRef.current.forEach(cancelAnimationFrame);
      timersRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  // gradient colours cycling across letter positions
  const gradientColors = ["#eca8d6", "#a78bfa", "#67e8f9", "#fbbf24", "#eca8d6"];

  return (
    <>
      {letters.map((char, i) => {
        const colorIndex = (i / Math.max(letters.length - 1, 1)) * (gradientColors.length - 1);
        const lower = Math.floor(colorIndex);
        const upper = Math.min(lower + 1, gradientColors.length - 1);
        const t = colorIndex - lower;

        // lerp hex colours
        const hex2rgb = (hex: string): [number, number, number] => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return [r, g, b];
        };
        const [r1, g1, b1] = hex2rgb(gradientColors[lower] || "#eca8d6");
        const [r2, g2, b2] = hex2rgb(gradientColors[upper] || "#eca8d6");
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: letterStates[i]?.opacity ?? 0,
              filter: `blur(${letterStates[i]?.blur ?? 20}px)`,
              color: showGradient ? `rgb(${r},${g},${b})` : "white",
              transition: "color 0.4s ease",
            }}
          >
            {char}
          </span>
        );
      })}
    </>
  );
}

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: session } = authClient.useSession();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoggingInDemo, setIsLoggingInDemo] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (typeof window !== "undefined") {
      setIsDemoMode(localStorage.getItem("is_demo_mode") === "true");
    }
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.log("Video auto-play prevented:", err);
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleEnterDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingInDemo) return;
    setIsLoggingInDemo(true);

    localStorage.setItem("is_demo_mode", "true");

    setTimeout(() => {
      window.location.href = "/workspace";
    }, 600);
  };

  const showDashboard = session?.user || isDemoMode;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden bg-black py-24 lg:py-32">
      {/* Background image connection */}
      <div className="absolute inset-0 z-0">
        <div className={`relative left-1/2 -translate-x-1/2 w-screen transition-all duration-1000 delay-200 ${isVisible ? "opacity-100" : "opacity-0"
          }`}>
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/connection-KeJwWPQvn6l0a7C48tCARYtNEdC92H.png"
            alt=""
            aria-hidden="true"
            className="w-full h-auto object-cover"
          />
        </div>
        {/* Subtle overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/85" />
      </div>

      {/* Subtle grid lines */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-white/10"
            style={{
              top: `${12.5 * (i + 1)}%`,
              left: 0,
              right: 0,
            }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-white/10"
            style={{
              left: `${8.33 * (i + 1)}%`,
              top: 0,
              bottom: 0,
            }}
          />
        ))}
      </div>

      {/* Main Content Stack */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
        {/* Headline & Subtitle */}
        <div className="max-w-4xl flex flex-col items-center mb-10">
          <h1
            className={`text-center text-[clamp(2rem,5vw,5.5rem)] font-display leading-[0.92] tracking-tight text-white transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
          >
            Turn your newsletter <br />
            <span className="">into a native content machine</span>
          </h1>

          <p
            className={`mt-6 text-center text-lg lg:text-xl text-white leading-relaxed max-w-2xl transition-all duration-1000 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
          >
            Narrativee learns your voice, extracts sharper angles, and compiles platform-native drafts for X, LinkedIn, Threads, Instagram, Facebook, Bluesky, and more.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-700 delay-200 relative z-30">
            {showDashboard ? (
              <Link
                href="/workspace"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Dashboard
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                >
                  Start repurposing
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <button
                  onClick={handleEnterDemo}
                  disabled={isLoggingInDemo}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] cursor-pointer"
                >
                  {isLoggingInDemo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      Entering...
                    </>
                  ) : (
                    "View workspace"
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Mockup Showcase */}
        <div className="relative aspect-[19/10] w-full bg-zinc-950 mb-10">
          <Image
            src="/dashboard.png"
            alt="Narrativee workspace dashboard interface showing active post queue, calendar, and channel profiles"
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover object-top select-none border rounded-2xl border-white/20"
            priority
          />
        </div>
        {/* Stats — 3 metrics static, no auto-scroll */}
        <div
          className={`w-full transition-all duration-700 delay-500 ${isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-10 lg:gap-20">
            {[
              { value: "500,000+", label: "native social posts generated" },
              { value: "10x", label: "average distribution reach growth" },
              { value: "< 2 mins", label: "time to deploy a social campaign" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl lg:text-4xl font-display text-white">{stat.value}</span>
                <span className="text-xs text-white/50 leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
