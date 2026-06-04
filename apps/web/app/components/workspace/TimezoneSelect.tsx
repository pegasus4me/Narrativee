"use client";

import { Globe } from "lucide-react";

// Most common timezones grouped by region
export const TIMEZONES = [
  // Europe
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Europe/Brussels", label: "Brussels (CET/CEST)" },
  { value: "Europe/Zurich", label: "Zurich (CET/CEST)" },
  { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)" },
  { value: "Europe/Warsaw", label: "Warsaw (CET/CEST)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  // Americas
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Denver", label: "Denver (MT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Toronto", label: "Toronto (ET)" },
  { value: "America/Vancouver", label: "Vancouver (PT)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "America/Mexico_City", label: "Mexico City (CST)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART)" },
  { value: "America/Bogota", label: "Bogotá (COT)" },
  // Asia / Pacific
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Mumbai/Delhi (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEDT/AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT/NZST)" },
  // Africa
  { value: "Africa/Cairo", label: "Cairo (EET)" },
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  // UTC
  { value: "UTC", label: "UTC" },
];

/** Resolve the user's browser timezone label, falling back to UTC */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Convert a local date + time string (YYYY-MM-DD, HH:MM) in a given timezone
 * to a UTC ISO string that the backend can store correctly.
 */
export function toUTCISOString(date: string, time: string, timezone: string): string {
  // Use Intl to compute the UTC offset for the chosen timezone at this moment
  const localDateTimeStr = `${date}T${time}:00`;
  // Create a date in the target timezone by formatting + re-parsing
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Build the Date object in the specified timezone
  // We use the trick: interpret the input as if it's in the selected timezone
  const localDate = new Date(localDateTimeStr);
  
  // Get what this date/time looks like in the target timezone
  const parts = formatter.formatToParts(localDate);
  const p: Record<string, string> = {};
  parts.forEach(({ type, value }) => { p[type] = value; });
  
  // The offset between local browser time and the target timezone
  // We convert by building a UTC timestamp for the target timezone wall clock
  const tzString = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  const tzAsUTC = new Date(tzString + "Z"); // treat tz wall clock as UTC temporarily
  const localAsUTC = new Date(localDateTimeStr + "Z"); // treat local input as UTC temporarily
  const offsetMs = tzAsUTC.getTime() - localAsUTC.getTime(); // difference = tz offset
  
  // Apply offset: subtract to get real UTC time
  const realUTC = new Date(localDate.getTime() - offsetMs);
  return realUTC.toISOString();
}

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
  compact?: boolean;
}

export default function TimezoneSelect({ value, onChange, className = "", compact = false }: TimezoneSelectProps) {
  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      <Globe className={`shrink-0 text-zinc-400 ${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-transparent text-zinc-350 focus:outline-none cursor-pointer hover:text-zinc-100 transition-colors ${
          compact ? "text-[10px]" : "text-xs"
        }`}
        style={{ colorScheme: 'dark' }}
        title="Select timezone"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value} className="bg-zinc-950 text-zinc-350">
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
}
