export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type JsonObject = { readonly [key: string]: JsonValue };

export type MutableJsonObject = { [key: string]: JsonValue };

export type DateRange = {
  readonly start: string;
  readonly end: string;
};

export type PlatformName =
  | "x"
  | "linkedin"
  | "tiktok"
  | "instagram"
  | "youtube"
  | "newsletter";

export type ContentAssetKind =
  | "short_post"
  | "thread"
  | "professional_post"
  | "short_video_script"
  | "reel_script"
  | "shorts_metadata"
  | "newsletter_snippet"
  | "carousel_outline"
  | "hook_variation"
  | "cta_variation";

export type GeneratedContentAsset = {
  readonly id: string;
  readonly platform: PlatformName;
  readonly kind: ContentAssetKind;
  readonly title?: string;
  readonly body: string;
  readonly sourceAgent: string;
  readonly metadata: JsonObject;
};

export type ScheduleItem = {
  readonly assetId: string;
  readonly platform: PlatformName;
  readonly scheduledFor: string;
  readonly timezone: string;
  readonly payloadId: string;
};
