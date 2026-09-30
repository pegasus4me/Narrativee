import { easeFn, sampleTable } from "./ease";
import {
  HALFTONE_DEFAULTS,
  drawHalftone,
  makeHalftoneTile,
} from "./halftone";
import { MEASURED } from "./presets/measured";
import type { Scene, WordSpec } from "./scene";

export class InkFlood {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;
  private scene: Scene;

  private tile: HTMLCanvasElement | null = null;
  private inkCanvas: HTMLCanvasElement | null = null;
  private fitCache = new Map<string, number>();

  readonly ok: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    scene: Scene = MEASURED,
  ) {
    this.scene = scene;
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) {
      this.resize();
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(() => {
          this.fitCache.clear();
          if (!this.running && this.ok) {
            this.renderStill();
          }
        });
      }
    }
  }

  setScene(scene: Scene) {
    this.scene = scene;
    this.t0 = performance.now();
    this.fitCache.clear();
    if (!this.running) this.renderStill();
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round((r.width || c.clientWidth || 300) * this.dpr);
    const targetH = Math.round((r.height || c.clientHeight || 150) * this.dpr);
    c.width = targetW;
    c.height = targetH;
    this.tile = null;
    if (this.inkCanvas) {
      this.inkCanvas.width = targetW;
      this.inkCanvas.height = targetH;
    }
    this.fitCache.clear();
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      this.draw((now - this.t0) / 1000);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(this.scene.restAt / this.scene.fps);
  }

  destroy() {
    this.stop();
    this.ctx = null;
    this.tile = null;
    this.inkCanvas = null;
    this.fitCache.clear();
  }

  private capsule(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    r: number,
  ) {
    if (r <= 0) return;
    ctx.beginPath();
    if (Math.hypot(x1 - x0, y1 - y0) < 0.5) {
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.lineWidth = r * 2;
      ctx.lineCap = "round";
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  private stampInk(ctx: CanvasRenderingContext2D, u: number, k: number) {
    const { spine } = this.scene;
    for (let i = 0; i < spine.length - 1; i++) {
      const sampleA = spine[i];
      const sampleB = spine[i + 1];
      if (!sampleA || !sampleB) break;
      const [ax, ay, ar, af] = sampleA;
      if (af > u) break;
      const [bx, by, br, bf] = sampleB;

      const seg = bf <= u ? 1 : (u - af) / (bf - af);
      const dist = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.ceil((dist * seg) / Math.max(2, ar * k * 0.4)));
      for (let j = 0; j <= n; j++) {
        const t = (j / n) * seg;
        const r = (ar + (br - ar) * t) * k;
        ctx.beginPath();
        ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private toScene(ctx: CanvasRenderingContext2D, W: number, H: number, flip: boolean) {
    const { ref } = this.scene;
    ctx.translate(W / 2, H / 2);
    if (flip) ctx.scale(-1, 1);
    const hs = Math.min(W, H) / ref;
    ctx.scale(hs, hs);
    ctx.translate(-ref / 2, -ref / 2);
  }

  private screen(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const o = HALFTONE_DEFAULTS;
    if (!this.tile) this.tile = makeHalftoneTile(o.pitch, o.radius, this.dpr);
    drawHalftone(ctx, this.tile, W, H, this.dpr, o.alpha);
  }

  private resolveFontFamily(family: string): string {
    if (typeof window === "undefined") return family;
    let res = family.trim();
    if (res.includes("var(")) {
      res = res.replace(
        /var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/g,
        (_, name, fb) => {
          const comp = getComputedStyle(this.canvas || document.body || document.documentElement)
            .getPropertyValue(name)
            .trim();
          return comp || (fb ? fb.trim() : "");
        },
      );
    }
    if (res.includes("var(")) {
      res = this.resolveFontFamily(res);
    }
    return res || "sans-serif";
  }

  private drawTrackedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    tracking: number,
  ) {
    const chars = Array.from(text);
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const totalWidth =
      widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
    let x = cx - totalWidth / 2;
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const w = widths[i] ?? 0;
      if (char) {
        ctx.fillText(char, x + w / 2, cy);
      }
      x += w + tracking;
    }
  }

  private knockoutWord(
    inkCtx: CanvasRenderingContext2D,
    W: number,
    H: number,
    second: boolean,
    u: number,
    spec: WordSpec,
  ) {
    const s = this.scene;
    const text = spec.text;
    if (!text) return;

    const floodRange = Math.max(1, s.flood.end - s.flood.at);
    const floodProgress = Math.min(1, Math.max(0, (u - s.flood.at) / floodRange));
    const fe = easeFn(s.flood.ease);
    const ft = fe(floodProgress);

    // Stretches on the flood's own clock (0.82 to 2.35 wide), vertical squashes slightly against it
    const sx = 0.82 + (2.35 - 0.82) * ft;
    const sy = 1.04 - 0.16 * ft;
    const tracking = (spec.tracking ?? 16) * ft;

    const resolvedFamily = this.resolveFontFamily(
      spec.fontFamily ?? "var(--font-instrument, var(--font-sans, sans-serif))",
    );
    const weight = spec.fontWeight ?? 700;
    const targetWidth = spec.fontSize ? 0 : s.ref * 0.54;
    const fontStatus =
      typeof document !== "undefined" && document.fonts ? document.fonts.status : "ready";
    const cacheKey = `${text}:${resolvedFamily}:${weight}:${targetWidth}:${spec.fontSize ?? 0}:${fontStatus}`;

    let fontSize = this.fitCache.get(cacheKey);
    if (!fontSize) {
      if (spec.fontSize) {
        fontSize = spec.fontSize;
      } else {
        const testSize = 72;
        inkCtx.save();
        inkCtx.font = `${weight} ${testSize}px ${resolvedFamily}`;
        const measured = inkCtx.measureText(text).width || 1;
        inkCtx.restore();
        fontSize = Math.max(14, Math.round((targetWidth / measured) * testSize));
      }
      this.fitCache.set(cacheKey, fontSize);
    }

    inkCtx.save();
    this.toScene(inkCtx, W, H, second);
    if (second) {
      // Keep text right-reading on mirrored second half
      inkCtx.translate(s.ref / 2, s.ref / 2);
      inkCtx.scale(-1, 1);
      inkCtx.translate(-s.ref / 2, -s.ref / 2);
    }

    inkCtx.translate(s.ref / 2, s.ref / 2);
    inkCtx.scale(sx, sy);
    inkCtx.translate(-s.ref / 2, -s.ref / 2);

    inkCtx.globalCompositeOperation = "destination-out";
    inkCtx.fillStyle = "#000000";
    inkCtx.textAlign = "center";
    inkCtx.textBaseline = "middle";
    inkCtx.font = `${weight} ${fontSize}px ${resolvedFamily}`;

    if ("letterSpacing" in inkCtx) {
      (inkCtx as any).letterSpacing = `${tracking}px`;
      inkCtx.fillText(text, s.ref / 2, s.ref / 2);
    } else {
      this.drawTrackedText(inkCtx, text, s.ref / 2, s.ref / 2, tracking);
    }
    inkCtx.restore();
  }

  private draw(time: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = this.scene;
    const { dpr } = this;
    const W = this.canvas.width / dpr;
    const H = this.canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const halfSecs = s.half / s.fps;
    const total = time % (halfSecs * 2);
    const second = total >= halfSecs;
    const u = (total - (second ? halfSecs : 0)) * s.fps;
    const [fieldA, fieldB] = s.palette.fields;
    const bg = second ? fieldB : fieldA;
    const ink = second ? fieldA : fieldB;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (u >= s.flood.end) {
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, W, H);
      this.screen(ctx, W, H);
      return;
    }

    const flooding = u >= s.flood.at;
    const fe = easeFn(s.flood.ease);
    const zoom = flooding ? sampleTable(s.flood.scale, s.flood.at, u, fe) : 1;
    const rawK = flooding ? sampleTable(s.flood.swell, s.flood.at, u, fe) : 1;
    // Pushes final swell past measured value on wide aspect cards/screens so boundary sweeps corners cleanly
    const aspect = Math.max(1, W / Math.max(1, H));
    const cornerBoost = flooding
      ? 1 + (aspect - 1) * 0.35 * Math.pow(Math.max(0, (zoom - 1) / 2.94), 2)
      : 1;
    const k = rawK * cornerBoost;

    const wordSpec = typeof s.word === "string" ? { text: s.word } : s.word;
    const hasWord = !!wordSpec?.text;

    if (!hasWord) {
      ctx.save();
      this.toScene(ctx, W, H, second);
      ctx.translate(s.ref / 2, s.ref / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-s.ref / 2, -s.ref / 2);
      ctx.fillStyle = ink;
      this.stampInk(ctx, u, k);
      ctx.restore();
    } else {
      if (!this.inkCanvas) {
        this.inkCanvas = document.createElement("canvas");
        this.inkCanvas.width = this.canvas.width;
        this.inkCanvas.height = this.canvas.height;
      }
      const inkCtx = this.inkCanvas.getContext("2d");
      if (inkCtx) {
        inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        inkCtx.clearRect(0, 0, W, H);

        inkCtx.save();
        this.toScene(inkCtx, W, H, second);
        inkCtx.translate(s.ref / 2, s.ref / 2);
        inkCtx.scale(zoom, zoom);
        inkCtx.translate(-s.ref / 2, -s.ref / 2);
        inkCtx.fillStyle = ink;
        this.stampInk(inkCtx, u, k);
        inkCtx.restore();

        if (flooding) {
          this.knockoutWord(inkCtx, W, H, second, u, wordSpec);
        }

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(this.inkCanvas, 0, 0);
        ctx.restore();
      }
    }

    ctx.save();
    this.toScene(ctx, W, H, second);
    ctx.fillStyle = s.palette.dot;
    ctx.strokeStyle = s.palette.dot;

    const sp = s.sparks;
    if (sp && u >= sp.popAt) {
      const se = easeFn(sp.ease);
      const rNow =
        u < s.flood.at
          ? sampleTable(sp.pop, sp.popAt, u, se)
          : u < sp.shrinkAt
            ? sp.radius
            : sampleTable(sp.shrink, sp.shrinkAt, u, se);

      const div = (v: number) =>
        v < s.flood.at ? 1 : sampleTable(sp.diverge, s.flood.at, v, se);
      const now = div(u + 0.5);
      const was = div(Math.max(u - 0.5, sp.popAt));
      const c = s.ref / 2;
      for (const sign of [1, -1]) {
        this.capsule(
          ctx,
          c + sign * sp.offset[0] * was,
          c + sign * sp.offset[1] * was,
          c + sign * sp.offset[0] * now,
          c + sign * sp.offset[1] * now,
          rNow,
        );
      }
    }

    if (s.tip && u >= s.tipAt && u < s.tipAt + s.tip.length) {
      const [x, y, r] = this.tipAt(u);
      if (r > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    this.screen(ctx, W, H);
  }

  private tipAt(u: number): [number, number, number] {
    const tip = this.scene.tip;
    if (!tip || tip.length === 0) return [0, 0, 0];
    const k = Math.min(Math.max(u - this.scene.tipAt, 0), tip.length - 1);
    const i = Math.min(Math.floor(k), tip.length - 2);
    const t = k - i;
    const a = tip[i] ?? tip[0] ?? [0, 0, 0];
    const b = tip[i + 1] ?? a;
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }
}
