import { Asset } from "expo-asset";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppShell } from "./src/AppShell";
import { AppDataProvider } from "./src/state/AppDataContext";

// Preload leaf assets to avoid first-render decode delay
const PRELOAD_ASSETS = [
  require("./assets/leaf.png"),
  require("./assets/leaf_2.png"),
  require("./assets/leaf_3.png"),
  require("./assets/leaf_4.png"),
  require("./assets/logo_1.png"),
  require("./assets/logo_2.png"),
  require("./assets/logo_3.png"),
  require("./assets/welcome_leaf_left.png"),
  require("./assets/welcome_leaf_right.png"),
];

// Configure how notifications behave while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    Asset.loadAsync(PRELOAD_ASSETS).catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppDataProvider>
        <AppShell />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
