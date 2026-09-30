import { isIP } from "node:net";

const blockedHostnames = new Set(["localhost", "0.0.0.0"]);

export function normalizePublicUrl(input: string): string {
  const candidate = input.match(/^https?:\/\//i) ? input : `https://${input}`;
  const url = new URL(candidate);
  const hostname = url.hostname.toLowerCase();

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not supported");
  }

  if (blockedHostnames.has(hostname) || hostname.endsWith(".local")) {
    throw new Error("Local URLs are not supported");
  }

  if (isPrivateIp(hostname)) {
    throw new Error("Private network URLs are not supported");
  }

  url.hash = "";
  return url.toString();
}

function isPrivateIp(hostname: string): boolean {
  const version = isIP(hostname);
  if (version === 4) {
    return (
      hostname.startsWith("10.") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("169.254.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  }

  if (version === 6) {
    return (
      hostname === "::1" ||
      hostname.startsWith("fc") ||
      hostname.startsWith("fd") ||
      hostname.startsWith("fe80:")
    );
  }

  return false;
}
