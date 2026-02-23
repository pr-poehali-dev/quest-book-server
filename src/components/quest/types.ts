export const API = "https://functions.poehali.dev/2f2c6c49-83e3-4b16-a65e-e7568c82acd4";

export type Rarity = "common" | "rare" | "epic";

export interface Quest {
  id: number;
  title: string;
  description: string;
  reward: string;
  xp: number;
  rarity: Rarity;
  icon: string;
  sort_order: number;
  status?: "completed" | "active" | "locked";
}

export interface Branch {
  id: number;
  title: string;
  icon: string;
  color: string;
  description: string;
  sort_order: number;
  quests: Quest[];
}

export async function apiFetch(path: string, opts?: RequestInit, adminKey?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) headers["X-Admin-Key"] = adminKey;
  const url = `${API}${path}`;
  try {
    const res = await fetch(url, { ...opts, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (e) {
    console.error(`Fetch error: ${e} for ${url}`);
    throw e;
  }
}