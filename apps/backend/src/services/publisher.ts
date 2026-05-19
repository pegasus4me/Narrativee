import { db } from "../auth/auth";
import { channels, socialPosts } from "../auth/schema/schema";
import { eq } from "drizzle-orm";
import { getProvider } from "../oauth/registry";

/**
 * Publishes a draft social post to X (Twitter) or LinkedIn using connected OAuth credentials.
 */
export async function publishPostToSocialPlatform(postId: string): Promise<boolean> {
  console.log(`[Publisher] Starting publishing process for post: ${postId}`);
  
  // 1. Fetch the post
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  if (!post) {
    console.error(`[Publisher] Post not found: ${postId}`);
    return false;
  }

  if (post.status === "published") {
    console.log(`[Publisher] Post ${postId} is already published`);
    return true;
  }

  // 2. Fetch the channel
  const [channel] = await db.select().from(channels).where(eq(channels.id, post.channelId)).limit(1);
  if (!channel) {
    console.error(`[Publisher] Channel not found for post ${postId}: ${post.channelId}`);
    await db.update(socialPosts).set({ status: "failed", updatedAt: new Date() }).where(eq(socialPosts.id, postId));
    return false;
  }

  let accessToken = channel.accessToken;
  
  // 3. Refresh token if expired or about to expire (within 5 minutes)
  const isExpired = channel.expiresAt && (new Date(channel.expiresAt).getTime() - 5 * 60 * 1000 < Date.now());
  if (isExpired && channel.refreshToken) {
    console.log(`[Publisher] Access token for channel ${channel.id} is expired. Refreshing...`);
    const provider = getProvider(channel.platform);
    if (provider && provider.refreshAccessToken) {
      try {
        const tokens = await provider.refreshAccessToken(channel.refreshToken);
        if (tokens) {
          accessToken = tokens.accessToken;
          await db.update(channels)
            .set({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken ?? channel.refreshToken,
              expiresAt: tokens.expiresAt,
            })
            .where(eq(channels.id, channel.id));
          console.log(`[Publisher] Successfully refreshed access token for channel ${channel.id}`);
        }
      } catch (err) {
        console.error(`[Publisher] Failed to refresh access token for channel ${channel.id}:`, err);
      }
    }
  }

  // 4. Extract post text
  const content = post.content as { text?: string };
  const postText = content.text || "";
  if (!postText) {
    console.error(`[Publisher] No text content found for post ${postId}`);
    await db.update(socialPosts).set({ status: "failed", updatedAt: new Date() }).where(eq(socialPosts.id, postId));
    return false;
  }

  // 5. Post to API
  try {
    let externalPostId: string | undefined;

    if (channel.platform === "x") {
      console.log(`[Publisher] Posting to X (Twitter) for user ${post.userId}`);
      const res = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: postText }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`X API returned error ${res.status}: ${errText}`);
      }

      const resData = await res.json() as any;
      externalPostId = resData?.data?.id;
      console.log(`[Publisher] Successfully posted to X! Tweet ID: ${externalPostId}`);

    } else if (channel.platform === "linkedin") {
      console.log(`[Publisher] Posting to LinkedIn for user ${post.userId}`);
      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${channel.providerAccountId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: postText,
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LinkedIn API returned error ${res.status}: ${errText}`);
      }

      const resData = await res.json() as any;
      externalPostId = resData?.id;
      console.log(`[Publisher] Successfully posted to LinkedIn! Post ID: ${externalPostId}`);

    } else {
      // Simulated successful posting for Threads, Instagram, Facebook (until fully implemented)
      console.log(`[Publisher] Platform ${channel.platform} publishing is simulated`);
      externalPostId = `simulated_${channel.platform}_${Date.now()}`;
    }

    // 6. Update post status to published
    await db.update(socialPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
        externalPostId,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, postId));

    return true;

  } catch (err: any) {
    console.error(`[Publisher] Failed to publish post ${postId} to ${channel.platform}:`, err);
    await db.update(socialPosts)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, postId));
    throw err;
  }
}
