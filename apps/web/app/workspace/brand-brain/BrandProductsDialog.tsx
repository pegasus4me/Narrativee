"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { BrandProducts } from "./BrandProducts";
import type { BrandBrainController } from "./useBrandBrain";

export function BrandProductsDialog({
  brain,
  brandId,
  onClose,
}: {
  brain: BrandBrainController;
  brandId: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const blocked = busy || brain.busy;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !blocked) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1300] bg-black/25 backdrop-blur-sm" />
        <Dialog.Content
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (blocked) event.preventDefault();
          }}
          className="studio-theme fixed left-1/2 top-1/2 z-[1301] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-dashed border-neutral-200 bg-white p-5 text-foreground shadow-xl outline-none sm:p-8"
        >
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs text-neutral-500">Brand Brain</p>
              <Dialog.Title className="text-xl font-medium">
                Your products
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-neutral-500">
                Save your products here. Your creative team will use their
                descriptions and photos.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={blocked}
                aria-label="Close product library"
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </header>
          {brain.error && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {brain.error}
            </p>
          )}
          <BrandProducts
            brain={brain}
            brandId={brandId}
            startAdd={!brain.data?.products?.length}
            onBusyChange={setBusy}
          />
          <button
            type="button"
            disabled={blocked}
            onClick={onClose}
            className="mt-6 text-sm text-muted-foreground underline underline-offset-4 disabled:opacity-40"
          >
            Back to materials
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
