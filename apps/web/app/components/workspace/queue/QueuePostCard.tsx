"use client";

import { Loader2, Check, Edit3, Calendar, X, Send, Trash2, Clock } from "lucide-react";
import { getPlatformLogo } from "../shared/PlatformLogo";
import type { QueuePost } from "./queue.types";

interface QueuePostCardProps {
  post: QueuePost;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  isSavingEdit: boolean;
  isRescheduling: boolean;
  newDate: string;
  newTime: string;
  onNewDateChange: (v: string) => void;
  onNewTimeChange: (v: string) => void;
  isSavingReschedule: boolean;
  isUnscheduling: boolean;
  isPublishing: boolean;
  isDeletingPost: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onStartReschedule: () => void;
  onCancelReschedule: () => void;
  onSaveReschedule: () => void;
  onUnschedule: () => void;
  onPublishNow: () => void;
  onDelete: () => void;
  formatTime: (d: string) => string;
}

export function QueuePostCard({
  post, isEditing, editText, onEditTextChange, isSavingEdit,
  isRescheduling, newDate, newTime, onNewDateChange, onNewTimeChange, isSavingReschedule,
  isUnscheduling, isPublishing, isDeletingPost,
  onStartEdit, onCancelEdit, onSaveEdit,
  onStartReschedule, onCancelReschedule, onSaveReschedule,
  onUnschedule, onPublishNow, onDelete, formatTime,
}: QueuePostCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0">
            {post.channel?.avatarUrl ? (
              <img src={post.channel.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-zinc-100" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-black border border-zinc-100">
                {(post.channel?.accountName || post.channel?.platform || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white p-0.5 border border-zinc-100">
              <img src={getPlatformLogo(post.channel?.platform)} alt="" className="h-full w-full object-contain" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-800">{post.channel?.accountName || "Social Post Connection"}</h4>
            <span className="text-[12px] text-black block font-light">{post.article?.title || "Repurposed Newsletter"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-zinc-50 border border-zinc-100/80 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
          <Clock className="h-3 w-3 text-zinc-400" />
          <span>{post.scheduledAt ? formatTime(post.scheduledAt) : "Unscheduled"}</span>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea value={editText} onChange={(e) => onEditTextChange(e.target.value)} className="w-full min-h-[120px] rounded-xl border border-zinc-200 p-3 text-xs leading-relaxed text-zinc-800 focus:outline-none font-normal" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancelEdit} className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors">Cancel</button>
            <button type="button" disabled={isSavingEdit} onClick={onSaveEdit} className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50">
              {isSavingEdit ? (<><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>) : (<><Check className="h-3 w-3" /> Save Changes</>)}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">{post.content?.text || ""}</p>
      )}

      {isRescheduling && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 mt-2 grid gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-800"><Calendar className="h-3.5 w-3.5" /> Reschedule Publishing Slot</div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={newDate} onChange={(e) => onNewDateChange(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none" />
            <input type="time" value={newTime} onChange={(e) => onNewTimeChange(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={onCancelReschedule} className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition-colors">Cancel</button>
            <button type="button" disabled={isSavingReschedule} onClick={onSaveReschedule} className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 text-[11px] font-semibold transition-colors">
              {isSavingReschedule ? (<><Loader2 className="h-3 w-3 animate-spin" /> Updating...</>) : (<><Check className="h-3 w-3" /> Reschedule</>)}
            </button>
          </div>
        </div>
      )}

      {!isEditing && !isRescheduling && (
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onStartEdit} className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors"><Edit3 className="h-3.5 w-3.5" /> Edit Text</button>
            <button type="button" onClick={onStartReschedule} className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors ml-3"><Calendar className="h-3.5 w-3.5" /> Reschedule</button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={isUnscheduling} onClick={onUnschedule} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-[10px] font-bold text-zinc-600 transition-colors disabled:opacity-50">
              {isUnscheduling ? (<><Loader2 className="h-3 w-3 animate-spin" /> Drafting...</>) : (<><X className="h-3.5 w-3.5" /> Remove Queue</>)}
            </button>
            <button type="button" disabled={isPublishing} onClick={onPublishNow} className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white px-2.5 py-1 text-[10px] font-bold transition-colors disabled:opacity-50">
              {isPublishing ? (<><Loader2 className="h-3 w-3 animate-spin" /> Sending...</>) : (<><Send className="h-3 w-3" /> Publish Now</>)}
            </button>
            <button type="button" disabled={isDeletingPost} onClick={onDelete} className="text-zinc-400 hover:text-rose-600 transition-colors p-1 ml-1"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
