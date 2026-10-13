import {
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
} from "openai";
import { asAccessError } from "../billing/catalog";
import { MediaModelError } from "./media-models";

// Keep provider payloads, credentials and database errors in server logs.
export function agentFailureMessage(error: unknown) {
  const access = asAccessError(error);
  if (access) return access.message;
  // Campaign errors preserve the SDK error that caused the failure.
  for (let depth = 0; depth < 5; depth++) {
    if (error instanceof APIError || error instanceof MediaModelError) break;
    if (!error || typeof error !== "object" || !("cause" in error)) break;
    error = error.cause;
  }
  if (error instanceof MediaModelError) return error.message;
  if (error instanceof APIConnectionTimeoutError)
    return "The agent's response timed out. Your saved canvas was kept.";
  if (error instanceof APIConnectionError)
    return "The agent could not reach its AI provider. Your saved canvas was kept.";
  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403)
      return "The AI provider rejected access. Check the backend API key and access to the selected agent model.";
    if (error.status === 404)
      return "The selected agent model is unavailable. Choose an available model in that agent's settings.";
    if (error.status === 429)
      return error.code === "insufficient_quota"
        ? "The AI provider has no available credits. Check the backend provider account before retrying."
        : "The AI provider is rate-limiting requests. Wait a moment before retrying.";
    if (error.code === "context_length_exceeded")
      return "The conversation exceeds the selected model's limit. Start a new creation chat for this brief.";
    if (error.status === 400)
      return "The selected agent model rejected this request. Check its model settings; your saved canvas was kept.";
    if (error.status && error.status >= 500)
      return "The AI provider is temporarily unavailable. Your saved canvas was kept.";
  }
  return "The creative team could not complete this step. Your saved canvas was kept.";
}
