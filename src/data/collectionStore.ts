import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "acidex_collections_v1";

export type CollectionMap = Record<string, string[]>;
type Listener = (collections: CollectionMap) => void;

let collections: CollectionMap = {
  
};
const listeners = new Set<Listener>();

function notify() {
  const snapshot = JSON.parse(JSON.stringify(collections)) as CollectionMap;
  listeners.forEach((listener) => listener(snapshot));
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

export const CollectionStore = {
  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        collections = { ...collections, ...(JSON.parse(raw) as CollectionMap) };
      }
      notify();
    } catch (error) {
      console.log("CollectionStore load error:", error);
    }
  },

  getAll(): CollectionMap {
    return JSON.parse(JSON.stringify(collections)) as CollectionMap;
  },

  getNames(): string[] {
    return Object.keys(collections);
  },

  has(collectionName: string, recordId: string): boolean {
    return (collections[collectionName] ?? []).includes(recordId);
  },

  async toggle(collectionName: string, recordId: string): Promise<void> {
    const next = new Set(collections[collectionName] ?? []);
    if (next.has(recordId)) next.delete(recordId);
    else next.add(recordId);
    collections = { ...collections, [collectionName]: Array.from(next) };
    notify();
    await persist();
  },

  async create(collectionName: string, recordIds: string[] = []): Promise<void> {
    const name = collectionName.trim();
    if (!name) return;
    collections = { ...collections, [name]: Array.from(new Set(recordIds)) };
    notify();
    await persist();
  },

  async removeCollection(collectionName: string): Promise<void> {
    if (!collections[collectionName]) return;
    const next = { ...collections };
    delete next[collectionName];
    collections = next;
    notify();
    await persist();
  },

  async setRecords(collectionName: string, recordIds: string[]): Promise<void> {
    if (!collections[collectionName]) return;
    collections = { ...collections, [collectionName]: Array.from(new Set(recordIds)) };
    notify();
    await persist();
  },

  async removeRecordFromAll(recordId: string): Promise<void> {
    const next: CollectionMap = {};
    Object.entries(collections).forEach(([name, ids]) => {
      next[name] = ids.filter((id) => id !== recordId);
    });
    collections = next;
    notify();
    await persist();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(this.getAll());
    return () => listeners.delete(listener);
  },
};
