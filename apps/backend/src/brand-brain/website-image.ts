import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import sharp from "sharp";

const maxBytes = 8 * 1024 * 1024;

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a > 0 &&
      a < 224 &&
      a !== 10 &&
      a !== 127 &&
      !(a === 169 && b === 254) &&
      !(a === 172 && b >= 16 && b <= 31) &&
      !(a === 192 && (b === 168 || b === 0)) &&
      !(a === 100 && b >= 64 && b <= 127) &&
      !(a === 198 && (b === 18 || b === 19))
    );
  }
  // Only global unicast IPv6; reject loopback, mapped IPv4, link-local and ULA.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address);
}

export async function normalizeWebsiteImage(bytes: Buffer) {
  if (!bytes.length || bytes.length > maxBytes)
    throw new Error("Website image is too large or empty");
  const metadata = await sharp(bytes, {
    limitInputPixels: 40_000_000,
  }).metadata();
  if (
    !["png", "jpeg", "webp", "svg"].includes(metadata.format ?? "") ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 12000 ||
    metadata.height > 12000
  ) {
    throw new Error("Unsupported website image");
  }
  if (metadata.format === "svg") {
    const svg = bytes.toString("utf8");
    if (
      /<!DOCTYPE|<!ENTITY|<(?:script|foreignObject|image)\b|(?:href\s*=\s*["'](?!#))|url\(\s*["']?(?!#)/i.test(
        svg,
      )
    ) {
      throw new Error("Unsafe SVG references");
    }
  }
  // Rasterize SVG and fully decode other formats; never serve scraped SVG markup.
  const normalized = await sharp(bytes, { limitInputPixels: 40_000_000 })
    .png()
    .toBuffer();
  if (normalized.length > maxBytes)
    throw new Error("Normalized website image is too large");
  return {
    bytes: normalized,
    width: metadata.width,
    height: metadata.height,
    mimeType: "image/png" as const,
  };
}

export async function downloadWebsiteImage(
  reference: string,
  websiteUrl: string,
) {
  if (reference.startsWith("data:")) {
    const match = reference.match(
      /^data:image\/(?:png|jpeg|webp|svg\+xml)(;base64)?,([\s\S]+)$/i,
    );
    if (!match || reference.length > maxBytes * 1.5)
      throw new Error("Unsupported inline website image");
    const bytes = match[1]
      ? Buffer.from(match[2], "base64")
      : Buffer.from(decodeURIComponent(match[2]));
    return normalizeWebsiteImage(bytes);
  }
  const deadline = AbortSignal.timeout(15_000);
  let url = new URL(reference, websiteUrl);
  for (let redirect = 0; redirect <= 3; redirect++) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port))
    )
      throw new Error("Unsupported image URL");
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    // Validate DNS on every redirect and pin the checked address for the request.
    const addresses = await lookup(hostname, { all: true });
    if (
      !addresses.length ||
      addresses.some(({ address }) => !isPublicAddress(address))
    ) {
      throw new Error("Private website image URL is not allowed");
    }
    const approved = addresses[0];
    const result = await new Promise<{ bytes?: Buffer; redirect?: string }>(
      (resolve, reject) => {
        const request = (
          url.protocol === "https:" ? httpsRequest : httpRequest
        )(
          url,
          {
            signal: deadline,
            agent: false,
            family: approved.family,
            lookup: (_hostname, _options, callback) =>
              callback(null, approved.address, approved.family),
            headers: {
              Accept: "image/png,image/jpeg,image/webp,image/svg+xml",
              "User-Agent": "Narrativee-BrandKit/1.0",
            },
          },
          (response) => {
            if (
              [301, 302, 303, 307, 308].includes(response.statusCode ?? 0) &&
              response.headers.location
            ) {
              response.destroy();
              resolve({ redirect: response.headers.location });
              return;
            }
            if (
              response.statusCode !== 200 ||
              Number(response.headers["content-length"] ?? 0) > maxBytes
            ) {
              response.destroy();
              reject(new Error("Website image could not be downloaded"));
              return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            response.on("data", (chunk: Buffer) => {
              size += chunk.length;
              if (size > maxBytes)
                response.destroy(new Error("Website image is too large"));
              else chunks.push(chunk);
            });
            response.on("end", () => resolve({ bytes: Buffer.concat(chunks) }));
            response.on("error", reject);
          },
        );
        request.on("error", reject);
        request.end();
      },
    );
    if (result.bytes) return normalizeWebsiteImage(result.bytes);
    url = new URL(result.redirect!, url);
  }
  throw new Error("Website image redirected too many times");
}
