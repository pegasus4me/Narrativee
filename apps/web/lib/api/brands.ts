import { API_URL } from "../api-config";

export interface Brand {
  id: string;
  name: string;
  url: string | null;
  analysisId?: string | null;
  provisional: boolean;
  createdAt: string;
  updatedAt: string;
}

export class BrandApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/brands${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new BrandApiError(
      response.status,
      data.error || "Unable to load your brands",
    );
  return data as T;
}

export const listBrands = () => request<Brand[]>("");
export const getBrand = (id: string) =>
  request<Brand>(`/${encodeURIComponent(id)}`);
export const claimBrand = (id: string) =>
  request<Brand>(`/${encodeURIComponent(id)}/claim`, { method: "POST" });
export const brandFromAnalysis = (id: string) =>
  request<Brand>(`/from-analysis/${encodeURIComponent(id)}`, {
    method: "POST",
  });
export const createBrand = (input: {
  name?: string;
  url?: string;
  key: string;
}) => request<Brand>("", { method: "POST", body: JSON.stringify(input) });

export const studioPath = (id: string) =>
  `/workspace/studio?brandId=${encodeURIComponent(id)}`;

export function rememberBrand(brand: Brand) {
  if (brand.provisional)
    window.sessionStorage.setItem("pending_brand_id", brand.id);
}
