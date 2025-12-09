"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "../hooks/useLocalStorage";
import { authClient } from "../../lib/auth-client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DatasetSelector } from "./powerbi/DatasetSelector";
import { File as FileIcon, BarChart, X, Link } from "clicons-react";

export default function FileUploadPrompt() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [powerBIDataset, setPowerBIDataset] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [, setSessionData] = useLocalStorage<{
    sessionId?: string;
    story?: string;
    fileName?: string;
    fileSize?: number;
    fileData?: string; // Base64 encoded file
    powerbi?: any; // Power BI dataset info
  }>("narrativee-session", {});

  const { data: session } = authClient.useSession();
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const calculateCost = async (file: File) => {
    if (!session?.user) return;

    // Base costs
    const plan = (session.user as any).plan || 'free';
    const baseCosts: Record<string, number> = {
      free: 5,
      premium: 4,
      pro: 3
    };
    const baseCost = baseCosts[plan] || 5;

    // Count rows (approximate)
    const text = await file.text();
    const rowCount = text.split('\n').length;

    // Formula: Base + ceil(Rows / 300)
    const variableCost = Math.ceil(rowCount / 300);
    setEstimatedCost(baseCost + variableCost);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.spreadsheet", // .ods
        "application/vnd.ms-excel.sheet.binary.macroEnabled.12" // .xlsb
      ];

      const validExtensions = ['.csv', '.xlsx', '.xls', '.ods', '.xlsb'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        alert("Please upload a CSV, Excel, or ODS file");
        return;
      }

      setFile(selectedFile);
      setPowerBIDataset(null); // Only allow one attachment type for now for simplicity, or allow both?
      // Let's allow replacing for now to keep UI simple, or we can support multiple later.
      calculateCost(selectedFile);
    }
  };

  const handlePowerBISelect = (data: any) => {
    console.log("handlePowerBISelect called with:", data);
    setPowerBIDataset(data);
    setFile(null); // Clear file if PBI selected
    // TODO: Calculate cost for Power BI?
    setEstimatedCost(5); // Base cost for now
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file && !powerBIDataset && !message) return;

    setUploading(true);

    try {
      // Convert file to base64 for storage
      let fileData: string | undefined;
      if (file) {
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Generate temporary session ID
      const sessionId = Math.random().toString(36).substring(7);

      // Save to localStorage using the hook
      setSessionData({
        sessionId,
        story: message || undefined,
        fileName: file?.name || undefined,
        fileSize: file?.size || undefined,
        fileData: fileData || undefined,
        powerbi: powerBIDataset || undefined
      });

      // Redirect to intent page
      router.push(`/create`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setFile(null);
    setPowerBIDataset(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto ">
      <form onSubmit={handleSubmit} className="relative">
        {/* Attachment preview */}
        {(file || powerBIDataset) && (
          <div className={`mb-3 flex flex-col gap-2 px-4 py-2 rounded-lg text-sm ${powerBIDataset ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
            <div className="flex items-center gap-2">
              {powerBIDataset ? <BarChart size={16} /> : <FileIcon size={16} />}
              <span className="flex-1 font-medium truncate">
                {file ? file.name : `${powerBIDataset.dataset.name} - ${powerBIDataset.table}`}
              </span>
              {file && <span className="text-xs opacity-70">{(file.size / 1024).toFixed(1)} KB</span>}
              <button
                type="button"
                onClick={removeAttachment}
                className="hover:opacity-70"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cost Estimate */}
            {estimatedCost !== null && session?.user && (
              <div className="flex items-center gap-2 text-xs opacity-80 bg-white/50 px-2 py-1 rounded w-fit">
                <span>Estimated cost: <strong>{estimatedCost} credits</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Input container */}
        <div className="relative shadow-xl flex items-end gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 focus-within:border-amber-400 focus-within:shadow-md transition-all">
          {/* Attachment Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={uploading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Attach data"
              >
                <Link size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileIcon className="mr-2 h-4 w-4" />
                <span>Import File</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSelectorOpen(true)}>
                <BarChart className="mr-2 h-4 w-4 text-amber-600" />
                <span>Power BI</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls,.ods,.xlsb"
            className="hidden"
          />

          {/* Text input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what story you want to tell with your data..."
            disabled={uploading}
            className="flex-1 px-2 py-2 text-gray-900 placeholder-gray-400 bg-transparent outline-none resize-none disabled:opacity-50"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={uploading || (!file && !powerBIDataset && !message)}
            className="p-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      </form>

      <DatasetSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handlePowerBISelect}
      />
    </div>
  );
}
