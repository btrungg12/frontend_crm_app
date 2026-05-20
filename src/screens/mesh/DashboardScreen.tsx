import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { getDashboard } from "../../api/dashboardApi";
import { extractArray, normalizeApiContact } from "../../api/screenAdapters";
import { getProfile } from "../../api/userApi";
import { DashboardMeshBackground } from "../../components/DashboardMeshBackground";
import { GradientAvatar } from "../../components/GradientAvatar";
import { QuickCreateSheet } from "../../components/QuickCreateSheet";
import { Avatar, BottomNav, BottomNavScrim, MeshCard, MeshHeader, MeshScreen, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { CreateNoteScreen } from "./CreateNoteScreen";
import { CreateContactScreen } from "./ContactsScreen";
import { Contact, Lang, statusById, Upcoming } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";
import { getToken } from "../../storage/tokenStorage";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  refresh?: number;
};

type RecentActivityContact = Contact & {
  activityAt?: Date;
  activityLabel?: string;
  activityType?: "note" | "contact";
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function unwrapData(value: unknown) {
  const root = asRecord(value);
  return asRecord(root?.data) ?? root;
}

function deriveTitleFromContent(content: unknown, maxLength = 80): string {
  if (typeof content !== "string") return "";

  const firstLine =
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? "";

  if (!firstLine) return "";

  return firstLine.length > maxLength
    ? firstLine.slice(0, maxLength).trimEnd() + "…"
    : firstLine;
}

function readDashboardContact(value: unknown) {
  const item = asRecord(value);
  if (!item) return null;

  const reminder = asRecord(item.reminder);
  const note = asRecord(item.note);

  const candidates = [
    asRecord(item.contact),
    asRecord(item.contactId),
    asRecord(item.person),
    asRecord(item.personId),

    asRecord(note?.contact),
    asRecord(note?.contactId),
    asRecord(note?.person),
    asRecord(note?.personId),

    asRecord(reminder?.contact),
    asRecord(reminder?.contactId),
  ];

  const contact = candidates.find((candidate) => {
    const name = candidate?.name;
    return typeof name === "string" && name.trim().length > 0;
  });

  const id =
    contact?._id ??
    contact?.id ??
    item.contactId ??
    note?.contactId ??
    item.personId ??
    "";

  const name =
    contact?.name ??
    item.contactName ??
    item.personName ??
    note?.contactName ??
    note?.personName ??
    "";

  const avatarUrl =
    typeof contact?.avatarUrl === "string" ? contact.avatarUrl : undefined;

  return {
    id: typeof id === "string" ? id : String(id ?? ""),
    name: typeof name === "string" ? name.trim() : "",
    avatarUrl,
    statusId: contact?.statusId ?? contact?.status ?? item.statusId ?? note?.statusId,
  };
}

function readUserName(value: unknown) {
  const profile = unwrapData(value);
  const candidate = profile?.name ?? profile?.fullName ?? profile?.displayName ?? profile?.username;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : "User";
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimeHHMM(date: Date, lang: Lang): string {
  return date.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatRelativeUpcomingTag(date: Date, lang: Lang): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  const diffHours = Math.round(diffMs / 3600000);

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startTarget - startToday) / 86400000);

  if (diffDays === 0 && diffMinutes < 60) {
    return lang === "vi" ? `${diffMinutes} phút nữa` : `In ${diffMinutes} min`;
  }

  if (diffDays === 0 && diffHours < 24) {
    return lang === "vi" ? `${Math.max(1, diffHours)} giờ nữa` : `In ${Math.max(1, diffHours)} hours`;
  }

  if (diffDays === 0) return lang === "vi" ? "Hôm nay" : "Today";
  if (diffDays === 1) return lang === "vi" ? "Ngày mai" : "Tomorrow";

  return lang === "vi" ? `${diffDays} ngày nữa` : `In ${diffDays} days`;
}

