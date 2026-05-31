import { Router } from 'express';
import { db } from '../auth/auth';
import { contentSources, articles } from '../auth/schema/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import Parser from 'rss-parser';
import { posthog } from '../lib/posthog';

const router = Router();
const parser = new Parser();

function decodeHtmlEntities(str: string): string {
    if (!str) return '';
    return str
        .replace(/&#8217;|&#39;|&rsquo;|&apos;/g, "'")
        .replace(/&#8216;|&lsquo;/g, "'")
        .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
}

// GET /api/sources - List connected content sources
router.get('/', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const sources = await db.select().from(contentSources).where(eq(contentSources.userId, userId));
        
        // Automatically backfill any missing avatars by fetching the feed in the background/parallel
        const backfilledSources = await Promise.all(sources.map(async (source) => {
            if (!source.avatarUrl && (source.platform === 'substack' || source.platform === 'custom_rss') && source.url) {
                try {

                    const feed = await parser.parseURL(source.url);
                    const avatarUrl = feed.image?.url || (typeof feed.image === 'string' ? feed.image : null);
                    if (avatarUrl) {
                        await db.update(contentSources).set({ avatarUrl }).where(eq(contentSources.id, source.id));
                        return { ...source, avatarUrl };
                    }
                } catch (err: any) {
                    console.error(`[Substack] Dynamic backfill failed for ${source.url}:`, err.message);
                }
            }
            return source;
        }));

        // Also get article counts for each source
        const allArticles = await db.select({ sourceId: articles.sourceId }).from(articles).where(eq(articles.userId, userId));
        
        const sourcesWithCounts = backfilledSources.map(source => ({
            ...source,
            articleCount: allArticles.filter(a => a.sourceId === source.id).length
        }));

        res.json({ sources: sourcesWithCounts });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch content sources', details: error.message });
    }
});

// POST /api/sources - Add a new Substack or Custom RSS blog connection
router.post('/', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { platform, url } = req.body;
        
        const targetPlatform = platform === 'substack' ? 'substack' : 'custom_rss';
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Normalize URL to get the feed
        let feedUrl = url.trim();
        if (!feedUrl.startsWith('http')) {
            feedUrl = `https://${feedUrl}`;
        }

        let feedParsed = false;
        let feed;

        // If it's substack, normalize it to /feed
        if (targetPlatform === 'substack' && !feedUrl.endsWith('/feed')) {
            feedUrl = feedUrl.replace(/\/$/, '') + '/feed';
        }

        // 1. Try parsing the feed URL directly
        try {

            feed = await parser.parseURL(feedUrl);
            feedParsed = true;
        } catch (err: any) {
            console.warn(`[Sources] Direct feed parsing failed for ${feedUrl}:`, err.message);
        }

        // 2. If direct parse failed and it's a blog (custom_rss), try common RSS endpoints
        if (!feedParsed && targetPlatform === 'custom_rss') {
            const commonPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/index.xml'];
            const baseUrl = feedUrl.replace(/\/$/, '');
            for (const path of commonPaths) {
                try {
                    const fallbackUrl = `${baseUrl}${path}`;

                    feed = await parser.parseURL(fallbackUrl);
                    feedUrl = fallbackUrl;
                    feedParsed = true;
                    break;
                } catch (err: any) {
                    // Try next path
                }
            }
        }

        if (!feedParsed || !feed) {
            const errorMsg = targetPlatform === 'substack'
                ? 'Could not parse Substack RSS feed. Make sure the URL is correct.'
                : 'Could not parse RSS feed. Make sure the blog URL is correct and publishes an RSS feed.';
            return res.status(400).json({ error: errorMsg });
        }

        // Extract feed logo / avatar URL
        const avatarUrl = feed.image?.url || (typeof feed.image === 'string' ? feed.image : null);

        // Check if this source already exists
        const existingSources = await db.select().from(contentSources).where(
            and(eq(contentSources.userId, userId), eq(contentSources.url, feedUrl))
        );

        let sourceId: string;

        if (existingSources.length > 0) {
            sourceId = existingSources[0].id;

            await db.update(contentSources)
                .set({ 
                    lastSyncedAt: new Date(),
                    avatarUrl: avatarUrl || existingSources[0].avatarUrl
                })
                .where(eq(contentSources.id, sourceId));
        } else {

            const [newSource] = await db.insert(contentSources).values({
                userId,
                platform: targetPlatform,
                url: feedUrl, // Save the feed URL
                avatarUrl,
                lastSyncedAt: new Date(),
            }).returning();
            sourceId = newSource.id;
        }

        // Insert articles

        let newArticlesCount = 0;

        // Fetch existing articles for this source to avoid duplicates
        const existingArticles = await db.select({ url: articles.url }).from(articles).where(eq(articles.sourceId, sourceId));
        const existingUrls = new Set(existingArticles.map(a => a.url).filter(Boolean));

        const articlesToInsert = feed.items
            .filter(item => item.link && !existingUrls.has(item.link))
            .map(item => ({
                userId,
                sourceId,
                title: decodeHtmlEntities(item.title || 'Untitled'),
                content: decodeHtmlEntities(item['content:encoded'] || item.content || item.contentSnippet || ''),
                url: item.link || '',
                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            }));

        if (articlesToInsert.length > 0) {
            await db.insert(articles).values(articlesToInsert);
            newArticlesCount = articlesToInsert.length;
        }

        posthog.capture({
            distinctId: userId,
            event: 'source_added',
            properties: {
                platform: targetPlatform,
                feed_url: feedUrl,
                feed_title: feed.title,
                articles_synced: newArticlesCount,
                is_new_source: existingSources.length === 0,
            },
        });

        res.json({
            success: true,
            message: `Successfully synced ${newArticlesCount} new articles`,
            feedTitle: feed.title
        });

    } catch (error: any) {
        console.error('[Substack] Sync error:', error);
        posthog.captureException(error, req.user!.id);
        res.status(500).json({ error: 'Failed to add content source', details: error.message });
    }
});

// DELETE /api/sources/:id - Disconnect a source
router.delete('/:id', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const sourceId = req.params.id;

        await db.delete(contentSources).where(
            and(eq(contentSources.id, sourceId), eq(contentSources.userId, userId))
        );

        posthog.capture({
            distinctId: userId,
            event: 'source_removed',
            properties: { source_id: sourceId },
        });

        res.json({ success: true });
    } catch (error: any) {
        posthog.captureException(error, req.user!.id);
        res.status(500).json({ error: 'Failed to delete source', details: error.message });
    }
});

export default router;
