"use client";

import { useState } from "react";
import { Calendar, Loader2, X } from "lucide-react";
import TimezoneSelect, { getBrowserTimezone, toUTCISOString } from "@/app/components/workspace/TimezoneSelect";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledAt: string) => void;
  isSubmitting: boolean;
  initialDate?: string;
  initialTime?: string;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  initialDate,
  initialTime = "09:00",
}: ScheduleModalProps) {
  const [date, setDate] = useState(initialDate ?? getDefaultDate());
  const [time, setTime] = useState(initialTime);
  const [timezone, setTimezone] = useState(() => getBrowserTimezone());

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!date || !time) return;
    const scheduledAt = toUTCISOString(date, time, timezone);
    onConfirm(scheduledAt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Schedule Post
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Timezone</label>
            <TimezoneSelect value={timezone} onChange={setTimezone} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !date || !time}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getDefaultDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
