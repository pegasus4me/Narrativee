"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReportEditor from "../../workspace/components/lexical/ReportEditor";
import { reportApi } from "../../../lib/apis";
import Image from "next/image";
import logo from "../../../public/logo.png";
import { Eye } from "clicons-react";
import Link from "next/link";
interface Template {
  id: string;
  name: string;
  description: string;
  markdown: string;
}

export default function SharedReportPage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [reportData, setReportData] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        console.log('🔍 Fetching shared report:', shareId);

        const report = await reportApi.getSharedReport(shareId);
        console.log('✅ Fetched shared report:', report);

        // Transform backend report to frontend format
        const template: Template = {
          id: report.id,
          name: report.name,
          description: `${report.audience} - ${report.reportStyle}`,
          markdown: report.markdownContent || '',
        };

        setReportData(template);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error fetching shared report:', error);
        setError('Report not found or has been unshared.');
        setIsLoading(false);
      }
    };

    if (shareId) {
      fetchSharedReport();
    }
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Loading Report
          </h2>
          <p className="text-gray-600">
            Fetching the shared report...
          </p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Report Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'This report does not exist or has been unshared.'}
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors inline-block"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* View-Only Banner */}
      <div className="bg-amber-50 px-4 py-1 text-center">
        <div className="flex items-center justify-center gap-2">
        <Eye size={20} className="text-amber-700"/>  
          <span className="text-sm font-medium text-amber-700">
            You are viewing this report in read-only mode
          </span>
        </div>
      </div>

      {/* Simple Header */}
      <header className=" px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Image src={logo} alt="logo" width={140} />
          <Link
            href="/"
            className="px-4 py-2 bg-amber-500 text-black rounded-lg border hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            Create Your Own Report
          </Link>
        </div>
      </header>

      {/* Report Content */}
      <main className="flex-1 overflow-auto mt-5">
        <ReportEditor
          template={reportData}
          reportId={shareId}
          readOnly={true}
        />
      </main>
    </div>
  );
}
