import * as SecureStore from "expo-secure-store";

const KEY = "context_aware_notifications_enabled";

export async function getContextAwareNotificationsEnabled() {
  const value = await SecureStore.getItemAsync(KEY);
  return value === "true";
}

export async function setContextAwareNotificationsEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(KEY, enabled ? "true" : "false");
}