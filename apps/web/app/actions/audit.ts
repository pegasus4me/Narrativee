"use server";

import * as cheerio from "cheerio";
import { type NicheKey, NICHE_BENCHMARKS } from "../tools/newsletter-auditor/lib/niche-benchmarks";
import { calculateMonetization, type MonetizationProjection } from "../tools/newsletter-auditor/lib/monetization-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditInput {
  url: string;
  subscriberCount: number;
  niche: NicheKey;
  /** Optional open rate override (0–1 decimal, e.g. 0.35 for 35%) */
  openRate?: number;
}

export interface AuditScores {
  landingPage: number;
  headline: number;
  socialProof: number;
  seo: number;
  contentPreview: number;
  overall: number;
}

export interface CrawledData {
  titleText: string;
  titleLength: number;
  descText: string;
  h1Text: string;
  h1Count: number;
  h2Texts: string[];
  buttonText: string;
  totalInputs: number;
  hasEmailInput: boolean;
  hasSocialProof: boolean;
  socialProofKeywords: string[];
  ogImageExists: boolean;
  ogImageUrl: string;
  hasArchiveLink: boolean;
  estimatedFrequency: string;
  hasTestimonials: boolean;
  linkCount: number;
  imageCount: number;
}

export interface Recommendation {
  id: string;
  category: "landing_page" | "headline" | "social_proof" | "seo" | "content" | "monetization";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
}

export interface AuditResult {
  success: boolean;
  error?: string;
  isBlocked?: boolean;
  url?: string;
  input?: { subscriberCount: number; niche: NicheKey };
  scores?: AuditScores;
  monetization?: MonetizationProjection;
  crawledData?: CrawledData;
  recommendations?: Recommendation[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalizes a URL to ensure it starts with https:// */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Scans body text for social proof keywords */
function scanSocialProof(text: string): string[] {
  const keywords = [
    "subscriber", "subscribers", "reader", "readers", "member", "members",
    "join", "joined", "trust", "trusted", "already", "weekly", "daily",
    "newsletter", "reviews", "testimonials", "stars", "rating", "rated",
    "community", "growing", "free",
  ];
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw));
}

/** Detects estimated sending frequency from page text */
function detectFrequency(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("daily") || lower.includes("every day") || lower.includes("every weekday")) return "Daily";
  if (lower.includes("twice a week") || lower.includes("2x per week") || lower.includes("biweekly")) return "2x / week";
  if (lower.includes("weekly") || lower.includes("every week") || lower.includes("once a week")) return "Weekly";
  if (lower.includes("bimonthly") || lower.includes("twice a month")) return "Bimonthly";
  if (lower.includes("monthly") || lower.includes("once a month")) return "Monthly";
  return "Unknown";
}

/** Checks for archive / past-issue links */
function detectArchiveLinks($: cheerio.CheerioAPI): boolean {
  const archiveIndicators = [
    'a[href*="archive"]',
    'a[href*="past-issues"]',
    'a[href*="previous"]',
    'a:contains("past issues")',
    'a:contains("archive")',
    'a:contains("previous edition")',
    'a:contains("read past")',
    '[class*="archive" i]',
  ];
  return archiveIndicators.some((selector) => {
    try { return $(selector).length > 0; } catch { return false; }
  });
}

// ---------------------------------------------------------------------------
// Scoring Functions
// ---------------------------------------------------------------------------

