import type { Item } from "@/types/item";
import type { AppState, SupplyList } from "@/types/list";
import { SCHEMA_VERSION, DEFAULT_LIST_NAME } from "@/types/list";
import { v4 as uuidv4 } from "uuid";

const KEY = "medical-supplies-table.lists.v2";
const LEGACY_KEY = "medical-supplies-table.items.v1"; // v1 单清单数据

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function sanitizeItem(x: unknown): Item | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  const metaRaw = o.meta;
  const meta =
    metaRaw && typeof metaRaw === "object"
      ? {
          patient: str((metaRaw as Record<string, unknown>).patient),
          admissionNo: str((metaRaw as Record<string, unknown>).admissionNo),
          dept: str((metaRaw as Record<string, unknown>).dept),
          doctor: str((metaRaw as Record<string, unknown>).doctor),
        }
      : undefined;
  return {
    id: o.id,
    spd: typeof o.spd === "string" ? o.spd : "",
    no: typeof o.no === "number" ? o.no : 0,
    name: o.name,
    spec: typeof o.spec === "string" ? o.spec : "",
    qty: typeof o.qty === "number" ? o.qty : 1,
    unit: typeof o.unit === "string" ? o.unit : "套",
    remark: typeof o.remark === "string" ? o.remark : "",
    meta,
  };
}

function sanitizeList(x: unknown): SupplyList | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  const rawItems = Array.isArray(o.items) ? o.items : [];
  const items = rawItems
    .map(sanitizeItem)
    .filter((i): i is Item => i !== null);
  return {
    id: o.id,
    name: o.name,
    items,
    createdAt: typeof o.createdAt === "number" ? o.createdAt : Date.now(),
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : Date.now(),
  };
}

export function createList(
  name: string,
  items: Item[] = []
): SupplyList {
  const now = Date.now();
  return { id: uuidv4(), name, items, createdAt: now, updatedAt: now };
}

export function suggestedListName(): string {
  // 场景友好默认名：如「8月16日 周日」
  const d = new Date();
  const weekday = "日一二三四五六"[d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekday}`;
}

/** 读取应用状态；含 v1 单清单数据自动迁移。 */
export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        activeListId?: unknown;
        lists?: unknown;
      };
      const rawLists = Array.isArray(parsed?.lists)
        ? (parsed.lists as unknown[])
        : [];
      const lists = rawLists
        .map(sanitizeList)
        .filter((l): l is SupplyList => l !== null);
      if (lists.length > 0) {
        const active =
          typeof parsed.activeListId === "string" &&
          lists.some((l) => l.id === parsed.activeListId)
            ? parsed.activeListId
            : lists[0].id;
        return { schemaVersion: SCHEMA_VERSION, activeListId: active, lists };
      }
    }

    // 迁移 v1：单清单数据 → 默认清单
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as unknown;
      const items = (Array.isArray(parsed) ? parsed : [])
        .map(sanitizeItem)
        .filter((i): i is Item => i !== null);
      const list = createList(DEFAULT_LIST_NAME, items);
      const state: AppState = {
        schemaVersion: SCHEMA_VERSION,
        activeListId: list.id,
        lists: [list],
      };
      const ok = saveState(state);
      if (ok) window.localStorage.removeItem(LEGACY_KEY); // 迁移成功后清理旧键
      return state;
    }
  } catch {
    /* 数据损坏则从空状态开始 */
  }
  return emptyState();
}

function emptyState(): AppState {
  const list = createList(DEFAULT_LIST_NAME);
  return {
    schemaVersion: SCHEMA_VERSION,
    activeListId: list.id,
    lists: [list],
  };
}

/** 持久化；返回是否成功（失败时调用方应提示用户导出备份）。 */
export function saveState(state: AppState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false; // 配额不足等：不静默吞掉，由 UI 提示
  }
}

export function nextNo(items: Item[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.no)) + 1;
}