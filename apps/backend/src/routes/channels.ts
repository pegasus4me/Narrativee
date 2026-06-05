import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../auth/auth';
import { channels, oauthStates } from '../auth/schema/schema';
import { eq, and, lte } from 'drizzle-orm';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { getProvider, getProviderList } from '../oauth/registry';
import { authenticateBluesky } from '../oauth/providers/bluesky';
import { posthog } from '../lib/posthog';
import { encrypt } from '../utils/encryption';

const router = Router();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3002';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Generic OAuth Routes ──────────────────────────────────────────────────

/**
 * GET /api/channels/platforms
 * Returns the list of supported platforms for the frontend UI.
 */
router.get('/platforms', (_req, res) => {
    res.json({ platforms: getProviderList() });
});

/**
 * GET /api/channels
 * List all connected channels for the authenticated user.
 */
router.get('/', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const userChannels = await db
            .select({
                id: channels.id,
                platform: channels.platform,
                accountName: channels.accountName,
                avatarUrl: channels.avatarUrl,
                createdAt: channels.createdAt,
            })
            .from(channels)
            .where(
                and(
                    eq(channels.userId, req.user!.id),
                    eq(channels.isConnected, true)
                )
            );

        res.json({ channels: userChannels });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch channels', details: error.message });
    }
});

/**
 * GET /api/channels/connect/:platform
 * Initiates the OAuth flow for any supported platform.
 * Redirects the user's browser to the platform's consent screen.
 */
router.get('/connect/:platform', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const { platform } = req.params;
        const provider = getProvider(platform);

        if (!provider) {
            return res.status(400).json({
                error: `Unsupported platform: ${platform}`,
                supported: getProviderList(),
            });
        }

        const isMetaPlatform = platform === 'facebook' || platform === 'instagram' || platform === 'threads';
        const hasMetaConfig = isMetaPlatform && (
            platform === 'threads'
                ? (process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET)
                : platform === 'instagram'
                    ? (process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET)
                    : (process.env.META_APP_ID && process.env.META_APP_SECRET)
        );

        if (isMetaPlatform && !hasMetaConfig) {
            return res.redirect(`${FRONTEND_URL}/workspace/channels?error=missing_oauth_config&detail=${encodeURIComponent(`OAuth credentials are not configured for ${platform}.`)}`);
        }

        // Generate a CSRF state token
        const state = crypto.randomBytes(32).toString('hex');
        // Generate a PKCE code verifier (random 43 character string)
        const codeVerifier = crypto.randomBytes(32).toString('base64url');

        // Store state in DB for multi-instance safety
        const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 min
        try {
            await db.insert(oauthStates).values({
                state,
                userId: req.user!.id,
                platform,
                codeVerifier,
                expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
            });
        } catch (dbErr: any) {
            console.error(`❌ [${platform}] Failed to store OAuth state in DB:`, dbErr.message);
            return res.status(500).json({
                error: 'Database error',
                message: 'Failed to initiate authentication session. Please try again later.',
                details: dbErr.message
            });
        }

        const redirectUri = `${BASE_URL}/api/channels/callback/${platform}`;
        const authUrl = provider.getAuthorizationUrl(state, redirectUri, codeVerifier);

        res.redirect(authUrl);
    } catch (err: any) {
        console.error(`❌ [${req.params.platform}] Failed to initiate OAuth flow:`, err);
        try {
            posthog.captureException(err, req.user?.id);
        } catch (phErr) {
            console.error('Failed to log oauth error to posthog:', phErr);
        }
        res.status(500).json({
            error: 'OAuth initiation failed',
            message: err.message || 'An unexpected error occurred.',
        });
    }
});

/**
 * GET /api/channels/callback/:platform
 * Handles the OAuth callback from any supported platform.
 * Exchanges the code for tokens, fetches the user's profile, and saves to DB.
 */
