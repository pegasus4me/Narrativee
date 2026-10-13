const iconBase = "https://cdn.jsdelivr.net/npm/simple-icons@11.15.0/icons";

export const socialPlatformBackgrounds: Record<string, string> = {
  instagram:
    "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
  tiktok: "#000000",
  facebook: "#0866ff",
  linkedin: "#0a66c2",
  x: "#000000",
  youtube: "#ff0000",
  pinterest: "#e60023",
  threads: "#000000",
};

export const socialPlatformLogos: Record<string, string> = Object.fromEntries(
  Object.keys(socialPlatformBackgrounds).map((platform) => [
    platform,
    `${iconBase}/${platform}.svg`,
  ]),
);
