"use client";

import { useState } from "react";
import { Plus, Trash2, Check, Loader2, Settings, HelpCircle } from "lucide-react";
import type { HookItem, TemplateItem } from "@/app/types/api";
import { getPlatformLabel } from "../shared/PlatformLogo";

type SettingsTab = "voice" | "hooks" | "templates" | "banned";

interface KnowledgeBaseEditorProps {
  customHooks: HookItem[];
  customTemplates: TemplateItem[];
  bannedWords: string[];
  brandVoiceTraining: string;
  onChangeHooks: (hooks: HookItem[]) => void;
  onChangeTemplates: (templates: TemplateItem[]) => void;
  onChangeBannedWords: (words: string[]) => void;
  onChangeBrandVoice: (voice: string) => void;
  onSave: () => void;
  saving: boolean;
  saveSuccess: boolean;
  loading: boolean;
}

export function KnowledgeBaseEditor({
  customHooks,
  customTemplates,
  bannedWords,
  brandVoiceTraining,
  onChangeHooks,
  onChangeTemplates,
  onChangeBannedWords,
  onChangeBrandVoice,
  onSave,
  saving,
  saveSuccess,
  loading,
}: KnowledgeBaseEditorProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("voice");
  const [selectedChannel, setSelectedChannel] = useState("linkedin");
  const [newHook, setNewHook] = useState("");
  const [newTemplate, setNewTemplate] = useState("");
  const [newBannedWord, setNewBannedWord] = useState("");

  const addHook = () => {
    if (!newHook.trim()) return;
    onChangeHooks([...customHooks, { channel: selectedChannel, hook: newHook.trim() }]);
    setNewHook("");
  };

  const removeHook = (index: number) => {
    onChangeHooks(customHooks.filter((_, i) => i !== index));
  };

  const addTemplate = () => {
    if (!newTemplate.trim()) return;
    onChangeTemplates([...customTemplates, { channel: selectedChannel, template: newTemplate.trim() }]);
    setNewTemplate("");
  };

  const removeTemplate = (index: number) => {
    onChangeTemplates(customTemplates.filter((_, i) => i !== index));
  };

  const addBannedWord = () => {
    if (!newBannedWord.trim()) return;
    const word = newBannedWord.trim().toLowerCase();
    if (!bannedWords.includes(word)) {
      onChangeBannedWords([...bannedWords, word]);
    }
    setNewBannedWord("");
  };

  const removeBannedWord = (word: string) => {
    onChangeBannedWords(bannedWords.filter((w) => w !== word));
  };

  const addPresetWord = (word: string) => {
    if (!bannedWords.includes(word)) {
      onChangeBannedWords([...bannedWords, word]);
    }
  };

  const TABS: { key: SettingsTab; label: string }[] = [
    { key: "voice", label: "Agent Brand Voice" },
    { key: "hooks", label: "Custom Hooks" },
    { key: "templates", label: "Custom Templates" },
    { key: "banned", label: "Banned Words" },
  ];

  return (
    <section className="overflow-hidden">
      <div className="border-b border-zinc-100 bg-linear-to-b from-zinc-50/50 to-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Knowledge Base</h3>
          </div>
        </div>
        <button
          type="button"
          disabled={saving || loading}
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 shrink-0 shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving Changes...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Changes Saved!
            </>
          ) : (
            <>
              <Settings className="h-3.5 w-3.5" />
              Save Brand Profile
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-600" />
          <p className="mt-2 text-xs">Loading your custom brand preferences...</p>
        </div>
      ) : (
        <div className="grid min-w-0 md:grid-cols-[220px_1fr] divide-y md:divide-y-0 md:divide-x divide-zinc-100">
          <div className="p-4 bg-zinc-50/40 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`w-full rounded-xl px-3.5 py-3 text-xs font-semibold transition-all text-left whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === tab.key
                    ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8 min-w-0">
            {activeTab === "voice" && (
              <VoiceTab value={brandVoiceTraining} onChange={onChangeBrandVoice} />
            )}
            {activeTab === "hooks" && (
              <HooksTab
                hooks={customHooks}
                selectedChannel={selectedChannel}
                onSelectChannel={setSelectedChannel}
                newHook={newHook}
                onChangeNewHook={setNewHook}
                onAdd={addHook}
                onRemove={removeHook}
              />
            )}
            {activeTab === "templates" && (
              <TemplatesTab
                templates={customTemplates}
                selectedChannel={selectedChannel}
                onSelectChannel={setSelectedChannel}
                newTemplate={newTemplate}
                onChangeNewTemplate={setNewTemplate}
                onAdd={addTemplate}
                onRemove={removeTemplate}
              />
            )}
            {activeTab === "banned" && (
              <BannedWordsTab
                words={bannedWords}
                newWord={newBannedWord}
                onChangeNewWord={setNewBannedWord}
                onAdd={addBannedWord}
                onRemove={removeBannedWord}
                onAddPreset={addPresetWord}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ChannelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs bg-white text-zinc-800 font-semibold focus:outline-none"
    >
      <option value="linkedin">LinkedIn</option>
      <option value="x">X</option>
      <option value="threads">Threads</option>
      <option value="instagram">Instagram</option>
    </select>
  );
}

function VoiceTab({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h4 className="text-sm font-bold text-zinc-900">Custom Brand Voice Guidelines</h4>
        <p className="text-xs text-zinc-500 font-light mt-0.5">
          Upload style sheets, successful newsletters, viral hooks, or tone training narratives.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"Example tone guide:\n- Write in dense, highly punchy, actionable sentences.\n- Use double line breaks between sentences for maximum scannability.\n- Avoid corporate jargon, instead use raw and transparent language.\n- Emulate this exact style: 'I spent 40 hours reading about X so you don't have to. Here's what I learned...'"}
        className="w-full h-80 rounded-xl border border-zinc-200 bg-white p-4 text-xs leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal"
      />
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 flex gap-3">
        <HelpCircle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-500 leading-normal">
          <strong>Pro tip:</strong> Paste one of your high-performing articles or tweets in full, and prefix it with{" "}
          <em>&quot;Write exactly in this person&apos;s voice, formatting structure, vocabulary style, and tone:&quot;</em>.
        </p>
      </div>
    </div>
  );
}

interface HooksTabProps {
  hooks: HookItem[];
  selectedChannel: string;
  onSelectChannel: (ch: string) => void;
  newHook: string;
  onChangeNewHook: (v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

function HooksTab({ hooks, selectedChannel, onSelectChannel, newHook, onChangeNewHook, onAdd, onRemove }: HooksTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-sm font-bold text-zinc-900">Upload Custom Hooks</h4>
        <p className="text-xs text-zinc-500 font-light mt-0.5">
          Provide customized hook formulas for specific social platforms to ensure your generated posts grab attention.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <ChannelSelect value={selectedChannel} onChange={onSelectChannel} />
        <input
          type="text"
          value={newHook}
          onChange={(e) => onChangeNewHook(e.target.value)}
          placeholder="e.g. Most people think [Topic] is easy. Here is why they are wrong:"
          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Hook
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <h5 className="text-[11px] font-bold text-zinc-400 mt-2">Active Hooks</h5>
        {hooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-zinc-50/10">
            <p className="text-xs text-zinc-400">No custom hooks added.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {hooks.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 p-3 bg-white hover:border-zinc-200 transition-colors">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-bold text-zinc-600 uppercase shrink-0 mt-0.5">
                    {getPlatformLabel(item.channel)}
                  </span>
                  <p className="text-xs text-zinc-800 font-normal truncate">{item.hook}</p>
                </div>
                <button type="button" onClick={() => onRemove(idx)} className="text-zinc-400 hover:text-rose-600 transition-colors p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplatesTabProps {
  templates: TemplateItem[];
  selectedChannel: string;
  onSelectChannel: (ch: string) => void;
  newTemplate: string;
  onChangeNewTemplate: (v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

function TemplatesTab({ templates, selectedChannel, onSelectChannel, newTemplate, onChangeNewTemplate, onAdd, onRemove }: TemplatesTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-sm font-bold text-zinc-900">Upload Custom Post Templates</h4>
        <p className="text-xs text-zinc-500 font-light mt-0.5">
          Define specific vertical structures or line breaks layout for platform-native output.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <ChannelSelect value={selectedChannel} onChange={onSelectChannel} />
          <span className="text-xs text-zinc-400">Define the block layout for this platform below:</span>
        </div>
        <textarea
          value={newTemplate}
          onChange={(e) => onChangeNewTemplate(e.target.value)}
          placeholder={"e.g.\n[Bold Claim Hook Line]\n\nWhy this happens: [Core Angle Detail]\n\n\u26A1 [Step 1 Takeaway]\n\uD83D\uDCA1 [Actionable Blueprint]\n\nWhat do you think? Let's discuss."}
          className="w-full h-36 rounded-xl border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-800 focus:border-zinc-300 focus:outline-none focus:ring-0 font-normal"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Template
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h5 className="text-[11px] font-bold text-zinc-400 mt-2">Active Templates</h5>
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-zinc-50/10">
            <p className="text-xs text-zinc-400">No custom templates defined.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {templates.map((item, idx) => (
              <div key={idx} className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-100 p-4 bg-white hover:border-zinc-200 transition-colors">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-bold text-zinc-600 uppercase">
                    {getPlatformLabel(item.channel)}
                  </span>
                  <button type="button" onClick={() => onRemove(idx)} className="text-zinc-400 hover:text-rose-600 transition-colors p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <pre className="text-[11px] text-zinc-800 font-normal font-sans whitespace-pre-wrap leading-relaxed">
                  {item.template}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface BannedWordsTabProps {
  words: string[];
  newWord: string;
  onChangeNewWord: (v: string) => void;
  onAdd: () => void;
  onRemove: (word: string) => void;
  onAddPreset: (word: string) => void;
}

const PRESET_BANNED_WORDS = ["delve", "testament", "tapestry", "revolutionize", "beacon", "in today's world", "synergy"];

function BannedWordsTab({ words, newWord, onChangeNewWord, onAdd, onRemove, onAddPreset }: BannedWordsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="text-sm font-bold text-zinc-900">Ban Words & Phrases</h4>
        <p className="text-xs text-zinc-500 font-light mt-0.5">
          Tell the social media agent to strictly avoid generic words, clich\u00E9s, or specific terms you dislike.
        </p>
      </div>
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={newWord}
          onChange={(e) => onChangeNewWord(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="e.g. delve"
          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Ban Word
        </button>
      </div>
      <div>
        <h5 className="text-[10px] font-bold text-zinc-400 mb-2">Curated Clich\u00E9 Banishments (Click to add)</h5>
        <div className="flex flex-wrap gap-2">
          {PRESET_BANNED_WORDS.map((w) => (
            <button
              type="button"
              key={w}
              onClick={() => onAddPreset(w)}
              disabled={words.includes(w)}
              className="rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-40"
            >
              + {w}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-2">
        <h5 className="text-[11px] font-bold text-zinc-400">Currently Prohibited Vocabulary</h5>
        {words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-zinc-200 text-center bg-zinc-50/10">
            <p className="text-xs text-zinc-400">No banned words declared.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {words.map((word) => (
              <div key={word} className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 shadow-2xs">
                <span>{word}</span>
                <button type="button" onClick={() => onRemove(word)} className="text-rose-500 hover:text-rose-900 transition-colors rounded-full">
                  <Plus className="h-3 w-3 rotate-45" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