router.get('/callback/:platform', async (req: any, res) => {
    const { platform } = req.params;
    const { code, state, error: oauthError } = req.query;

    // Handle user denial or platform error
    if (oauthError) {
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=${oauthError}`);
    }

    if (!code || !state) {
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=missing_params`);
    }

    // Verify CSRF state from DB
    let pending;
    try {
        const [retrieved] = await db
            .select()
            .from(oauthStates)
            .where(eq(oauthStates.state, state as string))
            .limit(1);
        pending = retrieved;
    } catch (dbErr: any) {
        console.error(`❌ [${platform}] Database error during CSRF state verification:`, dbErr.message);
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=database_error&detail=${encodeURIComponent(dbErr.message)}`);
    }

    if (!pending || pending.platform !== platform || pending.expiresAt < new Date()) {
        if (pending) {
            try {
                await db.delete(oauthStates).where(eq(oauthStates.state, state as string));
            } catch (delErr: any) {
                console.error(`❌ [${platform}] Failed to delete expired CSRF state from DB:`, delErr.message);
            }
        }
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=invalid_state`);
    }

    const userId = pending.userId;
    const codeVerifier = pending.codeVerifier ?? undefined;
    try {
        await db.delete(oauthStates).where(eq(oauthStates.state, state as string));
    } catch (delErr: any) {
        console.error(`❌ [${platform}] Failed to delete verified CSRF state from DB:`, delErr.message);
    }

    const provider = getProvider(platform);
    if (!provider) {
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=unsupported_platform`);
    }

    try {
        const redirectUri = `${BASE_URL}/api/channels/callback/${platform}`;


        // Exchange code for tokens
        let tokens;
        try {
            tokens = await provider.exchangeCodeForTokens(code as string, redirectUri, codeVerifier);

        } catch (tokenErr: any) {
            console.error(`❌ [${platform}] Token exchange failed:`, tokenErr.message);
            return res.redirect(`${FRONTEND_URL}/workspace/channels?error=token_exchange_failed&detail=${encodeURIComponent(tokenErr.message)}`);
        }

        // Fetch the user's profile on that platform
        let profile;
        try {
            profile = await provider.fetchProfile(tokens.accessToken);

        } catch (profileErr: any) {
            console.error(`❌ [${platform}] Profile fetch failed:`, profileErr.message);
            return res.redirect(`${FRONTEND_URL}/workspace/channels?error=profile_fetch_failed&detail=${encodeURIComponent(profileErr.message)}`);
        }

        // Upsert: if this exact account is already connected, update the tokens
        const existing = await db
            .select()
            .from(channels)
            .where(
                and(
                    eq(channels.userId, userId),
                    eq(channels.platform, platform),
                    eq(channels.providerAccountId, profile.providerAccountId)
                )
            );

        if (existing.length > 0) {
            await db
                .update(channels)
                .set({
                    accessToken: encrypt(tokens.accessToken),
                    refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : (existing[0]!.refreshToken ?? ''),
                    expiresAt: tokens.expiresAt,
                    accountName: profile.accountName,
                    avatarUrl: profile.avatarUrl,
                    isConnected: true,
                })
                .where(eq(channels.id, existing[0]!.id));
        } else {
            await db.insert(channels).values({
                userId,
                platform,
                providerAccountId: profile.providerAccountId,
                accountName: profile.accountName,
                avatarUrl: profile.avatarUrl,
                accessToken: encrypt(tokens.accessToken),
                refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
                expiresAt: tokens.expiresAt,
                isConnected: true,
            });
        }

        posthog.capture({
            distinctId: userId,
            event: 'channel_connected',
            properties: { platform, account_name: profile.accountName },
        });

        // Redirect back to the frontend with success
        res.redirect(`${FRONTEND_URL}/workspace/channels?connected=${platform}`);
    } catch (err: any) {
        console.error(`[${platform}] OAuth callback error:`, err);
        posthog.captureException(err, userId);
        res.redirect(`${FRONTEND_URL}/workspace/channels?error=token_exchange_failed`);
    }
});

/**
 * POST /api/channels/connect/bluesky
 * Connects a Bluesky account using AT Protocol (handle + app password).
 */
router.post('/connect/bluesky', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const { identifier, appPassword } = req.body;

        if (!identifier || !appPassword) {
            return res.status(400).json({ error: 'Bluesky handle and app password are required' });
        }


        const { tokens, profile } = await authenticateBluesky(identifier, appPassword);


        // Upsert: if this account is already connected, update tokens
        const existing = await db
            .select()
            .from(channels)
            .where(
                and(
                    eq(channels.userId, req.user!.id),
                    eq(channels.platform, 'bluesky'),
                    eq(channels.providerAccountId, profile.providerAccountId)
                )
            );

        if (existing.length > 0) {
            await db
                .update(channels)
                .set({
                    accessToken: encrypt(tokens.accessToken),
                    refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : (existing[0]!.refreshToken ?? ''),
                    expiresAt: tokens.expiresAt,
                    accountName: profile.accountName,
                    avatarUrl: profile.avatarUrl,
                    isConnected: true,
                })
                .where(eq(channels.id, existing[0]!.id));
        } else {
            await db.insert(channels).values({
                userId: req.user!.id,
                platform: 'bluesky',
                providerAccountId: profile.providerAccountId,
                accountName: profile.accountName,
                avatarUrl: profile.avatarUrl,
                accessToken: encrypt(tokens.accessToken),
                refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
                expiresAt: tokens.expiresAt,
                isConnected: true,
            });
        }

        posthog.capture({
            distinctId: req.user!.id,
            event: 'channel_connected',
            properties: { platform: 'bluesky', account_name: profile.accountName },
        });

        res.json({ success: true, platform: 'bluesky', accountName: profile.accountName });
    } catch (error: any) {
        console.error('❌ [Bluesky] Connection failed:', error.message);
        posthog.captureException(error, req.user!.id);
        res.status(400).json({ error: 'Failed to connect Bluesky', details: error.message });
    }
});

/**
 * POST /api/channels/connect/substack
 * Connects a Substack account using publication handle and session cookie.
 */
router.post('/connect/substack', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const { identifier, sessionCookie } = req.body;

        if (!identifier || !sessionCookie) {
            return res.status(400).json({ error: 'Substack publication handle/URL and session cookie are required' });
        }

        let cleanedHandle = identifier.trim();
        // If they pasted a full URL, let's extract the subdomain/handle
        if (cleanedHandle.includes('substack.com')) {
            try {
                let urlStr = cleanedHandle;
                if (!urlStr.startsWith('http')) {
                    urlStr = 'https://' + urlStr;
                }
                const parsed = new URL(urlStr);
                const hostParts = parsed.hostname.split('.');
                // e.g. "myblog.substack.com" -> ["myblog", "substack", "com"]
                if (hostParts.length >= 3 && hostParts[0] !== 'www') {
                    cleanedHandle = hostParts[0];
                }
            } catch (err) {
                // Fallback to raw string if URL parsing fails
            }
        }

        // Clean any trailing slashes or protocols if they just typed e.g. "https://myblog"
        cleanedHandle = cleanedHandle.replace(/https?:\/\//, '').split('/')[0];

        const providerAccountId = `substack_${cleanedHandle.toLowerCase()}`;
        const accountName = `@${cleanedHandle}`;
        const avatarUrl = 'https://substack.com/img/substack.png';

        // Upsert: if this exact Substack account is already connected, update it
        const existing = await db
            .select()
            .from(channels)
            .where(
                and(
                    eq(channels.userId, req.user!.id),
                    eq(channels.platform, 'substack'),
                    eq(channels.providerAccountId, providerAccountId)
                )
            );

        if (existing.length > 0) {
            await db
                .update(channels)
                .set({
                    accessToken: encrypt(sessionCookie),
                    accountName,
                    avatarUrl,
                    isConnected: true,
                })
                .where(eq(channels.id, existing[0]!.id));
        } else {
            await db.insert(channels).values({
                userId: req.user!.id,
                platform: 'substack',
                providerAccountId,
                accountName,
                avatarUrl,
                accessToken: encrypt(sessionCookie),
                isConnected: true,
            });
        }

        posthog.capture({
            distinctId: req.user!.id,
            event: 'channel_connected',
            properties: { platform: 'substack', account_name: accountName },
        });

        res.json({ success: true, platform: 'substack', accountName });
    } catch (error: any) {
        console.error('❌ [Substack] Connection failed:', error.message);
        posthog.captureException(error, req.user!.id);
        res.status(400).json({ error: 'Failed to connect Substack', details: error.message });
    }
});

/**
 * DELETE /api/channels/:channelId
 * Disconnect a specific channel (soft-disconnect).
 */
router.delete('/:channelId', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const { channelId } = req.params;

        const result = await db
            .update(channels)
            .set({
                isConnected: false,
                accessToken: "",
                refreshToken: null,
            })
            .where(and(eq(channels.id, channelId), eq(channels.userId, req.user!.id)))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        posthog.capture({
            distinctId: req.user!.id,
            event: 'channel_disconnected',
            properties: { platform: result[0]!.platform, channel_id: channelId },
        });

        res.json({ success: true, deleted: result[0] });
    } catch (error: any) {
        posthog.captureException(error, req.user!.id);
        res.status(500).json({ error: 'Failed to disconnect channel', details: error.message });
    }
});

// ─── Cleanup expired OAuth states from DB (runs every 5 min) ───────────────
const OAUTH_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(async () => {
    try {
        await db.delete(oauthStates).where(lte(oauthStates.expiresAt, new Date()));
    } catch (err) {
        console.error('[OAuth] Failed to clean up expired states:', err);
    }
}, OAUTH_CLEANUP_INTERVAL_MS);

export default router;
