import { generateFlood, generateSpine, generateTip } from "../generate";
import type { Scene } from "../scene";

const REF = 540;
const HALF = 72;
const FLOOD_AT = 49;
const FLOOD_END = 70;
const FLOOD_FRAMES = FLOOD_END - FLOOD_AT + 1;

function authored(opts: {
  id: string;
  name: string;
  fields: readonly [string, string];
  dot: string;
  scribble?: Parameters<typeof generateSpine>[0];
  flood?: Parameters<typeof generateFlood>[1];
  ease?: Scene["flood"]["ease"];
}): Scene {
  const spine = generateSpine({ ref: REF, from: 3, to: 32, ...opts.scribble });
  const { tip, tipAt } = generateTip(spine);
  const { scale, swell } = generateFlood(FLOOD_FRAMES, opts.flood);

  return {
    id: opts.id,
    name: opts.name,
    ref: REF,
    fps: 25,
    half: HALF,
    restAt: 40,
    palette: { fields: opts.fields, dot: opts.dot },
    spine,
    tip,
    tipAt,
    flood: {
      at: FLOOD_AT,
      end: FLOOD_END,
      scale,
      swell,
      ease: opts.ease ?? "drift",
    },
    sparks: {
      offset: [33.8, -34.2],
      popAt: 43,
      pop: [3.4, 15.3, 21.6, 25.2, 27.4, 28.8],
      radius: 30,
      diverge: [
        1.0, 1.06, 1.15, 1.26, 1.47, 1.73, 2.15, 2.73, 3.56, 4.64, 5.23,
        5.59, 5.79, 5.91, 6.0, 6.06, 6.09, 6.1, 6.12, 6.12, 6.12, 6.12,
      ],
      shrinkAt: 65,
      shrink: [28.6, 26.4, 22.8, 17.8, 10.6, 0],
      ease: "surge",
    },
  };
}

export const GRAPHITE = authored({
  id: "graphite",
  name: "Graphite",
  fields: ["#fafafa", "#111111"],
  dot: "#8c8c8c",
  scribble: { humps: 3, amplitude: 0.2, crestR: 22, valleyR: 46, seed: 3 },
  ease: "drift",
});
