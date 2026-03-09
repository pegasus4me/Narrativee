// Grok API configuration
// Uses OpenAI SDK with xAI base URL
import OpenAI from "openai";

const grok = new OpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey: process.env.GROK_API_KEY,
});

export interface RepurposeResult {
    xPosts: XPost[];
    linkedInPosts: LinkedInPost[];
}

export interface XPost {
    hook: string;
    thread: string[];
    angle: string;
}

export interface LinkedInPost {
    content: string;
    angle: string;
}

// Sanitize JSON string to handle control characters from LLM responses
function sanitizeJSON(str: string): string {
    // Remove or escape control characters that break JSON parsing
    return str
        // Replace literal newlines inside strings with escaped newlines
        .replace(/[\x00-\x1F\x7F]/g, (char) => {
            switch (char) {
                case '\n': return '\\n';
                case '\r': return '\\r';
                case '\t': return '\\t';
                default: return '';
            }
        });
}

// Safe JSON parse with sanitization
function safeJSONParse<T>(str: string, fallback: T): T {
    try {
        return JSON.parse(str);
    } catch {
        try {
            // Try sanitizing and parsing again
            return JSON.parse(sanitizeJSON(str));
        } catch {
            console.error("Failed to parse JSON even after sanitization:", str.substring(0, 500));
            return fallback;
        }
    }
}

export async function generateRepurposedContent(
    articleTitle: string,
    articleContent: string,
    tone: string
): Promise<RepurposeResult> {
    // Generate X/Twitter threads
    const xResponse = await grok.chat.completions.create({
        model: "grok-4-1-fast-reasoning",
        messages: [
            {
                role: "system",
                content: `You are an expert social media strategist specializing in X/Twitter growth. 
Your task is to repurpose newsletter articles into engaging Twitter threads.

TONE: ${tone}

Rules:
- Create 3 different thread variations with unique hooks and angles
- Each thread should be 5-7 tweets
- First tweet must be a powerful hook that stops the scroll
- Use line breaks for readability
- Include a CTA in the final tweet linking back to the original article
- Use relevant emojis sparingly
- Each tweet must be under 280 characters
- IMPORTANT: Do NOT use literal newlines in JSON string values. Use \\n for line breaks within tweet text.

Respond in JSON format:
{
  "threads": [
    {
      "hook": "The opening hook description",
      "angle": "The unique angle of this thread",
      "tweets": ["tweet1", "tweet2", "tweet3", ...]
    }
  ]
}`
            },
            {
                role: "user",
                content: `Repurpose this article into 3 Twitter thread variations:

TITLE: ${articleTitle}

CONTENT:
${articleContent.substring(0, 10000)}`
            }
        ],
        response_format: { type: "json_object" }
    });

    // Generate LinkedIn posts
    const linkedInResponse = await grok.chat.completions.create({
        model: "grok-4-1-fast-reasoning",
        messages: [
            {
                role: "system",
                content: `You are an expert LinkedIn content strategist.
Your task is to repurpose newsletter articles into engaging LinkedIn posts.

TONE: ${tone}

Rules:
- Create 3 different post variations with unique angles
- Each post should be 150-300 words
- Start with a hook that grabs attention
- Use short paragraphs
- Include a clear CTA at the end
- Make it feel personal and authentic, not corporate
- Use 3-5 relevant hashtags at the end
- IMPORTANT: Do NOT use literal newlines in JSON string values. Use \\n for line breaks within post text.

Respond in JSON format:
{
  "posts": [
    {
      "angle": "The unique angle of this post",
      "content": "The full LinkedIn post content with \\n for line breaks"
    }
  ]
}`
            },
            {
                role: "user",
                content: `Repurpose this article into 3 LinkedIn post variations:

TITLE: ${articleTitle}

CONTENT:
${articleContent.substring(0, 10000)}`
            }
        ],
        response_format: { type: "json_object" }
    });

    // Parse responses with safe parsing
    const xRawContent = xResponse.choices[0]?.message?.content || '{"threads": []}';
    const linkedInRawContent = linkedInResponse.choices[0]?.message?.content || '{"posts": []}';

    const xData = safeJSONParse(xRawContent, { threads: [] });
    const linkedInData = safeJSONParse(linkedInRawContent, { posts: [] });

    return {
        xPosts: (xData.threads || []).map((t: any) => ({
            hook: t.hook || "Thread",
            thread: t.tweets || [],
            angle: t.angle || ""
        })),
        linkedInPosts: (linkedInData.posts || []).map((p: any) => ({
            content: (p.content || "").replace(/\\n/g, '\n'),
            angle: p.angle || ""
        }))
    };
}

export default grok;

