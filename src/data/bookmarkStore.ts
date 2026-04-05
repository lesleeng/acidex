import AsyncStorage from "@react-native-async-storage/async-storage";
import { AnalysisRecord } from "@/src/types/analysis";

// ─── BookmarkStore ────────────────────────────────────────────────────────────
// Lightweight in-memory store backed by AsyncStorage.
// Consumers (Results screen, a future Bookmarks screen) can call:
//   BookmarkStore.add(record)
//   BookmarkStore.remove(id)
//   BookmarkStore.isBookmarked(id)
//   BookmarkStore.getAll()
//   BookmarkStore.subscribe(listener)   ← called whenever the list changes
//   BookmarkStore.load()               ← call once at app startup to hydrate

const STORAGE_KEY = "acidex_bookmarks";

type Listener = (bookmarks: AnalysisRecord[]) => void;

let _bookmarks: AnalysisRecord[] = [];
const _listeners = new Set<Listener>();

function _notify() {
  _listeners.forEach((fn) => fn([..._bookmarks]));
}

async function _persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_bookmarks));
  } catch (err) {
    console.warn("[BookmarkStore] persist error:", err);
  }
}

export const BookmarkStore = {
  /** Hydrate from AsyncStorage — call once on app start (e.g. in _layout.tsx) */
  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) _bookmarks = JSON.parse(raw) as AnalysisRecord[];
      _notify();
    } catch (err) {
      console.warn("[BookmarkStore] load error:", err);
    }
  },

  /** Add a record to bookmarks (no-op if already present) */
  add(record: AnalysisRecord): void {
    if (_bookmarks.some((b) => b.id === record.id)) return;
    _bookmarks = [record, ..._bookmarks];
    _notify();
    _persist();
  },

  /** Remove a record by id */
  remove(id: string): void {
    _bookmarks = _bookmarks.filter((b) => b.id !== id);
    _notify();
    _persist();
  },

  /** Check whether a record is bookmarked */
  isBookmarked(id: string): boolean {
    return _bookmarks.some((b) => b.id === id);
  },

  /** Return a snapshot of current bookmarks (newest first) */
  getAll(): AnalysisRecord[] {
    return [..._bookmarks];
  },

  /**
   * Subscribe to bookmark list changes.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   *
   * @example
   * useEffect(() => {
   *   const unsub = BookmarkStore.subscribe(setBookmarks);
   *   return unsub;
   * }, []);
   */
  subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    listener([..._bookmarks]); // emit current state immediately
    return () => _listeners.delete(listener);
  },
};