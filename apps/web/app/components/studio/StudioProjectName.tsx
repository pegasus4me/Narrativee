"use client";

import { useState } from "react";
import { renameStudioProject } from "@/lib/api/studio";

export default function StudioProjectName({
  projectId,
  title,
  onRenamed,
  onError,
}: {
  projectId: string;
  title: string;
  onRenamed: (title: string) => void;
  onError: (error: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const name = draft.trim();
    if (!name || name === title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    onError(null);
    try {
      const project = await renameStudioProject(projectId, name);
      onRenamed(project.title);
      setEditing(false);
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "Could not rename the project",
      );
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        aria-label="Project name"
        aria-busy={saving}
        disabled={saving}
        maxLength={100}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={() => void save()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setEditing(false);
          }
        }}
        className="h-7 w-40 min-w-0 px-2 text-md text-foreground focus:outline-none w-[40%]"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Rename project: ${title}`}
      title="Rename project"
      onClick={() => {
        setDraft(title);
        setEditing(true);
      }}
      className="min-w-0 truncate rounded-md px-2 py-1 text-sm text-black font-semibold hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {title}
    </button>
  );
}
