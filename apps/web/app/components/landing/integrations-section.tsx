"use client";

import { LINKEDIN_LOGO, MEDIUM_LOGO, SUBSTACK_LOGO, X_LOGO, THREADS_LOGO, BLUESKY_LOGO, WORDPRESS_LOGO, BEEHIIV_LOGO, GHOST_LOGO, MAILCHIMP_LOGO, SQUARESPACE_LOGO, KIT_LOGO } from "@/app/constants";
import { useEffect, useState, useRef } from "react";

const logos: Record<string, React.ReactNode> = {
  Substack: (
    <img src={SUBSTACK_LOGO} alt="Substack" className="w-6 h-6" />
  ),
  beehiiv: (
    <img src={BEEHIIV_LOGO} alt="beehiiv" className="w-6 h-6" />
  ),
  Ghost: (
    <img src={GHOST_LOGO} alt="Ghost" className="w-6 h-6" />
  ),
  LinkedIn: (
    <img src={LINKEDIN_LOGO} alt="LinkedIn" className="w-6 h-6" />
  ),
  X: (
    <img src={X_LOGO} alt="X" className="w-6 h-6" />
  ),
  Threads: (
    <img src={THREADS_LOGO} alt="Threads" className="w-6 h-6" />
  ),
  Medium: (
    <img src={MEDIUM_LOGO} alt="Medium" className="w-6 h-6" />
  ),
  WordPress: (
    <img src={WORDPRESS_LOGO} alt="WordPress" className="w-6 h-6" />
  ),
  Mailchimp: (
    <img src={MAILCHIMP_LOGO} alt="Mailchimp" className="w-6 h-6" />
  ),
  Squarespace: (
    <img src={SQUARESPACE_LOGO} alt="Squarespace" className="w-6 h-6" />
  ),
  Kit: (
    <img src={KIT_LOGO} alt="Kit" className="w-6 h-6" />
  ),

};

const integrations = [
  { name: "Substack", category: "Newsletter" },
  { name: "beehiiv", category: "Newsletter" },
  { name: "Ghost", category: "Newsletter" },
  { name: "LinkedIn", category: "Social" },
  { name: "X", category: "Social" },
  { name: "Threads", category: "Social" },
  { name: "Medium", category: "Blogging" },
  { name: "WordPress", category: "Blogging" },
  { name: "Mailchimp", category: "Marketing" },
  { name: "Squarespace", category: "Marketing" },
  { name: "Kit", category: "Marketing" },

];

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="integrations" ref={sectionRef} className="relative overflow-hidden">

      {/* Header — centré verticalement sur l'image */}
      <div className="relative z-10 pt-32 lg:pt-40 text-center">
        <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 justify-center ${isVisible ? "opacity-100" : "opacity-0"
          }`}>
          <span className="w-12 h-px bg-foreground/20" />
          Integrations
          <span className="w-12 h-px bg-foreground/20" />
        </span>

        <h2 className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
          Sync and
          <br />
          <span className="text-muted-foreground">distribute.</span>
        </h2>

        <p className={`mt-8 text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto transition-all duration-1000 delay-100 ${isVisible ? "opacity-100" : "opacity-0"
          }`}>
          Connect your newsletter sources and socials in one unified workspace and publish to all major social channels automatically. Narrativee integrates seamlessly with your writing workflow.
        </p>
      </div>

      {/* Full-width image */}
      <div className={`relative left-1/2 -translate-x-1/2 w-screen -mt-16 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100" : "opacity-0"
        }`}>
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/connection-KeJwWPQvn6l0a7C48tCARYtNEdC92H.png"
          alt=""
          aria-hidden="true"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Integration grid — remonte sur l'image avec spacing mobile approprié */}
      <div className="relative z-10 mt-0 lg:-mt-24 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          {integrations.map((integration, index) => (
            <div
              key={integration.name}
              className={`group relative overflow-hidden p-6 lg:p-8 border transition-all duration-500 cursor-default ${hoveredIndex === index
                ? "border-foreground bg-foreground/[0.04] scale-[1.02]"
                : "border-foreground/10 hover:border-foreground/30"
                } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{
                transitionDelay: `${index * 30 + 300}ms`,
              }}
              onMouseEnter={(e) => {
                setHoveredIndex(index);
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setMousePos(null);
              }}
            >
              {/* Cursor-following halo */}
              {hoveredIndex === index && mousePos && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{
                    background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1) 0%, transparent 70%)`,
                  }}
                />
              )}
              {/* Category tag */}
              <span className={`absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 transition-colors ${hoveredIndex === index
                ? "bg-foreground text-background"
                : "bg-foreground/10 text-muted-foreground"
                }`}>
                {integration.category}
              </span>

              {/* Logo */}
              <div className={`w-10 h-10 mb-6 flex items-center justify-center transition-colors ${hoveredIndex === index ? "text-white" : "text-foreground/60"
                }`}>
                {logos[integration.name]}
              </div>

              <span className="font-medium block">{integration.name}</span>

              {/* Animated underline */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/20 overflow-hidden">
                <div className={`h-full bg-foreground transition-all duration-500 ${hoveredIndex === index ? "w-full" : "w-0"
                  }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats row */}
        <div className={`flex flex-wrap items-center justify-between gap-8 pt-12 border-t border-foreground/10 transition-all duration-1000 delay-500 pb-32 lg:pb-40 ${isVisible ? "opacity-100" : "opacity-0"
          }`}>
          <div className="flex flex-wrap gap-12">
            {[
              { value: "10+", label: "Social & newsletter channels" },
              { value: "Secure OAuth", label: "Auth built-in" },
              { value: "Auto-Sync", label: "RSS feed monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-3">
                <span className="text-3xl font-display">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>

          <a href="#pricing" className="group inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors">
            Get started now
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
