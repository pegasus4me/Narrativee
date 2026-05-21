import type { OAuthProvider, OAuthTokens, OAuthProfile } from '../types';

/**
 * Threads OAuth 2.0 Provider
 * 
 * Required env vars:
 *   THREADS_APP_ID       (Meta/Threads App ID)
 *   THREADS_APP_SECRET   (Meta/Threads App Secret)
 */
export const threadsProvider: OAuthProvider = {
    platform: 'threads',
    displayName: 'Threads',
    scopes: [
        'threads_basic',
        'threads_content_publish',
        'threads_manage_replies',
        'threads_manage_insights',
        'threads_read_replies'
    ],

    getAuthorizationUrl(state: string, redirectUri: string): string {
        const appId = process.env.THREADS_APP_ID?.trim()!
        const params = new URLSearchParams({
            client_id: appId,
            redirect_uri: redirectUri,
            scope: this.scopes.join(','),
            response_type: 'code',
            state,
        });
        return `https://threads.net/oauth/authorize?${params.toString()}`;
    },

    async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
        const appId = process.env.THREADS_APP_ID?.trim()!
        const appSecret = process.env.THREADS_APP_SECRET?.trim()!

        // Step 1: Exchange code for short-lived token
        const res = await fetch('https://graph.threads.net/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code,
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Threads token exchange failed: ${error}`);
        }

        const shortLived = await res.json() as any;

        // Step 2: Exchange short-lived token for long-lived token
        const longRes = await fetch(
            `https://graph.threads.net/access_token?` +
            new URLSearchParams({
                grant_type: 'th_exchange_token',
                client_secret: appSecret,
                access_token: shortLived.access_token,
            }),
        );

        if (!longRes.ok) {
            return {
                accessToken: shortLived.access_token,
                expiresAt: new Date(Date.now() + 3600 * 1000), // ~1 hour fallback
            };
        }

        const longLived = await longRes.json() as any;
        return {
            accessToken: longLived.access_token,
            expiresAt: longLived.expires_in
                ? new Date(Date.now() + longLived.expires_in * 1000)
                : new Date(Date.now() + 60 * 24 * 3600 * 1000), // ~60 days
        };
    },

    async fetchProfile(accessToken: string): Promise<OAuthProfile> {
        const meRes = await fetch(
            `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${accessToken}`,
        );

        if (!meRes.ok) {
            throw new Error(`Threads profile fetch failed: ${await meRes.text()}`);
        }

        const meData = await meRes.json() as any;
        return {
            providerAccountId: meData.id,
            accountName: meData.username,
            avatarUrl: meData.threads_profile_picture_url,
        };
    },

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
        const appSecret = process.env.THREADS_APP_SECRET?.trim()!;

        const res = await fetch(
            `https://graph.threads.net/refresh_access_token?` +
            new URLSearchParams({
                grant_type: 'th_refresh_token',
                access_token: refreshToken,
            }),
        );

        if (!res.ok) return null;

        const data = await res.json() as any;
        return {
            accessToken: data.access_token,
            expiresAt: data.expires_in
                ? new Date(Date.now() + data.expires_in * 1000)
                : undefined,
        };
    },
};
