/**
 * Pure client-side backend mock interceptor.
 * Intercepts window.fetch requests in demo mode and resolves them with rich, premium mock data.
 */
export function setupMockFetch() {
  if (typeof window === "undefined") return;

  // Save the original fetch
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    // Only intercept if demo mode is explicitly enabled in localStorage
    const isDemoMode = localStorage.getItem("is_demo_mode") === "true";
    if (!isDemoMode) {
      return originalFetch(input, init);
    }

    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    console.log(`[MockFetch] Intercepted Request: ${url}`, init);

    const makeResponse = (data: any, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    };

    // 1. Session / Auth
    if (url.includes("/api/auth/get-session") || url.includes("/api/auth/session")) {
      return makeResponse({
        user: {
          id: "demo-user-id",
          name: "Demo User",
          email: "demo@narrativee.com",
          emailVerified: true,
          image: "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          plan: "premium",
          tokens: 40,
          onboarded: true
        },
        session: {
          id: "demo-session-id",
          token: "demo-session-token",
          userId: "demo-user-id",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }

    // 2. User Credits
    if (url.includes("/api/user/credits")) {
      return makeResponse({
        success: true,
        credits: 40,
        plan: "premium"
      });
    }

    // 3. Linked Channels
    if (url.includes("/api/channels")) {
      // Return single mock connected X account
      return makeResponse({
        channels: [
          {
            id: "mock-channel-id",
            platform: "x",
            providerAccountId: "mock-x-id",
            accountName: "@demo_repurposer",
            avatarUrl: "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg",
            createdAt: new Date().toISOString()
          }
        ]
      });
    }

    // 4. Content Sources
    if (url.includes("/api/sources")) {
      return makeResponse({
        sources: [
          {
            id: "mock-source-id",
            platform: "substack",
            url: "https://demo.substack.com/feed",
            avatarUrl: "https://substackcdn.com/mock-avatar",
            lastSyncedAt: new Date().toISOString()
          }
        ]
      });
    }
    // 4.5 Drafts & Queue Endpoints
    if (url.includes("/api/articles/drafts/queue")) {
      return makeResponse([
        {
          id: "mock-draft-id-1",
          status: "scheduled",
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          channel: {
            platform: "x",
            accountName: "@demo_repurposer",
            avatarUrl: "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg",
            isConnected: true
          },
          content: {
            text: "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates.\n\nThey copy, paste, and sound like robots.\n\nIf you want to win, you need platform-native formatting and raw personality."
          },
          articleId: "mock-article-1",
          articleTitle: "How to scale content without losing your authentic voice"
        }
      ]);
    }

    if (url.includes("/api/articles/drafts/latest")) {
      return makeResponse({
        article: {
          id: "mock-article-1",
          title: "How to scale content without losing your authentic voice",
          createdAt: new Date().toISOString()
        },
        drafts: [
          {
            id: "mock-draft-id-1",
            status: "draft",
            channel: {
              platform: "x",
              accountName: "@demo_repurposer",
              avatarUrl: "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg",
              isConnected: true
            },
            content: {
              text: "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates.\n\nThey copy, paste, and sound like robots.\n\nIf you want to win, you need platform-native formatting and raw personality."
            },
            articleId: "mock-article-1",
            articleTitle: "How to scale content without losing your authentic voice"
          }
        ]
      });
    }

    if (url.includes("/api/articles/drafts/active")) {
      return makeResponse([
        {
          id: "mock-draft-id-1",
          status: "draft",
          channel: {
            platform: "x",
            accountName: "@demo_repurposer",
            avatarUrl: "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-haircut_23-2149436180.jpg",
            isConnected: true
          },
          content: {
            text: "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates.\n\nThey copy, paste, and sound like robots.\n\nIf you want to win, you need platform-native formatting and raw personality."
          },
          articleId: "mock-article-1",
          articleTitle: "How to scale content without losing your authentic voice"
        }
      ]);
    }

    if (url.includes("/api/articles/drafts")) {
      return makeResponse({ success: true });
    }

    // 5. Articles Detail
    if (url.match(/\/api\/articles\/[a-zA-Z0-9-]{10,}/) && !url.includes("/ideas")) {
      return makeResponse({
        id: "mock-article-1",
        title: "How to scale content without losing your authentic voice",
        content: "<p>Content scaling is the dream of every creator, but most fail because they sound like a generic robot. In this article, we cover the exact frameworks to multiply your output by 10x while maintaining your exact brand voice and tone.</p><p>We will delve into why platform-specific formatting is vital and show how to extract the maximum engagement leverage from each angle.</p>",
        url: "https://demo.substack.com/p/how-to-scale-content",
        publishedAt: new Date().toISOString(),
        extractedAngles: [
          "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates.",
          "Contrarian Take: Stop trying to publish everywhere. Master one channel first.",
          "The Hidden Mistake: Copy-pasting the exact same content to X and LinkedIn.",
          "The Framework: The 3-step 'Voice Mirroring' blueprint.",
          "The Stat: Creators using platform-native formatting see 4.2x higher conversion.",
          "The Paradox: The less generic advice you give, the more viral you go.",
          "The Story: How we turned one newsletter into 24 custom social drafts.",
          "The Checklist: Hook, readability, formatting, and call-to-action."
        ]
      });
    }

    // 6. Extraction Ideas (POST /articles/:id/ideas)
    if (url.includes("/ideas")) {
      return makeResponse({
        ideas: [
          "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates.",
          "Contrarian Take: Stop trying to publish everywhere. Master one channel first.",
          "The Hidden Mistake: Copy-pasting the exact same content to X and LinkedIn.",
          "The Framework: The 3-step 'Voice Mirroring' blueprint.",
          "The Stat: Creators using platform-native formatting see 4.2x higher conversion.",
          "The Paradox: The less generic advice you give, the more viral you go.",
          "The Story: How we turned one newsletter into 24 custom social drafts.",
          "The Checklist: Hook, readability, formatting, and call-to-action."
        ],
        cached: false
      });
    }

    // 7. Articles List
    if (url.includes("/api/articles")) {
      return makeResponse({
        articles: [
          {
            id: "mock-article-1",
            title: "How to scale content without losing your authentic voice",
            content: "Content scaling is the dream of every creator...",
            url: "https://demo.substack.com/p/how-to-scale-content",
            publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            extractedAngles: [
              "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates.",
              "Contrarian Take: Stop trying to publish everywhere. Master one channel first.",
              "The Hidden Mistake: Copy-pasting the exact same content to X and LinkedIn.",
              "The Framework: The 3-step 'Voice Mirroring' blueprint.",
              "The Stat: Creators using platform-native formatting see 4.2x higher conversion.",
              "The Paradox: The less generic advice you give, the more viral you go.",
              "The Story: How we turned one newsletter into 24 custom social drafts.",
              "The Checklist: Hook, readability, formatting, and call-to-action."
            ]
          },
          {
            id: "mock-article-2",
            title: "Why newsletters are the ultimate high-leverage content source",
            content: "Newsletters build deep relationships...",
            url: "https://demo.substack.com/p/ultimate-high-leverage",
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            extractedAngles: []
          }
        ]
      });
    }

    // 8. Creation Sessions
    if (url.includes("/api/creation-sessions")) {
      return makeResponse({
        creationSessions: [
          {
            id: "mock-creation-session-id",
            userId: "demo-user-id",
            sourceId: "mock-source-id",
            articleId: "mock-article-1",
            selectedAngles: [
              "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates."
            ],
            selectedChannelIds: [
              "mock-channel-id"
            ],
            drafts: [
              {
                id: "mock-draft-id-1",
                channelId: "mock-channel-id",
                platform: "x",
                content: "Uncomfortable Truth: 90% of content creators sound like generic ChatGPT templates.\n\nThey copy, paste, and sound like robots.\n\nIf you want to win, you need platform-native formatting and raw personality.",
                status: "draft"
              }
            ],
            status: "ready",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      });
    }

    // 9. Knowledge Base
    if (url.includes("/api/knowledge-base")) {
      return makeResponse({
        knowledgeBase: {
          customHooks: [],
          customTemplates: [],
          bannedWords: ["leverage", "delve", "testament"],
          brandVoiceTraining: "Keep it punchy, conversational, and direct."
        }
      });
    }

    // 10. Default / Fallback
    return makeResponse({ success: true });
  };
}
