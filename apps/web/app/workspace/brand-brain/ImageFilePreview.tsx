"use client";

import { useEffect, useState } from "react";

export function ImageFilePreview({
  file,
  className,
}: {
  file: File;
  className: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  return url ? (
    <img
      src={url}
      alt={`Preview of ${file.name}`}
      width={256}
      height={256}
      className={className}
    />
  ) : (
    <div aria-label="Preparing image preview" className={className} />
  );
}
