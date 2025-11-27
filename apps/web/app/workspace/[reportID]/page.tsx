"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReportEditor from "../components/lexical/ReportEditor";
import { authClient } from "../../../lib/auth-client";
import { reportApi } from "../../../lib/apis";
import Image from "next/image";
import logo from "../../../public/sidelogo.png"
interface Template {
  id: string;
  name: string;
  description: string;
  markdown: string;
  sections?: any[];
}

interface ReportData {
  success: boolean;
  template: Template;
  metadata: {
    fileName: string;
    rowCount: number;
    columns: string[];
  };
}

export default function WorkspacePage() {
  const params = useParams();
  const reportId = params.reportID as string;
  const { data: session } = authClient.useSession();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if reportId is a valid UUID
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  useEffect(() => {
    console.log('Workspace page loaded for reportId:', reportId);

    const loadReportData = async () => {
      try {
        // If authenticated AND reportId is UUID, fetch from backend
        if (session?.user && isValidUUID(reportId)) {
          console.log('🔄 Fetching report from backend (authenticated user)...');

          const report = await reportApi.getReportById(reportId);
          console.log('✅ Fetched report from backend:', report);

          // Transform backend report to match frontend format
          const data: ReportData = {
            success: true,
            template: {
              id: report.id,
              name: report.name,
              description: `${report.audience} - ${report.reportStyle}`,
              markdown: report.markdownContent || '',
            },
            metadata: {
              fileName: report.fileName,
              rowCount: 0,
              columns: [],
              ...report.metadata, // Spread metadata to override defaults if they exist
            }
          };

          setReportData(data);
          setIsLoading(false);
        } else {
          // Anonymous user or localStorage report - load from localStorage
          console.log('📦 Loading from localStorage (anonymous user or local report)...');

          const storageKey = `report-${reportId}`;
          console.log('Looking for data with key:', storageKey);
          const stored = localStorage.getItem(storageKey);

          if (stored) {
            console.log('Found data in localStorage:', stored.substring(0, 100) + '...');
            const data = JSON.parse(stored);
            console.log('Parsed data:', data);
            console.log('Has template?', !!data.template);
            console.log('Has template.sections?', !!data.template?.sections);
            setReportData(data);
            setIsLoading(false);
          } else {
            console.log('No data found yet, will retry in 1s');
            // Still loading from API
            setTimeout(loadReportData, 1000);
          }
        }
      } catch (error) {
        console.error('Error loading report:', error);
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [reportId, session?.user]);


  return (
    <div className="h-screen flex bg-gray-50">

      {/* Main Editor Area */}
      <main className="flex-1 overflow-hidden bg-[#ffffff]">
        {isLoading ? (
          <div className="flex items-center justify-center flex-col py-20">
            <div>
              <Image src={logo} alt="logo" width={170} className="animate-pulse"/>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2" >
              Generating Your Report
            </h2>
            </div>
            <p className="text-gray-600">
              Our AI is analyzing your data and creating your narrative report...
            </p>
          </div>
        ) : reportData && reportData.template ? (
          <ReportEditor
            template={reportData.template}
            reportId={reportId}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600">Failed to load report data</p>
          </div>
        )}
      </main>
    </div>
  );
}
