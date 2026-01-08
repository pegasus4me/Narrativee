"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Github, Menu, X, Star} from "lucide-react";
import { authClient } from "../../../lib/auth-client";
import logo from "../../../public/logoWhite.png";
import PrimaryButton from "./PrimaryButton";
import ProfileMenu from "./ProfileMenu";

export default function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-tertiary">
      {/* Main header bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2">
        {/* Logo */}
        <div className="w-[120px] md:w-[160px]">
          <Image src={logo} alt="Logo" width={160} height={100} className="w-full h-auto" />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 justify-center text-white items-center gap-8 text-sm font-medium font-manrope">
          <Link href="/pricing" className="hover:opacity-70">Pricing</Link>
          <Link href="/#features" className="hover:opacity-70">Features</Link>
          <Link href="/#solution" className="hover:opacity-70">Solution</Link>
          <Link href="/pricing#calculator" className="hover:opacity-70">ROI Calculator</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex flex-1 justify-end gap-4 items-center">
          {session ? (
            <ProfileMenu />
          ) : (
            <>
              <a
                href="https://github.com/NarrativeeApp/Narrativee-SDK"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-manrope text-white border border-white/30 rounded-full px-3 py-1.5 bg-white/10 transition-colors"
              >
                <Github size={14} />
              
                <span>SDK</span>
                  <Star size={14} className="text-yellow-500" fill="yellow"/>
              </a>
              <Link className="text-sm font-medium text-white" href="/auth/signin">Login</Link>
              <PrimaryButton onClick={() => router.push('/auth/signup')}>Get Started</PrimaryButton>
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
              <ProfileMenu />
            ) : (
              <>
                <Link className="text-sm font-medium text-white" href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <PrimaryButton onClick={() => { setMobileMenuOpen(false); router.push('/auth/signup'); }}>Get Started</PrimaryButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
