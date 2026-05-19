import type { OAuthProvider, OAuthTokens, OAuthProfile } from '../types';

/**
 * Instagram OAuth 2.0 Provider (Direct Instagram Login API for Professional Accounts)
 * 
 * Required env vars:
 *   INSTAGRAM_APP_ID       (Instagram App ID)
 *   INSTAGRAM_APP_SECRET   (Instagram App Secret)
 */
export const instagramProvider: OAuthProvider = {
    platform: 'instagram',
    displayName: 'Instagram',
    scopes: [
        'instagram_business_basic',
        'instagram_business_content_publish',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
    ],

    getAuthorizationUrl(state: string, redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: process.env.INSTAGRAM_APP_ID?.trim()!,
            redirect_uri: redirectUri,
            scope: this.scopes.join(','),
            response_type: 'code',
            state,
        });
        return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    },

    async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
        // Step 1: Exchange code for short-lived token
        const res = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.INSTAGRAM_APP_ID?.trim()!,
                client_secret: process.env.INSTAGRAM_APP_SECRET?.trim()!,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code,
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Instagram token exchange failed: ${error}`);
        }

        const shortLived = await res.json() as any;

        // Step 2: Exchange short-lived token for long-lived token (60 days)
        const longRes = await fetch(
            `https://graph.instagram.com/access_token?` +
            new URLSearchParams({
                grant_type: 'ig_exchange_token',
                client_secret: process.env.INSTAGRAM_APP_SECRET?.trim()!,
                access_token: shortLived.access_token,
            }),
        );

        if (!longRes.ok) {
            // Fall back to short-lived token if long-lived exchange fails
            return {
                accessToken: shortLived.access_token,
                expiresAt: new Date(Date.now() + 3600 * 1000), // ~1 hour
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
        // Fetch the IG account details using the /me endpoint on graph.instagram.com
        const igRes = await fetch(
            `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${accessToken}`,
        );

        if (!igRes.ok) {
            throw new Error(`Instagram profile fetch failed: ${await igRes.text()}`);
        }

        const igData = await igRes.json() as any;
        return {
            providerAccountId: igData.id,
            accountName: `@${igData.username}`,
            avatarUrl: igData.profile_picture_url,
        };
    },

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
        const res = await fetch(
            `https://graph.instagram.com/access_token?` +
            new URLSearchParams({
                grant_type: 'ig_exchange_token',
                client_secret: process.env.INSTAGRAM_APP_SECRET?.trim()!,
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
