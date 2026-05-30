"use client";

import { LINKEDIN_LOGO, X_LOGO, FACEBOOK_LOGO, INSTAGRAM_LOGO, THREADS_LOGO, BLUESKY_LOGO } from "@/app/constants";

const PLATFORM_LOGOS: Record<string, string> = {
  linkedin: LINKEDIN_LOGO,
  x: X_LOGO,
  facebook: FACEBOOK_LOGO,
  instagram: INSTAGRAM_LOGO,
  threads: THREADS_LOGO,
  bluesky: BLUESKY_LOGO,
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  instagram: "Instagram",
  threads: "Threads",
  facebook: "Facebook",
  bluesky: "Bluesky",
};

interface PlatformLogoProps {
  platform: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Returns the logo asset for a known social platform. */
export function getPlatformLogo(platform?: string): string {
  return platform ? PLATFORM_LOGOS[platform] ?? LINKEDIN_LOGO : LINKEDIN_LOGO;
}

/** Returns the display label for a known social platform. */
export function getPlatformLabel(platform?: string): string {
  return platform ? PLATFORM_LABELS[platform] ?? platform : "Social platform";
}

/** Renders a platform logo with consistent sizing. */
export function PlatformLogo({ platform, size = "md", className = "" }: PlatformLogoProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <img
      src={getPlatformLogo(platform)}
      alt={getPlatformLabel(platform)}
      className={`${sizeClasses[size]} object-contain ${className}`}
    />
  );
}
