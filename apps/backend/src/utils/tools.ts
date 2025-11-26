import { CSVRow } from "./csv/csvParser";
export function toCSVString(data: CSVRow[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => Object.values(row).join(","));
  return [headers, ...rows].join("\n");
}