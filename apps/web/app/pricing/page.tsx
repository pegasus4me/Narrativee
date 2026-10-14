import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Header from "../components/commons/Header";
import PricingPlans from "./PricingPlans";
import { trialDays } from "./pricingData";
import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Find your rhythm with Narrativee. Explore plans for creating on-brand social posts and ads with your AI brand designer.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | Narrativee",
    description: "A creative partner for every stage of your brand.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="pricing-title">
          <h1 id="pricing-title">Good creative. Simple pricing.</h1>
          <p>A little spark for your brand. A plan for wherever it goes.</p>
        </section>

        <PricingPlans />

        <div className={styles.note}>
          <span className={styles.betaDot} aria-hidden="true" />
          <p>
            We’re in beta. New accounts get 400 credits for a {trialDays}-day
            free trial, cancel anytime.
          </p>
          <a href="mailto:contact@narrativee.com">
            Have a question? <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link href="/" aria-label="Narrativee home">
              <Image
                src="/logo-dark.png"
                alt="Narrativee"
                width={160}
                height={31}
                className={styles.logo}
              />
            </Link>
            <p>Designed to keep creating.</p>
            <span>© {new Date().getFullYear()} Narrativee</span>
          </div>
          <nav className={styles.footerLinks} aria-label="Product">
            <h2>Product</h2>
            <Link href="/#features">Explore Narrativee</Link>
            <Link href="/#solution">Your brand designer</Link>
            <Link href="/pricing" aria-current="page">
              Pricing
            </Link>
          </nav>
          <nav className={styles.footerLinks} aria-label="Get in touch">
            <h2>Let’s talk</h2>
            <a href="mailto:contact@narrativee.com">Contact us</a>
            <a href="mailto:contact@narrativee.com?subject=Narrativee%20for%20my%20agency">
              For agencies <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
