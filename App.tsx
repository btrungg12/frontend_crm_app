import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppShell } from "./src/AppShell";
import { AppDataProvider } from "./src/state/AppDataContext";

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
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppDataProvider>
        <AppShell />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
