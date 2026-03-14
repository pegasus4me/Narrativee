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

    let systemPrompt = `You are a ghostwriter who has deeply studied a specific author's voice. Your job is to write Substack notes that are INDISTINGUISHABLE from what this author would actually post.`;

    // Add user context
    if (context.connectedSources?.publicationName) {
        systemPrompt += `\n\nThe author writes for "${context.connectedSources.publicationName}".`;
    }
    if (context.connectedSources?.bio) {
        systemPrompt += `\nAuthor bio: ${context.connectedSources.bio}`;
    }

    // Add sample posts for voice training - use more samples with more content
    if (samplePosts && samplePosts.length > 0) {
        systemPrompt += `\n\n=== AUTHOR'S ACTUAL WRITING (study this DEEPLY) ===`;
        systemPrompt += `\nBefore writing anything, analyze these samples for:`;
        systemPrompt += `\n- Sentence length and rhythm (short punchy? long flowing? mixed?)`;
        systemPrompt += `\n- Vocabulary level (simple everyday words? intellectual? industry jargon?)`;
        systemPrompt += `\n- How they open (question? bold claim? story? observation?)`;
        systemPrompt += `\n- How they close (call to action? open question? mic drop? reflection?)`;
        systemPrompt += `\n- Emotional register (raw/vulnerable? confident? analytical? passionate?)`;
        systemPrompt += `\n- Use of line breaks, paragraphs, formatting`;
        systemPrompt += `\n- Recurring phrases or verbal tics`;
        systemPrompt += `\n- Whether they use "I" vs "you" vs "we"`;

        samplePosts.slice(0, 10).forEach((post, i) => {
            const content = post.content?.slice(0, 1500) || '';
            if (content.length > 20) {
                systemPrompt += `\n\n--- Sample ${i + 1} ---\n${content}`;
            }
        });
        systemPrompt += `\n\n=== END OF AUTHOR'S WRITING ===`;

        systemPrompt += `\n\nCRITICAL: You must write AS this person. Not "inspired by" them. Not "in a similar style." 
You must sound EXACTLY like them. Copy their sentence patterns, their word choices, their rhythm.
If they write short declarative sentences, you write short declarative sentences.
If they use em dashes and ellipses, you use em dashes and ellipses.
If they share personal stories, you share personal stories.
If they use metaphors, use similar types of metaphors.
DO NOT sanitize or genericize their voice. Keep it raw and real.`;
    }

    // Add tone guidance
    if (tone) {
        systemPrompt += `\n\nAdditional tone direction: ${tone} (blend this with the author's natural voice, don't override it)`;
    }

    // Add custom rules
    if (context.rules && context.rules.length > 0) {
        systemPrompt += `\n\nCustom writing rules to follow:`;
        context.rules.forEach((rule, i) => {
            systemPrompt += `\n${i + 1}. ${rule}`;
        });
    }

    // Add language preference
    if (context.platformPreferences?.language) {
        systemPrompt += `\n\nWrite in: ${context.platformPreferences.language}`;
    }

    systemPrompt += `\n\n=== OUTPUT FORMAT ===
Generate exactly ${quantity} Substack notes about the topic below.

Each note must:
- Be 3-8 sentences long (like a real Substack note, not a tweet)
- Have a strong opening hook that stops the scroll
- Develop one clear idea or insight
- Feel like something the author would actually post
- Use line breaks between paragraphs for readability
- NOT sound like AI wrote it (no "In today's world...", no "It's important to note...", no "Let's dive in...")
- NOT be generic motivation poster quotes
- Have genuine depth — share a specific insight, observation, story, or contrarian take
- ABSOLUTELY NO FAKE HISTORIES: Do NOT invent fake personal stories, fake past businesses, or pretend you experienced something you didn't. Stick STRICTLY to the user's prompt and facts. If they ask for tips, give tips. Do not preface it with "When I built my startup..." unless that story is explicitly in the author samples.

BANNED phrases (these scream AI):
"game-changer", "embark", "delve", "unpack", "navigate", "landscape", "journey", "here's the thing", "let that sink in", "read that again", "simple as that"

Each note angle should be DIFFERENT — use varied hooks:
- A personal observation or story
- A contrarian take or hot take 
- A practical tip with specifics
- A question that makes people think
- A pattern or trend you've noticed
- A mistake or lesson learned

Return ONLY a valid JSON array: [{"content": "note text here with \\n for line breaks", "suggestedTime": "HH:MM"}]
Vary times between 07:00-20:00. No markdown, no explanation, just the JSON array.`;

    const userPrompt = `Write ${quantity} Substack notes about: ${topic}

Remember: Write AS the author from the samples. Match their EXACT voice, not a polished version of it.`;

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
    let systemPrompt = `You are an expert social media editor. Your task is to enhance the user's post by:
1. Fixing any typos and grammatical errors
2. Improving clarity and impact
3. Making it more engaging and punchy
4. Keeping the same voice and meaning`;

    // Inject Tone/Style
    if (context.platformPreferences?.writingStyle) {
        systemPrompt += `\n\nStyle Guide: Maintain a ${context.platformPreferences.writingStyle} tone.`;
    }

    if (context.connectedSources?.bio) {
        systemPrompt += `\nAuthor Context: ${context.connectedSources.bio}`;
    }

    // Inject Rules
    if (context.rules && context.rules.length > 0) {
        systemPrompt += `\n\nCustom writing rules to follow:`;
        context.rules.forEach((rule, i) => {
            systemPrompt += `\n${i + 1}. ${rule}`;
        });
    }

    systemPrompt += `\n\nIMPORTANT: Return ONLY the enhanced post text, nothing else. No quotes, no explanations.`;

    try {
        const response = await grok.chat.completions.create({
            model: "grok-4-1-fast-reasoning",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: postContent }
            ]
        });

        return response.choices[0]?.message?.content?.trim() || postContent;
    } catch (error) {
        console.error("Post Enhancement Error:", error);
        return postContent; // Return original if error
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


