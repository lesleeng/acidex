import AsyncStorage from "@react-native-async-storage/async-storage";

export type TastePreset = "gentle" | "balanced" | "bold" | "custom";

export interface UserPreferences {
  tastePreset: TastePreset;
  customAcidityTolerance: number;
  remindersEnabled: boolean;
  reminderDelayMinutes: number;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
}

const STORAGE_KEY = "acidex_user_preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  tastePreset: "balanced",
  customAcidityTolerance: 50,
  remindersEnabled: true,
  reminderDelayMinutes: 30,
  highContrastEnabled: false,
  largeTextEnabled: false,
};

let cachedPreferences: UserPreferences = DEFAULT_PREFERENCES;
const listeners = new Set<(preferences: UserPreferences) => void>();

function notify() {
  listeners.forEach((listener) => listener({ ...cachedPreferences }));
}

function normalizePreferences(value: Partial<UserPreferences> | null | undefined): UserPreferences {
  return {
    tastePreset: value?.tastePreset ?? DEFAULT_PREFERENCES.tastePreset,
    customAcidityTolerance:
      typeof value?.customAcidityTolerance === "number"
        ? value.customAcidityTolerance
        : DEFAULT_PREFERENCES.customAcidityTolerance,
    remindersEnabled: value?.remindersEnabled ?? DEFAULT_PREFERENCES.remindersEnabled,
    reminderDelayMinutes:
      typeof value?.reminderDelayMinutes === "number"
        ? value.reminderDelayMinutes
        : DEFAULT_PREFERENCES.reminderDelayMinutes,
    highContrastEnabled: value?.highContrastEnabled ?? DEFAULT_PREFERENCES.highContrastEnabled,
    largeTextEnabled: value?.largeTextEnabled ?? DEFAULT_PREFERENCES.largeTextEnabled,
  };
}

async function persist(nextPreferences: UserPreferences) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  } catch (error) {
    console.warn("[UserPreferencesStore] persist error:", error);
  }
}

export const UserPreferencesStore = {
  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<UserPreferences>) : null;
      cachedPreferences = normalizePreferences(parsed);
      notify();
    } catch (error) {
      console.warn("[UserPreferencesStore] load error:", error);
      cachedPreferences = { ...DEFAULT_PREFERENCES };
      notify();
    }
  },

  get(): UserPreferences {
    return { ...cachedPreferences };
  },

  async update(next: Partial<UserPreferences>): Promise<UserPreferences> {
    cachedPreferences = normalizePreferences({ ...cachedPreferences, ...next });
    notify();
    await persist(cachedPreferences);
    return cachedPreferences;
  },

  async reset(): Promise<UserPreferences> {
    cachedPreferences = { ...DEFAULT_PREFERENCES };
    notify();
    await persist(cachedPreferences);
    return cachedPreferences;
  },

  subscribe(listener: (preferences: UserPreferences) => void): () => void {
    listeners.add(listener);
    listener({ ...cachedPreferences });
    return () => listeners.delete(listener);
  },

  defaults: DEFAULT_PREFERENCES,
};