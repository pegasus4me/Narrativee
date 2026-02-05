
import { Router } from 'express';
import { auth } from '../auth/auth';

const router = Router();

// Middleware to get authenticated user (same as onboarding.ts)
const requireAuth = async (req: any, res: any, next: any) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.session = session;
        next();
    } catch (error) {
        console.error("Auth error", error);
        return res.status(500).json({ error: 'Auth error' });
    }
};

router.post('/fetch-profile', requireAuth, async (req, res) => {
    const { profileUrl } = req.body;

    if (!profileUrl || !profileUrl.includes('substack.com')) {
        return res.status(400).json({ error: 'Invalid Substack URL' });
    }

    try {
        // Fetch the HTML content
        const response = await fetch(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(404).json({ error: 'Profile not found or inaccessible' });
        }

        const html = await response.text();

        // Extract using Regex (Lightweight approach)
        const getMetaContent = (prop: string) => {
            const regex = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
            const match = html.match(regex);
            return match ? match[1] : null;
        };

        // Extract JSON-LD for better accuracy (especially for image)
        let jsonLd: any = null;
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
            try {
                jsonLd = JSON.parse(jsonLdMatch[1]);
            } catch (e) {
                console.error("Failed to parse JSON-LD", e);
            }
        }

        const getTitleContent = () => {
            const regex = /<title>([^<]*)<\/title>/i;
            const match = html.match(regex);
            return match ? match[1] : null;
        }

        const name = jsonLd?.name || getMetaContent('og:title') || getMetaContent('twitter:title') || getTitleContent()?.split('|')[0].trim();
        const bio = jsonLd?.description || getMetaContent('og:description') || getMetaContent('twitter:description');
        const image = jsonLd?.image || getMetaContent('og:image') || getMetaContent('twitter:image');

        // Try to extract handle from URL if not found in meta
        // e.g. https://substack.com/@username
        let handle = null;
        const handleMatch = profileUrl.match(/@([\w\d]+)/);
        if (handleMatch) {
            handle = handleMatch[1];
        }

        // Try to find publications
        // Strategy 1: Look for links to *.substack.com that are likely the user's publication
        // Strategy 2: Default to handle.substack.com if highly confident (or just pass it as a suggestion)

        let publicationUrl = null;

        // Simple regex to find the first substack subdomain link that isn't www or profile
        // This is a heuristic.
        const pubMatch = html.match(/class="[^"]*publication-title[^"]*"[^>]*href="(https:\/\/[a-zA-Z0-9-]+\.substack\.com)"/i);
        if (pubMatch) {
            publicationUrl = pubMatch[1];
        } else if (handle) {
            // Fallback suggestion
            publicationUrl = `https://${handle}.substack.com`;
        }

        return res.json({
            name,
            bio,
            image,
            handle,
            url: profileUrl,
            publicationUrl
        });

    } catch (error: any) {
        console.error('Error fetching Substack profile:', error);
        return res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
    }
});

export default router;
