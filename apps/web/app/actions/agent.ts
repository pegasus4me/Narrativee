"use server";

import grok from "@/lib/grok";

interface AgentContext {
    userName?: string;
    rules: string[]; // Custom rules from Knowledge Base
    connectedSources?: {
        publicationName?: string;
        publicationUrl?: string;
        profileUrl?: string;
        bio?: string;
    };
    platformPreferences?: {
        language?: string;
        writingStyle?: string;
    }
}

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface SubstackPost {
    title: string;
    excerpt: string;
    content?: string;
    publishedAt?: string;
    url?: string;
}

// Fetch ALL posts from Substack archive page
export async function fetchSubstackPosts(publicationUrl: string, limit: number = 100): Promise<SubstackPost[]> {
    if (!publicationUrl) return [];

    const baseUrl = publicationUrl.replace(/\/$/, '');
    const posts: SubstackPost[] = [];

    try {
        // Fetch from archive page which lists all posts
        const archiveUrl = `${baseUrl}/archive?sort=new`;
        const archiveRes = await fetch(archiveUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        if (archiveRes.ok) {
            const html = await archiveRes.text();

            // Extract posts from archive HTML
            // Posts are in article elements or div with post-preview class
            // Look for post links in format /p/slug
            const postLinkMatches = html.matchAll(/href="(\/p\/[^"]+)"[^>]*>([^<]*)<|data-post-title="([^"]+)"/g);
            const seenUrls = new Set<string>();

            for (const match of postLinkMatches) {
                const urlPath = match[1];
                const title = match[2]?.trim() || match[3]?.trim();

                if (urlPath && !seenUrls.has(urlPath)) {
                    seenUrls.add(urlPath);
                    posts.push({
                        title: title || urlPath.split('/p/')[1]?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Untitled',
                        excerpt: '',
                        content: '',
                        url: `${baseUrl}${urlPath}`
                    });
                }

                if (posts.length >= limit) break;
            }

            // Also try to extract from JSON data embedded in page
            const jsonDataMatch = html.match(/<script[^>]*>window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?})\s*<\/script>/);
            if (jsonDataMatch && jsonDataMatch[1]) {
                try {
                    const data = JSON.parse(jsonDataMatch[1]);
                    if (data?.posts || data?.publicationPosts) {
                        const postsData = data.posts || data.publicationPosts || [];
                        for (const post of postsData) {
                            if (posts.length >= limit) break;
                            if (post.title && !posts.some(p => p.title === post.title)) {
                                posts.push({
                                    title: post.title,
                                    excerpt: post.subtitle || post.description || '',
                                    content: post.body_text || post.truncated_body_text || '',
                                    publishedAt: post.post_date,
                                    url: post.canonical_url || `${baseUrl}/p/${post.slug}`
                                });
                            }
                        }
                    }
                } catch (e) {
                    // JSON parsing failed, continue with what we have
                }
            }
        }

        // Now fetch RSS for content of recent posts
        const feedUrl = `${baseUrl}/feed`;
        const feedRes = await fetch(feedUrl, {
            headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });

        if (feedRes.ok) {
            const feedXml = await feedRes.text();
            const itemMatches = feedXml.matchAll(/<item>([\s\S]*?)<\/item>/g);

            for (const match of itemMatches) {
                const itemXml = match[1];
                if (!itemXml) continue;

                const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
                const title = titleMatch?.[1] || titleMatch?.[2] || '';

                const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
                const url = linkMatch?.[1] || '';

                const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
                const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);

                let content = contentMatch?.[1] || descMatch?.[1] || descMatch?.[2] || '';
                content = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

                const excerpt = content.slice(0, 500) + (content.length > 500 ? '...' : '');
                const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);

                // Update existing post or add new one
                const existingIndex = posts.findIndex(p => p.title === title || p.url === url);
                if (existingIndex >= 0) {
                    posts[existingIndex] = {
                        ...posts[existingIndex],
                        title: title || posts[existingIndex]?.title || '',
                        excerpt,
                        content: content.slice(0, 2000),
                        publishedAt: pubDateMatch?.[1]
                    };
                } else if (title && posts.length < limit) {
                    posts.push({
                        title,
                        excerpt,
                        content: content.slice(0, 2000),
                        publishedAt: pubDateMatch?.[1],
                        url
                    });
                }
            }
        }

        return posts.slice(0, limit);
    } catch (error) {
        console.error("Failed to fetch Substack posts:", error);
        return [];
    }
}

export interface ReaderFeedNote {
    date: string;       // ISO timestamp
    likes: number;
    comments: number;
    restacks: number;
    hour: number;       // 0-23
    dayOfWeek: number;  // 0=Sun … 6=Sat
}

