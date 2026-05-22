import { createApi } from 'unsplash-js';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

const unsplash = createApi({
    accessKey: UNSPLASH_ACCESS_KEY,
    // Node.js 18+ has native fetch
    fetch: global.fetch
});

export class UnsplashService {
    /**
     * Fetches a relevant background image from Unsplash for a given keyword.
     * Returns the high-resolution image URL.
     */
    static async fetchImageForKeyword(keyword: string): Promise<string> {
        try {
            if (!UNSPLASH_ACCESS_KEY) {
                console.warn('[Unsplash] No access key configured, returning fallback image');
                return 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop';
            }

            const result = await unsplash.photos.getRandom({
                query: keyword,
                orientation: 'landscape'
            });

            if (result.errors) {
                console.error('[Unsplash] Error fetching from Unsplash:', result.errors[0]);
                return 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop';
            }

            const photo = Array.isArray(result.response) ? result.response[0] : result.response;
            if (photo) {
                return photo.urls.regular;
            }

            // Fallback generic dark gradient image if no results found
            return 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop';
        } catch (error) {
            console.error('[Unsplash] Exception:', error);
            return 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop';
        }
    }
}