function scoreLandingPage(data: CrawledData): { score: number; recommendations: Recommendation[] } {
  let score = 100;
  const recs: Recommendation[] = [];

  // Email input presence
  if (!data.hasEmailInput) {
    score -= 30;
    recs.push({
      id: "lp-no-email",
      category: "landing_page",
      priority: "critical",
      title: "No email signup form detected",
      description: "Your landing page doesn't have a visible email input field. This is the single most important conversion element.",
      impact: "Fixing this could increase signups by 50–100%",
    });
  }

  // Form friction
  if (data.totalInputs > 2) {
    score -= (data.totalInputs - 2) * 12;
    recs.push({
      id: "lp-form-friction",
      category: "landing_page",
      priority: "high",
      title: `Too many form fields (${data.totalInputs} detected)`,
      description: "Each additional field beyond email reduces conversion by ~10%. Consider collecting extra info during onboarding instead.",
      impact: `Removing ${data.totalInputs - 1} fields could boost signups by ${(data.totalInputs - 1) * 10}%`,
    });
  }

  // Button copy analysis
  if (data.buttonText) {
    const lower = data.buttonText.toLowerCase();
    const genericLabels = ["submit", "click here", "sign up", "subscribe"];
    const premiumLabels = ["free", "get", "unlock", "start", "join", "access", "try", "learn"];
    const isGeneric = genericLabels.some((gl) => lower === gl || lower.startsWith(gl));
    const hasPremium = premiumLabels.some((pl) => lower.includes(pl));

    if (isGeneric) {
      score -= 15;
      recs.push({
        id: "lp-generic-cta",
        category: "landing_page",
        priority: "high",
        title: `Weak CTA button copy: "${data.buttonText}"`,
        description: "Generic button labels like 'Submit' or 'Subscribe' don't communicate value. Use benefit-driven copy that tells readers what they get.",
        impact: "Optimized CTA copy can increase clicks by 15–30%",
      });
    } else if (!hasPremium) {
      score -= 8;
      recs.push({
        id: "lp-standard-cta",
        category: "landing_page",
        priority: "medium",
        title: `CTA could be more compelling: "${data.buttonText}"`,
        description: "Your button copy works but could be stronger. Try adding urgency or value words like 'Get Free Access' or 'Join 10k+ readers'.",
        impact: "Better CTA copy can lift conversions by 5–15%",
      });
    }
  } else {
    score -= 20;
    recs.push({
      id: "lp-no-cta",
      category: "landing_page",
      priority: "critical",
      title: "No CTA button detected",
      description: "We couldn't find a clear submit or subscribe button on your page. Make sure your CTA is visually prominent.",
      impact: "A clear CTA is essential for any conversion",
    });
  }

  return { score: Math.max(20, Math.min(100, score)), recommendations: recs };
}

function scoreHeadline(data: CrawledData): { score: number; recommendations: Recommendation[] } {
  let score = 100;
  const recs: Recommendation[] = [];

  if (data.h1Count === 0) {
    score = 30;
    recs.push({
      id: "hl-no-h1",
      category: "headline",
      priority: "critical",
      title: "Missing H1 headline tag",
      description: "Your page has no H1 element. Visitors decide within 3 seconds whether to stay — a clear, benefit-driven headline is essential.",
      impact: "Adding a strong H1 can improve time-on-page by 40%+",
    });
    return { score, recommendations: recs };
  }

  // Multiple H1s
  if (data.h1Count > 1) {
    score -= 10;
    recs.push({
      id: "hl-multiple-h1",
      category: "headline",
      priority: "medium",
      title: `Multiple H1 tags detected (${data.h1Count})`,
      description: "Having more than one H1 dilutes your primary message. Use a single, focused H1 for your value proposition.",
      impact: "A single focused H1 improves clarity and SEO",
    });
  }

  // Generic headline detection
  const genericPhrases = ["newsletter", "subscribe", "weekly updates", "daily email", "mailing list", "sign up for"];
  const lowerH1 = data.h1Text.toLowerCase();
  const isGeneric = genericPhrases.some((phrase) => lowerH1.includes(phrase)) && data.h1Text.split(/\s+/).length < 6;

  if (isGeneric) {
    score -= 25;
    recs.push({
      id: "hl-generic",
      category: "headline",
      priority: "high",
      title: `Generic headline: "${data.h1Text}"`,
      description: "Your headline describes the format (newsletter) instead of the value. Focus on what the reader learns or gains — the transformation they'll experience.",
      impact: "Benefit-driven headlines convert 2–3x better than generic ones",
    });
  }

  // Word count
  const wordCount = data.h1Text.split(/\s+/).length;
  if (wordCount < 4) {
    score -= 12;
    recs.push({
      id: "hl-too-short",
      category: "headline",
      priority: "medium",
      title: "Headline may be too short",
      description: `Your H1 is only ${wordCount} words. It might not communicate enough value to capture attention. Aim for 5–12 words.`,
      impact: "Longer, benefit-focused headlines tend to convert better",
    });
  } else if (wordCount > 14) {
    score -= 10;
    recs.push({
      id: "hl-too-long",
      category: "headline",
      priority: "low",
      title: "Headline may be too wordy",
      description: `Your H1 is ${wordCount} words — readers scan quickly. Keep your main promise punchy and readable at a glance.`,
      impact: "Shorter headlines are easier to scan above the fold",
    });
  }

  // Subheadline presence
  if (data.h2Texts.length === 0) {
    score -= 10;
    recs.push({
      id: "hl-no-subhead",
      category: "headline",
      priority: "medium",
      title: "No subheadline (H2) detected",
      description: "A supporting subheadline below your H1 clarifies your promise and adds urgency. E.g., 'Join 5,000+ founders getting weekly growth tactics.'",
      impact: "Subheadlines increase above-the-fold engagement by 15–20%",
    });
  }

  return { score: Math.max(20, Math.min(100, score)), recommendations: recs };
}

