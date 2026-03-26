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

// ===== ENGAGEMENT AUTOPILOT =====

interface EngagementCommentOptions {
    noteContent: string;
    authorName: string;
    authorHandle?: string;
    userBio?: string;
    writingStyle?: string;
    language?: string;
}

export async function generateEngagementComment(
    options: EngagementCommentOptions,
    context: AgentContext
): Promise<string> {
    const { noteContent, authorName, authorHandle, userBio, writingStyle, language } = options;

    let systemPrompt = `You are commenting on a Substack note written by another creator. 
Your goal is to write a highly authentic, native-feeling comment that sparks genuine conversation or builds a connection. 
You must sound like a real person typing quickly on their phone or laptop.`;

    if (context.connectedSources?.publicationName) {
        systemPrompt += `\n\nContext about you: You write a publication called "${context.connectedSources.publicationName}".`;
    }
    if (context.connectedSources?.bio || userBio) {
        systemPrompt += `\nYour background: ${context.connectedSources?.bio || userBio}`;
    }
    if (writingStyle || context.platformPreferences?.writingStyle) {
        systemPrompt += `\nYour writing style: ${writingStyle || context.platformPreferences?.writingStyle}`;
    }

    systemPrompt += `\n\nRULES:
1. 1-2 sentences max. Never write a paragraph.
2. Reference something specific they actually said. No generic praise.
3. Either: relate with a small personal observation, push back lightly, or ask one sharp follow-up question.
4. Sound like a real person typing casually. Lowercase is fine. Imperfect punctuation is fine.
5. No em dashes (—). Use a comma or just end the sentence instead.
6. No hyphens used as separators or list markers.

BANNED:
- Em dash (—) anywhere
- "game-changer", "this is gold", "so underrated", "let that sink in", "level up", "unpack", "delve", "embark", "resonate", "100% this"
- Ending with "what do you think?" or any generic question to the room
- Bullet points, bold text, any markdown formatting
- Made-up stats or fake personal stories

GOOD EXAMPLES:
"honestly the hardest part is just showing up when nobody is reading yet"
"the pricing thing hit. raised my rates last month and it was uncomfortable but worth it"
"disagree a little, i think most people quit after 2 weeks not because of the platform but because they expected faster results"
"yep. did exactly this and the difference was immediate"
"this is what i tell everyone who asks but they never want to hear it"

Return ONLY the comment text. No quotes around it, no explanation, nothing else.`;

    if (language || context.platformPreferences?.language) {
        systemPrompt += `\n\nWrite in: ${language || context.platformPreferences?.language}`;
    }

    const userPrompt = `Leave a natural, authentic comment on this note by ${authorName}${authorHandle ? ` (@${authorHandle})` : ''}:

"${noteContent}"`;

    try {
        const response = await grok.chat.completions.create({
            model: "grok-4-1-fast-reasoning",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        const raw = response.choices[0]?.message?.content?.trim() || "";
        // Strip leading - or " that sometimes leaks from the model
        return raw.replace(/^[-–—"'\s]+/, "").replace(/['"]+$/, "") || "Failed to generate comment";
    } catch (error) {
        console.error("Engagement Comment Error:", error);
        throw new Error("Failed to generate comment");
    }
}
