"use client";

import { useEffect } from "react";

export function useGoogleFontPreview(family: string, weight = "400") {
  useEffect(() => {
    if (!family) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    const url = new URL("https://fonts.googleapis.com/css2");
    url.searchParams.set("family", `${family}:wght@${weight}`);
    url.searchParams.set("display", "swap");
    link.href = url.toString();
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [family, weight]);
}