function scoreSocialProof(data: CrawledData): { score: number; recommendations: Recommendation[] } {
  let score = 100;
  const recs: Recommendation[] = [];

  if (!data.hasSocialProof && !data.hasTestimonials) {
    score = 35;
    recs.push({
      id: "sp-none",
      category: "social_proof",
      priority: "critical",
      title: "No social proof detected",
      description: "We found no subscriber counts, testimonials, or trust badges. Social proof is the #1 trust-builder for newsletter signups.",
      impact: "Adding social proof can increase conversions by 20–40%",
    });
    return { score, recommendations: recs };
  }

  if (!data.hasTestimonials) {
    score -= 20;
    recs.push({
      id: "sp-no-testimonials",
      category: "social_proof",
      priority: "high",
      title: "No testimonials or reader quotes",
      description: "Keywords suggest some social proof, but no actual testimonial blockquotes or review sections were detected. Embed 2–3 reader quotes near your signup form.",
      impact: "Testimonials near the CTA boost trust and signups by 15–25%",
    });
  }

  if (data.socialProofKeywords.length < 3) {
    score -= 10;
    recs.push({
      id: "sp-weak",
      category: "social_proof",
      priority: "medium",
      title: "Social proof signals are weak",
      description: "Only a few trust keywords found. Consider adding a specific subscriber count (e.g., 'Join 5,000+ readers'), brand logos, or media mentions.",
      impact: "Specific numbers outperform vague claims by 2x",
    });
  }

  return { score: Math.max(20, Math.min(100, score)), recommendations: recs };
}

function scoreSeo(data: CrawledData): { score: number; recommendations: Recommendation[] } {
  let score = 100;
  const recs: Recommendation[] = [];

  // Title tag
  if (!data.titleText) {
    score -= 25;
    recs.push({
      id: "seo-no-title",
      category: "seo",
      priority: "critical",
      title: "Missing page title tag",
      description: "Your page has no <title> element. Search engines use this as the primary ranking signal and display it in results.",
      impact: "Critical for search engine indexing and click-through rates",
    });
  } else if (data.titleLength < 25) {
    score -= 10;
    recs.push({
      id: "seo-short-title",
      category: "seo",
      priority: "medium",
      title: `Page title too short (${data.titleLength} chars)`,
      description: "Your title doesn't fully utilize the available space in search results. Aim for 50–60 characters including your brand name.",
      impact: "Optimized titles improve CTR from search by 10–20%",
    });
  } else if (data.titleLength > 65) {
    score -= 8;
    recs.push({
      id: "seo-long-title",
      category: "seo",
      priority: "low",
      title: `Page title too long (${data.titleLength} chars)`,
      description: "Your title will be truncated in Google results. Keep it under 60 characters for full visibility.",
      impact: "Truncated titles reduce click-through rates",
    });
  }

  // Meta description
  if (!data.descText) {
    score -= 18;
    recs.push({
      id: "seo-no-desc",
      category: "seo",
      priority: "high",
      title: "Missing meta description",
      description: "Without a meta description, Google generates its own snippet from page content, which is usually poor. Write a compelling 120–155 character description.",
      impact: "Custom descriptions improve search CTR by 5–10%",
    });
  }

  // OG Image
  if (!data.ogImageExists) {
    score -= 15;
    recs.push({
      id: "seo-no-og",
      category: "seo",
      priority: "high",
      title: "Missing social share image (og:image)",
      description: "When someone shares your link on X, LinkedIn, or Slack, it appears without a visual. Add an og:image to make shares stand out.",
      impact: "Links with images get 2–3x more engagement than text-only",
    });
  }

  return { score: Math.max(20, Math.min(100, score)), recommendations: recs };
}

