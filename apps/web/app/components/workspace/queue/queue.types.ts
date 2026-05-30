/** Shared shape for a social post displayed in queue and calendar views. */
export interface QueuePost {
  id: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  content?: {
    text?: string;
  };
  channel?: {
    platform?: string;
    accountName?: string;
    avatarUrl?: string;
  };
  article?: {
    title?: string;
  };
  articleId?: string;
  articleTitle?: string;
}

/** Queue post variant that is guaranteed to have a scheduled timestamp. */
export interface ScheduledQueuePost extends QueuePost {
  scheduledAt: string;
}

/** Narrows queue posts to items with a usable scheduled timestamp. */
export function hasScheduledAt(post: QueuePost): post is ScheduledQueuePost {
  return typeof post.scheduledAt === "string" && post.scheduledAt.length > 0;
}