function formatRelativePast(date: Date, lang: Lang): string {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return lang === "vi" ? "vừa xong" : "just now";
  if (diffMinutes < 60) return lang === "vi" ? `${diffMinutes} phút trước` : `${diffMinutes}m ago`;
  if (diffHours < 24) return lang === "vi" ? `${diffHours} giờ trước` : `${diffHours}h ago`;
  if (diffDays < 7) return lang === "vi" ? `${diffDays} ngày trước` : `${diffDays}d ago`;

  return date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatCurrentDate(lang: Lang) {
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const date = new Date();
  const weekday = date.toLocaleDateString(locale, { weekday: "short" }).toUpperCase();
  const month = date.toLocaleDateString(locale, { month: "short" });
  return `${weekday} ${date.getDate()} ${month}`;
}

function normalizeDashboardReminder(value: unknown, lang: Lang): Upcoming | null {
  const item = asRecord(value);
  if (!item) return null;

  const reminder = asRecord(item.reminder);
  const enabled = reminder?.enabled !== false;
  const remindAt = parseDate(reminder?.remindAt ?? item.remindAt ?? item.reminderAt);

  if (!enabled || !remindAt) return null;

  const contactInfo = readDashboardContact(item);
  const contactName = contactInfo?.name || "Unknown person";

  const note = asRecord(item.note);

  // Title priority: note title (from item or embedded note), then content first line, then reminder content
  const noteTitle =
    typeof item.title === "string" && item.title.trim()
      ? item.title.trim()
      : typeof note?.title === "string" && note.title.trim()
        ? note.title.trim()
        : "";

  const contentTitle =
    deriveTitleFromContent(item.content) ||
    deriveTitleFromContent(note?.content);

  const reminderContent =
    typeof reminder?.content === "string" && reminder.content.trim()
      ? reminder.content.trim()
      : "";

  const title =
    noteTitle ||
    contentTitle ||
    reminderContent ||
    (lang === "vi" ? "Nhắc nhở" : "Reminder");

  const noteId = String(item._id ?? item.id ?? item.noteId ?? "");

  return {
    id: noteId || `${contactName}-${remindAt.toISOString()}`,
    icon: "alarm-outline",
    noteId,
    contactId: contactInfo?.id || String(item.contactId ?? ""),
    kind: "reminder",
    title,
    titleEn: title,
    sub: contactName,
    subEn: contactName,
    time: formatTimeHHMM(remindAt, lang),
    tag: formatRelativeUpcomingTag(remindAt, "vi" as Lang),
    tagEn: formatRelativeUpcomingTag(remindAt, "en" as Lang),
    ...(remindAt ? { dateValue: remindAt as any } : {}),
  } as Upcoming;
}

function buildSpecialDayTitle(occasionRaw: unknown, contactName: string, lang: Lang) {
  const occasion = typeof occasionRaw === "string" ? occasionRaw.trim() : "";
  const lower = occasion.toLowerCase();

  const isBirthday =
    lower.includes("birthday") ||
    lower.includes("sinh nhật") ||
    lower === "birthday";

  const isAnniversary =
    lower.includes("anniversary") ||
    lower.includes("kỷ niệm") ||
    lower.includes("ki niem");

  const isGeneric =
    !occasion ||
    lower === "special day" ||
    lower === "ngày đặc biệt" ||
    lower === "ngay dac biet";

  if (isBirthday) {
    return {
      title: contactName ? `Sinh nhật ${contactName}` : "Sinh nhật",
      titleEn: contactName ? `${contactName}'s birthday` : "Birthday",
    };
  }

  if (isAnniversary) {
    return {
      title: contactName ? `Kỷ niệm với ${contactName}` : "Kỷ niệm",
      titleEn: contactName ? `Anniversary with ${contactName}` : "Anniversary",
    };
  }

  if (isGeneric) {
    return {
      title: contactName ? `Ngày đặc biệt của ${contactName}` : "Ngày đặc biệt",
      titleEn: contactName ? `Special day for ${contactName}` : "Special day",
    };
  }

  return {
    title: occasion,
    titleEn: occasion,
  };
}

function normalizeDashboardSpecialDay(value: unknown, lang: Lang): Upcoming | null {
  const item = asRecord(value);
  if (!item) return null;

  const date = parseDate(item.date);
  if (!date) return null;

  const contact = asRecord(item.contact) ?? asRecord(item.contactId);
  const contactName = String(
    contact?.name ??
    item.contactName ??
    ""
  ).trim();

  const occasionRaw =
    item.title ??
    item.occasion ??
    item.name ??
    item.label ??
    item.type;

  const { title, titleEn } = buildSpecialDayTitle(occasionRaw, contactName, lang);

  // Determine kind based on occasion
  const occasion = typeof occasionRaw === "string" ? occasionRaw.toLowerCase() : "";
  const isBirthday =
    occasion.includes("birthday") ||
    occasion.includes("sinh nhật");

  return {
    id: String(item.specialDayId ?? item._id ?? item.id ?? `${item.contactId ?? contactName}-${date.toISOString()}`),
    icon: isBirthday ? "gift-outline" : "sparkles-outline",
    contactId: String(contact?._id ?? contact?.id ?? item.contactId ?? ""),
    kind: isBirthday ? "birthday" : "special",
    title,
    titleEn,
    sub: contactName,
    subEn: contactName,
    time: "",
    tag: formatRelativeUpcomingTag(date, "vi" as Lang),
    tagEn: formatRelativeUpcomingTag(date, "en" as Lang),
    ...(date ? { dateValue: date as any } : {}),
  } as Upcoming;
}

function getContactFromNote(noteValue: unknown): Contact | null {
  const note = asRecord(noteValue);
  if (!note) return null;

  const contactRaw =
    asRecord(note.contact) ??
    asRecord(note.person) ??
    asRecord(note.contactId) ??
    asRecord(note.personId);

  const idCandidate =
    contactRaw?._id ??
    contactRaw?.id ??
    note.contactId ??
    note.personId ??
    "";

  const rawName =
    contactRaw?.name ??
    note.contactName ??
    note.personName ??
    "";

  const name =
    typeof rawName === "string" ? rawName.trim() : "";

  // Critical: Do not create fake Unknown contact in Recent Contacts.
  // If backend does not provide contact name, skip this note.
  if (!name) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        "Dashboard recentNotes item missing populated contact/name. Skipping recent contact from note.",
        {
          noteId: note._id ?? note.id,
          contactId: note.contactId,
        }
      );
    }
    return null;
  }

  const id =
    typeof idCandidate === "string"
      ? idCandidate
      : String(idCandidate ?? "");

  return {
    id: id || name,
    name,
    phone: "",
    email: "",
    status: String(contactRaw?.statusId ?? contactRaw?.status ?? "other"),
    avatarUrl: typeof contactRaw?.avatarUrl === "string" ? contactRaw.avatarUrl : undefined,
  } as Contact;
}

