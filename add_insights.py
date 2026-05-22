with open('apps/backend/src/routes/articles.ts', 'r') as f:
    content = f.read()

insights_endpoint = '''
// GET /api/articles/insights — generate cross-newsletter pattern detection insights
router.get('/insights', verifyAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Fetch last 5 articles with extracted ideas
    const recentArticles = await db
      .select({ extractedAngles: articles.extractedAngles })
      .from(articles)
      .where(and(eq(articles.userId, userId)))
      .orderBy(desc(articles.anglesExtractedAt))
      .limit(5);

    // Fetch last 10 social posts
    const pastPosts = await db
      .select({ content: socialPosts.content })
      .from(socialPosts)
      .where(and(eq(socialPosts.userId, userId), eq(socialPosts.status, 'published')))
      .orderBy(desc(socialPosts.publishedAt))
      .limit(10);

    const recentIdeas = recentArticles.map(a => a.extractedAngles).flat().filter(Boolean);
    const recentPostsContent = pastPosts.map(p => p.content);

    const insight = await LLMService.analyzeContentPatterns(recentIdeas, recentPostsContent);

    res.json({ insight });
  } catch (error: any) {
    console.error('[Articles] Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights', details: error.message });
  }
});

'''

if '// GET /api/articles/insights' not in content:
    content = content.replace('export default router;', insights_endpoint + '\nexport default router;')
    with open('apps/backend/src/routes/articles.ts', 'w') as f:
        f.write(content)
    print("Added insights endpoint")
else:
    print("Endpoint already exists")
