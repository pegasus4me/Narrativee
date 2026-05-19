import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../auth/auth';
import { channels } from '../auth/schema/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { getProvider, getProviderList } from '../oauth/registry';

const router = Router();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3002';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// In-memory state store for CSRF protection (use Redis in production)
const pendingStates = new Map<string, { userId: string; platform: string; expiresAt: number; codeVerifier?: string }>();

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
    const isMetaPlatform = platform === 'facebook' || platform === 'instagram' || platform === 'threads';
    const hasMetaConfig = isMetaPlatform && (
        platform === 'threads'
            ? (process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET)
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
                accessToken: 'mock_token_secret',
                refreshToken: 'mock_refresh_token',
                expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year
            });
        }

        // Redirect back to frontend with success
        return res.redirect(`${FRONTEND_URL}/workspace/channels?connected=${platform}&sandbox=true`);
    }

    // Generate a CSRF state token
    const state = crypto.randomBytes(32).toString('hex');
    // Generate a PKCE code verifier (random 43 character string)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');

    pendingStates.set(state, {
        userId: req.user!.id,
        platform,
        codeVerifier,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
    });

    const redirectUri = `${BASE_URL}/api/channels/callback/${platform}`;
    const authUrl = provider.getAuthorizationUrl(state, redirectUri, codeVerifier);

    console.log(`🔗 [${platform}] OAuth redirect URL:`, authUrl);
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

    // Verify CSRF state
    const pending = pendingStates.get(state as string);
    if (!pending || pending.platform !== platform || pending.expiresAt < Date.now()) {
        pendingStates.delete(state as string);
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=invalid_state`);
    }

    const userId = pending.userId;
    const codeVerifier = pending.codeVerifier;
    pendingStates.delete(state as string);

    const provider = getProvider(platform);
    if (!provider) {
        return res.redirect(`${FRONTEND_URL}/workspace/channels?error=unsupported_platform`);
    }

    try {
        const redirectUri = `${BASE_URL}/api/channels/callback/${platform}`;
        console.log(`🔄 [${platform}] Exchanging code for tokens, redirectUri=${redirectUri}`);

        // Exchange code for tokens
        let tokens;
        try {
            tokens = await provider.exchangeCodeForTokens(code as string, redirectUri, codeVerifier);
            console.log(`✅ [${platform}] Token exchange succeeded`);
        } catch (tokenErr: any) {
            console.error(`❌ [${platform}] Token exchange failed:`, tokenErr.message);
            return res.redirect(`${FRONTEND_URL}/workspace/channels?error=token_exchange_failed&detail=${encodeURIComponent(tokenErr.message)}`);
        }

        // Fetch the user's profile on that platform
        let profile;
        try {
            profile = await provider.fetchProfile(tokens.accessToken);
            console.log(`✅ [${platform}] Profile fetched:`, profile);
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
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken ?? existing[0]!.refreshToken,
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
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt: tokens.expiresAt,
            });
        }

        // Redirect back to the frontend with success
        res.redirect(`${FRONTEND_URL}/workspace/channels?connected=${platform}`);
    } catch (err: any) {
        console.error(`OAuth callback error for ${platform}:`, err);
        res.redirect(`${FRONTEND_URL}/workspace/channels?error=token_exchange_failed`);
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

        res.json({ success: true, deleted: result[0] });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to disconnect channel', details: error.message });
    }
});

// ─── Cleanup expired states (runs every 5 min) ─────────────────────────────
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of pendingStates) {
        if (val.expiresAt < now) pendingStates.delete(key);
    }
}, 5 * 60 * 1000);

export default router;