function scoreContentPreview(data: CrawledData): { score: number; recommendations: Recommendation[] } {
  let score = 100;
  const recs: Recommendation[] = [];

  // Archive link check
  if (!data.hasArchiveLink) {
    score -= 25;
    recs.push({
      id: "cp-no-archive",
      category: "content",
      priority: "high",
      title: "No past issue archive or preview",
      description: "Readers want to preview what they're signing up for. Link to your best 2–3 past issues or embed a sample directly on the page.",
      impact: "Issue previews reduce signup anxiety and increase conversions by 10–20%",
    });
  }

  // Frequency detection
  if (data.estimatedFrequency === "Unknown") {
    score -= 15;
    recs.push({
      id: "cp-no-frequency",
      category: "content",
      priority: "medium",
      title: "Sending frequency not communicated",
      description: "Readers want to know how often they'll hear from you. Explicitly state your schedule (e.g., 'Every Tuesday & Friday morning').",
      impact: "Stating frequency sets expectations and reduces unsubscribes",
    });
  }

  // Image/visual content check
  if (data.imageCount < 2) {
    score -= 10;
    recs.push({
      id: "cp-few-images",
      category: "content",
      priority: "low",
      title: "Limited visual content on page",
      description: "Your landing page has very few images. Consider adding a newsletter preview mockup, author photo, or content samples to make it more engaging.",
      impact: "Visual pages increase time-on-page and build trust",
    });
  }

  return { score: Math.max(20, Math.min(100, score)), recommendations: recs };
}

