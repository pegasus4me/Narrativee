import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from "openai";
import { asAccessError } from "../billing/catalog";

export function analysisFailureMessage(error: unknown): string {
  const access = asAccessError(error);
  if (access) return access.message;
  // The SDK wraps errors from the metered transport as connection failures.
  for (let depth = 0; depth < 5; depth++) {
    if (
      !(error instanceof APIConnectionError) ||
      !("cause" in error) ||
      !error.cause
    )
      break;
    error = error.cause;
  }
  if (error instanceof APIConnectionTimeoutError)
    return "Brand analysis timed out. Please try again.";
  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403)
      return "The AI provider rejected access. Check the backend API key and model access.";
    if (error.status === 404)
      return "The selected analysis model is unavailable. Check the backend model configuration.";
    if (error.status === 429)
      return error.code === "insufficient_quota"
        ? "The AI provider has no available credits. Check the provider account before retrying."
        : "The AI provider is rate-limiting requests. Wait a moment before retrying.";
    if (error.status === 400)
      return "The AI provider rejected the analysis request. Check the backend logs for details.";
    if (error.status && error.status >= 500)
      return "The AI provider is temporarily unavailable. Please try again.";
    if (error instanceof APIConnectionError)
      return "Brand analysis could not connect to its AI provider. Please try again.";
  }
  if (error instanceof TypeError || error instanceof DOMException)
    return "Brand analysis could not connect to its AI provider. Please try again.";
  return error instanceof Error ? error.message : "Brand analysis failed";
}
