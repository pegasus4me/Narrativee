"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";

const navLinks = [
  { name: "Features",      href: "#features"          },
  { name: "Process",       href: "#how-it-works"      },
  { name: "Voice Engine",  href: "#voice-engine"      },
  { name: "Integrations",  href: "#integrations"      },
  { name: "Workspace",     href: "#creator-workspace" },
  { name: "Pricing",       href: "/pricing"           },
];

const freeTools = [
  {
    name: "Social Hook Generator",
    description: "Generate scroll-stopping social hooks",
    href: "/tools/social-hook-generator",
  },
  {
    name: "Subject Line Tester",
    description: "Grade your email subject lines for open rates",
    href: "/tools/subject-line-tester",
  },
  {
    name: "Readability Analyzer",
    description: "Audit the reading level and clarity of your text",
    href: "/tools/readability-analyzer",
  },
  {
    name: "Newsletter Auditor",
    description: "Audit your growth and monetization potential",
    href: "/tools/newsletter-auditor",
  },
];

function getDisplayName(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  if (email && email.trim().length > 0) {
    return email.split("@")[0] ?? "Account";
  }

  return "Account";
}

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const session = authClient.useSession();
  const user = session.data?.user;
  const displayName = user ? getDisplayName(user.name, user.email) : null;

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setIsMobileToolsOpen(false);
    }
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? "top-4 left-4 right-4" 
          : "top-0 left-0 right-0"
      }`}
    >
      <nav 
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? "bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-transparent max-w-[1400px]"
        }`}
      >
        <div 
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-20"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image 
              src="/logo.png" 
              alt="Narrativee" 
              width={140} 
              height={22} 
              className="h-5 w-auto" 
              priority 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.slice(0, 5).map((link) => {
              const isHashLink = link.href.startsWith("#");
              const href = isHashLink ? (isHome ? link.href : `/${link.href}`) : link.href;
              return (
                <a
                  key={link.name}
                  href={href}
                  className={`text-sm transition-colors duration-300 relative group ${isScrolled ? "text-foreground/70 hover:text-foreground" : "text-white/70 hover:text-white"}`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${isScrolled ? "bg-foreground" : "bg-white"}`} />
                </a>
              );
            })}

            {/* Free Tools Dropdown */}
            <div className="relative group py-2">
              <button
                className={`flex items-center gap-1 text-sm transition-colors duration-300 relative cursor-pointer ${isScrolled ? "text-foreground/70 hover:text-foreground" : "text-white/70 hover:text-white"}`}
              >
                Free Tools
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </button>
              
              {/* Dropdown Menu Panel */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 ease-out z-50">
                <div className="w-72 rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">
                  <div className="grid gap-1">
                    {freeTools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        className="group/item flex flex-col gap-1 rounded-xl p-3 transition-colors hover:bg-white/5"
                      >
                        <span className="text-sm font-medium text-white transition-colors group-hover/item:text-[#eca8d6]">
                          {tool.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 leading-normal">
                          {tool.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {navLinks.slice(5).map((link) => {
              const isHashLink = link.href.startsWith("#");
              const href = isHashLink ? (isHome ? link.href : `/${link.href}`) : link.href;
              return (
                <a
                  key={link.name}
                  href={href}
                  className={`text-sm transition-colors duration-300 relative group ${isScrolled ? "text-foreground/70 hover:text-foreground" : "text-white/70 hover:text-white"}`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${isScrolled ? "bg-foreground" : "bg-white"}`} />
                </a>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {session.isPending ? (
              <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
            ) : displayName ? (
              <>
                {!isScrolled && (
                  <span className="hidden max-w-36 truncate text-sm font-medium transition-colors md:block text-white/70">
                    {displayName}
                  </span>
                )}
                <Link href="/workspace">
                  <Button
                    size="sm"
                    className={`rounded-full transition-all duration-500 ${isScrolled ? "bg-foreground hover:bg-foreground/90 text-background px-5 h-8 text-xs" : "bg-white hover:bg-white/90 text-black px-6"}`}
                  >
                    Dashboard
                  </Button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`hidden text-sm font-semibold transition-colors duration-300 cursor-pointer md:block ${isScrolled ? "text-foreground/70 hover:text-foreground" : "text-white/70 hover:text-white"}`}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/signin" 
                  className={`transition-all duration-500 ${isScrolled ? "text-xs text-foreground/70 hover:text-foreground" : "text-sm text-white/70 hover:text-white"}`}
                >
                  Sign in
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="sm"
                    className={`rounded-full transition-all duration-500 ${isScrolled ? "bg-foreground hover:bg-foreground/90 text-background px-5 h-8 text-xs" : "bg-white hover:bg-white/90 text-black px-6"}`}
                  >
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors duration-500 ${isScrolled || isMobileMenuOpen ? "text-foreground" : "text-white"}`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

      </nav>
      
      {/* Mobile Menu - Full Screen Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8 overflow-y-auto">
          {/* Navigation Links */}
          <div className="flex-1 flex flex-col justify-center gap-6 py-6">
            {navLinks.slice(0, 5).map((link, i) => {
              const isHashLink = link.href.startsWith("#");
              const href = isHashLink ? (isHome ? link.href : `/${link.href}`) : link.href;
              return (
                <a
                  key={link.name}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-4xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                    isMobileMenuOpen 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: isMobileMenuOpen ? `${i * 50}ms` : "0ms" }}
                >
                  {link.name}
                </a>
              );
            })}

            {/* Free Tools Collapsible in Mobile */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                className={`flex items-center gap-2 text-4xl font-display text-left text-foreground hover:text-muted-foreground transition-all duration-500 cursor-pointer ${
                  isMobileMenuOpen 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `250ms` : "0ms" }}
              >
                Free Tools
                <ChevronDown className={`h-6 w-6 transition-transform duration-300 ${isMobileToolsOpen ? "rotate-180" : ""}`} />
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isMobileToolsOpen 
                    ? "max-h-96 opacity-100 mt-2" 
                    : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                <div className="flex flex-col gap-4 pl-4 border-l border-foreground/10">
                  {freeTools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex flex-col gap-0.5"
                    >
                      <span className="text-xl font-medium text-foreground hover:text-[#eca8d6] transition-colors">
                        {tool.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {navLinks.slice(5).map((link, i) => {
              const isHashLink = link.href.startsWith("#");
              const href = isHashLink ? (isHome ? link.href : `/${link.href}`) : link.href;
              return (
                <a
                  key={link.name}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-4xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                    isMobileMenuOpen 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: isMobileMenuOpen ? `300ms` : "0ms" }}
                >
                  {link.name}
                </a>
              );
            })}
          </div>
          
          {/* Bottom CTAs */}
          <div className={`flex gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
            isMobileMenuOpen 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? "300ms" : "0ms" }}
          >
            {session.isPending ? (
              <div className="h-14 w-full animate-pulse rounded-full bg-white/10" />
            ) : displayName ? (
              <>
                <Link href="/workspace" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-foreground text-background rounded-full h-14 text-base">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-full h-14 text-base"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full h-14 text-base">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-foreground text-background rounded-full h-14 text-base">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
