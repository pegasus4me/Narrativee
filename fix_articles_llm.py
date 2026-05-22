import re

with open('apps/backend/src/routes/articles.ts', 'r') as f:
    content = f.read()

# 1. Add currentContentGoal parsing
content = content.replace('const force = req.body?.force === true;', 'const force = req.body?.force === true;\n    const contentGoal = req.body?.contentGoal;')

# 2. Update asStringArray to handle our new JSON structure gracefully
as_string_array_old = '''function asStringArray(val: unknown): string[] | null {
  if (Array.isArray(val)) {
    const valid = val.filter((v) => typeof v === 'string') as string[];
    return valid.length > 0 ? valid : null;
  }
  return null;
}'''
as_string_array_new = '''function asStringArray(val: unknown): any[] | null {
  if (Array.isArray(val)) {
    return val.length > 0 ? val : null;
  }
  return null;
}'''
content = content.replace(as_string_array_old, as_string_array_new)

# 3. Fetch user knowledge base for LLM
old_llm_call = '''    const ideas = await LLMService.extractAtomicIdeas(row.title, row.content);'''
new_llm_call = '''    // Fetch user preferences for extraction
    const [kb] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.userId, userId)).limit(1);
    const [uPrefs] = await db.select({ topics: user.contentTopics, currentContentGoal: user.currentContentGoal }).from(user).where(eq(user.id, userId)).limit(1);
    
    // Save the new goal if provided
    if (contentGoal && contentGoal !== uPrefs?.currentContentGoal) {
      await db.update(user).set({ currentContentGoal: contentGoal }).where(eq(user.id, userId));
    }

    const activeGoal = contentGoal || uPrefs?.currentContentGoal || undefined;
    const activeTopics = (uPrefs?.topics as string[]) || undefined;

    const ideas = await LLMService.extractAtomicIdeas(
      row.title, 
      row.content,
      activeGoal,
      kb?.brandVoiceTraining || undefined,
      activeTopics
    );'''
content = content.replace(old_llm_call, new_llm_call)

# Add knowledgeBase import if missing
if 'knowledgeBase' not in content[:content.find('router.get(')]:
    content = content.replace('import { articles, user, contentSources, channels, socialPosts', 'import { articles, user, contentSources, channels, socialPosts, knowledgeBase')

with open('apps/backend/src/routes/articles.ts', 'w') as f:
    f.write(content)

print("Fixed articles.ts")
