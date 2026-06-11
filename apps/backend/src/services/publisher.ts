import { db } from "../auth/auth";
import { channels, socialPosts } from "../auth/schema/schema";
import { eq } from "drizzle-orm";
import { getProvider } from "../oauth/registry";
import { decrypt, encrypt } from "../utils/encryption";

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
  if (!channel || !channel.isConnected) {
    console.error(`[Publisher] Channel not found or is disconnected for post ${postId}: ${post.channelId}`);
    await db.update(socialPosts).set({ status: "failed", updatedAt: new Date() }).where(eq(socialPosts.id, postId));
    return false;
  }

  let accessToken = decrypt(channel.accessToken);
  
  // 3. Refresh token if expired or about to expire (within 5 minutes)
  const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
  const isExpired = channel.expiresAt && (new Date(channel.expiresAt).getTime() - TOKEN_EXPIRY_BUFFER_MS < Date.now());
  if (isExpired && channel.refreshToken) {
    console.log(`[Publisher] Access token for channel ${channel.id} is expired. Refreshing...`);
    const provider = getProvider(channel.platform);
    if (provider && provider.refreshAccessToken) {
      try {
        const decryptedRefresh = decrypt(channel.refreshToken);
        const tokens = await provider.refreshAccessToken(decryptedRefresh);
        if (tokens) {
          accessToken = tokens.accessToken;
          await db.update(channels)
            .set({
              accessToken: encrypt(tokens.accessToken),
              refreshToken: encrypt(tokens.refreshToken ?? decryptedRefresh),
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
  const content = post.content as {
    text?: string;
    imageUrl?: string;
    mediaUrl?: string;
    type?: string;
    slides?: Array<{ dataUri?: string; imageUrl?: string }>;
  };
  const postText = content.text || "";
  if (!postText) {
    console.error(`[Publisher] No text content found for post ${postId}`);
    await db.update(socialPosts).set({ status: "failed", updatedAt: new Date() }).where(eq(socialPosts.id, postId));
    return false;
  }

  // 5. Post to API
  try {
    let externalPostId: string | undefined;

    if (accessToken === "demo" || channel.providerAccountId.startsWith("demo_")) {
      console.log(`[Publisher] Simulated successful posting for demo channel: ${channel.platform}`);
      externalPostId = `simulated_${channel.platform}_${Date.now()}`;
    } else if (channel.platform === "x") {
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
      const isCarousel = content.type === "carousel" && Array.isArray(content.slides) && content.slides.length > 0;

      if (isCarousel) {
        console.log(`[Publisher] LinkedIn post is a carousel with ${content.slides!.length} slides`);
        const mediaUrns: string[] = [];

        for (let i = 0; i < content.slides!.length; i++) {
          const slide = content.slides![i];
          const imgBuffer = await resolveCarouselSlideBuffer(slide);

          // 1. Register asset
          console.log(`[Publisher] Registering LinkedIn asset for slide ${i + 1}`);
          const regRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify({
              registerUploadRequest: {
                recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                owner: `urn:li:person:${channel.providerAccountId}`,
                supportedUploadMechanism: ["SYNCHRONOUS_UPLOAD"],
              },
            }),
          });

          if (!regRes.ok) {
            const errText = await regRes.text();
            throw new Error(`LinkedIn asset registration failed for slide ${i + 1}: ${errText}`);
          }

          const regData = await regRes.json() as any;
          const uploadMechanism = regData.value.uploadMechanism;
          const uploadUrl = uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl
            || uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadMechanism"]?.uploadUrl;
          const assetUrn = regData.value.asset;

          // 2. Upload binary
          console.log(`[Publisher] Uploading binary to LinkedIn asset: ${assetUrn}`);
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "image/png",
            },
            body: imgBuffer,
          });

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`LinkedIn asset upload failed for slide ${i + 1}: ${errText}`);
          }

          mediaUrns.push(assetUrn);
        }

        // 3. Publish ugcPost
        console.log(`[Publisher] Publishing LinkedIn multi-image post with ${mediaUrns.length} assets`);
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
                shareMediaCategory: "IMAGE",
                media: mediaUrns.map((urn, index) => ({
                  status: "READY",
                  media: urn,
                  title: {
                    text: `Slide ${index + 1}`,
                  },
                })),
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`LinkedIn carousel publishing failed: ${errText}`);
        }

        const resData = await res.json() as any;
        externalPostId = resData?.id;
        console.log(`[Publisher] Successfully posted carousel to LinkedIn! Post ID: ${externalPostId}`);

      } else {
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
      }

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
      const isCarousel = content.type === "carousel" && Array.isArray(content.slides) && content.slides.length > 0;

      if (isCarousel) {
        console.log(`[Publisher] Instagram post is a carousel with ${content.slides!.length} slides`);
        const itemIds: string[] = [];

        for (let i = 0; i < content.slides!.length; i++) {
          const slidePublicUrl = content.slides![i]?.imageUrl ?? `${getPublicBackendUrl()}/api/articles/drafts/${postId}/slides/${i}.png`;
          console.log(`[Publisher] Creating Instagram item container for slide ${i + 1}: ${slidePublicUrl}`);

          const itemRes = await fetch(`https://graph.instagram.com/v21.0/${channel.providerAccountId}/media`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              image_url: slidePublicUrl,
              is_carousel_item: true,
            }),
          });

          if (!itemRes.ok) {
            const errText = await itemRes.text();
            throw new Error(`Instagram carousel item ${i + 1} container creation failed: ${errText}`);
          }

          const itemData = await itemRes.json() as any;
          itemIds.push(itemData.id);
        }

        // 2. Create carousel container with children
        console.log(`[Publisher] Creating Instagram carousel container with items: ${itemIds.join(', ')}`);
        const containerRes = await fetch(`https://graph.instagram.com/v21.0/${channel.providerAccountId}/media`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            media_type: "CAROUSEL",
            children: itemIds,
            caption: postText,
          }),
        });

        if (!containerRes.ok) {
          const errText = await containerRes.text();
          throw new Error(`Instagram carousel container creation failed: ${errText}`);
        }

        const containerData = await containerRes.json() as any;
        const containerId = containerData.id;

        // Wait a moment for container processing
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 3. Publish the carousel container
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
          throw new Error(`Instagram carousel publish failed: ${errText}`);
        }

        const publishData = await publishRes.json() as any;
        externalPostId = publishData.id;
        console.log(`[Publisher] Successfully posted carousel to Instagram! Post ID: ${externalPostId}`);

      } else {
        const imageUrl = content.imageUrl || content.mediaUrl || "https://img.freepik.com/free-vector/blue-purple-mosaic-background_1164-812.jpg?semt=ais_rp_progressive&w=740&q=80";

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
      }

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

    } else if (channel.platform === "substack") {
      console.log(`[Publisher] Posting to Substack Notes for user ${post.userId}`);
      
      const cookieHeader = accessToken.includes("=") 
        ? accessToken 
        : `substack.sid=${accessToken}`;

      const res = await fetch("https://substack.com/api/v1/comment/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": cookieHeader,
          "Referer": "https://substack.com/activity",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          bodyJson: {
            type: "doc",
            attrs: {
              schemaVersion: "v1",
              title: null,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: postText,
                  },
                ],
              },
            ],
          },
          replyMinimumRole: "everyone",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Substack API returned error ${res.status}: ${errText}`);
      }

      const resData = await res.json() as any;
      externalPostId = resData?.id?.toString() || `substack_${Date.now()}`;
      console.log(`[Publisher] Successfully posted to Substack Notes! Post ID: ${externalPostId}`);

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

const resolveCarouselSlideBuffer = async (slide: { dataUri?: string; imageUrl?: string }): Promise<Buffer> => {
  if (typeof slide.dataUri === "string") {
    const base64Data = slide.dataUri.split(";base64,").pop();
    if (base64Data) {
      return Buffer.from(base64Data, "base64");
    }
  }

  if (typeof slide.imageUrl === "string" && slide.imageUrl.length > 0) {
    const response = await fetch(slide.imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download carousel slide: ${response.status} ${await response.text()}`);
    }

    const bytes = await response.arrayBuffer();
    return Buffer.from(bytes);
  }

  throw new Error("Carousel slide is missing both dataUri and imageUrl.");
};

const getPublicBackendUrl = (): string =>
  process.env.NODE_ENV === "production"
    ? "https://api.narrativee.com"
    : "http://localhost:3002";
