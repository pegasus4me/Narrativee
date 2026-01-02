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
  ownerId?: string; // Optional if needed
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

  /**
   * GET /scoring
   */
  async getScoringConfigs(): Promise<any[]> {
    const { data } = await this.client.get<{ configs: any[] }>("/scoring");
    return data.configs;
  }

  /**
   * POST /scoring
   */
  async createScoringConfig(eventName: string, scoreValue: number): Promise<void> {
    await this.client.post("/scoring", { eventName, scoreValue });
  }

  /**
   * DELETE /scoring/:id
   */
  async deleteScoringConfig(id: string): Promise<void> {
    await this.client.delete(`/scoring/${id}`);
  }

  // --- Workflows ---

  /**
   * GET /workflows
   */
  async getWorkflows(): Promise<any[]> {
    const { data } = await this.client.get<{ workflows: any[] }>("/workflows");
    return data.workflows;
  }

  /**
   * POST /workflows (Create or Update)
   */
  async saveWorkflow(workflow: any): Promise<any> {
    const { data } = await this.client.post<{ workflow: any }>("/workflows", workflow);
    return data.workflow;
  }

  /**
   * DELETE /workflows/:id
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.client.delete(`/workflows/${id}`);
  }
}

export const reportApi = new ReportAPI();