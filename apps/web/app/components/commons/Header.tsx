"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import StartCreatingLink from "../landing/StartCreatingLink";
import { authLink } from "@/lib/auth-destination";
import { usePostHog } from "posthog-js/react";
import darkLogo from "public/logo-dark.png";

export default function Header() {
  const ph = usePostHog();
  const pathname = usePathname();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => setStuck(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      data-stuck={stuck}
      className="sticky top-0 z-50 mx-auto w-full max-w-7xl px-4 pb-3"
    >
      <div
        className={`mx-auto grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-b-[32px] bg-neutral-50 px-3 py-3 text-[14px] font-medium text-[#292929] shadow-[inset_0_1px_3px_rgba(0,0,0,0.07)] transition-[width] duration-300 ease-out motion-reduce:transition-none lg:grid-cols-3 lg:px-4 ${stuck ? "lg:w-[90%]" : "lg:w-full"}`}
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
            className={`flex h-7 items-center rounded-full px-4 transition-colors duration-200 hover:bg-white hover:text-[#292929] ${pathname === "/" ? "bg-white text-[#292929] shadow-sm" : "text-[#737373]"}`}
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
            className={`flex h-7 items-center rounded-full px-4 transition-colors duration-200 hover:bg-white hover:text-[#292929] ${pathname === "/pricing" ? "bg-white text-[#292929] shadow-sm" : "text-[#737373]"}`}
            href="/pricing"
            aria-current={pathname === "/pricing" ? "page" : undefined}
            onClick={() => ph?.capture("nav_clicked", { target: "pricing" })}
          >
            Pricing
          </Link>
        </nav>

        <div className="flex h-10 items-center justify-self-end gap-3 lg:col-start-3 lg:row-start-1">
          <Link
            href={authLink("signin", "/workspace")}
            onClick={() => ph?.capture("nav_clicked", { target: "signin" })}
            className="rounded-full px-3 py-2 text-[#737373] transition-colors duration-200 hover:text-[#292929]"
          >
            Login
          </Link>
          <StartCreatingLink
            location="header"
            className="inline-flex min-h-9 cursor-pointer items-center whitespace-nowrap rounded-full bg-tertiary px-4 py-2 text-[13px] leading-tight text-[#292929] transition-colors duration-200 hover:brightness-95 lg:text-[14px]"
          >
            Get started
          </StartCreatingLink>
        </div>
      </div>
    </header>
  );
}
