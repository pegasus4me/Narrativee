import { z } from "zod";

export const ownerEmail = "safoantouil@gmail.com";
const id = z.uuid();
const date = z.iso.date();
const text = z.string().trim().min(1).max(12000);
const short = z.string().trim().max(300);
const count = z.number().int().min(0).max(100000000).nullable();
const money = z.number().int().min(0).max(100000000000);

export const noteSchema = z.object({
  id, date, text, kind: z.enum(["note", "feedback", "blocker", "learning"]),
  actionId: id.nullable(), experimentId: id.nullable(),
});
export const actionSchema = z.object({
  id, title: text.max(300), status: z.enum(["todo", "in_progress", "completed"]),
  createdOn: date, completedOn: date.nullable(), dueOn: date.nullable(),
  priorityDate: date.nullable(), channel: short, experimentId: id.nullable(),
  noteId: id.nullable(),
});
const experimentSchema = z.object({ id, title: text.max(300), goal: text.max(1000), channel: short, date });
export const resultSchema = z.object({
  id, date, actionId: id.nullable(), experimentId: id.nullable(), channel: short,
  text, sent: count, replies: count, signups: count, trials: count, paying: count,
});
export const metricSchema = z.object({
  id, date, mrrCents: money, activeCustomers: count, newCustomers: count,
  churnedCustomers: count, oneOffCents: money.nullable(),
});
export const proposalSchema = z.object({
  kind: z.enum(["action", "result", "blocker", "learning"]),
  title: text.max(300), reason: text.max(2000), channel: short,
  actionStatus: z.enum(["todo", "completed"]), actionId: id.nullable(),
  durationMinutes: z.number().int().min(1).max(480).nullable(),
  signal: short, sources: z.array(z.string().max(80)).max(20),
  sent: count, replies: count, signups: count, trials: count, paying: count,
});
const suggestionSchema = proposalSchema.extend({
  id, date, noteId: id.nullable(), status: z.enum(["pending", "accepted", "dismissed"]),
});
const reviewSchema = z.object({ id, date, start: date, end: date, summary: text, unknowns: z.array(short).max(20), sources: z.array(z.string().max(80)).max(100) });
export const dataSchema = z.object({
  name: text.max(100), currency: z.enum(["EUR", "USD", "GBP"]), targetCents: money.positive(),
  milestonesCents: z.array(money).max(15), audience: short, offer: short,
  channels: short, weeklyMinutes: z.number().int().min(0).max(10080).nullable(),
  deadline: date.nullable(), notes: z.array(noteSchema).max(5000),
  actions: z.array(actionSchema).max(5000), experiments: z.array(experimentSchema).max(1000),
  results: z.array(resultSchema).max(10000), metrics: z.array(metricSchema).max(5000),
  suggestions: z.array(suggestionSchema).max(3000), reviews: z.array(reviewSchema).max(1000),
}).superRefine((data, ctx) => {
  const collectionIds = [data.notes, data.actions, data.experiments, data.results, data.metrics, data.suggestions, data.reviews].flatMap(items => items.map(item => item.id));
  if (new Set(collectionIds).size !== collectionIds.length) ctx.addIssue({ code: "custom", message: "Identifiants dupliqués." });
  const priorities = new Map<string, number>();
  for (const action of data.actions) {
    if (action.priorityDate) priorities.set(action.priorityDate, (priorities.get(action.priorityDate) ?? 0) + 1);
    if ((action.status === "completed") !== Boolean(action.completedOn)) ctx.addIssue({ code: "custom", message: "Date de clôture incohérente." });
  }
  if ([...priorities.values()].some(value => value > 3)) ctx.addIssue({ code: "custom", message: "Trois priorités maximum par jour." });
  const references = { actionId: data.actions, experimentId: data.experiments, noteId: data.notes };
  for (const item of [...data.notes, ...data.actions, ...data.results, ...data.suggestions]) {
    for (const [key, items] of Object.entries(references)) {
      const value = key in item ? item[key as keyof typeof item] : null;
      if (value && !items.some(parent => parent.id === value)) ctx.addIssue({ code: "custom", message: "Lien hors du projet." });
    }
  }
});

export type ProjectData = z.infer<typeof dataSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Action = z.infer<typeof actionSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export type Project = { id: string; revision: number; data: ProjectData };

export function newProject(name = "Narrativee"): ProjectData {
  return { name, currency: "EUR", targetCents: 100000, milestonesCents: [10000, 25000, 50000, 75000, 100000], audience: "", offer: "", channels: "", weeklyMinutes: null, deadline: null, notes: [], actions: [], experiments: [], results: [], metrics: [], suggestions: [], reviews: [] };
}

export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function moneyLabel(cents: number | null | undefined, currency: string) {
  return cents == null ? "À renseigner" : new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);
}

export function parseMoney(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Montant invalide (deux décimales maximum).");
  const [whole, decimals = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

export function latestMetrics(data: ProjectData) {
  return [...data.metrics].sort((a, b) => b.date.localeCompare(a.date));
}

export function weekRange(end = today()) {
  const start = new Date(`${end}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  return { start: start.toISOString().slice(0, 10), end };
}