function buildRecentActivityContacts(
  recentNotesRaw: unknown[],
  recentContactsRaw: unknown[],
  lang: Lang
): RecentActivityContact[] {
  const byId = new Map<string, RecentActivityContact>();

  function upsert(contact: Contact | null, activityAt: Date | null, activityType: "note" | "contact") {
    if (!contact) return;
    const key = contact.id || contact.name;
    if (!key) return;

    const previous = byId.get(key);
    const previousTime = previous?.activityAt?.getTime() ?? 0;
    const nextTime = activityAt?.getTime() ?? 0;

    if (!previous || nextTime >= previousTime) {
      byId.set(key, {
        ...contact,
        activityAt: activityAt ?? previous?.activityAt,
        activityLabel: activityAt ? formatRelativePast(activityAt, lang) : "",
        activityType,
      });
    }
  }

  recentNotesRaw.forEach((raw) => {
    const note = asRecord(raw);
    const contact = getContactFromNote(raw);
    const activityAt = parseDate(note?.interactionDate ?? note?.createdAt ?? note?.updatedAt);
    upsert(contact, activityAt, "note");
  });

  recentContactsRaw.forEach((raw) => {
    const contact = normalizeApiContact(raw);
    const rec = asRecord(raw);
    const activityAt = parseDate(rec?.updatedAt ?? rec?.createdAt);
    upsert(contact, activityAt, "contact");
  });

  return Array.from(byId.values())
    .filter((contact) => {
      const name = contact.name?.trim().toLowerCase();
      return Boolean(name) && name !== "unknown person" && name !== "unknown";
    })
    .sort((a, b) => (b.activityAt?.getTime() ?? 0) - (a.activityAt?.getTime() ?? 0))
    .slice(0, 4);
}

