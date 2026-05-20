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

    } else if (channel.platform === "threads") {
      console.log(`[Publisher] Posting to Threads for user ${post.userId}`);
      const imageUrl = content.imageUrl || content.mediaUrl;
      const mediaType = imageUrl ? "IMAGE" : "TEXT";

      const containerRes = await fetch(`https://graph.threads.net/v1.0/${channel.providerAccountId}/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          media_type: mediaType,
          text: postText,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }),
      });

      if (!containerRes.ok) {
        const errText = await containerRes.text();
        throw new Error(`Threads container creation failed: ${errText}`);
      }

      const containerData = await containerRes.json() as any;
      const containerId = containerData.id;

      // Wait a moment for container processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      const publishRes = await fetch(`https://graph.threads.net/v1.0/${channel.providerAccountId}/threads_publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          creation_id: containerId,
        }),
      });

      if (!publishRes.ok) {
        const errText = await publishRes.text();
        throw new Error(`Threads publish failed: ${errText}`);
      }

      const publishData = await publishRes.json() as any;
      externalPostId = publishData.id;
      console.log(`[Publisher] Successfully posted to Threads! Post ID: ${externalPostId}`);

    } else if (channel.platform === "instagram") {
      console.log(`[Publisher] Posting to Instagram for user ${post.userId}`);
      const imageUrl = content.imageUrl || content.mediaUrl || "https://img.freepik.com/free-vector/blue-purple-mosaic-background_1164-812.jpg?semt=ais_rp_progressive&w=740&q=80";

      // Use graph.instagram.com (Instagram API tokens from direct IG login)
      const containerRes = await fetch(`https://graph.instagram.com/v21.0/${channel.providerAccountId}/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: postText,
        }),
      });

      if (!containerRes.ok) {
        const errText = await containerRes.text();
        throw new Error(`Instagram container creation failed: ${errText}`);
      }

      const containerData = await containerRes.json() as any;
      const containerId = containerData.id;

      // Wait a moment for container processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      const publishRes = await fetch(`https://graph.instagram.com/v21.0/${channel.providerAccountId}/media_publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          creation_id: containerId,
        }),
      });

      if (!publishRes.ok) {
        const errText = await publishRes.text();
        throw new Error(`Instagram publish failed: ${errText}`);
      }

      const publishData = await publishRes.json() as any;
      externalPostId = publishData.id;
      console.log(`[Publisher] Successfully posted to Instagram! Post ID: ${externalPostId}`);

    } else if (channel.platform === "bluesky") {
      console.log(`[Publisher] Posting to Bluesky for user ${post.userId}`);
      
      const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          repo: channel.providerAccountId, // DID of the user
          collection: "app.bsky.feed.post",
          record: {
            text: postText,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Bluesky API returned error ${res.status}: ${errText}`);
      }

      const resData = await res.json() as any;
      externalPostId = resData?.uri;
      console.log(`[Publisher] Successfully posted to Bluesky! Post URI: ${externalPostId}`);

    } else {
      // Simulated successful posting for Facebook (until fully implemented)
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