export interface ReaderFeedResult {
    heatmap: { date: string; count: number }[];
    notes: ReaderFeedNote[];
    totalLikes: number;
    totalComments: number;
    totalRestacks: number;
}

/**
 * Resolve a Substack handle/profile URL to a numeric user ID by hitting
 * the public profile API endpoint.
 */
async function resolveSubstackUserId(handle: string): Promise<number | null> {
    try {
        const cleanHandle = handle.replace(/^@/, "").replace(/^https?:\/\/substack\.com\/@?/, "").split("/")[0]!;
        const res = await fetch(`https://substack.com/api/v1/user/${cleanHandle}/public_profile`, {
            headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        const data = await res.json() as any;
        return data?.id ?? null;
    } catch {
        return null;
    }
}

/**
 * Fetch notes from the Substack reader feed API for a given user ID.
 * Paginates through all available items. Returns raw note data for
 * heatmap, stats, and best-time-to-post calculations.
 */
export async function fetchNotesFromReaderFeed(
    substackHandleOrProfileUrl: string
): Promise<ReaderFeedResult> {
    const empty: ReaderFeedResult = { heatmap: [], notes: [], totalLikes: 0, totalComments: 0, totalRestacks: 0 };
    if (!substackHandleOrProfileUrl) return empty;

    const userId = await resolveSubstackUserId(substackHandleOrProfileUrl);
    if (!userId) return empty;

    const allNotes: ReaderFeedNote[] = [];
    let cursor: string | undefined;
    const MAX_PAGES = 20; // cap at ~20 × 25 = 500 items

    for (let page = 0; page < MAX_PAGES; page++) {
        const url = `https://substack.com/api/v1/reader/feed/profile/${userId}${cursor ? `?cursor=${cursor}` : ""}`;
        try {
            const res = await fetch(url, {
                headers: {
                    "accept": "application/json",
                    "accept-language": "en-US,en;q=0.9",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                },
                next: { revalidate: 3600 },
            });
            if (!res.ok) break;

            const data = await res.json() as any;
            const items: any[] = data?.items ?? [];
            if (items.length === 0) break;

            for (const item of items) {
                // Notes have type "comment" with context.type "note" in the feed
                const isNote =
                    item.type === "comment" &&
                    (item.context?.type === "note" || item.comment?.type === "feed");

                if (!isNote) continue;

                const timestamp: string =
                    item.comment?.date ??
                    item.context?.timestamp ??
                    "";

                if (!timestamp) continue;

                const d = new Date(timestamp);
                if (isNaN(d.getTime())) continue;

                allNotes.push({
                    date: d.toISOString().split("T")[0]!,
                    likes: item.comment?.reaction_count ?? 0,
                    comments: item.comment?.children_count ?? 0,
                    restacks: item.comment?.restacks ?? 0,
                    hour: d.getUTCHours(),
                    dayOfWeek: d.getUTCDay(),
                });
            }

            cursor = data?.nextCursor ?? data?.cursor;
            if (!cursor) break;
        } catch (e) {
            console.error("[ReaderFeed] page error:", e);
            break;
        }
    }

    // Build heatmap
    const dateCounts = new Map<string, number>();
    for (const n of allNotes) {
        dateCounts.set(n.date, (dateCounts.get(n.date) ?? 0) + 1);
    }
    const heatmap = Array.from(dateCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const totalLikes = allNotes.reduce((s, n) => s + n.likes, 0);
    const totalComments = allNotes.reduce((s, n) => s + n.comments, 0);
    const totalRestacks = allNotes.reduce((s, n) => s + n.restacks, 0);

    return { heatmap, notes: allNotes, totalLikes, totalComments, totalRestacks };
}

/**
 * @deprecated — kept for backward compat. Use fetchNotesFromReaderFeed instead.
 */
export async function fetchHeatmapFromSubstack(
    publicationUrl: string
): Promise<{ date: string; count: number }[]> {
    const result = await fetchNotesFromReaderFeed(publicationUrl);
    return result.heatmap;
}

interface BulkGenerationOptions {
    topic: string;
    quantity: number;
    tone?: string;
    scheduleStartDate?: string;
    samplePosts?: Array<{ title: string; content?: string }>;
}

interface BulkNote {
    content: string;
    suggestedTime?: string;
}

export async function generateBulkNotes(
    options: BulkGenerationOptions,
    context: AgentContext
): Promise<BulkNote[]> {
    const { topic, quantity, tone, samplePosts } = options;

    let systemPrompt = `You are ghostwriting Substack notes for a specific person. You must sound exactly like them — not a cleaned-up version, not "inspired by" them. Exactly them.`;

    if (context.connectedSources?.publicationName) {
        systemPrompt += `\n\nThey write for: "${context.connectedSources.publicationName}"`;
    }
    if (context.connectedSources?.bio) {
        systemPrompt += `\nWho they are: ${context.connectedSources.bio}`;
    }
    if (context.platformPreferences?.language) {
        systemPrompt += `\nWrite in: ${context.platformPreferences.language}`;
    }
    if (tone) {
        systemPrompt += `\nTone direction: ${tone} — blend with their natural voice, don't override it`;
    }

    if (samplePosts && samplePosts.length > 0) {
        systemPrompt += `\n\n════ THEIR ACTUAL WRITING — READ THIS CAREFULLY ════`;
        systemPrompt += `\nStudy these samples. Extract:
- Do they write short punchy sentences or longer flowing ones?
- Do they use "I", "you", or "we"?
- Do they open with a story, a bold claim, a question, or an observation?
- Do they use casual language or more formal language?
- What punctuation do they favour? (ellipses? short paragraphs? no punctuation tricks?)
- What emotions come through — raw? confident? analytical? frustrated?
- Any verbal tics or recurring phrases?`;

        samplePosts.slice(0, 10).forEach((post, i) => {
            const content = post.content?.slice(0, 1500) || '';
            if (content.length > 20) {
                systemPrompt += `\n\n--- Sample ${i + 1} ---\n${content}`;
            }
        });
        systemPrompt += `\n════ END OF THEIR WRITING ════`;
        systemPrompt += `\n\nNow write new notes that sound like THAT person wrote them — same sentence rhythm, same vocabulary level, same emotional register. Not a polished version. The real version.`;
    }

    if (context.rules && context.rules.length > 0) {
        systemPrompt += `\n\nPersonal writing rules (follow strictly):`;
        context.rules.forEach((rule, i) => {
            systemPrompt += `\n${i + 1}. ${rule}`;
        });
    }

    systemPrompt += `\n\n════ RULES ════
- 3-8 sentences per note. Real Substack note length, not a tweet, not an essay.
- Strong first line that makes someone stop scrolling
- One clear idea per note — don't try to say everything
- Line breaks between paragraphs
- Each of the ${quantity} notes must have a DIFFERENT angle (observation, hot take, tip, question, pattern, lesson)
- NO fake personal stories or invented experiences unless they appear in the samples above
- NO summary conclusions ("So remember...", "The bottom line is...")

BANNED — these instantly read as AI-generated:
- Em dashes used as separators (—)
- "game-changer", "embark", "delve", "unpack", "navigate", "landscape", "journey"
- "here's the thing", "let that sink in", "read that again", "simple as that"
- "In today's world", "It's important to note", "Let's dive in"
- "foster", "pivotal", "crucial", "realm", "testament", "thrilled to share"
- Rhetorical questions followed immediately by answering them

════ OUTPUT ════
Return ONLY a valid JSON array, no markdown, no explanation:
[{"content": "note text with \\n for line breaks", "suggestedTime": "HH:MM"}]
Vary times between 07:00-20:00.`;

    const userPrompt = `Write ${quantity} Substack notes about: ${topic}

Write as the person from the samples above. If there are no samples, write naturally and conversationally — like a real human posted this, not a content team.`;

    try {
        const response = await grok.chat.completions.create({
            model: "grok-4-1-fast-reasoning",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.85,
            max_tokens: 2500, // Explicit limit to prevent default 30k token request causing "insufficient credits"
        });

        const content = response.choices[0]?.message?.content || "[]";

        try {
            // Parse JSON from response
            const matchIndex = content.indexOf('[');
            const lastMatchIndex = content.lastIndexOf(']');
            if (matchIndex !== -1 && lastMatchIndex !== -1 && lastMatchIndex > matchIndex) {
                const jsonStr = content.substring(matchIndex, lastMatchIndex + 1);
                const parsed = JSON.parse(jsonStr);
                return parsed as BulkNote[];
            }
            return [];
        } catch (parseError) {
            console.error("JSON Parse Error. Raw content was:\n", content);
            throw parseError;
        }
    } catch (error) {
        console.error("Bulk Generation Error:", error);
        throw new Error(`Failed to generate notes: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}


export async function generateAgentResponse(
    userMessage: string,
    history: ChatMessage[],
    context: AgentContext
): Promise<string> {
    const systemPrompt = constructSystemPrompt(context);

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage }
    ];

    try {
        const response = await grok.chat.completions.create({
            model: "grok-4-1-fast-reasoning",
            // @ts-ignore
            messages: messages,
            max_tokens: 1500,
        });

        return response.choices[0]?.message?.content || "I'm having trouble thinking right now. Please try again.";
    } catch (error) {
        console.error("Agent Error:", error);
        return "Sorry, I encountered an error while processing your request.";
    }
}

export async function cleanNote(
    noteContent: string,
    context: AgentContext
): Promise<string> {
    const systemPrompt = constructNoteCleaningPrompt(context);

    try {
        const response = await grok.chat.completions.create({
            model: "grok-4-1-fast-reasoning",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Please clean up and refine this note:\n\n${noteContent}` }
            ]
        });

        return response.choices[0]?.message?.content || noteContent;
    } catch (error) {
        console.error("Note Cleaning Error:", error);
        return noteContent; // Return original if error
    }
}

