import type { OAuthProvider, OAuthTokens, OAuthProfile } from '../types';

/**
 * LinkedIn OAuth 2.0 Provider
 * 
 * Uses standard OAuth 2.0 Authorization Code Flow.
 * Docs: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 * 
 * Required env vars:
 *   LINKEDIN_CLIENT_ID
 *   LINKEDIN_CLIENT_SECRET
 * 
 * Required LinkedIn Developer Products:
 *   - "Share on LinkedIn" → grants w_member_social
 *   - "Sign In with LinkedIn using OpenID Connect" → grants openid + profile (add later for avatar)
 */
export const linkedinProvider: OAuthProvider = {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    // "Sign In with LinkedIn using OpenID Connect" provides openid + profile
    // "Share on LinkedIn" provides w_member_social
    scopes: ['openid', 'profile', 'w_member_social'],

    getAuthorizationUrl(state: string, redirectUri: string): string {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            redirect_uri: redirectUri,
            scope: this.scopes.join(' '),
            state,
        });
        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    },

    async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
        const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`LinkedIn token exchange failed: ${error}`);
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
        // Try /v2/userinfo first (requires openid + profile scopes)
        const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (userinfoRes.ok) {
            const data = await userinfoRes.json() as any;
            return {
                providerAccountId: data.sub,
                accountName: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || 'LinkedIn User',
                avatarUrl: data.picture,
            };
        }

        // Fallback: use token introspection to at least get the member ID
        const introspectRes = await fetch('https://www.linkedin.com/oauth/v2/introspectToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                token: accessToken,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
        });

        if (introspectRes.ok) {
            const data = await introspectRes.json() as any;
            const memberId: string = data.sub || '';
            return {
                providerAccountId: memberId || 'linkedin_user',
                accountName: memberId ? `LinkedIn User` : 'LinkedIn User',
                avatarUrl: undefined,
            };
        }

        return {
            providerAccountId: 'linkedin_user',
            accountName: 'LinkedIn User',
            avatarUrl: undefined,
        };
    },

    async refreshAccessToken(refreshToken: string): Promise<OAuthTokens | null> {
        const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
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
