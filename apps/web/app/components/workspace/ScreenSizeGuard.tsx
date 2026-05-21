"use client";

import { useMediaQuery } from "usehooks-ts";
import { ReactNode } from "react";
import Narrativeelogo from '../../../public/logo.png'
import Image from "next/image";
// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceType = "mobile" | "tablet" | "laptop" | "desktop";

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useDeviceType(): DeviceType {
  const isMobile  = useMediaQuery("(max-width: 767px)");
  const isTablet  = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isLaptop  = useMediaQuery("(min-width: 1024px) and (max-width: 1439px)");

  if (isMobile)  return "mobile";
  if (isTablet)  return "tablet";
  if (isLaptop)  return "laptop";
  return "desktop";
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function NarrativeUnavailableOverlay({ device }: { device: DeviceType }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white px-6"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center">

            {/* Logo */}    
            <div className="mb-6 flex items-center justify-center">
              <Image src={Narrativeelogo.src} alt="Narrativee logo" className="h-8 w-auto" width={100} height={100}/>
            </div>
        {/* Heading */}
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-black">
          Switch to a laptop or desktop
        </h2>

        {/* Body */}
        <p className="mb-5 text-sm leading-relaxed text-black">
          <span className="font-medium text-primary">Narrative</span>{" "}
          isn&apos;t available on{" "}
          <span className="inline-block rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 font-mono text-xs capitalize text-neutral-300">
            {device}
          </span>
          . Please open this page on a screen at least{" "}
          <span className="text-primary">1024 px</span> wide.
        </p>

        {/* Hint */}
        <p className="text-xs uppercase tracking-widest text-neutral-600">
          min-width · 1024 px
        </p>
      </div>
    </div>
  );
}

// ─── Guard ────────────────────────────────────────────────────────────────────

interface ScreenSizeGuardProps {
  children: ReactNode;
  /** Devices on which the narrative is blocked. Defaults to mobile + tablet. */
  blockedDevices?: DeviceType[];
}

export default function ScreenSizeGuard({
  children,
  blockedDevices = ["mobile", "tablet"],
}: ScreenSizeGuardProps) {
  const device = useDeviceType();

  if (blockedDevices.includes(device)) {
    return <NarrativeUnavailableOverlay device={device} />;
  }

  return <>{children}</>;
}