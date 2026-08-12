import type { Item } from "@/types/item";

const KEY = "medical-supplies-table.items.v1";

export function loadItems(): Item[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) => x && typeof x.id === "string" && typeof x.name === "string"
    );
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}

export function nextNo(items: Item[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.no)) + 1;
}

// 暂存草稿：独立于自动保存的快照，允许条目不完整（缺失字段）
const DRAFT_KEY = "medical-supplies-table.draft.v1";

export function loadDraft(): Item[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x) => x && typeof x.id === "string" && typeof x.name === "string"
    );
  } catch {
    return [];
  }
}

export function saveDraft(items: Item[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function hasDraft(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return false;
  }
}
