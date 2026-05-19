import type { OAuthProvider, OAuthTokens, OAuthProfile } from '../types';

/**
 * Facebook OAuth 2.0 Provider
 * 
 * Uses Facebook Login flow for Pages.
 * 
 * Required env vars:
 *   META_APP_ID       (Meta App ID)
 *   META_APP_SECRET   (Meta App Secret)
 */
export const facebookProvider: OAuthProvider = {
    platform: 'facebook',
    displayName: 'Facebook',
    scopes: [
        'public_profile',
        'email',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
    ],

    getAuthorizationUrl(state: string, redirectUri: string): string {
        const appId = process.env.META_APP_ID?.trim() || '';
        const params = new URLSearchParams({
            client_id: appId,
            redirect_uri: redirectUri,
            scope: this.scopes.join(','),
            response_type: 'code',
            state,
        });
        return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    },

    async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
        const appId = process.env.META_APP_ID?.trim() || '';
        const appSecret = process.env.META_APP_SECRET?.trim() || '';

        // Step 1: Exchange code for short-lived token
        const res = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                redirect_uri: redirectUri,
                code,
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Facebook token exchange failed: ${error}`);
        }

        const shortLived = await res.json() as any;

        // Step 2: Exchange short-lived token for long-lived token (60 days)
        const longRes = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?` +
            new URLSearchParams({
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: shortLived.access_token,
            }),
        );

        if (!longRes.ok) {
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
        const meRes = await fetch(
            `https://graph.facebook.com/v21.0/me?fields=id,name,picture.type(large)&access_token=${accessToken}`,
        );

        if (!meRes.ok) {
            throw new Error(`Facebook profile fetch failed: ${await meRes.text()}`);
        }

        const meData = await meRes.json() as any;
        return {
            providerAccountId: meData.id,
            accountName: meData.name,
            avatarUrl: meData.picture?.data?.url,
        };
    },

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
        const appId = process.env.META_APP_ID?.trim() || '';
        const appSecret = process.env.META_APP_SECRET?.trim() || '';

        const res = await fetch(
            `https://graph.facebook.com/v21.0/oauth/access_token?` +
            new URLSearchParams({
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: refreshToken,
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
