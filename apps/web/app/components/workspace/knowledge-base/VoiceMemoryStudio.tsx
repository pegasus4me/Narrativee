"use client";

import { Plus, Trash2 } from "lucide-react";
import type { VoiceMemory, VoiceProfile, VoiceSourceItem } from "@/app/types/api";

interface VoiceMemoryStudioProps {
  voiceMemory: VoiceMemory;
  onChange: (voiceMemory: VoiceMemory) => void;
}

const SOURCE_CATEGORIES: Array<{ value: VoiceSourceItem["category"]; label: string }> = [
  { value: "newsletter", label: "Newsletter" },
  { value: "x", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website / Blog" },
  { value: "best-performing", label: "Best-performing content" },
];

const TONE_OPTIONS = ["Direct", "Warm", "Analytical", "Bold", "Story-driven"];
const VOCABULARY_OPTIONS = ["Simple & clear", "Technical", "Conversational", "Premium/editorial", "No jargon"];
const SENTENCE_OPTIONS = ["Mostly short", "Balanced", "Long-form depth"];
const HUMOR_OPTIONS = ["None", "Light", "Dry", "Playful"];
const STANCE_OPTIONS = ["Neutral", "Balanced", "Opinionated"];

/**
 * Renders the voice memory editor with source ingestion and profile controls.
 */
export function VoiceMemoryStudio({ voiceMemory, onChange }: VoiceMemoryStudioProps) {
  const addSource = (): void => {
    onChange({
      ...voiceMemory,
      sources: [...voiceMemory.sources, { category: "newsletter", label: "", content: "", url: "" }],
    });
  };

  const updateSource = (index: number, patch: Partial<VoiceSourceItem>): void => {
    const nextSources = voiceMemory.sources.map((source, sourceIndex) => (
      sourceIndex === index ? { ...source, ...patch } : source
    ));
    onChange({ ...voiceMemory, sources: nextSources });
  };

  const removeSource = (index: number): void => {
    onChange({
      ...voiceMemory,
      sources: voiceMemory.sources.filter((_, sourceIndex) => sourceIndex !== index),
    });
  };

  const updateProfile = (key: keyof VoiceProfile, value: string): void => {
    onChange({
      ...voiceMemory,
      profile: { ...voiceMemory.profile, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-primary/50 p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-100">Voice sources</h3>
          <p className="mt-1 text-sm text-gray-400">Choose a platform and paste a few of your own posts as training samples.</p>
        </div>
        <div className="space-y-4">
          {voiceMemory.sources.map((source, index) => (
            <div key={`${source.category}-${index}`} className="rounded-xl border border-white/10 bg-[#111111] p-4">
              <div className="grid gap-3 sm:grid-cols-1">
                <select
                  value={source.category}
                  onChange={(event) => updateSource(index, { category: event.target.value as VoiceSourceItem["category"] })}
                  className="rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2 text-xs text-gray-200 outline-none focus:border-white/20"
                >
                  {SOURCE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={source.content}
                onChange={(event) => updateSource(index, { content: event.target.value })}
                placeholder={"Paste 3-10 sample posts for this platform.\n\nTip: separate each post with ---"}
                className="mt-3 h-40 w-full rounded-lg border border-white/10 bg-[#0d0d0d] p-3 text-xs leading-relaxed text-gray-200 outline-none focus:border-white/20"
              />
              <button
                type="button"
                onClick={() => removeSource(index)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove source
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSource}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-white/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Add source
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#171717] p-5">
        <h3 className="text-sm font-semibold text-gray-100">Voice profile</h3>
        <p className="mt-1 text-xs text-gray-400">A compact profile: pick defaults fast, then fine-tune only what matters.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <QuickSelect
            label="Tone"
            value={voiceMemory.profile.tone}
            options={TONE_OPTIONS}
            onSelect={(value) => updateProfile("tone", value)}
          />
          <QuickSelect
            label="Vocabulary"
            value={voiceMemory.profile.vocabulary}
            options={VOCABULARY_OPTIONS}
            onSelect={(value) => updateProfile("vocabulary", value)}
          />
          <QuickSelect
            label="Sentence style"
            value={voiceMemory.profile.sentenceLength}
            options={SENTENCE_OPTIONS}
            onSelect={(value) => updateProfile("sentenceLength", value)}
          />
          <QuickSelect
            label="Humor"
            value={voiceMemory.profile.humorLevel}
            options={HUMOR_OPTIONS}
            onSelect={(value) => updateProfile("humorLevel", value)}
          />
          <QuickSelect
            label="Stance"
            value={voiceMemory.profile.opinionatedVsNeutral}
            options={STANCE_OPTIONS}
            onSelect={(value) => updateProfile("opinionatedVsNeutral", value)}
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300">CTA style</label>
            <input
              value={voiceMemory.profile.ctaStyle}
              onChange={(event) => updateProfile("ctaStyle", event.target.value)}
              placeholder="One clear action at the end"
              className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2 text-xs text-gray-200 outline-none focus:border-white/20"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300">Topics to avoid</label>
            <textarea
              value={voiceMemory.profile.topicsToAvoid}
              onChange={(event) => updateProfile("topicsToAvoid", event.target.value)}
              placeholder="Politics, gossip, vague motivation..."
              className="h-20 w-full rounded-lg border border-white/10 bg-[#0d0d0d] p-3 text-xs text-gray-200 outline-none focus:border-white/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300">Frequent phrases</label>
            <textarea
              value={voiceMemory.profile.frequentPhrases}
              onChange={(event) => updateProfile("frequentPhrases", event.target.value)}
              placeholder="“Here’s the playbook”, “No fluff”..."
              className="h-20 w-full rounded-lg border border-white/10 bg-[#0d0d0d] p-3 text-xs text-gray-200 outline-none focus:border-white/20"
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-300">Voice strictness</label>
            <span className="text-xs text-gray-400">{voiceMemory.strictness}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={voiceMemory.strictness}
            onChange={(event) => onChange({ ...voiceMemory, strictness: Number(event.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-white"
          />
        </div>
      </div>
    </div>
  );
}

interface QuickSelectProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}

function QuickSelect({ label, value, options, onSelect }: QuickSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-300">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-white/10 bg-[#0d0d0d] p-2">
        {options.map((option) => {
          const isSelected = value.toLowerCase() === option.toLowerCase();
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-md px-2 py-1 text-[11px] transition-colors ${isSelected ? "bg-white text-black" : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
