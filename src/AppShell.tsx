import * as Notifications from "expo-notifications";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

import {
  ForgotScreen,
  LoadingScreen,
  LoginScreen,
  RegisterScreen,
  ResetScreen,
  SetupNameScreen,
  VerifyEmailScreen,
  VerifyPhoneScreen,
  VerifySuccessScreen,
  WelcomeScreen
} from "./screens/mesh/AuthScreens";
import { ContactDetailScreen, ContactsEmptyScreen, ContactsScreen, CreateContactScreen } from "./screens/mesh/ContactsScreen";
import { DashboardScreen } from "./screens/mesh/DashboardScreen";
import { CreateNoteScreen } from "./screens/mesh/CreateNoteScreen";
import { NoteDetailScreen } from "./screens/mesh/NoteDetailScreen";
import { NotesScreen } from "./screens/mesh/NotesScreen";
import { SearchScreen } from "./screens/mesh/SearchScreen";
import { CreateStatusScreen, StatusContactsScreen, StatusScreen } from "./screens/mesh/StatusScreen";
import {
  AllUpcomingScreen,
  ChangePasswordScreen,
  ConfirmShowcaseScreen,
  DashboardEmptyScreen,
  EditProfileScreen,
  LanguageScreen,
  NotifEmptyScreen,
  NotifPrefsScreen,
  NotificationsScreen,
  NotesEmptyScreen,
  RecentContactsScreen,
  SettingsScreen,
  StatusEmptyScreen,
  StatusInUseScreen
} from "./screens/mesh/SystemScreens";
import { Lang, makeT } from "./mesh/meshData";
import { getToken } from "./storage/tokenStorage";
import { mesh } from "./mesh/meshTheme";
import { registerPushToken } from "./utils/registerPushToken";
import { useAppData } from "./state/AppDataContext";

type Route = {
  name: string;
  props?: Record<string, unknown>;
};

