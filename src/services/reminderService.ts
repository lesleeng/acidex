import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { UserPreferencesStore } from "../data/userPreferencesStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let configured = false;

export async function ensureReminderPermissions(): Promise<boolean> {
  if (!configured) {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("acidex-reminders", {
        name: "Acidex Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    configured = true;
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function schedulePostCoffeeReminder(input: {
  coffeeType: string;
  riskLevel?: string;
}): Promise<void> {
  await UserPreferencesStore.load();
  const prefs = UserPreferencesStore.get();
  if (!prefs.remindersEnabled) return;

  const granted = await ensureReminderPermissions();
  if (!granted) return;

  const base =
    input.riskLevel === "High Risk"
      ? "Hydration + pause can reduce discomfort."
      : "Take a hydration break before your next cup.";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Acidex reminder",
      body: `${base} (${input.coffeeType})`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, prefs.reminderDelayMinutes * 60),
      channelId: Platform.OS === "android" ? "acidex-reminders" : undefined,
    },
  });
}
