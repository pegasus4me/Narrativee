import type { OAuthProvider } from './types';
import { xProvider } from './providers/x';
import { linkedinProvider } from './providers/linkedin';
import { instagramProvider } from './providers/instagram';
import { facebookProvider } from './providers/facebook';
import { threadsProvider } from './providers/threads';
import { blueskyProvider } from './providers/bluesky';
import { beehiivProvider } from './providers/beehiiv';

/**
 * Provider Registry
 * 
 * Central map of all supported OAuth providers.
 * To add a new platform:
 *   1. Create a new file in /providers that implements OAuthProvider
 *   2. Import it here
 *   3. Add it to the `providers` map
 * That's it — the generic routes handle everything else.
 */
const providers = new Map<string, OAuthProvider>([
    ['x', xProvider],
    ['linkedin', linkedinProvider],
    ['instagram', instagramProvider],
    ['facebook', facebookProvider],
    ['threads', threadsProvider],
    ['bluesky', blueskyProvider],
    ['beehiiv', beehiivProvider],
]);

/** Get a provider by platform name, or null if unsupported */
export function getProvider(platform: string): OAuthProvider | null {
    return providers.get(platform) ?? null;
}

/** List all supported platform names */
export function getSupportedPlatforms(): string[] {
    return Array.from(providers.keys());
}

/** List all providers with display info (for the frontend) */
export function getProviderList(): Array<{ platform: string; displayName: string }> {
    return Array.from(providers.values()).map((p) => ({
        platform: p.platform,
        displayName: p.displayName,
    }));
}
