import type { JsonObject } from "../common/types.js";
import type { LogLevel, Logger } from "./Logger.js";

export class ConsoleLogger implements Logger {
  constructor(private readonly minimumLevel: LogLevel = "info") {}

  debug(message: string, metadata?: JsonObject): void {
    this.write("debug", message, metadata);
  }

  info(message: string, metadata?: JsonObject): void {
    this.write("info", message, metadata);
  }

  warn(message: string, metadata?: JsonObject): void {
    this.write("warn", message, metadata);
  }

  error(message: string, metadata?: JsonObject): void {
    this.write("error", message, metadata);
  }

  private write(level: LogLevel, message: string, metadata?: JsonObject): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(metadata ? { metadata } : {})
    };

    const line = JSON.stringify(payload);
    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  private shouldLog(level: LogLevel): boolean {
    const rank: Record<LogLevel, number> = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40
    };

    return rank[level] >= rank[this.minimumLevel];
  }
}
