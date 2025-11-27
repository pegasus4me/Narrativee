import axios, { AxiosInstance } from "axios";

// Types based on your backend response structure
export interface Report {
  id: string;
  name: string;
  fileName: string;
  story: string;
  audience: string;
  reportStyle: string;
  markdownContent?: string;
  createdAt: string;
  metadata?: any;
  shareId?: string;
  isShared?: boolean;
  sharedAt?: string;
  viewCount?: number;
  lastViewedAt?: string;
}

export interface GenerateReportParams {
  file: File;
  story: string;
  audience: string;
  reportStyle: string;
}

export interface GenerateResponse {
  success: boolean;
  template: {
    id: string;
    name: string;
    markdown: string;
    // other template fields
  };
  reportId?: string;
  metadata: {
    fileName: string;
    rowCount: number;
    columns: string[];
  };
}

export class ReportAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "http://localhost:3002/api/report",
      // Important: This allows cookies (Better Auth session) to be sent to the backend
      withCredentials: true, 
    });
  }

  /**
   * POST /generate
   * Uploads a CSV file and generates a report
   */
  async generateReport(params: GenerateReportParams): Promise<GenerateResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("story", params.story);
    formData.append("audience", params.audience);
    formData.append("reportStyle", params.reportStyle);

    try {
      const { data } = await this.client.post<GenerateResponse>("/generate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  }

  /**
   * GET /my-reports
   * Fetches all reports for the authenticated user
   */
  async getAllReports(): Promise<Report[]> {
    try {
      // The backend returns { success: true, reports: [...] }
      const { data } = await this.client.get<{ success: boolean; reports: Report[] }>(
        "/my-reports"
      );
      return data.reports;
    } catch (error) {
      console.error("Error fetching reports:", error);
      throw error;
    }
  }

  /**
   * GET /:reportId
   * Fetches a specific report by ID
   */
  async getReportById(reportId: string): Promise<Report> {
    try {
      // The backend returns { success: true, report: { ... } }
      const { data } = await this.client.get<{ success: boolean; report: Report }>(
        `/${reportId}`
      );
      return data.report;
    } catch (error) {
      console.error(`Error fetching report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * PUT /:reportId
   * Updates a specific report
   */
  async updateReport(
    reportId: string,
    updates: {
      name?: string;
      markdownContent?: string;
      reportStyle?: 'executive' | 'story' | 'detailed';
    }
  ): Promise<Report> {
    try {
      const { data } = await this.client.put<{ success: boolean; report: Report }>(
        `/${reportId}`,
        updates
      );
      return data.report;
    } catch (error) {
      console.error(`Error updating report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * DELETE /:reportId
   * Deletes a specific report
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      await this.client.delete(`/${reportId}`);
    } catch (error) {
      console.error(`Error deleting report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * POST /migrate
   * Migrates a localStorage report to the database
   */
  async migrateLocalReport(data: {
    name: string;
    fileName: string;
    markdownContent: string;
    metadata: any;
  }): Promise<Report> {
    try {
      const { data: response } = await this.client.post<{ success: boolean; report: Report }>(
        '/migrate',
        data
      );
      return response.report;
    } catch (error) {
      console.error('Error migrating report:', error);
      throw error;
    }
  }

  /**
   * POST /:reportId/share
   * Generates a shareable link for a report
   */
  async generateShareLink(reportId: string): Promise<{ shareUrl: string; shareId: string }> {
    try {
      const { data } = await this.client.post<{ success: boolean; shareUrl: string; shareId: string }>(
        `/${reportId}/share`
      );
      return { shareUrl: data.shareUrl, shareId: data.shareId };
    } catch (error) {
      console.error('Error generating share link:', error);
      throw error;
    }
  }

  /**
   * GET /share/:shareId
   * Fetches a shared report (public, no auth required)
   */
  async getSharedReport(shareId: string): Promise<Report> {
    try {
      const { data } = await this.client.get<{ success: boolean; report: Report }>(
        `/share/${shareId}`
      );
      return data.report;
    } catch (error) {
      console.error('Error fetching shared report:', error);
      throw error;
    }
  }
}

export const reportApi = new ReportAPI();