function upcomingSearchText(item: Upcoming) {
  return `${item.title} ${item.titleEn} ${item.sub} ${item.subEn} ${item.tag} ${item.tagEn}`.toLowerCase();
}

function getUpcomingVisual(item: Upcoming): {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  pillBg: string;
  pillColor: string;
  pillIcon: keyof typeof Ionicons.glyphMap;
} {
  const searchText = upcomingSearchText(item);

  if (item.kind === "birthday") {
    return {
      icon: "gift-outline",
      iconBg: "rgba(139,92,214,0.08)",
      iconColor: "#7C3AED",
      pillBg: "rgba(139,92,214,0.08)",
      pillColor: "#7C3AED",
      pillIcon: "calendar-outline"
    };
  }

  if (item.kind === "special") {
    return {
      icon: searchText.includes("anniversary") || searchText.includes("kỷ niệm") ? "gift-outline" : "sparkles-outline",
      iconBg: "rgba(224,117,67,0.09)",
      iconColor: mesh.orange,
      pillBg: "rgba(230,181,62,0.09)",
      pillColor: mesh.orange,
      pillIcon: "time-outline"
    };
  }

  const icon =
    searchText.includes("call") || searchText.includes("gọi") || searchText.includes("phone") || searchText.includes("điện thoại")
      ? "call-outline"
      : searchText.includes("buy") || searchText.includes("mua") || searchText.includes("gift") || searchText.includes("quà")
        ? "notifications-outline"
        : "alarm-outline";

  return {
    icon,
    iconBg: "rgba(31,112,72,0.075)",
    iconColor: mesh.green700,
    pillBg: "rgba(31,112,72,0.075)",
    pillColor: mesh.green700,
    pillIcon: "time-outline"
  };
}

function upcomingSubtitle(item: Upcoming, lang: Lang) {
  const sub = lang === "vi" ? item.sub : item.subEn;
  if (item.kind !== "reminder" || !item.time || item.time === "--" || item.time === "-") return sub;
  return sub ? `${sub} · ${item.time}` : item.time;
}

