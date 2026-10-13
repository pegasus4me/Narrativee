"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createBrandProduct,
  updateBrandProduct,
  uploadBrainAsset,
  type BrandProduct,
} from "@/lib/api/brand-brain";
import { ProductPhotoPicker } from "./ProductPhotoPicker";

export function ProductForm({
  brandId,
  product,
  onSaved,
  onCancel,
  onBusyChange,
}: {
  brandId: string;
  product?: BrandProduct;
  onSaved: () => Promise<void>;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [savedId, setSavedId] = useState(product?.id);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    onBusyChange?.(saving);
    return () => onBusyChange?.(false);
  }, [saving, onBusyChange]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving || !name.trim() || !description.trim()) return;
    if (
      files.some(
        (file) =>
          file.size > 8 * 1024 * 1024 ||
          !["image/png", "image/jpeg", "image/webp"].includes(file.type),
      )
    ) {
      setError("Choose PNG, JPEG, or WebP photos up to 8 MB each.");
      return;
    }
    setSaving(true);
    setError(null);
    setProgress("Saving product…");
    let id = savedId;
    try {
      const fields = { name: name.trim(), description: description.trim() };
      const saved = id
        ? await updateBrandProduct(brandId, id, fields)
        : await createBrandProduct(brandId, fields);
      id = saved.id;
      setSavedId(id);
      for (let index = 0; index < files.length; index++) {
        const file = files[index]!;
        setProgress(`Uploading photo ${index + 1} of ${files.length}…`);
        await uploadBrainAsset(
          brandId,
          file,
          "rule",
          "imagery",
          `${saved.name}: ${file.name}`.slice(0, 1000),
          id,
        );
        setFiles((remaining) =>
          remaining.filter((candidate) => candidate !== file),
        );
      }
      await onSaved();
    } catch (cause) {
      setError(
        `${id ? "Your product and completed uploads are saved. Retry to finish. " : ""}${cause instanceof Error ? cause.message : "Could not save your product."}`,
      );
    } finally {
      setSaving(false);
      setProgress("");
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="space-y-5 rounded-xl border border-dashed border-neutral-200 p-4 sm:p-5"
    >
      <h3 className="text-base font-medium">
        {product ? "Edit product" : "Add your product"}
      </h3>
      <fieldset disabled={saving} className="space-y-4">
        <label className="block text-sm font-medium">
          Product name
          <input
            required
            maxLength={160}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            placeholder="e.g. Dark chocolate — orange"
            className="mt-2 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-normal outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block text-sm font-medium">
          Description
          <textarea
            required
            maxLength={4000}
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is it? What makes it useful or different? Add the details your agents should know."
            className="mt-2 w-full resize-y rounded-lg border border-neutral-200 bg-white p-3 text-sm font-normal outline-none focus:border-neutral-400"
          />
        </label>
      </fieldset>
      <ProductPhotoPicker files={files} onChange={setFiles} disabled={saving} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={saving || !name.trim() || !description.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save product"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="text-sm text-muted-foreground underline disabled:opacity-40"
        >
          Cancel
        </button>
        {progress && (
          <p role="status" className="text-xs text-neutral-500">
            {progress}
          </p>
        )}
      </div>
    </form>
  );
}
