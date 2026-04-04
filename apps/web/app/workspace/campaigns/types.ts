export interface Campaign {
    id: string;
    name: string;
    status: "draft" | "active" | "paused" | "completed";
    replyTemplate: string;
    sequenceSteps: string[];
    dailyQuota: number;
    repliedToday: number;
    totalReplies: number;
    createdAt: string;
    targets?: CampaignTarget[];
}

export interface CampaignTarget {
    id: string;
    targetAuthorName: string | null;
    targetAuthorHandle: string | null;
    targetCommentContent: string | null;
    parentCommentContent: string | null;
    originalNoteContent: string | null;
    parentPostUrl: string;
    parentCommentUrl: string;
    targetCommentId: string;
    targetCommentUrl: string | null;
    status: "pending" | "replied" | "skipped" | "failed";
    sequenceStep: number;
    repliedAt: string | null;
    replyText: string | null;
    targetRepliedBack: boolean;
    targetSubscribed: boolean;
}

export interface FeedNote {
    id: string;
    content: string;
    author: { name: string; handle: string; avatar: string };
    engagement: { likes: number; restacks: number; comments: number };
    totalEngagement: number;
    url: string;
    timestamp: string;
}

export interface ScrapedTarget {
    parentCommentId: string;
    parentCommentUrl: string;
    parentPostUrl: string;
    parentCommentContent: string;
    targetAuthorName: string;
    targetAuthorHandle: string;
    targetCommentId: string;
    targetCommentContent: string;
    originalNoteContent: string;
}

export type CampaignView = "list" | "detail" | "create";
