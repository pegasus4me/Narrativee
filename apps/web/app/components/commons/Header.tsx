"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import darkLogo from "public/logo-dark.png";

interface HeaderProps {
  onBetaSignup?: () => void;
}

export default function Header({ onBetaSignup }: HeaderProps = {}) {
  const router = useRouter();
  const ph = usePostHog();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => setStuck(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const start = () => {
    ph?.capture("header_cta_clicked", {
      action: "scroll_to_waitlist",
    });
    if (onBetaSignup) onBetaSignup();
    else router.push("/#start");
  };

  return (
    <header
      data-stuck={stuck}
      className="sticky top-0 z-50 mx-auto w-full max-w-7xl px-4 pb-3"
    >
      <div
        className={`mx-auto border-b border-l bg-neutral-50 border-neutral-300 border-r border-dashed grid w-full  grid-cols-[1fr_auto] items-center gap-3 rounded-b-[32px]  px-3 py-3 text-[14px] font-medium text-[#292929] transition-[width] duration-300 ease-out motion-reduce:transition-none lg:grid-cols-3 lg:px-4 ${stuck ? "lg:w-[90%]" : "lg:w-full"}`}
      >
        <Link
          className="ml-2 w-max text-[20px] tracking-[-0.04em] lg:col-start-2 lg:row-start-1 lg:ml-0 lg:justify-self-center"
          href="/"
          aria-label="Narrativee home"
        >
          <Image
            src={darkLogo}
            alt="Narrativee"
            width={160}
            height={31}
            className="h-5 w-auto object-contain lg:h-7"
            priority
          />
        </Link>

        <nav
          className="hidden h-10 lg:flex flex-row items-center gap-1 rounded-full bg-[#f3f3f4] px-1.5 lg:col-start-1 lg:row-start-1 justify-self-start leading-[1.38]"
          aria-label="Main navigation"
        >
          <Link
            className="flex h-7 items-center rounded-full bg-white px-4 text-[#292929] shadow-sm transition-colors duration-200 hover:bg-[#fafafa]"
            href="/#features"
            onClick={() => ph?.capture("nav_clicked", { target: "features" })}
          >
            Explore
          </Link>
          <Link
            className="flex h-7 items-center rounded-full px-4 text-[#737373] transition-colors duration-200 hover:bg-white hover:text-[#292929]"
            href="/#solution"
            onClick={() => ph?.capture("nav_clicked", { target: "solution" })}
          >
            Solution
          </Link>
          <Link
            className="flex h-7 items-center rounded-full px-4 text-[#737373] transition-colors duration-200 hover:bg-white hover:text-[#292929]"
            href="/#start"
            onClick={() => ph?.capture("nav_clicked", { target: "waitlist" })}
          >
            Early access
          </Link>
        </nav>

        <div className="flex h-10 items-center justify-self-end rounded-full bg-[#f3f3f4] px-1.5 lg:col-start-3 lg:row-start-1">
          <button
            className="group inline-flex min-h-7 max-w-[148px] cursor-pointer items-center rounded-full bg-white px-3 py-1 text-[12px] leading-tight text-[#292929] shadow-sm transition-colors duration-200 hover:bg-[#fafafa] lg:max-w-none lg:whitespace-nowrap lg:px-4 lg:text-[14px]"
            type="button"
            onClick={start}
            data-ph-capture-attribute="header-cta-button"
          >
            Integrate Narrativee to your company
            <span
              aria-hidden="true"
              className="ml-2 hidden text-[1.1em] transition-transform duration-180 group-hover:translate-x-1 lg:inline-block"
            >
              →
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
