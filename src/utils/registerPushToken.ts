import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { updateProfile } from "../api/userApi";
import { getToken } from "../storage/tokenStorage";

// Singleton guard — prevent concurrent registrations
let registeringPromise: Promise<string | null> | null = null;

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId ??
    undefined
  );
}

export function registerPushToken(): Promise<string | null> {
  if (registeringPromise) return registeringPromise;

  registeringPromise = registerPushTokenInner().finally(() => {
    registeringPromise = null;
  });

  return registeringPromise;
}

async function registerPushTokenInner(): Promise<string | null> {
  try {
    const authToken = await getToken();
    if (!authToken) return null;

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      if (__DEV__) console.log("[Push] Skipped: not a physical device.");
      return null;
    }

    // Android: set up notification channel before anything else
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#064532",
      });
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (finalStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      if (__DEV__) console.log("[Push] Permission not granted.");
      return null;
    }

    // Get Expo push token
    const projectId = getProjectId();
    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const expoPushToken = tokenData.data;
    if (!expoPushToken) return null;

    // Save to backend via existing updateProfile
    await updateProfile({ expoPushToken });

    if (__DEV__) console.log("[Push] Token registered:", expoPushToken);

    return expoPushToken;
  } catch (err) {
    if (__DEV__) {
      console.warn("[Push] Registration failed:", err instanceof Error ? err.message : err);
    }
    return null;
  }
}
