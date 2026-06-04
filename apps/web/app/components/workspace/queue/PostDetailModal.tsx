"use client";

import { Loader2, Edit3, Calendar, X, Send, Trash2, Clock } from "lucide-react";
import { getPlatformLogo } from "../shared/PlatformLogo";
import type { QueuePost } from "./queue.types";

interface PostDetailModalProps {
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
  onClose: () => void;
  formatTime: (d: string) => string;
}

export function PostDetailModal({
  post, isEditing, editText, onEditTextChange, isSavingEdit,
  isRescheduling, newDate, newTime, onNewDateChange, onNewTimeChange, isSavingReschedule,
  isUnscheduling, isPublishing, isDeletingPost,
  onStartEdit, onCancelEdit, onSaveEdit,
  onStartReschedule, onCancelReschedule, onSaveReschedule,
  onUnschedule, onPublishNow, onDelete, onClose, formatTime,
}: PostDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-850 bg-[#09090b] p-7 animate-in zoom-in-95 duration-150 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0">
              {post.channel?.avatarUrl ? (
                <img src={post.channel.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover border border-zinc-800" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-800">
                  {(post.channel?.accountName || post.channel?.platform || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 p-0.5 border border-zinc-800">
                <img src={getPlatformLogo(post.channel?.platform)} alt="" className="h-full w-full object-contain" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100 leading-none">{post.channel?.accountName || "Social Connection"}</h4>
              <span className="text-[11px] text-zinc-400 block mt-1 truncate max-w-[240px]">{post.article?.title || "Repurposed Newsletter"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
              <Clock className="h-3 w-3 text-zinc-500" />
              <span>{post.scheduledAt ? formatTime(post.scheduledAt) : "Unscheduled"}</span>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2.5">
            <textarea value={editText} onChange={(e) => onEditTextChange(e.target.value)} className="w-full min-h-[220px] rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs leading-relaxed text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#e99ab1] font-normal font-sans" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onCancelEdit} className="rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-zinc-200">Cancel</button>
              <button type="button" disabled={isSavingEdit} onClick={onSaveEdit} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#e99ab1] hover:bg-[#e99ab1]/90 text-white px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-50">
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 min-h-[180px] max-h-[300px] overflow-y-auto">
            <p className="text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">{post.content?.text || ""}</p>
          </div>
        )}

        {isRescheduling && (
          <div className="rounded-xl border border-[#e99ab1]/20 bg-[#e99ab1]/5 p-4 grid gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#e99ab1]"><Calendar className="h-3.5 w-3.5" /> Select New Publishing Date & Time</div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={newDate} onChange={(e) => onNewDateChange(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#e99ab1]/50" style={{ colorScheme: 'dark' }} />
              <input type="time" value={newTime} onChange={(e) => onNewTimeChange(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#e99ab1]/50" style={{ colorScheme: 'dark' }} />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={onCancelReschedule} className="rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-zinc-200">Cancel</button>
              <button type="button" disabled={isSavingReschedule} onClick={onSaveReschedule} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#e99ab1] hover:bg-[#e99ab1]/90 text-white px-3 py-1.5 text-[11px] font-bold transition-colors">
                {isSavingReschedule ? "Updating..." : "Reschedule"}
              </button>
            </div>
          </div>
        )}

        {!isEditing && !isRescheduling && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80 mt-1 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onStartEdit} className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"><Edit3 className="h-4 w-4" /> Edit Text</button>
              <button type="button" onClick={onStartReschedule} className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"><Calendar className="h-4 w-4" /> Reschedule</button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={isUnscheduling} onClick={onUnschedule} className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-zinc-450 hover:text-zinc-200 transition-colors disabled:opacity-50">
                {isUnscheduling ? "Drafting..." : "Unschedule"}
              </button>
              <button type="button" disabled={isPublishing} onClick={onPublishNow} className="inline-flex items-center gap-1 rounded-lg bg-[#e99ab1] hover:bg-[#e99ab1]/90 text-white px-3 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50">
                {isPublishing ? "Sending..." : "Publish Now"}
              </button>
              <button type="button" disabled={isDeletingPost} onClick={onDelete} className="text-zinc-400 hover:text-rose-600 transition-colors p-1 ml-1"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
