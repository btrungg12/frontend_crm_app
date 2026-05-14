import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  ForgotScreen,
  LoadingScreen,
  LoginScreen,
  RegisterScreen,
  ResetScreen,
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
import { CreateStatusScreen, StatusScreen } from "./screens/mesh/StatusScreen";
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
  const t = useMemo(() => makeT(lang), [lang]);
  const route = stack[stack.length - 1];

  useEffect(() => {
    let active = true;

    getToken().then((token) => {
      if (active) setStack([routeForAuth(token)]);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("location" in window) || !window.location) return undefined;
    const onHashChange = () => {
      getToken().then((token) => setStack([routeForAuth(token)]));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const nav = (name: string, props: Record<string, unknown> = {}) => {
    if (name === "back") {
      setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
      return;
    }

    const tabRoots = new Set(["dashboard", "contacts", "notes", "status"]);
    if (tabRoots.has(name)) {
      setStack([{ name, props }]);
      return;
    }

    setStack((current) => [...current, { name, props }]);
  };

  const common = { t, lang, nav };
  const noteId = (route.props?.id as string) || (route.props?.noteId as string);
  const contactId = (route.props?.id as string) || (route.props?.contactId as string);
  const emailOrPhone = route.props?.emailOrPhone as string | undefined;
  const phone = route.props?.phone as string | undefined;

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
    case "reset":
      return <ResetScreen {...common} />;
    case "loading":
      return <LoadingScreen {...common} />;
    case "dashboard":
      return <DashboardScreen {...common} />;
    case "notes":
      return <NotesScreen {...common} />;
    case "noteDetail":
      return noteId ? <NoteDetailScreen {...common} noteId={noteId} /> : <MissingParamScreen title="Missing note id" onBack={() => nav("notes")} />;
    case "noteDetailB":
      return noteId ? <NoteDetailScreen {...common} noteId={noteId} variant="B" /> : <MissingParamScreen title="Missing note id" onBack={() => nav("notes")} />;
    case "createNote":
      return <CreateNoteScreen {...common} initialPerson={route.props?.person as string | undefined} />;
    case "editNote":
      return <CreateNoteScreen {...common} edit />;
    case "search":
      return <SearchScreen {...common} initialQ={(route.props?.query as string) || ""} />;
    case "contacts":
      return <ContactsScreen {...common} />;
    case "contactDetail":
      return contactId ? <ContactDetailScreen {...common} contactId={contactId} /> : <MissingParamScreen title="Missing contact id" onBack={() => nav("contacts")} />;
    case "createContact":
      return <CreateContactScreen {...common} />;
    case "editContact":
      return contactId ? <CreateContactScreen {...common} edit contactId={contactId} /> : <MissingParamScreen title="Missing contact id" onBack={() => nav("contacts")} />;
    case "contactsEmpty":
      return <ContactsEmptyScreen {...common} />;
    case "status":
      return <StatusScreen {...common} />;
    case "createStatus":
      return <CreateStatusScreen {...common} statusId={(route.props?.id as string) || (route.props?.statusId as string) || undefined} />;
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
      return <MissingParamScreen title="Screen not found" onBack={() => nav("dashboard")} />;
  }
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
