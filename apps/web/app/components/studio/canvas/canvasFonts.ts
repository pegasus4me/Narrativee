const loaded = new Map<string, Promise<void>>();

export function loadCanvasFont(
  family: string,
  weight: number | string = 400,
): Promise<void> {
  weight = weight === "bold" ? 700 : weight === "normal" ? 400 : weight;
  const key = `${family}:${weight}`;
  const existing = loaded.get(key);
  if (existing) return existing;
  const pending = new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    const url = new URL("https://fonts.googleapis.com/css2");
    url.searchParams.set("family", `${family}:wght@${weight}`);
    link.href = url.toString();
    const timer = setTimeout(() => fail(), 15_000);
    const fail = () => {
      clearTimeout(timer);
      link.remove();
      loaded.delete(key);
      reject(
        new Error(
          `Font ${family} ${weight} could not be loaded. Check your connection or select another Google Font.`,
        ),
      );
    };
    link.onerror = fail;
    link.onload = () => {
      document.fonts
        .load(`${weight} 16px ${JSON.stringify(family)}`)
        .then((faces) => {
          if (!faces.length) {
            fail();
            return;
          }
          clearTimeout(timer);
          resolve();
        })
        .catch(fail);
    };
    document.head.appendChild(link);
  });
  loaded.set(key, pending);
  return pending;
}
