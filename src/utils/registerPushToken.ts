import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { updateProfile } from "../api/userApi";

/**
 * Requests push notification permission, retrieves the Expo push token,
 * and persists it to the backend via PATCH /api/users/me.
 *
 * Called once after a successful login. Errors are swallowed so they never
 * block the user from reaching the dashboard.
 */
export async function registerPushToken(): Promise<void> {
  try {
    // Physical device required — simulators/emulators cannot receive push notifications
    if (!Device.isDevice) {
      return;
    }

    // Android requires a notification channel before showing any alerts
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1F7048",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // User declined — nothing to register
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data; // "ExponentPushToken[...]"

    await updateProfile({ expoPushToken });
  } catch (err) {
    // Never let push-token registration crash the login flow
    console.warn("registerPushToken failed:", err);
  }
}
