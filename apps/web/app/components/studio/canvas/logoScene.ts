import { Canvas, IText, Path, Rect, Textbox } from "fabric";
import type { CreatorCanvasEvent, LogoStyleSpec } from "@/lib/api/studio";

export const BOARD_WIDTH = 920;
export const BOARD_HEIGHT = 560;
export const BOARD_GAP = 120;
export const ROW_GAP = 180;

export interface CanvasObjectData {
  runId: string;
  directionId: string;
  role: "artboard" | "label" | "angle" | "mark" | "wordmark" | "layer";
  name: string;
  row: number;
}

interface DirectionContext {
  runId: string;
  index: number;
  row: number;
  brandName: string;
  name: string;
  style?: LogoStyleSpec;
}

export type DirectionContexts = Map<string, DirectionContext>;

function position(index: number, row: number) {
  return {
    x: 100 + index * (BOARD_WIDTH + BOARD_GAP),
    y: 130 + row * (BOARD_HEIGHT + ROW_GAP),
  };
}

function directionId(runId: string, index: number) {
  return `${runId}:${index}`;
}

function data(
  context: DirectionContext,
  role: CanvasObjectData["role"],
): CanvasObjectData {
  return {
    runId: context.runId,
    directionId: directionId(context.runId, context.index),
    role,
    name: context.name,
    row: context.row,
  };
}

export function readObjectData(object: {
  get(key: string): unknown;
}): CanvasObjectData | null {
  const value = object.get("data");
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<CanvasObjectData>;
  return typeof record.directionId === "string" &&
    typeof record.runId === "string" &&
    typeof record.role === "string"
    ? (record as CanvasObjectData)
    : null;
}

export function applyLogoEvent(
  canvas: Canvas,
  event: CreatorCanvasEvent,
  contexts: DirectionContexts,
): { focus?: { index: number; row: number }; fitAll?: boolean } {
  if (
    event.type === "stage" ||
    event.type === "campaign_scene" ||
    event.type === "agent_activity" ||
    event.type === "conversation_thread" ||
    event.type === "team_message"
  )
    return {};
  const key = directionId(event.runId, event.index);

  if (event.type === "direction_start") {
    const existingRuns = new Set(
      canvas
        .getObjects()
        .map(readObjectData)
        .filter((item) => item?.role === "artboard")
        .map((item) => item!.runId),
    );
    const row = existingRuns.has(event.runId)
      ? (canvas
          .getObjects()
          .map(readObjectData)
          .find((item) => item?.runId === event.runId)?.row ?? 0)
      : existingRuns.size;
    const context: DirectionContext = {
      runId: event.runId,
      index: event.index,
      row,
      brandName: event.brandName,
      name: event.name,
    };
    contexts.set(key, context);
    const { x, y } = position(event.index, row);
    const frame = new Rect({
      left: x,
      top: y,
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      rx: 12,
      ry: 12,
      fill: "#F4F1EA",
      selectable: false,
      evented: false,
    });
    frame.set("data", data(context, "artboard"));
    const title = new IText(
      `${String(event.index + 1).padStart(2, "0")}  ${event.name}`,
      {
        left: x,
        top: y - 42,
        fontFamily: "Instrument Sans",
        fontSize: 20,
        fill: "#F1F1F1",
        selectable: false,
        evented: false,
      },
    );
    title.set("data", data(context, "label"));
    const angle = new Textbox(event.angle, {
      left: x + 34,
      top: y + BOARD_HEIGHT - 70,
      width: BOARD_WIDTH - 68,
      fontFamily: "Instrument Sans",
      fontSize: 16,
      fill: "#4E5760",
      selectable: false,
      evented: false,
    });
    angle.set("data", data(context, "angle"));
    canvas.add(frame, title, angle);
    return { focus: { index: event.index, row } };
  }

  const context = contexts.get(key);
  if (!context) return {};
  const { x, y } = position(context.index, context.row);

  if (event.type === "direction_style") {
    context.style = event.style;
    const frame = canvas
      .getObjects()
      .find(
        (object) =>
          readObjectData(object)?.directionId === key &&
          readObjectData(object)?.role === "artboard",
      );
    frame?.set("fill", event.style.background);
    canvas.requestRenderAll();
  }

  if (event.type === "direction_path" && context.style) {
    const style = context.style;
    const shape = new Path(event.path.d, {
      fill: event.path.fill === "none" ? "transparent" : style[event.path.fill],
      stroke:
        event.path.stroke === "none" ? undefined : style[event.path.stroke],
      strokeWidth: event.path.strokeWidth,
      strokeUniform: true,
    });
    const originalLeft = shape.left;
    const originalTop = shape.top;
    shape.set({
      left: x + 150 + originalLeft * 0.85,
      top: y + 170 + originalTop * 0.85,
      scaleX: 0.85,
      scaleY: 0.85,
    });
    shape.set("data", data(context, "mark"));
    canvas.add(shape);
  }

  if (event.type === "direction_complete" && context.style) {
    const style = context.style;
    const wordmark = new IText(context.brandName, {
      left: x + 390,
      top: y + 222,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontSize: Math.min(78, Math.max(42, 550 / context.brandName.length)),
      charSpacing: style.letterSpacing * 70,
      fill: style.foreground,
    });
    wordmark.set("data", data(context, "wordmark"));
    canvas.add(wordmark);
    void document.fonts.ready.then(() => canvas.requestRenderAll());
    return event.index === 2 ? { fitAll: true } : {};
  }

  return {};
}

export function directionBounds(index: number, row: number) {
  const { x, y } = position(index, row);
  return {
    x: x - 50,
    y: y - 85,
    width: BOARD_WIDTH + 100,
    height: BOARD_HEIGHT + 130,
  };
}

export function allBoardsBounds(canvas: Canvas) {
  const boards = canvas
    .getObjects()
    .filter(
      (object) =>
        readObjectData(object)?.role === "artboard" ||
        object.get("data")?.kind === "upload",
    )
    .map((object) => object.getBoundingRect());
  if (boards.length === 0) return null;
  const left = Math.min(...boards.map((board) => board.left));
  const top = Math.min(...boards.map((board) => board.top));
  return {
    x: left - 50,
    y: top - 60,
    width:
      Math.max(...boards.map((board) => board.left + board.width)) - left + 100,
    height:
      Math.max(...boards.map((board) => board.top + board.height)) - top + 120,
  };
}
