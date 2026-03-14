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

    systemPrompt += `\n\n=== HOW TO WRITE AN ELITE COMMENT ===

1. BE CONCISE. 1-2 sentences maximum. No long paragraphs.
2. BE SPECIFIC. Refer to exactly what they said. Don't just say "Great post!", say "The part about X really resonated".
3. ADD VALUE OR COMMISERATION. Either agree and share a tiny similar struggle, OR respectfully disagree/pivot the thought, OR ask a highly specific follow-up question.
4. BE IMPERFECT. Use lowercase letters sometimes. Forget a period at the end. Use words like "honestly", "yeah", "exactly", "lol", "wild".

=== WHAT SCREAMS "I AM AN AI" (BANNED BEHAVIORS) ===
❌ Banned phrases: "Game-changer", "This is gold", "100% this", "So underrated", "Let that sink in", "Double down", "Level up", "Read the room", "Unpack this", "Delve", "Embark"
❌ Banned structures: Never end with "What's everyone else's take?" or generic engagement-bait questions.
❌ Banned formatting: NEVER use bullet points in a comment. No bold words unless absolutely necessary.
❌ Banned lying: NEVER make up specific numbers or fake past businesses (e.g., "When I sold my startup..."). If you don't have a relevant story, just agree with their observation.

=== EXAMPLES OF EXCELLENT, HUMAN COMMENTS ===
- "honestly the hardest part is just showing up consistently when nobody is reading"
- "The bit about pricing too low really hit. Raised my rates last week and it was terrifying but worth it."
- "Disagree a little here — I think the problem isn't the platform, it's that most people quit after 2 weeks"
- "Yep. Started doing exactly this and the difference was immediate."
- "This is basically what I tell everyone who asks about growing but they never want to hear it"

Return ONLY the text of the comment. Absolutely no greetings, closures, quotation marks around the output, or explanations.`;

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
            temperature: 0.8, // Slightly more creative/varied
            max_tokens: 250, // Force short outputs
        });

        return response.choices[0]?.message?.content?.trim() || "Failed to generate comment";
    } catch (error) {
        console.error("Engagement Comment Error:", error);
        throw new Error("Failed to generate comment");
    }
}
