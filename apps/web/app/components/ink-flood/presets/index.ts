import { MEASURED } from "./measured";
import { GRAPHITE } from "./authored";
import type { Scene } from "../scene";

export const VAULT_SCENE: Scene = {
  ...GRAPHITE,
  spine: MEASURED.spine,
  tip: MEASURED.tip,
  tipAt: MEASURED.tipAt,
  flood: MEASURED.flood,
  sparks: MEASURED.sparks,
  word: "Narrativee",
};
