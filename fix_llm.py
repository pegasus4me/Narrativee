import re
with open('apps/backend/src/services/llm.ts', 'r') as f:
    content = f.read()

# Update extractAtomicIdeas signature and prompt
old_sig = 'static async extractAtomicIdeas(title: string, content: string): Promise<string[]> {'
new_sig = '''static async extractAtomicIdeas(title: string, content: string, currentContentGoal?: string, brandVoiceTraining?: string, contentTopics?: string[]): Promise<any[]> {'''
content = content.replace(old_sig, new_sig)

old_prompt = '''You are an expert content strategist. Given an article, extract between 3 and 5 "atomic ideas" (angles for repurposing).
Each atomic idea must be exactly ONE of: a counterintuitive hook, a concrete stat or claim, or a single actionable line - not a summary of the whole piece and not generic filler.
Each idea is one highly polished sentence that can stand alone as the seed for a platform-native post.
NEVER use the em-dash character '—' (Unicode U+2014) in any generated text. Instead, use a standard hyphen '-', a colon, or structure the sentence cleanly without it.
Return ONLY a JSON array of strings, e.g. ["Idea 1", "Idea 2"]. No markdown fences, no commentary.'''

new_prompt = '''You are an expert content strategist and personal brand builder. Given an article, extract 8 to 12 "atomic ideas" for repurposing.
Each atomic idea must be exactly ONE of: a counterintuitive hook, a concrete stat or claim, or a single actionable line - not a summary of the whole piece and not generic filler.
Each idea is one highly polished sentence that can stand alone as the seed for a platform-native post.

You must personalize these ideas based on the user's profile:
- Current Content Goal: ${currentContentGoal || 'General audience growth'}
- Brand Voice/Tone: ${brandVoiceTraining || 'Professional and insightful'}
- Key Topics: ${contentTopics ? contentTopics.join(', ') : 'Various'}

Rank and filter the extracted ideas to best serve the user's current content goal.
NEVER use the em-dash character '—' (Unicode U+2014) in any generated text.

Return ONLY a JSON array of objects with the exact structure:
[
  {
    "idea": "The core atomic idea (one punchy sentence)",
    "whyInteresting": "A short explanation of why this idea is compelling or contrarian",
    "targetAudience": "Who this is for (e.g., 'Founders', 'Devs', 'Marketers')"
  }
]
No markdown fences, no commentary.'''

content = content.replace(old_prompt, new_prompt)

# Update return mapping
old_map = '''            if (Array.isArray(parsed)) {
                return parsed.map((item: any) =>
                    typeof item === 'string'
                        ? item.replace(/\\u2014/g, '-').replace(/—/g, '-')
                        : item
                );
            }
            throw new Error('LLM response is not an array of strings');'''

new_map = '''            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => ({
                    idea: typeof item.idea === 'string' ? item.idea.replace(/\\u2014/g, '-').replace(/—/g, '-') : item.idea,
                    whyInteresting: item.whyInteresting,
                    targetAudience: item.targetAudience
                }));
            }
            throw new Error('LLM response is not a valid JSON array');'''

content = content.replace(old_map, new_map)

# Add analyzeContentPatterns method
pattern_method = '''
    /**
     * Analyzes past generated content to find patterns and gaps
     */
    static async analyzeContentPatterns(recentIdeas: any[], pastPosts: any[]): Promise<string | null> {
        if (recentIdeas.length === 0 && pastPosts.length === 0) return null;
        
        try {
            const response = await openai.chat.completions.create({
                model: GROK_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert content strategist analyzing a creator's content patterns.
Given their recently extracted newsletter ideas and their past social posts, identify one major pattern, recurring theme, or glaring content gap.
Return a SINGLE short sentence insight. Example: "You've never posted about AI regulation, but 3 newsletters you read this month touched on it — this seems like a gap in your content."
Return ONLY the text string. No quotes, no markdown.`
                    },
                    {
                        role: 'user',
                        content: `Recent Ideas:\\n${JSON.stringify(recentIdeas).substring(0, 4000)}\\n\\nPast Posts:\\n${JSON.stringify(pastPosts).substring(0, 4000)}`
                    }
                ],
                temperature: 0.5,
            });

            return response.choices[0]?.message?.content?.trim() || null;
        } catch (error) {
            console.error('[LLMService] Error analyzing patterns:', error);
            return null;
        }
    }
'''

content = content.replace('    static async generateSocialDraft', pattern_method + '\n    static async generateSocialDraft')

with open('apps/backend/src/services/llm.ts', 'w') as f:
    f.write(content)

print("Updated llm.ts")
