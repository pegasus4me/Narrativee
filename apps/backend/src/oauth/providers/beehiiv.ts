import type { OAuthProvider, OAuthTokens, OAuthProfile } from '../types';
import crypto from 'crypto';

/**
 * Beehiiv OAuth 2.0 Provider
 * 
 * Uses standard OAuth 2.0 Authorization Code Flow.
 * Docs: https://support.beehiiv.com/hc/en-us
 * 
 * Required env vars:
 *   BEEHIIV_CLIENT_ID
 *   BEEHIIV_CLIENT_SECRET
 */
export const beehiivProvider: OAuthProvider = {
    platform: 'beehiiv',
    displayName: 'Beehiiv',
    scopes: ['identify:read', 'publications:read', 'posts:read', 'posts:write'],

    getAuthorizationUrl(state: string, redirectUri: string, codeVerifier?: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.BEEHIIV_CLIENT_ID!,
            redirect_uri: redirectUri,
            scope: this.scopes.join(' '),
            state,
        });

        if (codeVerifier) {
            const codeChallenge = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');
            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', 'S256');
        }

        return `https://app.beehiiv.com/oauth/authorize?${params.toString()}`;
    },

    async exchangeCodeForTokens(code: string, redirectUri: string, codeVerifier?: string): Promise<OAuthTokens> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: process.env.BEEHIIV_CLIENT_ID!,
            client_secret: process.env.BEEHIIV_CLIENT_SECRET!,
        });

        if (codeVerifier) {
            params.append('code_verifier', codeVerifier);
        }

        const res = await fetch('https://app.beehiiv.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Beehiiv token exchange failed: ${error}`);
        }

        const data = await res.json() as any;
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_in
                ? new Date(Date.now() + data.expires_in * 1000)
                : undefined,
            scope: data.scope,
        };
    },

    async fetchProfile(accessToken: string): Promise<OAuthProfile> {
        // Fetch metadata about the token
        const res = await fetch('https://app.beehiiv.com/oauth/token/info', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Beehiiv profile fetch failed: ${error}`);
        }

        const data = await res.json() as any;
        
        return {
            providerAccountId: data.resource_owner_id || data.application?.uid || 'beehiiv_user',
            accountName: data.application?.name || 'Beehiiv Account',
            avatarUrl: undefined,
        };
    },

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
        const res = await fetch('https://app.beehiiv.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.BEEHIIV_CLIENT_ID!,
                client_secret: process.env.BEEHIIV_CLIENT_SECRET!,
            }),
        });

        if (!res.ok) return null;

        const data = await res.json() as any;
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_in
                ? new Date(Date.now() + data.expires_in * 1000)
                : undefined,
        };
    },
};
