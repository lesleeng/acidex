import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";

const THEME_MODE_KEY = "acidex_theme_mode";

export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  try {
    const raw = await AsyncStorage.getItem(THEME_MODE_KEY);
    if (raw === "light" || raw === "dark") {
      return raw;
    }
    return null;
  } catch (error) {
    console.log("getStoredThemeMode error:", error);
    return null;
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
  } catch (error) {
    console.log("saveThemeMode error:", error);
  }
}

export async function clearThemeMode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(THEME_MODE_KEY);
  } catch (error) {
    console.log("clearThemeMode error:", error);
  }
}