export async function enhancePost(
    postContent: string,
    context: AgentContext
): Promise<string> {
    let systemPrompt = `You are editing a Substack note for a specific person. Your job is to sharpen what they wrote — not rewrite it, not make it sound smarter, not make it sound like a different person.

WHAT TO DO:
- Fix typos and obvious grammar errors
- Tighten sentences that are too wordy
- Strengthen the opening line if it's weak
- Make sure the ending lands cleanly
- Preserve every quirk, imperfection, and stylistic choice that makes it sound like THEM

WHAT NOT TO DO:
- Do NOT add em dashes (—) as stylistic separators
- Do NOT add bullet points or structure that wasn't there
- Do NOT use any of these words: "game-changer", "embark", "delve", "unpack", "navigate", "landscape", "journey", "fostering", "pivotal", "crucial", "realm", "testament", "thrilled", "excited to share"
- Do NOT start sentences with "In today's...", "It's important to...", "Let's dive in"
- Do NOT add a conclusion that summarizes what was just said
- Do NOT make it more "professional" — that usually means less human`;

    if (context.connectedSources?.bio) {
        systemPrompt += `\n\nWho this person is: ${context.connectedSources.bio}`;
    }

    if (context.platformPreferences?.writingStyle) {
        systemPrompt += `\nTheir writing style: ${context.platformPreferences.writingStyle}`;
    }

    if (context.rules && context.rules.length > 0) {
        systemPrompt += `\n\nTheir personal writing rules (follow strictly):`;
        context.rules.forEach((rule, i) => {
            systemPrompt += `\n${i + 1}. ${rule}`;
        });
    }

    systemPrompt += `\n\nReturn ONLY the edited note. No explanation, no "Here's the enhanced version:", no quotes around it.`;

    try {
        const response = await grok.chat.completions.create({
            model: "grok-4-1-fast-reasoning",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: postContent }
            ],
            temperature: 0.4,
            max_tokens: 1000,
        });

        return response.choices[0]?.message?.content?.trim() || postContent;
    } catch (error) {
        console.error("Post Enhancement Error:", error);
        return postContent;
    }
}

