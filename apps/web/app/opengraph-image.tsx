import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Narrativee — Your AI brand designer, always on.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/logo-dark.png"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#ffffff",
          color: "#171717",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={240}
          height={46}
          alt="Narrativee"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-3px",
              lineHeight: 1.1,
            }}
          >
            Your AI brand designer. Always on.
          </div>
          <div style={{ fontSize: 28, color: "#595959" }}>
            Brand identities. Campaigns. Creative assets.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
          }}
        >
          <span style={{ color: "#737373" }}>narrativee.com</span>
          <span>Join the early-access waitlist →</span>
        </div>
      </div>
    ),
    size,
  );
}
