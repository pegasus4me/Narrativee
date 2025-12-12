"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "../hooks/useLocalStorage";
import { authClient } from "../../lib/auth-client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DatasetSelector } from "./powerbi/DatasetSelector";
import { File as FileIcon, BarChart, X, Link, Upload } from "clicons-react";
import { IoCloudUpload } from "react-icons/io5";

export default function FileUploadPrompt() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [powerBIDataset, setPowerBIDataset] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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

  const processFile = (selectedFile: File) => {
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
    setPowerBIDataset(null);
    calculateCost(selectedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
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
      <form onSubmit={handleSubmit} className="relative group pt-6"> {/* Added pt-6 to push content down for shadow/tab effect */}

        {/* Drop Zone / Back Layer */}
        {!file && !powerBIDataset && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`absolute inset-x-0 bottom-0 top-0 z-0 rounded-2xl mb-2 transition-all duration-200 cursor-pointer flex items-start justify-center pt-2 ${dragOver
              ? 'bg-amber-500 border-amber-400 -top-8 shadow-lg'
              : 'bg-amber-300 -top-10 hover:-top-11 hover:border-gray-400'
              }`}
          >
            <div className={`flex items-center gap-2 text-[10px] mb-4 font-medium transition-colors duration-200  ${dragOver ? 'text-amber-600' : 'text-gray-500'}`}>
              <IoCloudUpload size={18} />
              <span>{dragOver ? 'Drop files here' : 'Upload files'}</span>
            </div>
          </div>
        )}

        {/* Attachment preview */}
        {(file || powerBIDataset) && (
          <div className={`mb-1 flex flex-row justify-between gap-2 px-2 py-2 rounded-xl text-sm border ${powerBIDataset ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {powerBIDataset ? <BarChart size={18} className="text-gray-700" /> : <FileIcon size={18} className="text-gray-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-gray-900">
                  {file ? file.name : `${powerBIDataset.dataset.name} - ${powerBIDataset.table}`}
                </p>
                {file && <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Cost Estimate */}
              {estimatedCost !== null && session?.user && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/50 px-2 rounded w-fit mt-1">
                  <span>Estimated cost: <strong>{estimatedCost} credits</strong></span>
                </div>
              )}
              <button
                type="button"
                onClick={removeAttachment}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Input container */}
        <div className="relative shadow-sm hover:shadow-md flex items-end gap-3 p-2 pl-4 bg-white border border-gray-200 rounded-2xl focus-within:border-black focus-within:ring-1 focus-within:ring-black/5 transition-all z-20">

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
            placeholder="Describe the story you want to tell..."
            disabled={uploading}
            className="flex-1 py-3 text-gray-900 placeholder-gray-400 bg-transparent outline-none resize-none disabled:opacity-50 text-base"
          />

          {/* Attachment Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={uploading}
                className="p-2.5 mb-0.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                title="Attach data"
              >
                <Link size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-gray-100">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-lg cursor-pointer py-2.5">
                <FileIcon className="mr-2 h-4 w-4" />
                <span>Import File</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSelectorOpen(true)} className="rounded-lg cursor-pointer py-2.5">
                <BarChart className="mr-2 h-4 w-4" />
                <span>Power BI</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Send button */}
          <button
            type="submit"
            disabled={uploading || (!file && !powerBIDataset && !message)}
            className="p-2.5 mb-0.5 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm"
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
