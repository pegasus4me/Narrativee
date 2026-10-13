import { billingFetch } from "./billing";
import { API_URL } from "../api-config";

export type BrainKind = "rule" | "inspiration" | "feedback";
export type BrainCategory =
  | "identity"
  | "color"
  | "typography"
  | "imagery"
  | "voice"
  | "layout"
  | "other";
export type BrainItem = {
  id: string;
  kind: BrainKind;
  category: BrainCategory;
  content: string;
  createdAt: string;
  source: "user" | "discovery";
  sourceUrl: string | null;
};
export type BrainAsset = {
  id: string;
  productId?: string | null;
  kind: "rule" | "inspiration";
  category: BrainCategory;
  caption: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  createdAt: string;
  source: "user" | "discovery";
  sourceUrl: string | null;
};
export type BrandProduct = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};
export type BrandBrain = {
  items: BrainItem[];
  assets: BrainAsset[];
  products?: BrandProduct[];
};

async function request<T>(
  brandId: string,
  path = "",
  init?: RequestInit,
): Promise<T> {
  const response = await billingFetch(
    `${API_URL}/brands/${encodeURIComponent(brandId)}/brain${path}`,
    {
      ...init,
      credentials: "include",
      cache: "no-store",
    },
  );
  if (response.status === 204) return undefined as T;
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Brand Brain request failed");
  return data;
}

export const getBrandBrain = (brandId: string) => request<BrandBrain>(brandId);
export const syncWebsiteBrain = (brandId: string) =>
  request<{ imported: number; warnings: string[] }>(brandId, "/sync", {
    method: "POST",
  });
export const approveBrainItem = (brandId: string, id: string) =>
  request<BrainItem>(brandId, `/items/${encodeURIComponent(id)}/approve`, {
    method: "POST",
  });
export const approveBrainAsset = (brandId: string, id: string) =>
  request<void>(brandId, `/assets/${encodeURIComponent(id)}/approve`, {
    method: "POST",
  });
export const addBrainItem = (
  brandId: string,
  item: Pick<BrainItem, "kind" | "category" | "content">,
) =>
  request<BrainItem>(brandId, "/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
export const updateBrainItem = (brandId: string, id: string, content: string) =>
  request<BrainItem>(brandId, `/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
export const archiveBrainItem = (brandId: string, id: string) =>
  request<void>(brandId, `/items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
export const createBrandProduct = (
  brandId: string,
  product: Pick<BrandProduct, "name" | "description">,
) =>
  request<BrandProduct>(brandId, "/products", {
    method: "POST",
    body: JSON.stringify(product),
    headers: { "Content-Type": "application/json" },
  });
export const updateBrandProduct = (
  brandId: string,
  id: string,
  product: Pick<BrandProduct, "name" | "description">,
) =>
  request<BrandProduct>(brandId, `/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(product),
    headers: { "Content-Type": "application/json" },
  });
export const archiveBrandProduct = (brandId: string, id: string) =>
  request<void>(brandId, `/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
export const uploadBrainAsset = (
  brandId: string,
  file: File,
  kind: "rule" | "inspiration",
  category: BrainCategory,
  caption: string,
  productId?: string,
) => {
  const params = new URLSearchParams({ kind, category, caption });
  if (productId) params.set("productId", productId);
  return request<BrainAsset>(brandId, `/assets?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      "X-Filename": encodeURIComponent(file.name),
    },
    body: file,
  });
};
export const archiveBrainAsset = (brandId: string, id: string) =>
  request<void>(brandId, `/assets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
export const brainAssetUrl = (brandId: string, id: string) =>
  `${API_URL}/brands/${encodeURIComponent(brandId)}/brain/assets/${encodeURIComponent(id)}`;
