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
    const baseURL = (process.env.NODE_ENV === "production" ? "https://api.narrativee.com" : "http://localhost:3002") + "/api";

    this.client = axios.create({
      baseURL,
      withCredentials: true, // Crucial for Better-Auth
      timeout: 300000, // 5 minutes to match backend
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
   * POST /report/generate
   */
  async generateReport(params: GenerateReportParams): Promise<GenerateResponse> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("story", params.story);
    formData.append("audience", params.audience);
    formData.append("reportStyle", params.reportStyle);

    // 3. Improvement: Do NOT manually set Content-Type for FormData. 
    // Axios/Browser detects it automatically and adds the required 'boundary' string.
    const { data } = await this.client.post<GenerateResponse>("/report/generate", formData);
    return data;
  }

  /**
   * GET /report/my-reports
   */
  async getAllReports(): Promise<Report[]> {
    const { data } = await this.client.get<{ success: boolean; reports: Report[] }>(
      "/report/my-reports"
    );
    return data.reports;
  }

  /**
   * GET /report/:reportId
   */
  async getReportById(reportId: string): Promise<Report> {
    const { data } = await this.client.get<{ success: boolean; report: Report }>(
      `/report/${reportId}`
    );
    return data.report;
  }

  /**
   * PUT /report/:reportId
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
      `/report/${reportId}`,
      updates
    );
    return data.report;
  }

  /**
   * DELETE /report/:reportId
   */
  async deleteReport(reportId: string): Promise<void> {
    await this.client.delete(`/report/${reportId}`);
  }

  /**
   * POST /report/migrate
   */
  async migrateLocalReport(data: {
    name: string;
    fileName: string;
    markdownContent: string;
    metadata: any;
  }): Promise<Report> {
    const { data: response } = await this.client.post<{ success: boolean; report: Report }>(
      '/report/migrate',
      data
    );
    return response.report;
  }

  /**
   * POST /report/:reportId/share
   */
  async generateShareLink(reportId: string): Promise<{ shareUrl: string; shareId: string }> {
    const { data } = await this.client.post<{ success: boolean; shareUrl: string; shareId: string }>(
      `/report/${reportId}/share`
    );
    return { shareUrl: data.shareUrl, shareId: data.shareId };
  }

  /**
   * GET /report/share/:shareId
   */
  async getSharedReport(shareId: string): Promise<Report> {
    const { data } = await this.client.get<{ success: boolean; report: Report }>(
      `/report/share/${shareId}`
    );
    return data.report;
  }

  /**
   * POST /chat
   */
  async chat(params: {
    question: string;
    reportContent: string;
    reportId: string;
    requestType: "question" | "edit";
  }): Promise<{ answer: string; generatedContent?: string }> {
    const { data } = await this.client.post<{ answer: string; generatedContent?: string }>(
      "/chat",
      params
    );
    return data;
  }

  /**
   * POST /chat/regenerate
   */
  async regenerateReport(params: {
    file: File;
    question: string;
    reportId: string;
    reportContent: string;
  }): Promise<{ success: boolean; newContent: string }> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("question", params.question);
    formData.append("reportId", params.reportId);
    formData.append("reportContent", params.reportContent);

    const { data } = await this.client.post<{ success: boolean; newContent: string }>(
      "/chat/regenerate",
      formData
    );
    return data;
  }

  /**
   * GET /user/credits
   */
  async getUserCredits(): Promise<number> {
    const { data } = await this.client.get<{ success: boolean; credits: number }>(
      "/user/credits"
    );
    return data.credits;
  }

  /**
   * POST /pricing/create-portal-session
   */
  async createPortalSession(): Promise<{ url: string }> {
    const { data } = await this.client.post<{ url: string }>(
      "/pricing/create-portal-session"
    );
    return data;
  }

}

export const reportApi = new ReportAPI();