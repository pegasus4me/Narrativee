import type { GeneratedContentAsset } from "../../common/types.js";

export type ContentRepurposingOutput = {
  readonly summary: string;
  readonly assets: readonly GeneratedContentAsset[];
  readonly hooks: readonly string[];
  readonly ctas: readonly string[];
};