function constructSystemPrompt(context: AgentContext): string {
    let prompt = `You are a helpful, proactive workspace assistant`;

    if (context.userName) {
        prompt += ` for ${context.userName}`;
    }

    prompt += `.\nYour goal is to help the user with scheduling, note-taking, and organizing their thoughts.`;

    // Inject Context
    if (context.connectedSources?.publicationName) {
        prompt += `\n\nCONTEXT: The user writes for a publication called "${context.connectedSources.publicationName}".`;
    }

    if (context.platformPreferences) {
        if (context.platformPreferences.writingStyle) {
            prompt += `\nUser's preferred writing style: ${context.platformPreferences.writingStyle}.`;
        }
    }

    // Inject Rules
    if (context.rules && context.rules.length > 0) {
        prompt += `\n\nCRITICAL RULES (You must strictly follow these):`;
        context.rules.forEach((rule, index) => {
            prompt += `\n${index + 1}. ${rule}`;
        });
    }

    prompt += `\n\nBe concise, friendly, and professional. If the user asks for scheduling, acknowledge it clearly (even though you can't access their actual calendar yet, simulate the helpfulness).`;

    return prompt;
}

function constructNoteCleaningPrompt(context: AgentContext): string {
    let prompt = `You are an expert editor. Your task is to clean up, format, and refine the user's raw notes.`;

    // Inject Tone/Style
    if (context.platformPreferences?.writingStyle) {
        prompt += `\n\nStyle Guide: Maintain a ${context.platformPreferences.writingStyle} tone.`;
    }

    if (context.connectedSources?.bio) {
        prompt += `\nAuthor Context: ${context.connectedSources.bio}`;
    }

    // Inject Rules
    if (context.rules && context.rules.length > 0) {
        prompt += `\n\nApplying Custom Editor Rules:`;
        context.rules.forEach(rule => {
            prompt += `\n- ${rule}`;
        });
    }

    prompt += `\n\nInstructions:
    1. Fix grammar and spelling errors.
    2. Improve flow and clarity.
    3. Use markdown for formatting (bullet points, headers) where appropriate.
    4. Do NOT change the core meaning or facts.
    5. Return ONLY the cleaned note content, no conversational filler.`;

    return prompt;
}


