import { useEffect, useMemo, useState } from "react";

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

type Route = {
  name: string;
  props?: Record<string, unknown>;
};

function initialRoute(): Route {
  const hash =
    typeof window !== "undefined" && "location" in window && window.location?.hash
      ? window.location.hash.replace(/^#\/?/, "")
      : "";
  return { name: hash || "dashboard" };
}

export function AppShell() {
  const [lang] = useState<Lang>("en");
  const [stack, setStack] = useState<Route[]>([initialRoute()]);
  const t = useMemo(() => makeT(lang), [lang]);
  const route = stack[stack.length - 1];

  useEffect(() => {
    if (typeof window === "undefined" || !("location" in window) || !window.location) return undefined;
    const onHashChange = () => setStack([initialRoute()]);
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
      return <VerifyEmailScreen {...common} />;
    case "verifyPhone":
      return <VerifyPhoneScreen {...common} />;
    case "verifyPhoneR":
      return <VerifyPhoneScreen {...common} resend />;
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
      return <NoteDetailScreen {...common} noteId={(route.props?.id as string) || (route.props?.noteId as string) || "n1"} />;
    case "noteDetailB":
      return <NoteDetailScreen {...common} noteId={(route.props?.id as string) || (route.props?.noteId as string) || "n1"} variant="B" />;
    case "createNote":
      return <CreateNoteScreen {...common} />;
    case "editNote":
      return <CreateNoteScreen {...common} edit />;
    case "search":
      return <SearchScreen {...common} initialQ={(route.props?.query as string) || "An"} />;
    case "contacts":
      return <ContactsScreen {...common} />;
    case "contactDetail":
      return <ContactDetailScreen {...common} contactId={(route.props?.id as string) || (route.props?.contactId as string) || "c1"} />;
    case "createContact":
      return <CreateContactScreen {...common} />;
    case "editContact":
      return <CreateContactScreen {...common} edit contactId={(route.props?.id as string) || (route.props?.contactId as string) || "c1"} />;
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
      return <DashboardScreen {...common} />;
  }
}