export function DashboardScreen({ t, lang, nav, refresh }: Props) {
  const [recent, setRecent] = useState<RecentActivityContact[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<Upcoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("User");
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickCreateMode, setQuickCreateMode] = useState<"note" | "contact" | null>(null);

  function openUpcoming(item: Upcoming) {
    if (item.kind === "reminder" && item.noteId) {
      nav("noteDetail", { id: item.noteId });
      return;
    }

    if ((item.kind === "birthday" || item.kind === "special") && item.contactId) {
      nav("contactDetail", { id: item.contactId });
      return;
    }
  }

  const loadDashboard = useCallback(async () => {
    let active = true;

    try {
      setLoading(true);
      setError("");
      const token = await getToken();

      if (!token) {
        if (!active) return;
        setRecent([]);
        setUpcomingItems([]);
        setUserName("User");
        setError("Please log in to view dashboard data.");
        return;
      }

      const [dashboardResponse, profileResponse] = await Promise.all([
        getDashboard(),
        getProfile().catch(() => null)
      ]);

      if (!active) return;

      const dashboardData = unwrapData(dashboardResponse);

      const recentContactsRaw = extractArray(dashboardResponse, "recentContacts");
      const recentNotesRaw = extractArray(dashboardResponse, "recentNotes");

      const upcomingReminders = extractArray(dashboardResponse, "upcomingReminders")
        .map((item) => normalizeDashboardReminder(item, lang))
        .filter(Boolean) as Upcoming[];

      const upcomingSpecialDays = extractArray(dashboardResponse, "upcomingSpecialDays")
        .map((item) => normalizeDashboardSpecialDay(item, lang))
        .filter(Boolean) as Upcoming[];

      const apiUpcoming = [...upcomingReminders, ...upcomingSpecialDays]
        .sort((a, b) => {
          const aTime = (a as any).dateValue?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
          const bTime = (b as any).dateValue?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        })
        .slice(0, 4);

      const activityContacts = buildRecentActivityContacts(
        recentNotesRaw,
        recentContactsRaw,
        lang
      );

      const unreadRaw = dashboardData?.unreadNotificationCount;

      setUserName(readUserName(profileResponse));
      setUnreadCount(typeof unreadRaw === "number" ? unreadRaw : 0);
      setRecent(activityContacts);
      setUpcomingItems(apiUpcoming);
    } catch (err) {
      if (!active) return;
      setRecent([]);
      setUpcomingItems([]);
      setError(err instanceof Error && err.message ? err.message : "Cannot load dashboard.");
    } finally {
      if (active) setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (refresh) {
      loadDashboard();
    }
  }, [refresh, loadDashboard]);

  return (
    <MeshScreen>
      <DashboardMeshBackground />

      <MeshHeader variant="transparent" style={{ paddingBottom: 34 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <Pressable onPress={() => nav("settings")}>
            <Avatar name={userName} size={44} ring />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 }}>
              {formatCurrentDate(lang)}
            </Text>
            <Pressable onPress={() => nav("notifications")} style={{ position: "relative" }}>
              <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
              {unreadCount > 0 ? (
                <View style={{
                  position: "absolute",
                  right: -4,
                  top: -4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: "#FF3B30",
                  borderWidth: 1.5,
                  borderColor: "#F8FCF7",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 3
                }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "900", lineHeight: 12 }}>
                    {unreadCount > 9 ? "9+" : String(unreadCount)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 42 }}>
          <Text style={{ color: mesh.green800, fontSize: mesh.font.hero, fontWeight: "800", letterSpacing: -0.4 }}>
            {t("greeting")}, {userName} <Text style={{ fontSize: mesh.font.hero - 4 }}>👋</Text>
          </Text>
          <Text style={{ color: "#5F6864", fontSize: mesh.font.body + 2, lineHeight: 23, marginTop: 10 }}>{t("greetingSub")}</Text>
        </View>
      </MeshHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 10 }}>
            <SectionLabel style={{ color: mesh.green700, fontSize: 15 }}>
              {t("upcoming")} <Text style={{ color: mesh.ink500 }}>({upcomingItems.length})</Text>
            </SectionLabel>
            <Pressable onPress={() => nav("allUpcoming")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: mesh.green700, fontSize: mesh.font.bodySm, fontWeight: "700" }}>{t("viewAll")}</Text>
              <Ionicons name="chevron-forward" size={14} color={mesh.green700} />
            </Pressable>
          </View>

          {loading ? (
            <StateCard label="Loading dashboard..." />
          ) : error ? (
            <StateCard label={error} tone="error" />
          ) : upcomingItems.length === 0 ? (
            <StateCard label="No upcoming items from API." />
          ) : (
            <MeshCard style={{ backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 24, borderWidth: 1, borderColor: "rgba(6,69,50,0.055)", elevation: 2, shadowColor: "#064532", shadowOpacity: 0.045, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, paddingHorizontal: 8, paddingVertical: 4 }}>
              {upcomingItems.map((item, index) => {
              const visual = getUpcomingVisual(item);
              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() => openUpcoming(item)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 10, minHeight: 58 }}
                  >
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: visual.iconBg, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={visual.icon} size={21} color={visual.iconColor} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: mesh.ink900, fontSize: mesh.font.body, fontWeight: "700" }}>
                        {lang === "vi" ? item.title : item.titleEn}
                      </Text>
                      <Text style={{ color: mesh.ink500, fontSize: mesh.font.caption, marginTop: 3 }}>{upcomingSubtitle(item, lang)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: visual.pillBg }}>
                      <Ionicons name={visual.pillIcon} size={11} color={visual.pillColor} />
                      <Text style={{ color: visual.pillColor, fontSize: 11, fontWeight: "700" }}>{lang === "vi" ? item.tag : item.tagEn}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={mesh.ink400} />
                  </Pressable>
                  {index < upcomingItems.length - 1 ? <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.04)", marginHorizontal: 10 }} /> : null}
                </View>
              );
              })}
            </MeshCard>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 24, paddingBottom: 12 }}>
            <SectionLabel style={{ color: mesh.green700, fontSize: 15 }}>{t("recentContacts")}</SectionLabel>
            <Pressable onPress={() => nav("recentContacts")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: mesh.green700, fontSize: mesh.font.bodySm, fontWeight: "700" }}>{t("viewAll")}</Text>
              <Ionicons name="chevron-forward" size={14} color={mesh.green700} />
            </Pressable>
          </View>

          {loading ? null : error ? null : recent.length === 0 ? (
            <StateCard label="No recent contacts from API." />
          ) : (
            <View style={{ flexDirection: "row", gap: 14, paddingHorizontal: 4, paddingVertical: 4 }}>
              {recent.map((contact) => (
                <Pressable key={contact.id} onPress={() => nav("contactDetail", { id: contact.id })} style={{ width: 68, alignItems: "center", gap: 5 }}>
                  <GradientAvatar name={contact.name} statusColor={contact.statusColor ?? statusById(contact.status)?.color} size={64} />
                  <Text numberOfLines={1} style={{ textAlign: "center", color: mesh.ink700, fontSize: mesh.font.caption, fontWeight: "700", lineHeight: 15 }}>
                    {contact.name.split(" ").slice(-2).join(" ")}
                  </Text>
                  <Text numberOfLines={1} style={{ textAlign: "center", color: mesh.ink400, fontSize: 10, lineHeight: 13 }}>
                    {contact.activityLabel || ""}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={() => nav("createContact")} style={{ width: 64, alignItems: "center", gap: 6 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderStyle: "dashed", borderColor: mesh.green300, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.04)" }}>
                  <Ionicons name="add" size={24} color={mesh.green700} />
                </View>
                <Text style={{ textAlign: "center", color: mesh.green700, fontSize: mesh.font.caption, fontWeight: "700", lineHeight: 15 }}>{t("addContact")}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavScrim />

      <BottomNav
        active="home"
        t={t}
        onQuickCreateContact={() => setQuickCreateMode("contact")}
        onQuickCreateNote={() => setQuickCreateMode("note")}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "contacts") nav("contacts");
          else if (id === "notes") nav("notes");
          else if (id === "status") nav("status");
        }}
      />

      <QuickCreateSheet
        open={quickCreateMode !== null}
        onClose={() => setQuickCreateMode(null)}
      >
        {quickCreateMode === "note" && (
          <CreateNoteScreen
            t={t}
            lang={lang}
            nav={nav}
            presentation="sheet"
            onCloseSheet={() => setQuickCreateMode(null)}
            onCreated={(result) => {
              setQuickCreateMode(null);
              nav("notes", {
                highlightId: result.id,
                highlightLatest: result.highlightLatest,
                refresh: Date.now(),
              });
            }}
          />
        )}
        {quickCreateMode === "contact" && (
          <CreateContactScreen
            t={t}
            lang={lang}
            nav={nav}
            presentation="sheet"
            onCloseSheet={() => setQuickCreateMode(null)}
            onCreated={(result) => {
              setQuickCreateMode(null);
              nav("contacts", {
                highlightId: result.id,
                highlightName: result.name,
                refresh: Date.now(),
              });
            }}
          />
        )}
      </QuickCreateSheet>
    </MeshScreen>
  );
}

function StateCard({ label, tone = "muted" }: { label: string; tone?: "muted" | "error" }) {
  return (
    <MeshCard style={{ alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 22, borderWidth: 1, elevation: 0, padding: 18, shadowOpacity: 0.02 }}>
      {label === "Loading dashboard..." ? <ActivityIndicator color={mesh.green700} size="small" style={{ marginBottom: 8 }} /> : null}
      <Text style={{ color: tone === "error" ? mesh.pink : mesh.ink500, fontSize: 13, lineHeight: 19, textAlign: "center" }}>{label}</Text>
    </MeshCard>
  );
}
