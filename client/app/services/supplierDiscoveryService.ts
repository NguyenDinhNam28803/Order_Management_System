const API_BASE = "http://localhost:5000";
// process.env.NEXT_PUBLIC_API_URL ||

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
export type CompanySize = 'STARTUP' | 'SME' | 'ENTERPRISE';
export type SearchPriority = 'PRICE' | 'DELIVERY_SPEED' | 'ISO_CERTIFIED' | 'EXPERIENCE';
export type SupplierStatus = 'IN_SYSTEM' | 'WORKED_BEFORE' | 'NEW';

export interface DiscoverSupplierDto {
  query: string;
  categories?: string[];
  products?: string;
  location?: string;
  companySize?: CompanySize;
  priorities?: SearchPriority[];
  excludeNames?: string[];
  limit?: number;
}

export interface DiscoveredSupplier {
  name: string;
  website: string;
  email?: string;
  phone?: string;
  address?: string;
  province?: string;
  industry?: string;
  products: string[];
  certifications: string[];
  description?: string;
  taxCode?: string;
  aiScore: number;
  aiSummary: string;
  matchReasons: string[];
  sourceUrl: string;
  status: SupplierStatus;
  existingOrgId?: string;
}

export interface DiscoverySearchResult {
  total: number;
  query: string;
  suppliers: DiscoveredSupplier[];
  isDemoData?: boolean;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface ImportSupplierDto {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  province?: string;
  industry?: string;
  taxCode?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
}

function getHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function searchSuppliers(dto: DiscoverSupplierDto): Promise<DiscoverySearchResult> {
  const res = await fetch(`${API_BASE}/supplier-discovery/search`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const json = await res.json() as ApiResponse<DiscoverySearchResult>;
  return json.data;
}

export async function enrichSupplier(url: string, content?: string): Promise<DiscoveredSupplier> {
  const res = await fetch(`${API_BASE}/supplier-discovery/enrich`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ url, content }),
  });
  if (!res.ok) throw new Error(`Enrich failed: ${res.status}`);
  const json = await res.json() as ApiResponse<DiscoveredSupplier>;
  return json.data;
}

export async function importSupplier(dto: ImportSupplierDto): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/supplier-discovery/import`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  const json = await res.json() as ApiResponse<{ id: string }>;
  return json.data;
}

export async function fetchDiscoveryCategories(): Promise<ProductCategory[]> {
  const res = await fetch(`${API_BASE}/supplier-discovery/categories`, {
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Fetch categories failed: ${res.status}`);
  const json = await res.json() as ApiResponse<ProductCategory[]>;
  return json.data;
}