function initialRoute(): Route {
  const hash =
    typeof window !== "undefined" && "location" in window && window.location?.hash
      ? window.location.hash.replace(/^#\/?/, "")
      : "";
  return { name: hash };
}

const authRoutes = new Set(["", "welcome", "login", "loginErr", "register", "registerErr", "verifyEmail", "verifyPhone", "verifyPhoneR", "verifySuccess", "forgot", "reset", "loading"]);

const protectedRoutes = new Set([
  "dashboard",
  "contacts",
  "notes",
  "status",
  "settings",
  "notifications",
  "contactDetail",
  "noteDetail",
  "noteDetailB",
  "createContact",
  "editContact",
  "createNote",
  "editNote",
  "createStatus",
  "search",
  "allUpcoming",
  "recentContacts",
  "editProfile",
  "changePassword",
  "language",
  "notifPrefs",
  "contactsEmpty",
  "notesEmpty",
  "statusEmpty",
  "notifEmpty",
  "dashboardEmpty",
  "statusInUse",
  "confirmDeleteNote",
  "confirmDeleteContact",
  "confirmDeleteStatus",
  "confirmDeleteSpecial",
  "statusContacts"
]);

function routeForAuth(token: string | null) {
  const route = initialRoute();

  if (token) {
    return { name: route.name || "dashboard", props: route.props };
  }

  return authRoutes.has(route.name) ? { name: route.name || "welcome", props: route.props } : { name: "welcome" };
}

export function AppShell() {
  const [lang] = useState<Lang>("en");
  const [stack, setStack] = useState<Route[]>([{ name: "loading" }]);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const t = useMemo(() => makeT(lang), [lang]);
  const { preloadAppData, clearAppData } = useAppData();

  // Transition animation state
  const transition = useRef(new Animated.Value(1)).current;
  const [renderedRoute, setRenderedRoute] = useState<Route>(stack[stack.length - 1]);
  const [transitionType, setTransitionType] = useState<"push" | "pop" | "tab" | "fade">("fade");
  const didInitialRoute = useRef(false);

  const activeRoute = stack[stack.length - 1];
  const route = renderedRoute;

  useEffect(() => {
    let active = true;

    getToken().then((token) => {
      if (!active) return;
      const authed = Boolean(token);
      setIsAuthed(authed);
      setStack([routeForAuth(token)]);
      if (token) {
        registerPushToken().catch(() => undefined);
        preloadAppData().catch(() => undefined);
      } else {
        clearAppData();
      }
    });

    return () => {
      active = false;
    };
  }, [preloadAppData, clearAppData]);

  useEffect(() => {
    if (typeof window === "undefined" || !("location" in window) || !window.location) return undefined;
    const onHashChange = () => {
      getToken().then((token) => {
        setIsAuthed(Boolean(token));
        setStack([routeForAuth(token)]);
      });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Sync rendered route with stack changes and animate transitions
  useEffect(() => {
    const nextRoute = activeRoute;

    setRenderedRoute(nextRoute);

    // Skip animation on first app load
    if (!didInitialRoute.current) {
      didInitialRoute.current = true;
      transition.setValue(1);
      return;
    }

    transition.setValue(0);

    Animated.timing(transition, {
      toValue: 1,
      duration:
        transitionType === "tab" ? 90 :
        transitionType === "fade" ? 130 :
        210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeRoute, transition, transitionType]);

  const nav = (name: string, props: Record<string, unknown> = {}) => {
    if (name === "back") {
      setTransitionType("pop");
      setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
      return;
    }

    if (name === "logout") {
      setTransitionType("fade");
      setIsAuthed(false);
      clearAppData();

      // Clear any URL hash so a refresh doesn't land on a protected route
      if (typeof window !== "undefined" && "history" in window && window.location) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      setStack([{ name: "welcome" }]);
      return;
    }

    // Handle login success case: verify token exists before allowing dashboard navigation
    // LoginScreen only calls nav("dashboard") after loginRequest() succeeded and token was saved
    if (name === "dashboard") {
      getToken().then((token) => {
        if (token) {
          setIsAuthed(true);
          preloadAppData().catch(() => undefined);
          setTransitionType("tab");
          setStack([{ name: "dashboard", props }]);
        } else {
          // Token doesn't exist, redirect to welcome
          setIsAuthed(false);
          setTransitionType("fade");
          setStack([{ name: "welcome" }]);
        }
      });
      return;
    }

    // Block navigation to protected routes when not authenticated
    // Important: this runs after dashboard login-success handling
    if (protectedRoutes.has(name) && isAuthed === false) {
      setTransitionType("fade");
      setStack([{ name: "welcome" }]);
      return;
    }

    const tabRoots = new Set(["dashboard", "contacts", "notes", "status"]);
    if (tabRoots.has(name)) {
      setTransitionType("tab");
      setStack([{ name, props }]);
      return;
    }

    setTransitionType("push");
    setStack((current) => [...current, { name, props }]);
  };

  // Notification tap listener — must be after nav is defined
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;

      const targetType = String(data.targetType ?? data.onModel ?? "").toLowerCase();

      const noteId =
        typeof data.noteId === "string" && data.noteId
          ? data.noteId
          : typeof data.relatedId === "string" && targetType.includes("note")
            ? data.relatedId
            : undefined;

      const contactId =
        typeof data.contactId === "string" && data.contactId
          ? data.contactId
          : typeof data.relatedId === "string" && targetType.includes("contact")
            ? data.relatedId
            : undefined;

      if (noteId) {
        nav("noteDetail", { id: noteId });
        return;
      }

      if (contactId) {
        nav("contactDetail", { id: contactId });
        return;
      }

      nav("notifications");
    });

    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Still loading token from storage — show loading screen
  if (isAuthed === null) {
    const common = { t, lang, nav };
    return <LoadingScreen {...common} />;
  }

  // After logout (or on unauthenticated deep link), block protected routes
  if (isAuthed === false && protectedRoutes.has(route.name)) {
    const common = { t, lang, nav };
    return <WelcomeScreen {...common} />;
  }

  const common = { t, lang, nav };
  const noteId = (route.props?.id as string) || (route.props?.noteId as string);
  const contactId = (route.props?.id as string) || (route.props?.contactId as string);
  const emailOrPhone = route.props?.emailOrPhone as string | undefined;
  const phone = route.props?.phone as string | undefined;

  // Create animated styles for page transitions
  const animatedStyle = {
    flex: 1,
    opacity: transition.interpolate({
      inputRange: [0, 1],
      outputRange:
        transitionType === "tab"
          ? [0.98, 1]
          : [0.94, 1],
    }),
    transform: [
      {
        translateX: transition.interpolate({
          inputRange: [0, 1],
          outputRange:
            transitionType === "push"
              ? [24, 0]
              : transitionType === "pop"
                ? [-14, 0]
                : [0, 0],
        }),
      },
    ],
  };

  // Render the appropriate screen for the current route
  function renderRoute() {
    switch (route.name) {
      case "welcome":
        return <WelcomeScreen {...common} />;
      case "login":
        return <LoginScreen {...common} />;
      case "loginErr":
        return <LoginScreen {...common} error />;
      case "register":
        return <RegisterScreen {...common} />;
      case "registerErr":
        return <RegisterScreen {...common} error />;
      case "verifyEmail":
        return <VerifyEmailScreen {...common} emailOrPhone={emailOrPhone} />;
      case "verifyPhone":
        return <VerifyPhoneScreen {...common} emailOrPhone={emailOrPhone} phone={phone} />;
      case "verifyPhoneR":
        return <VerifyPhoneScreen {...common} emailOrPhone={emailOrPhone} phone={phone} resend />;
      case "verifySuccess":
        return <VerifySuccessScreen {...common} />;
      case "forgot":
        return <ForgotScreen {...common} />;
      case "setupName":
        return <SetupNameScreen {...common} />;
      case "reset":
        return <ResetScreen {...common} emailOrPhone={route.props?.emailOrPhone as string | undefined} />;
      case "loading":
        return <LoadingScreen {...common} />;
      case "dashboard":
        return <DashboardScreen {...common} {...(route.props as Record<string, unknown>)} />;
      case "notes":
        return <NotesScreen {...common} {...(route.props as Record<string, unknown>)} />;
      case "noteDetail":
        return noteId ? <NoteDetailScreen {...common} noteId={noteId} /> : <MissingParamScreen title="Missing note id" onBack={() => nav("notes")} />;
      case "noteDetailB":
        return noteId ? <NoteDetailScreen {...common} noteId={noteId} variant="B" /> : <MissingParamScreen title="Missing note id" onBack={() => nav("notes")} />;
      case "createNote":
        return <CreateNoteScreen {...common} initialPerson={route.props?.person as string | undefined} />;
      case "editNote":
        return noteId ? <CreateNoteScreen {...common} edit noteId={noteId} /> : <MissingParamScreen title="Missing note id" onBack={() => nav("notes")} />;
      case "search":
        return <SearchScreen {...common} initialQ={(route.props?.query as string) || ""} type={(route.props?.type as "contacts" | "notes" | undefined) || "notes"} />;
      case "contactDetail":
        return contactId ? (
          <ContactDetailScreen key={`contact-detail-${contactId}`} {...common} contactId={contactId} />
        ) : (
          <MissingParamScreen title="Missing contact id" onBack={() => nav("contacts")} />
        );
      case "createContact":
        return <CreateContactScreen {...common} />;
      case "editContact":
        return contactId ? (
          <CreateContactScreen key={`edit-contact-${contactId}`} {...common} edit contactId={contactId} />
        ) : (
          <MissingParamScreen title="Missing contact id" onBack={() => nav("contacts")} />
        );
      case "contactsEmpty":
        return <ContactsEmptyScreen {...common} />;
      case "contacts":
        return <ContactsScreen {...common} {...(route.props as Record<string, unknown>)} />;
      case "status":
        return <StatusScreen {...common} {...(route.props as Record<string, unknown>)} />;
      case "createStatus":
        return <CreateStatusScreen {...common} statusId={(route.props?.id as string) || (route.props?.statusId as string) || undefined} initialStatus={route.props?.status as import("./mesh/meshData").Status | undefined} />;
      case "statusContacts":
        return (route.props?.statusId as string) ? (
          <StatusContactsScreen {...common} statusId={route.props.statusId as string} statusName={(route.props.statusName as string) || ""} statusColor={route.props.statusColor as string | undefined} />
        ) : <MissingParamScreen title="Missing status id" onBack={() => nav("status")} />;
      case "notifications":
        return <NotificationsScreen {...common} />;
      case "allUpcoming":
        return <AllUpcomingScreen {...common} />;
      case "recentContacts":
        return <RecentContactsScreen {...common} />;
      case "settings":
        return <SettingsScreen {...common} />;
      case "notesEmpty":
        return <NotesEmptyScreen {...common} />;
      case "editProfile":
        return <EditProfileScreen {...common} />;
      case "changePassword":
        return <ChangePasswordScreen {...common} />;
      case "language":
        return <LanguageScreen {...common} />;
      case "notifPrefs":
        return <NotifPrefsScreen {...common} />;
      case "statusInUse":
        return <StatusInUseScreen {...common} />;
      case "confirmDeleteNote":
        return <ConfirmShowcaseScreen {...common} kind="note" />;
      case "confirmDeleteContact":
        return <ConfirmShowcaseScreen {...common} kind="contact" />;
      case "confirmDeleteStatus":
        return <ConfirmShowcaseScreen {...common} kind="status" />;
      case "confirmDeleteSpecial":
        return <ConfirmShowcaseScreen {...common} kind="special" />;
      case "statusEmpty":
        return <StatusEmptyScreen {...common} />;
      case "notifEmpty":
        return <NotifEmptyScreen {...common} />;
      case "dashboardEmpty":
        return <DashboardEmptyScreen {...common} />;
      default:
        return <MissingParamScreen title="Screen not found" onBack={() => {
          setTransitionType("fade");
          setStack([{ name: isAuthed ? "dashboard" : "welcome" }]);
        }} />;
    }
  }

  return (
    <Animated.View style={animatedStyle as any}>
      {renderRoute()}
    </Animated.View>
  );
}

function MissingParamScreen({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FFFFFF" }}>
      <Text style={{ color: mesh.ink900, fontSize: 20, fontWeight: "800", textAlign: "center" }}>{title}</Text>
      <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: "center" }}>This screen needs an API id. No mock id was used.</Text>
      <Pressable onPress={onBack} style={{ marginTop: 22, borderRadius: 999, backgroundColor: mesh.green700, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Go back</Text>
      </Pressable>
    </View>
  );
}
