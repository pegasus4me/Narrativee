import { meteredTool } from "../usage/tools";
export interface FirecrawlDocument {
  markdown?: string;
  links?: string[];
  screenshot?: string;
  branding?: unknown;
  metadata?: {
    sourceURL?: string;
    title?: string;
    description?: string;
  };
}

interface FirecrawlResponse {
  success: boolean;
  data?: FirecrawlDocument;
  error?: string;
}

export interface FirecrawlSearchResult {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
}

interface FirecrawlSearchResponse {
  success: boolean;
  data?: {
    web?: FirecrawlSearchResult[];
  };
  error?: string;
}

export class FirecrawlClient {
  constructor(private readonly apiKey: string) {}

  // Initial onboarding scrape is an operating cost, not customer credit usage.
  async scrapeInitialHomepage(url: string): Promise<FirecrawlDocument> {
    return this.scrapeHomepageInternal(url);
  }

  async scrapeHomepage(url: string): Promise<FirecrawlDocument> {
    return meteredTool("firecrawl:scrapeHomepage", () =>
      this.scrapeHomepageInternal(url),
    );
  }
  private async scrapeHomepageInternal(
    url: string,
  ): Promise<FirecrawlDocument> {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        onlyMainContent: false,
        formats: ["markdown", "links", "branding", "screenshot"],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const result = (await response.json()) as FirecrawlResponse;
    if (!response.ok || !result.success || !result.data) {
      throw new Error(
        result.error ?? `Firecrawl failed with ${response.status}`,
      );
    }

    return result.data;
  }

  async searchWeb(query: string, limit = 10): Promise<FirecrawlSearchResult[]> {
    // Fixed request contract includes at most eight returned search results.
    return meteredTool("firecrawl:searchWeb", () =>
      this.searchWebInternal(query, Math.min(limit, 8)),
    );
  }
  async searchInitialWeb(
    query: string,
    limit = 8,
  ): Promise<FirecrawlSearchResult[]> {
    return this.searchWebInternal(query, Math.min(limit, 8));
  }
  private async searchWebInternal(
    query: string,
    limit: number,
  ): Promise<FirecrawlSearchResult[]> {
    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit }),
      signal: AbortSignal.timeout(60_000),
    });

    const result = (await response.json()) as FirecrawlSearchResponse;
    if (!response.ok || !result.success) {
      throw new Error(
        result.error ?? `Firecrawl search failed with ${response.status}`,
      );
    }

    return result.data?.web ?? [];
  }
}
