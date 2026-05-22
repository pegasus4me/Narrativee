import OpenAI from 'openai';
import { db } from '../auth/auth';
import { knowledgeBase } from '../auth/schema/schema';
import { eq } from 'drizzle-orm';

// Initialize OpenAI client pointing to xAI Grok
const GROK_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

const openai = new OpenAI({
    apiKey: GROK_API_KEY || '',
    baseURL: 'https://api.x.ai/v1',
});

// Grok Model of Choice
const GROK_MODEL = 'grok-4.3';

/**
 * Service to handle xAI Grok LLM operations
 */
export class LLMService {
    /**
     * Extracts between 3 to 5 atomic ideas from long-form article content
     */
    static async extractAtomicIdeas(title: string, content: string): Promise<string[]> {
        try {
            const response = await openai.chat.completions.create({
                model: GROK_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert content strategist. Given an article, extract between 3 and 5 "atomic ideas" (angles for repurposing).
Each atomic idea must be exactly ONE of: a counterintuitive hook, a concrete stat or claim, or a single actionable line - not a summary of the whole piece and not generic filler.
Each idea is one highly polished sentence that can stand alone as the seed for a platform-native post.
NEVER use the em-dash character '—' (Unicode U+2014) in any generated text. Instead, use a standard hyphen '-', a colon, or structure the sentence cleanly without it.
Return ONLY a JSON array of strings, e.g. ["Idea 1", "Idea 2"]. No markdown fences, no commentary.`
                    },
                    {
                        role: 'user',
                        content: `Title: ${title}\n\nContent:\n${content.substring(0, 8000)}`
                    }
                ],
                temperature: 0.7,
            });

            const rawContent = response.choices[0]?.message?.content || '[]';


            // Clean LLM response to get valid JSON
            let cleanedText = rawContent.trim();
            if (cleanedText.startsWith('```json')) cleanedText = cleanedText.substring(7);
            if (cleanedText.startsWith('```')) cleanedText = cleanedText.substring(3);
            if (cleanedText.endsWith('```')) cleanedText = cleanedText.substring(0, cleanedText.length - 3);
            cleanedText = cleanedText.trim();

            // Extract the first '[' and the last ']' to isolate the JSON array
            const firstBracket = cleanedText.indexOf('[');
            const lastBracket = cleanedText.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
            }

            const parsed = JSON.parse(cleanedText);
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) =>
                    typeof item === 'string'
                        ? item.replace(/\u2014/g, '-').replace(/—/g, '-')
                        : item
                );
            }
            throw new Error('LLM response is not an array of strings');
        } catch (error: any) {
            console.error('[LLMService] Error extracting ideas:', error);
            throw new Error(`Failed to extract atomic ideas via Grok: ${error.message}`);
        }
    }

    /**
     * Generates a platform-native post draft from a selected atomic idea
     */
    static async generateSocialDraft(
        platform: string,
        atomicIdea: string,
        articleTitle: string,
        articleContent: string,
        writingStyle: string,
        userId?: string
    ): Promise<string> {
        let customHooks: string[] = [];
        let customTemplates: string[] = [];
        let bannedWords: string[] = [];
        let brandVoiceTraining = '';

        if (userId) {
            try {
                const [record] = await db
                    .select()
                    .from(knowledgeBase)
                    .where(eq(knowledgeBase.userId, userId))
                    .limit(1);

                if (record) {
                    const hooksArray = (record.customHooks || []) as { channel: string; hook: string }[];
                    customHooks = hooksArray
                        .filter(h => h.channel === platform)
                        .map(h => h.hook);

                    const templatesArray = (record.customTemplates || []) as { channel: string; template: string }[];
                    customTemplates = templatesArray
                        .filter(t => t.channel === platform)
                        .map(t => t.template);

                    bannedWords = (record.bannedWords || []) as string[];
                    brandVoiceTraining = record.brandVoiceTraining || '';
                }
            } catch (e) {
                console.error("[LLMService] Error fetching knowledge base settings:", e);
            }
        }

        // Curated, high-performing hooks and structural templates to train the LLM in-context
        const platformTraining = {
            linkedin: {
                hooks: customHooks.length > 0 ? customHooks : [
                    "Most people think [Topic] requires [Resource]. But after analyzing [Data], I realized the opposite is true.",
                    "If you're still relying on [Legacy Method] in 2026, you're falling behind. Here is the brutal truth of [New Method]:",
                    "I spent [Time] researching [Subject] so you don't have to. Here are the [Number] most critical findings:",
                    "We went from [Negative State] to [Positive State] in just [Time]. The secret wasn't [Generic Factor], it was this:"
                ],
                templates: customTemplates.length > 0 ? customTemplates : [
                    `[Counter-intuitive or Bold Hook Line]

[Engaging, narrative context paragraph explaining the story or challenge (2-3 sentences max)]

⚡ [Actionable takeaway 1 - concrete and metric-backed if possible]
💡 [Actionable takeaway 2 - counterintuitive lesson or strategic paradigm shift]
📌 [Actionable takeaway 3 - exact step-by-step blueprint or implementation tip]

[Thought-provoking closing question to drive comment engagement]`
                ]
            },
            x: {
                hooks: customHooks.length > 0 ? customHooks : [
                    "[Subject] is undergoing a silent revolution. If you don't understand this, you're leaving massive leverage on the table.",
                    "How to build/achieve [Desired Outcome] without [Common Pain Point] (in 3 simple steps):",
                    "[Legacy Approach] is dead. [Modern Approach] is the future. Here's why:",
                    "I've reviewed dozens of [Field] cases. Most of them make the same fatal mistake. Avoid this at all costs:"
                ],
                templates: customTemplates.length > 0 ? customTemplates : [
                    `[Punchy, attention-grabbing Hook Line]

[1-2 sentences of dense, high-signal value explaining the atomic idea's core lesson]

[Memorable, high-leverage one-liner that encourages retweets/bookmarks]`
                ]
            }
        };

        // Define platform native rules/guidelines
        let nativeGuidelines = '';
        if (platform === 'x' || platform === 'threads') {
            nativeGuidelines = `Format natively for X/Twitter.
Training Hook Examples to emulate:
${platformTraining.x.hooks.map(h => `- "${h}"`).join('\n')}

Required Structural Template (Strictly adhere to this layout):
${platformTraining.x.templates[0]}

Rules:
- MUST start with an extremely punchy, high-impact hook line adapting one of the styles above.
- NO hashtags, NO emojis, and NO meta-introductions.
- STRICTLY under 280 characters in total length.
- NO markdown bolding or italic formatting (never use asterisks like **bold**).
- Make it sound like a top-tier tech/business thought leader writing a high-signal tweet.`;
        } else if (platform === 'linkedin') {
            nativeGuidelines = `Format natively for LinkedIn.
Training Hook Examples to emulate:
${platformTraining.linkedin.hooks.map(h => `- "${h}"`).join('\n')}

Required Structural Template (Strictly adhere to this layout):
${platformTraining.linkedin.templates[0]}

Rules:
- Start with a compelling thought-leadership hook adapting one of the high-converting styles above to create instant intrigue.
- Followed by a double line break, then a short, highly engaging narrative/context paragraph (2-3 sentences).
- Use generous line breaks to create a vertical, easy-to-read rhythm.
- Present 3 concrete, highly actionable takeaways using the exact emojis provided in the template (⚡, 💡, 📌).
- End with a double line break, followed by an engaging question to drive comments (e.g. "What is your experience with this?").
- Do NOT use cheesy hashtags or sales pitches. Make it authentic, human, and authoritative.`;
        } else if (platform === 'instagram') {
            nativeGuidelines = `Format natively for Instagram.
Rules:
- Start with a suggested graphic slide layout description inside square brackets [e.g. [Slide 1: Hook, Slide 2: Details]].
- Follow with an engaging, hook-driven caption with clean spacing and bullet points.
- Include 3-5 relevant hashtags at the bottom.`;
        } else {
            nativeGuidelines = `Write a high-quality native post optimized for ${platform}. Use clean formatting and engaging hook.`;
        }

        // Banned words system constraint
        let bannedConstraint = '';
        if (bannedWords.length > 0) {
            bannedConstraint = `
CRITICAL CONSTRAINT (BANNED WORDS):
Under no circumstances are you allowed to use any of the following banned words or phrases:
${bannedWords.map(w => `- "${w}"`).join('\n')}
Double check your final output and ensure NONE of these prohibited words appear in the text.`;
        }

        // Custom voice training instruction
        let brandVoiceInstruction = '';
        if (brandVoiceTraining) {
            brandVoiceInstruction = `
PRIMARY WRITING VOICE AND STYLE TRAINING DATA:
"""
${brandVoiceTraining}
"""
You MUST prioritize this voice. Mimic the tone, pacing, vocabulary, and formatting of the style training data above perfectly.`;
        } else {
            brandVoiceInstruction = `
Writing style preferences: "${writingStyle}"`;
        }

        try {
            const response = await openai.chat.completions.create({
                model: GROK_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert ghostwriter and social media copywriter.
Your goal is to expand a specific "Atomic Idea" from a user's newsletter into a highly native post for a specific platform.
${brandVoiceInstruction}
${bannedConstraint}

CRITICAL: NEVER use the em-dash character '—' (Unicode U+2014) in any generated text. Instead, use a standard hyphen '-', a colon, or structure the sentence cleanly without it.

Follow these platform native rules and templates strictly:
${nativeGuidelines}

Your output MUST be ready to publish. Write ONLY the final post content. Do not include any meta-commentary, introduction, or explanations.`
                    },
                    {
                        role: 'user',
                        content: `Atomic Idea: "${atomicIdea}"\n\nArticle Context:\nTitle: ${articleTitle || 'Newsletter'}\nSnippet: ${articleContent.substring(0, 1500) || ''}`
                    }
                ],
                temperature: 0.8,
            });

            const rawDraft = response.choices[0]?.message?.content || '';
            return rawDraft.replace(/\u2014/g, '-').replace(/—/g, '-');
        } catch (error: any) {
            console.error(`[LLMService] Error generating draft for ${platform}:`, error);
            throw new Error(`Failed to generate native draft via Grok: ${error.message}`);
        }
    }

    /**
     * Generates a carousel draft with structured slides and image search keywords.
     */
    static async generateCarouselDraft(
        atomicIdea: string,
        articleTitle: string,
        articleContent: string
    ): Promise<{ text: string; imageSearchQuery: string }[]> {
        try {
            const response = await openai.chat.completions.create({
                model: GROK_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert social media carousel creator. Your job is to take an "Atomic Idea" from a newsletter and break it down into a highly engaging, native carousel.
The carousel should have between 4 to 8 slides depending on the depth of the idea.

Slide 1 MUST be a punchy, hook-driven title slide.
The middle slides should deliver concrete value, insights, or steps.
The final slide MUST be a call-to-action (e.g., "Follow for more", "Share your thoughts below").

For each slide, provide:
1. "text": The exact text to display on the slide. Keep it concise (max 20-30 words per slide for readability). NEVER use the em-dash character '—'.
2. "imageSearchQuery": A 1-2 word simple search query to fetch a relevant background image from Unsplash (e.g. "office", "mountain", "coffee", "laptop", "growth").

You MUST return ONLY a JSON array of objects, like this:
[
  { "text": "Hook text...", "imageSearchQuery": "keyword" },
  { "text": "Slide 2 text...", "imageSearchQuery": "keyword" }
]
No markdown formatting, no explanations, just the JSON array.`
                    },
                    {
                        role: 'user',
                        content: `Atomic Idea: "${atomicIdea}"\n\nArticle Context:\nTitle: ${articleTitle || 'Newsletter'}\nSnippet: ${articleContent.substring(0, 1500) || ''}`
                    }
                ],
                temperature: 0.7,
            });

            const rawDraft = response.choices[0]?.message?.content || '[]';
            
            // Clean JSON
            let cleanedText = rawDraft.trim();
            if (cleanedText.startsWith('```json')) cleanedText = cleanedText.substring(7);
            if (cleanedText.startsWith('```')) cleanedText = cleanedText.substring(3);
            if (cleanedText.endsWith('```')) cleanedText = cleanedText.substring(0, cleanedText.length - 3);
            cleanedText = cleanedText.trim();

            const parsed = JSON.parse(cleanedText);
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => ({
                    text: item.text.replace(/\u2014/g, '-').replace(/—/g, '-'),
                    imageSearchQuery: item.imageSearchQuery
                }));
            }
            throw new Error('LLM response is not a valid slide array');
        } catch (error: any) {
            console.error(`[LLMService] Error generating carousel draft:`, error);
            throw new Error(`Failed to generate carousel via Grok: ${error.message}`);
        }
    }
}
