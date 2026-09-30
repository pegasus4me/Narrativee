"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { authClient } from "../../../lib/auth-client";
import dark_logo from "public/logo-dark.png";
import white_logo from "public/logo-white.png";

interface HeaderProps {
  onBetaSignup?: () => void;
}

export default function Header({ onBetaSignup }: HeaderProps = {}) {
  const router = useRouter();
  const ph = usePostHog();
  const { data: session } = authClient.useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const start = () => {
    ph?.capture("header_cta_clicked", { action: session ? "go_to_workspace" : "scroll_to_waitlist" });
    if (onBetaSignup) onBetaSignup();
    else router.push(session ? "/workspace" : "/#start");
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#050505]/80 backdrop-blur-md border-b border-[#252525]/80 py-3.5 shadow-lg shadow-black/40"
          : "bg-transparent py-5 md:py-6 border-b border-transparent"
      }`}
    >
      <div className="mx-auto grid w-[calc(100%-48px)] md:w-[min(60%,1120px)] grid-cols-[1fr_auto] md:grid-cols-3 items-center text-[17px] font-semibold text-[#f3f3f3]">
        <Link className="w-max text-[20px] tracking-[-0.04em]" href="/" aria-label="Narrativee home">
          <Image src={dark_logo} alt="Narrativee" width={160} height={31} className="h-7 w-auto object-contain dark:hidden md:h-8" priority />
          <Image src={white_logo} alt="" width={160} height={31} className="hidden h-7 w-auto object-contain dark:block md:h-8" priority />
        </Link>

        <nav className="hidden md:flex flex-row gap-5 justify-self-center leading-[1.38]" aria-label="Main navigation">
          <Link className="text-[#f3f3f3] transition-colors duration-180 hover:text-white" href="/#features" onClick={() => ph?.capture("nav_clicked", { target: "features" })}>Explore</Link>
          <Link className="text-[#858585] transition-colors duration-180 hover:text-white" href="/#solution" onClick={() => ph?.capture("nav_clicked", { target: "solution" })}>Solution</Link>
          <Link className="text-[#858585] transition-colors duration-180 hover:text-white" href="/#start" onClick={() => ph?.capture("nav_clicked", { target: "waitlist" })}>Waitlist</Link>
        </nav>

        <div className="flex items-center justify-self-end">
          <button
            className="group inline-flex items-center whitespace-nowrap text-[15px] md:text-base font-semibold text-[#f3f3f3] transition-colors hover:text-white cursor-pointer"
            type="button"
            onClick={start}
            data-ph-capture-attribute="header-cta-button"
          >
            {session ? "Dashboard" : "Join waitlist"}
            <span aria-hidden="true" className="inline-block ml-2 text-[1.1em] transition-transform duration-180 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
