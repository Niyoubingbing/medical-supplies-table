import type { Item } from "./item";

// 多清单数据模型（schemaVersion 2）
// 迁移说明见 lib/storage.ts 与 docs/ARCHITECTURE.md §3

export interface SupplyList {
  id: string;
  name: string;
  items: Item[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  schemaVersion: 2;
  activeListId: string;
  lists: SupplyList[];
}

export const SCHEMA_VERSION = 2;

export const DEFAULT_LIST_NAME = "默认清单";
