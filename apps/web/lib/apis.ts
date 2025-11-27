import axios, { AxiosInstance } from "axios";

// --- Types ---

export interface Report {
  id: string;
  name: string;
  fileName: string;
  story: string;
  audience: string;
  reportStyle: string;
  markdownContent?: string;
  createdAt: string;
  metadata?: Record<string, any>; // Better than 'any'
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
  };
  reportId?: string;
  metadata: {
    fileName: string;
    rowCount: number;
    columns: string[];
  };
}

// --- API Service ---

export class ReportAPI {
  private client: AxiosInstance;

  constructor() {
    // 1. Best Practice: Use Env Variables, fallback to localhost
    const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002") + "/api/report";

    this.client = axios.create({
      baseURL,
      withCredentials: true, // Crucial for Better-Auth
    });

    // 2. Best Practice: Global Error Logging (Axios Interceptor)
    // This replaces the repetitive try/catch blocks in every method
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`API Error [${error.config?.url}]:`, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * POST /generate
   */
  async generateReport(params: GenerateReportParams): Promise<GenerateResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("story", params.story);
    formData.append("audience", params.audience);
    formData.append("reportStyle", params.reportStyle);

    // 3. Improvement: Do NOT manually set Content-Type for FormData. 
    // Axios/Browser detects it automatically and adds the required 'boundary' string.
    const { data } = await this.client.post<GenerateResponse>("/generate", formData);
    return data;
  }

  /**
   * GET /my-reports
   */
  async getAllReports(): Promise<Report[]> {
    const { data } = await this.client.get<{ success: boolean; reports: Report[] }>(
      "/my-reports"
    );
    return data.reports;
  }

  /**
   * GET /:reportId
   */
  async getReportById(reportId: string): Promise<Report> {
    const { data } = await this.client.get<{ success: boolean; report: Report }>(
      `/${reportId}`
    );
    return data.report;
  }

  /**
   * PUT /:reportId
   */
  async updateReport(
    reportId: string,
    updates: {
      name?: string;
      markdownContent?: string;
      reportStyle?: 'executive' | 'story' | 'detailed';
    }
  ): Promise<Report> {
    const { data } = await this.client.put<{ success: boolean; report: Report }>(
      `/${reportId}`,
      updates
    );
    return data.report;
  }

  /**
   * DELETE /:reportId
   */
  async deleteReport(reportId: string): Promise<void> {
    await this.client.delete(`/${reportId}`);
  }

  /**
   * POST /migrate
   */
  async migrateLocalReport(data: {
    name: string;
    fileName: string;
    markdownContent: string;
    metadata: any;
  }): Promise<Report> {
    const { data: response } = await this.client.post<{ success: boolean; report: Report }>(
      '/migrate',
      data
    );
    return response.report;
  }

  /**
   * POST /:reportId/share
   */
  async generateShareLink(reportId: string): Promise<{ shareUrl: string; shareId: string }> {
    const { data } = await this.client.post<{ success: boolean; shareUrl: string; shareId: string }>(
      `/${reportId}/share`
    );
    return { shareUrl: data.shareUrl, shareId: data.shareId };
  }

  /**
   * GET /share/:shareId
   */
  async getSharedReport(shareId: string): Promise<Report> {
    const { data } = await this.client.get<{ success: boolean; report: Report }>(
      `/share/${shareId}`
    );
    return data.report;
  }
}

export const reportApi = new ReportAPI();