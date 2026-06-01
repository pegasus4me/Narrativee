"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Github, Menu, X, Star } from "lucide-react";
import { authClient } from "../../../lib/auth-client";
import logo from "../../../public/logo.png"
import PrimaryButton from "./PrimaryButton";
import ProfileMenu from "./ProfileMenu";

interface HeaderProps {
  onBetaSignup?: () => void;
}

export default function Header({ onBetaSignup }: HeaderProps = {}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="">
      {/* Main header bar */}
      <div className="relative flex items-center justify-between px-4 md:px-6 py-2 text-black">
        {/* Logo */}
        <div className="flex items-center gap-2 z-10">
          <div className="w-[120px] md:w-[160px]">
            <Image src={logo} alt="Narrativee - Newsletter Repurposing" width={160} height={100} className="w-full h-auto" />
          </div>
        </div>

        {/* Desktop nav - Absolutely centered */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2  items-center gap-8 text-sm font-medium font-manrope">
          <Link href="/pricing" className="hover:opacity-70">Pricing</Link>
          <Link href="/#features" className="hover:opacity-70">Features</Link>
          <Link href="/#solution" className="hover:opacity-70">Solution</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex gap-4 items-center z-10">
          {session ? (
            < ProfileMenu />
          ) : (
            <>
              <button
                className="text-sm font-medium  hover:opacity-70 transition-opacity"
                onClick={onBetaSignup || (() => router.push('/auth/signin'))}
              >
                Login
              </button>
              <PrimaryButton onClick={onBetaSignup || (() => router.push('/auth/signup'))}>Get Started for free</PrimaryButton>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-tertiary border-t border-white/10 px-4 py-4">
          <nav className="flex flex-col gap-4 text-white text-sm font-medium font-manrope mb-4">
            <Link href="/pricing" className="hover:opacity-70" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/#features" className="hover:opacity-70" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/#solution" className="hover:opacity-70" onClick={() => setMobileMenuOpen(false)}>Solution</Link>
            <Link href="/pricing#calculator" className="hover:opacity-70" onClick={() => setMobileMenuOpen(false)}>ROI Calculator</Link>
          </nav>
          <div className="flex flex-col gap-3">
            {session ? (
              < ProfileMenu  />
            ) : (
              <>
                <button
                  className="text-sm font-medium text-tertiary hover:opacity-70 transition-opacity text-left"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onBetaSignup) onBetaSignup();
                    else router.push('/auth/signin');
                  }}
                >
                  Login
                </button>
                <PrimaryButton onClick={() => {
                  setMobileMenuOpen(false);
                  if (onBetaSignup) onBetaSignup();
                  else router.push('/auth/signup');
                }}>Get Started</PrimaryButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
