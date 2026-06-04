"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Zap } from "lucide-react";
import { PricingPlans } from "../../../lib/pricingData";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
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
    <section id="pricing" ref={sectionRef} className="relative py-32 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header - Dramatic offset */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
              <span className="w-12 h-px bg-foreground/30" />
              Pricing
            </span>
            <h2 className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              Fair and
              <br />
              <span className="text-stroke">transparent.</span>
            </h2>
          </div>
          
          <div className="lg:col-span-5 relative p-0 h-48 lg:h-auto">
            {/* Whale image */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 delay-100 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}>
              <Image
                src="/images/whale.png"
                alt="Organic whale"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain object-center"
              />
            </div>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-14 h-7 bg-zinc-800 rounded-full border border-white/10 transition-colors focus:outline-none hover:border-white/20"
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isAnnual ? 'translate-x-7 bg-[#eca8d6]' : 'translate-x-0'
                }`}
            />
          </button>
          <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
            Yearly <span className="bg-[#eca8d6]/20 text-[#eca8d6] border border-[#eca8d6]/30 px-2 py-0.5 rounded-full text-xs font-bold ml-1.5">-20%</span>
          </span>
        </div>

        {/* Pricing cards - Centered 2-column layout */}
        <div className="relative max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {PricingPlans.map((plan, index) => {
              const isCreator = plan.name === "Creator";
              return (
                <div
                  key={plan.name}
                  className={`relative bg-background border transition-all duration-700 ${
                    isCreator 
                      ? "border-[#eca8d6] md:-mx-2 md:z-10 md:scale-105" 
                      : "border-foreground/10"
                  } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Popular badge */}
                  {isCreator && (
                    <div className="absolute -top-4 left-8 right-8 flex justify-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#eca8d6] text-black text-xs font-mono uppercase tracking-widest font-bold">
                        <Zap className="w-3 h-3 fill-black" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-8 lg:p-10 flex flex-col h-full justify-between">
                    <div>
                      {/* Plan header */}
                      <div className="mb-8 pb-8 border-b border-foreground/10">
                        <span className="font-mono text-xs text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-2xl lg:text-3xl font-display mt-2">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl lg:text-6xl font-display">
                            ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                          </span>
                          <span className="text-muted-foreground text-sm">/month</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          {isAnnual ? "billed annually" : "billed monthly"}
                        </p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-10">
                        {plan.features.map((feature) => (
                          <li key={feature.text} className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-[#eca8d6] mt-0.5 shrink-0" />
                            <span className={`text-sm text-muted-foreground ${feature.bold ? "font-bold text-foreground" : ""}`}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/pricing"
                      className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                        isCreator
                          ? "bg-[#eca8d6] text-black hover:bg-[#eca8d6]/90 font-bold"
                          : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom note with icons */}
        <div className={`mt-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-12 border-t border-foreground/10 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Secure OAuth Connection
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Isolated Voice Models
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Manual Review Before Publishing
            </span>
          </div>
          <Link href="/pricing" className="text-sm underline underline-offset-4 hover:text-foreground transition-colors">
            View pricing details
          </Link>
        </div>
      </div>

      <style jsx>{`
        .text-stroke {
          -webkit-text-stroke: 1.5px currentColor;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </section>
  );
}
