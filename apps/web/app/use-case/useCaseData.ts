export interface UseCaseItem {
  slug: string;
  title: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  introText: string;
  sourcePlatform: string;
  targetPlatform: string;
  steps: readonly {
    title: string;
    description: string;
  }[];
  faqs: readonly {
    question: string;
    answer: string;
  }[];
}

export const useCaseData: Record<string, UseCaseItem> = {
  "substack-to-linkedin": {
    slug: "substack-to-linkedin",
    title: "How to Repurpose Substack to LinkedIn Automatically",
    metaDescription: "Learn how to turn Substack newsletter issues into high-engagement, native LinkedIn posts automatically while keeping your unique writing voice.",
    heading: "Substack to LinkedIn Repurposing & Automation",
    subheading: "Stop copy-pasting. Translate Substack issues into native, value-packed LinkedIn posts automatically.",
    introText: "Growing a professional brand on LinkedIn is the best way to get new Substack subscribers. But manual rewriting is exhausting. Narrativee syncs directly with your Substack RSS feed, analyzes your content, and drafts professional, platform-native LinkedIn posts tailored to your personal writing style.",
    sourcePlatform: "Substack",
    targetPlatform: "LinkedIn",
    steps: [
      {
        title: "Connect Your Substack Feed",
        description: "Paste your Substack publication URL into your Narrativee dashboard. Narrativee automatically detects your feed and synchronizes previous issues."
      },
      {
        title: "Train Your Voice Memory",
        description: "Narrativee reads your past newsletter articles to map your unique vocabulary, tone, and formatting preference. This ensures generated LinkedIn drafts sound exactly like you."
      },
      {
        title: "Select Repurposing Angles",
        description: "Choose from multiple social formats. Narrativee can extract step-by-step takeaways, controversial hooks, or case-study summaries from a single article."
      },
      {
        title: "Approve and Schedule",
        description: "Review your auto-generated LinkedIn drafts on our visual calendar. Click schedule, and Narrativee pushes them to your LinkedIn profile automatically."
      }
    ],
    faqs: [
      {
        question: "Can I schedule Substack posts to LinkedIn directly?",
        answer: "Yes, Narrativee automates this entire pipeline. When you publish a new issue on Substack, Narrativee imports it, drafts custom LinkedIn posts, and schedules them according to your custom calendar."
      },
      {
        question: "Does the output sound like robotic AI?",
        answer: "No. Standard tools write generic AI text. Narrativee uses a custom Voice Memory matrix that clones your vocabulary, sentence length frequency, and formatting style to maintain professional credibility."
      },
      {
        question: "Is there a limit to how many Substack feeds I can sync?",
        answer: "Free tier accounts can connect one newsletter source. Premium subscriptions support multiple feeds for agencies and writers managing multiple publications."
      }
    ]
  },
  "substack-to-twitter": {
    slug: "substack-to-twitter",
    title: "Turn Substack Newsletters into Twitter Threads Automatically",
    metaDescription: "Convert Substack newsletter issues into punchy, native X (Twitter) threads. Retain your voice, hooks, and CTA links without manual formatting.",
    heading: "Substack to X / Twitter Thread Automations",
    subheading: "Decompose long-form newsletters into viral X threads in under 2 minutes.",
    introText: "X (Twitter) is the prime engine for discovery, but long-form text doesn't perform well as a single block. Narrativee breaks down your Substack articles, extracts sharp hooks, and formats them into clean, numbered X threads with automatic newsletter subscription CTAs.",
    sourcePlatform: "Substack",
    targetPlatform: "X (Twitter)",
    steps: [
      {
        title: "Input Substack URL",
        description: "Paste your Substack publication link to automatically sync your content library."
      },
      {
        title: "Generate Thread Drafts",
        description: "Narrativee decomposes the article into consecutive, readable tweets, adhering strictly to the 280-character limit and spacing rules."
      },
      {
        title: "Add Engagement Plugs",
        description: "Configure automatic calls-to-action that hook your newsletter subscription link to the end of the thread when it starts getting impressions."
      },
      {
        title: "Automate Publishing",
        description: "Review the full visual preview on your dashboard and queue the thread to publish natively on X."
      }
    ],
    faqs: [
      {
        question: "How does Narrativee stay within the X character limits?",
        answer: "Narrativee's rendering engine checks character boundaries and automatically splits long paragraphs into distinct, coherent thread segments, complete with line breaks."
      },
      {
        question: "Can I schedule Substack Notes as well?",
        answer: "Yes! Narrativee includes a specialized Substack Notes scheduler extension, allowing you to cross-promote threads across both networks seamlessly."
      }
    ]
  },
  "beehiiv-to-linkedin": {
    slug: "beehiiv-to-linkedin",
    title: "Repurpose beehiiv Newsletters to LinkedIn Automatically",
    metaDescription: "Connect your beehiiv newsletter feed and auto-draft professional LinkedIn posts. The premium tool to clone your voice and scale subscribers.",
    heading: "beehiiv to LinkedIn Automated Repurposing",
    subheading: "Connect your beehiiv RSS feed and auto-draft professional LinkedIn posts matching your voice.",
    introText: "beehiiv is exceptional for newsletter growth, but writing social distribution content still takes hours. Narrativee integrates with your beehiiv feed to automatically convert each newsletter launch into structured LinkedIn posts, maximizing your referral traffic.",
    sourcePlatform: "beehiiv",
    targetPlatform: "LinkedIn",
    steps: [
      {
        title: "Obtain your beehiiv RSS Link",
        description: "Copy your public beehiiv RSS feed URL from your publication settings."
      },
      {
        title: "Link beehiiv to Narrativee",
        description: "Paste the RSS link under the Channels section of your Narrativee workspace."
      },
      {
        title: "Verify Voice Style",
        description: "Choose your LinkedIn channel profile to apply specific professional structures and style matrices."
      },
      {
        title: "Approve and Queue",
        description: "Approve and queue generated LinkedIn drafts directly from your editorial calendar dashboard."
      }
    ],
    faqs: [
      {
        question: "Does Narrativee import beehiiv posts in real-time?",
        answer: "Yes, Narrativee regularly polls your RSS feed. Within minutes of a new publication, your custom social drafts will be ready for review."
      },
      {
        question: "Can I customize the LinkedIn post structure?",
        answer: "Yes. You can select different angles, adjust formatting presets (emoji density, paragraph structure), and edit the text directly before scheduling."
      }
    ]
  },
  "rss-to-linkedin": {
    slug: "rss-to-linkedin",
    title: "Automate RSS Feed to LinkedIn Posts | Narrativee",
    metaDescription: "Sync WordPress, Ghost, Medium, or custom RSS feeds to auto-generate professional LinkedIn posts. Expand your reach automatically.",
    heading: "RSS Feed to LinkedIn Automation Tool",
    subheading: "Sync WordPress, Medium, Ghost, or any custom RSS feed to generate professional LinkedIn drafts.",
    introText: "Blogging on WordPress, Ghost, or Medium is great for SEO, but you need social loops to drive initial readers. Narrativee connects to any standard RSS feed, extracting headers, case studies, and insights to create native LinkedIn content workflows.",
    sourcePlatform: "Any RSS Feed",
    targetPlatform: "LinkedIn",
    steps: [
      {
        title: "Add Custom RSS URL",
        description: "Provide the public RSS feed URL of your blog, WordPress site, Ghost publication, or Medium page."
      },
      {
        title: "Analyze Page Context",
        description: "Narrativee crawls the blog post to capture complete context and filter out header navigation/ads."
      },
      {
        title: "Format LinkedIn Drafts",
        description: "Select from professional takeaways, listicles, or story frameworks to translate the post into LinkedIn format."
      },
      {
        title: "Publish or Queue",
        description: "Schedule posts via the Narrativee calendar or copy and paste them straight into LinkedIn."
      }
    ],
    faqs: [
      {
        question: "Does this support WordPress or Ghost?",
        answer: "Yes! Narrativee supports any standard XML/RSS feed generated by WordPress, Ghost, Medium, beehiiv, or custom-built blogs."
      },
      {
        question: "Will it copy the entire blog post?",
        answer: "No. Narrativee decomposes the post, extracting the most engaging elements, statistics, and arguments to rewrite it into a short-form social media asset."
      }
    ]
  },
  "newsletter-to-linkedin": {
    slug: "newsletter-to-linkedin",
    title: "Repurpose Newsletters to LinkedIn Automatically | Narrativee",
    metaDescription: "Turn email newsletters into structured LinkedIn posts. Maintain your credibility, expand your audience, and automate your workflow.",
    heading: "Newsletter to LinkedIn Content Compiler",
    subheading: "The ultimate workflow engine to turn email newsletters into structured LinkedIn posts.",
    introText: "Writers invest immense effort into weekly newsletters. Don't let your best insights get locked in email databases. Narrativee translates your newsletter content into platform-native, high-value LinkedIn updates that drive organic subscribers back to your newsletter.",
    sourcePlatform: "Newsletters",
    targetPlatform: "LinkedIn",
    steps: [
      {
        title: "Connect Newsletter URL",
        description: "Add your newsletter archive link or RSS path to feed your articles into Narrativee."
      },
      {
        title: "Map Your Writer Profile",
        description: "Apply your voice model so the output mirrors the exact sentence structure and vocabulary you use in your writing."
      },
      {
        title: "Extract Multiple Post Angles",
        description: "Generate different styles of LinkedIn updates: a contrarian hook, a structured listicle, or a short summary."
      },
      {
        title: "Publish Natively",
        description: "Deploy the scheduled posts to LinkedIn via our automated calendar, ensuring consistent weekly publishing."
      }
    ],
    faqs: [
      {
        question: "What is the benefit of newsletter repurposing?",
        answer: "LinkedIn has an organic algorithm that favors high-value text content. By repurposing your newsletters, you can grow a professional audience without having to create brand new content from scratch."
      },
      {
        question: "Do I need to rewrite the AI suggestions?",
        answer: "Our users rarely rewrite. Because Narrativee analyzes your actual past work to construct a personalized style guide, the output fits your natural tone right out of the box."
      }
    ]
  }
};