/** Generates monetization-specific recommendations based on subscriber count and niche */
function generateMonetizationRecs(subscriberCount: number, niche: NicheKey): Recommendation[] {
  const recs: Recommendation[] = [];
  const benchmark = NICHE_BENCHMARKS[niche];

  if (subscriberCount < 1000) {
    recs.push({
      id: "mon-grow-first",
      category: "monetization",
      priority: "high",
      title: "Focus on growth before monetization",
      description: "With under 1,000 subscribers, prioritize growing your list. Most sponsors require 1,000+ to start. Focus on referral programs and cross-promotions.",
      impact: "Reaching 1,000 subs unlocks your first sponsorship deals",
    });
  } else if (subscriberCount < 5000) {
    recs.push({
      id: "mon-starter-sponsors",
      category: "monetization",
      priority: "medium",
      title: "Start with newsletter sponsorship marketplaces",
      description: `With ${subscriberCount.toLocaleString()} subscribers in ${benchmark.label}, you're ready for platforms like Sparkloop, Passionfroot, or Swapstack. Start with classified-style ads.`,
      impact: `Potential: $${Math.round((subscriberCount * benchmark.openRate / 1000) * benchmark.cpm.low)}–$${Math.round((subscriberCount * benchmark.openRate / 1000) * benchmark.cpm.mid)} per issue`,
    });
  } else {
    recs.push({
      id: "mon-direct-sponsors",
      category: "monetization",
      priority: "high",
      title: "Pursue direct sponsor partnerships",
      description: `At ${subscriberCount.toLocaleString()} subscribers, you can command premium rates by selling directly to brands in the ${benchmark.label} space. Create a media kit showcasing your open rates and audience demographics.`,
      impact: `Direct deals typically pay 2–3x more than marketplace rates`,
    });
  }

  if (subscriberCount >= 2000) {
    recs.push({
      id: "mon-paid-tier",
      category: "monetization",
      priority: "medium",
      title: "Consider a paid subscription tier",
      description: `With ${subscriberCount.toLocaleString()} subscribers, even a ${Math.round(benchmark.paidConversion.low * 100)}% conversion at $${benchmark.avgPaidPrice}/mo = $${Math.round(subscriberCount * benchmark.paidConversion.low * benchmark.avgPaidPrice).toLocaleString()}/mo in recurring revenue. Offer premium analysis, templates, or early access.`,
      impact: "Paid tiers create predictable recurring revenue",
    });
  }

  if (subscriberCount >= 500) {
    recs.push({
      id: "mon-affiliate",
      category: "monetization",
      priority: "low",
      title: "Add affiliate links to recommendations",
      description: "When you naturally recommend tools or products, use affiliate links. This monetizes your existing content without additional work.",
      impact: "Affiliate revenue grows passively as your archive expands",
    });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Main Server Action
// ---------------------------------------------------------------------------

/**
 * Audits a newsletter URL with subscriber count and niche context.
 * Crawls the landing page, scores 5 categories, calculates monetization
 * projections, and generates prioritized recommendations.
 */
export async function auditNewsletter(input: AuditInput): Promise<AuditResult> {
  try {
    if (!input.url || input.url.trim().length === 0) {
      return { success: false, error: "Please enter a valid URL." };
    }
    if (!input.subscriberCount || input.subscriberCount < 0) {
      return { success: false, error: "Please enter a valid subscriber count." };
    }

    const targetUrl = normalizeUrl(input.url);

    // --- Fetch page ---
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        next: { revalidate: 0 },
      });
    } catch {
      return {
        success: false,
        isBlocked: true,
        error: "Failed to connect to the website. This might be due to network blocking or CORS restrictions.",
      };
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 503 || response.status === 429) {
        return {
          success: false,
          isBlocked: true,
          error: `The website blocked our request (Status ${response.status}). Many major platforms use Cloudflare or similar protection.`,
        };
      }
      return {
        success: false,
        error: `Could not fetch the page. Server returned status: ${response.status}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // --- Extract crawl data ---
    const titleText = $("title").first().text().trim();
    const titleLength = titleText.length;

    const metaDesc = $('meta[name="description"]').first().attr("content");
    const ogDesc = $('meta[property="og:description"]').first().attr("content");
    const descText = (metaDesc || ogDesc || "").trim();

    const ogImageUrl = $('meta[property="og:image"]').first().attr("content") || "";
    const ogImageExists = ogImageUrl.length > 0;

    const h1Elements = $("h1");
    const h1Count = h1Elements.length;
    const h1Text = h1Count > 0 ? $(h1Elements[0]).text().trim() : "";

    const h2Elements = $("h2");
    const h2Texts: string[] = [];
    h2Elements.each((_, el) => {
      const text = $(el).text().trim();
      if (text) h2Texts.push(text);
    });

    const emailInputs = $('input[type="email"], input[placeholder*="email" i], input[name*="email" i]');
    const hasEmailInput = emailInputs.length > 0;
    const totalInputs = $("form").find("input:not([type='hidden']):not([type='submit'])").length;

    let buttonText = "";
    const submitBtn = $('button[type="submit"], input[type="submit"], form button, .button, [class*="button" i], [class*="cta" i]');
    if (submitBtn.length > 0) {
      buttonText = $(submitBtn[0]).text().trim() || $(submitBtn[0]).attr("value")?.trim() || "";
    }

    const bodyText = $("body").text();
    const socialProofKeywords = scanSocialProof(bodyText);
    const hasQuotes = $("blockquote").length > 0;
    const hasTestimonialClass = $('[class*="testimonial" i], [class*="review" i], [class*="quote" i]').length > 0;
    const hasTestimonials = hasQuotes || hasTestimonialClass;
    const hasSocialProof = socialProofKeywords.length >= 3 || hasTestimonials;

    const hasArchiveLink = detectArchiveLinks($);
    const estimatedFrequency = detectFrequency(bodyText);
    const linkCount = $("a").length;
    const imageCount = $("img").length;

    const crawledData: CrawledData = {
      titleText,
      titleLength,
      descText,
      h1Text,
      h1Count,
      h2Texts: h2Texts.slice(0, 5),
      buttonText,
      totalInputs,
      hasEmailInput,
      hasSocialProof,
      socialProofKeywords,
      ogImageExists,
      ogImageUrl,
      hasArchiveLink,
      estimatedFrequency,
      hasTestimonials,
      linkCount,
      imageCount,
    };

    // --- Score each category ---
    const lpResult = scoreLandingPage(crawledData);
    const hlResult = scoreHeadline(crawledData);
    const spResult = scoreSocialProof(crawledData);
    const seoResult = scoreSeo(crawledData);
    const cpResult = scoreContentPreview(crawledData);

    const overall = Math.round(
      lpResult.score * 0.30 +
      hlResult.score * 0.25 +
      spResult.score * 0.20 +
      seoResult.score * 0.10 +
      cpResult.score * 0.15
    );

    const scores: AuditScores = {
      landingPage: lpResult.score,
      headline: hlResult.score,
      socialProof: spResult.score,
      seo: seoResult.score,
      contentPreview: cpResult.score,
      overall,
    };

    // --- Calculate monetization ---
    const monetization = calculateMonetization(input.subscriberCount, input.niche, input.openRate);

    // --- Compile recommendations (sorted by priority) ---
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const allRecs = [
      ...lpResult.recommendations,
      ...hlResult.recommendations,
      ...spResult.recommendations,
      ...seoResult.recommendations,
      ...cpResult.recommendations,
      ...generateMonetizationRecs(input.subscriberCount, input.niche),
    ].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

    return {
      success: true,
      url: targetUrl,
      input: { subscriberCount: input.subscriberCount, niche: input.niche },
      scores,
      monetization,
      crawledData,
      recommendations: allRecs,
    };
  } catch (err: unknown) {
    console.error("Newsletter audit crash:", err);
    return {
      success: false,
      error: "An unexpected error occurred: " + (err instanceof Error ? err.message : String(err)),
    };
  }
}
