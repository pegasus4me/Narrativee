import type { OAuthProvider, OAuthTokens, OAuthProfile } from '../types';

/**
 * Bluesky (AT Protocol) Provider
 * 
 * Bluesky does NOT use traditional OAuth. It uses the AT Protocol with
 * handle + App Password authentication via `com.atproto.server.createSession`.
 * 
 * The OAuth interface methods (getAuthorizationUrl, exchangeCodeForTokens) are
 * stubbed and not used — instead, a dedicated /connect/bluesky route handles
 * the form-based login flow.
 * 
 * Required: User provides their Bluesky handle and App Password.
 */
export const blueskyProvider: OAuthProvider = {
    platform: 'bluesky',
    displayName: 'Bluesky',
    scopes: [],

    // Bluesky doesn't use OAuth redirects — stub
    getAuthorizationUrl(_state: string, _redirectUri: string): string {
        throw new Error('Bluesky uses AT Protocol authentication, not OAuth redirects.');
    },

    // Bluesky doesn't use OAuth code exchange — stub
    async exchangeCodeForTokens(_code: string, _redirectUri: string): Promise<OAuthTokens> {
        throw new Error('Bluesky uses AT Protocol authentication, not OAuth code exchange.');
    },

    async fetchProfile(accessToken: string): Promise<OAuthProfile> {
        // accessToken here is the accessJwt from createSession
        // We need the DID to fetch the profile, which is stored as providerAccountId
        // This method is called with just the token, so we decode the DID from the JWT
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid Bluesky access token format');
        }

        const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8'));
        const did = payload.sub;

        const res = await fetch(`https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            throw new Error(`Bluesky profile fetch failed: ${await res.text()}`);
        }

        const data = await res.json() as any;
        return {
            providerAccountId: data.did,
            accountName: `@${data.handle}`,
            avatarUrl: data.avatar,
        };
    },

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
        // Bluesky supports refreshing sessions via com.atproto.server.refreshSession
        const res = await fetch('https://bsky.social/xrpc/com.atproto.server.refreshSession', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        });

        if (!res.ok) return null;

        const data = await res.json() as any;
        return {
            accessToken: data.accessJwt,
            refreshToken: data.refreshJwt,
            // Bluesky access tokens typically expire in ~2 hours
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        };
    },
};

/**
 * Authenticate with Bluesky using handle + app password.
 * Returns tokens and profile info.
 */
export async function authenticateBluesky(
    identifier: string,
    appPassword: string
): Promise<{ tokens: OAuthTokens; profile: OAuthProfile }> {
    const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: appPassword }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Bluesky authentication failed: ${errText}`);
    }

    const data = await res.json() as any;

    return {
        tokens: {
            accessToken: data.accessJwt,
            refreshToken: data.refreshJwt,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // ~2 hours
        },
        profile: {
            providerAccountId: data.did,
            accountName: `@${data.handle}`,
            avatarUrl: data.avatar || undefined,
        },
    };
}
