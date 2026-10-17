"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StartCreatingLink from "../landing/StartCreatingLink";
import { authLink } from "@/lib/auth-destination";
import { usePostHog } from "posthog-js/react";
import { buttonVariants } from "@/components/ui/button";

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
      className="sticky top-0 z-50 mx-auto w-full max-w-[1536px] px-4 pb-3"
    >
      <div
        className={`mx-auto grid w-full grid-cols-[1fr_auto] items-center gap-3 px-3 py-3 text-[14px] font-medium text-[#292929] transition-[width] duration-300 ease-out motion-reduce:transition-none lg:grid-cols-3 lg:px-4 ${stuck ? "lg:w-[90%]" : "lg:w-full"}`}
      >
        <Link
          className="ml-2 flex w-max items-center gap-2 font-sf-rounded text-[24px] font-semibold leading-none tracking-[-0.04em] lg:col-start-1 lg:row-start-1 lg:ml-0 lg:justify-self-start lg:text-[34px]"
          href="/"
          aria-label="Narrativee home"
        >
          <span
            aria-hidden="true"
            className="aspect-[623/408] w-8 shrink-0 bg-tertiary lg:w-12"
            style={{
              mask: "url(/narrativee-mark.svg) center / contain no-repeat",
            }}
          />
          <span>narrativee</span>
        </Link>

        <nav
          className="hidden h-10 lg:flex flex-row items-center gap-1 rounded-full bg-[#f3f3f4] px-1.5 lg:col-start-2 lg:row-start-1 justify-self-center leading-[1.38]"
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
            className="rounded-full bg-transparent px-3 py-2 font-sf-rounded text-base font-bold text-[#292929] transition-colors duration-200 hover:brightness-95"
          >
            Login
          </Link>
          <StartCreatingLink
            location="header"
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className:
                "h-auto min-h-9 whitespace-nowrap rounded-full px-4 py-2 font-sf-rounded text-sm font-bold leading-tight lg:text-base",
            })}
          >
            Get started
          </StartCreatingLink>
        </div>
      </div>
    </header>
  );
}
