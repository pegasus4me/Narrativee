import type { OAuthProvider, OAuthTokens, OAuthProfile } from '../types';
import crypto from 'crypto';

/**
 * X (Twitter) OAuth 2.0 Provider
 * 
 * Uses OAuth 2.0 with PKCE (Authorization Code Flow).
 * Docs: https://developer.x.com/en/docs/authentication/oauth-2-0
 * 
 * Required env vars:
 *   X_CLIENT_ID
 *   X_CLIENT_SECRET
 */
export const xProvider: OAuthProvider = {
    platform: 'x',
    displayName: 'X (Twitter)',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],

    getAuthorizationUrl(state: string, redirectUri: string, codeVerifier?: string): string {
        if (!codeVerifier) {
            throw new Error('X OAuth requires PKCE codeVerifier');
        }

        // Generate S256 code challenge from the code verifier
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.X_CLIENT_ID!,
            redirect_uri: redirectUri,
            scope: this.scopes.join(' '),
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });
        return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    },

    async exchangeCodeForTokens(code: string, redirectUri: string, codeVerifier?: string): Promise<OAuthTokens> {
        if (!codeVerifier) {
            throw new Error('X OAuth token exchange requires PKCE codeVerifier');
        }

        const credentials = Buffer.from(
            `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
        ).toString('base64');

        const res = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${credentials}`,
            },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                client_id: process.env.X_CLIENT_ID!,
                code_verifier: codeVerifier,
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`X token exchange failed: ${error}`);
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
        const res = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            throw new Error(`X profile fetch failed: ${await res.text()}`);
        }

        const { data } = await res.json() as any;
        return {
            providerAccountId: data.id,
            accountName: `@${data.username}`,
            avatarUrl: data.profile_image_url,
        };
    },

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
        const credentials = Buffer.from(
            `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
        ).toString('base64');

        const res = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${credentials}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
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
