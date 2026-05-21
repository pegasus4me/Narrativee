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
            .where(eq(channels.userId, req.user!.id));

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
    const { platform } = req.params;
    const provider = getProvider(platform);

    if (!provider) {
        return res.status(400).json({
            error: `Unsupported platform: ${platform}`,
            supported: getProviderList(),
        });
    }

    // Intercept mock connection if credentials are not configured in environment
    // add bluesky to this
    const isMetaPlatform = platform === 'facebook' || platform === 'instagram' || platform === 'threads' || platform === 'bluesky';
    const hasMetaConfig = isMetaPlatform && (
        platform === 'threads'
            ? (process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET)
            : platform === 'instagram'
                ? (process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET)
                : (process.env.META_APP_ID && process.env.META_APP_SECRET)
    );

    if (isMetaPlatform && !hasMetaConfig) {
        console.log(`⚠️ Meta app credentials missing for platform [${platform}]. Initiating premium sandbox mock connection.`);
        
        // Upsert a mock channel connection in the database
        const mockAccountId = `mock_${platform}_${req.user!.id}`;
        const mockAccountName = platform === 'instagram' 
            ? '@meta_sandbox' 
            : platform === 'threads'
                ? '@threads_sandbox'
                : 'Narrativee Sandbox Page';
        const mockAvatarUrl = platform === 'instagram' 
            ? 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg'
            : platform === 'threads'
                ? 'https://upload.wikimedia.org/wikipedia/commons/d/db/Threads_%28app%29.png'
                : 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg';

        const existing = await db
            .select()
            .from(channels)
            .where(
                and(
                    eq(channels.userId, req.user!.id),
                    eq(channels.platform, platform),
                    eq(channels.providerAccountId, mockAccountId)
                )
            );

        if (existing.length === 0) {
            await db.insert(channels).values({
                userId: req.user!.id,
                platform,
                providerAccountId: mockAccountId,
                accountName: mockAccountName,
                avatarUrl: mockAvatarUrl,
                accessToken: encrypt('mock_token_secret'),
                refreshToken: encrypt('mock_refresh_token'),
                expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year
            });
        }

        posthog.capture({
            distinctId: req.user!.id,
            event: 'channel_connected',
            properties: { platform, sandbox: true, account_name: mockAccountName },
        });

        // Redirect back to frontend with success
        return res.redirect(`${FRONTEND_URL}/workspace/channels?connected=${platform}&sandbox=true`);
    }

    // Generate a CSRF state token
    const state = crypto.randomBytes(32).toString('hex');
    // Generate a PKCE code verifier (random 43 character string)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');

    // Store state in DB for multi-instance safety
    const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 min
    await db.insert(oauthStates).values({
        state,
        userId: req.user!.id,
        platform,
        codeVerifier,
        expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
    });

    const redirectUri = `${BASE_URL}/api/channels/callback/${platform}`;
    const authUrl = provider.getAuthorizationUrl(state, redirectUri, codeVerifier);


    res.redirect(authUrl);
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
    const [pending] = await db
        .select()
        .from(oauthStates)
        .where(eq(oauthStates.state, state as string))
        .limit(1);

    if (!pending || pending.platform !== platform || pending.expiresAt < new Date()) {
        if (pending) await db.delete(oauthStates).where(eq(oauthStates.state, state as string));
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=invalid_state`);
    }

    const userId = pending.userId;
    const codeVerifier = pending.codeVerifier ?? undefined;
    await db.delete(oauthStates).where(eq(oauthStates.state, state as string));

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
                    refreshToken: encrypt(tokens.refreshToken ?? existing[0]!.refreshToken ?? ''),
                    expiresAt: tokens.expiresAt,
                    accountName: profile.accountName,
                    avatarUrl: profile.avatarUrl,
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
                    refreshToken: encrypt(tokens.refreshToken ?? existing[0]!.refreshToken ?? ''),
                    expiresAt: tokens.expiresAt,
                    accountName: profile.accountName,
                    avatarUrl: profile.avatarUrl,
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
 * DELETE /api/channels/:channelId
 * Disconnect a specific channel.
 */
router.delete('/:channelId', verifyAuth, async (req: AuthRequest, res) => {
    try {
        const { channelId } = req.params;

        const result = await db
            .delete(channels)
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
