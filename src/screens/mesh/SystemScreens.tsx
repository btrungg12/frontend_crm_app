import { Ionicons } from "@expo/vector-icons";
import { MeshGradientView } from "expo-mesh-gradient";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getDashboard } from "../../api/dashboardApi";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../../api/notificationApi";
import { extractArray, normalizeApiContact, normalizeApiUpcoming } from "../../api/screenAdapters";
import { changePassword, getProfile, updateProfile } from "../../api/userApi";
import { Avatar, BottomNav, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshChip, MeshHeader, MeshScreen, MeshScroll, MeshTextInput, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { Contact, Lang, statusById, Upcoming } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

type ApiNotificationItem = {
  body: string;
  bodyEn: string;
  color: string;
  contactId?: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  noteId?: string;
  section: "today" | "earlier";
  targetType?: string;
  time: string;
  title: string;
  titleEn: string;
  unread: boolean;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function relativeTime(value: unknown) {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return text(value, "");

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))}m`;
  if (diffMs < day) return `${Math.round(diffMs / hour)}h`;
  if (diffMs < 2 * day) return "Yesterday";

  return `${Math.round(diffMs / day)}d`;
}

function notificationMeta(type: string) {
  const normalized = type.toUpperCase();

  if (normalized.includes("SPECIAL")) {
    return { color: mesh.pink, icon: "calendar-outline" as const, title: "Special day" };
  }

  if (normalized.includes("SUGGEST")) {
    return { color: mesh.green700, icon: "sparkles-outline" as const, title: "Connection nudge" };
  }

  if (normalized.includes("SYSTEM")) {
    return { color: mesh.blue, icon: "information-circle-outline" as const, title: "System" };
  }

  return { color: mesh.orange, icon: "notifications-outline" as const, title: "Reminder coming up" };
}

function notificationSection(value: unknown): ApiNotificationItem["section"] {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "today";

  const now = new Date();
  return date.toDateString() === now.toDateString() ? "today" : "earlier";
}

function normalizeNotification(value: unknown): ApiNotificationItem | null {
  const item = asRecord(value);
  if (!item) return null;

  // Use the notification's own _id, not relatedId (which points to a Contact/Note)
  const id = text(item._id ?? item.id);
  if (!id) return null;

  const type = text(item.type, "REMINDER");
  const targetType = text(item.targetType ?? item.relatedType ?? item.onModel).toLowerCase();
  const meta = notificationMeta(type);
  const content = text(item.content ?? item.message ?? item.body, meta.title);
  const title = text(item.title, meta.title);
  const createdAt = item.createdAt ?? item.updatedAt ?? item.time;
  const note = asRecord(item.note);
  const contact = asRecord(item.contact ?? item.person);
  const upperType = type.toUpperCase();
  const targetIsNote = targetType.includes("note");
  const targetIsContact = targetType.includes("contact");
  const noteId = text(
    item.noteId ??
    note?._id ??
    note?.id ??
    item.relatedNoteId ??
    ((upperType.includes("REMINDER") || targetIsNote) ? item.relatedId : undefined) ??
    (targetIsNote ? item.targetId : undefined)
  );
  const contactId = text(
    item.contactId ??
    contact?._id ??
    contact?.id ??
    (targetIsContact ? item.relatedId : undefined) ??
    (targetIsContact ? item.targetId : undefined)
  );

  return {
    body: content,
    bodyEn: content,
    color: meta.color,
    contactId: contactId || undefined,
    icon: meta.icon,
    id,
    noteId: noteId || undefined,
    section: notificationSection(createdAt),
    targetType: targetType || undefined,
    time: relativeTime(createdAt),
    title,
    titleEn: title,
    unread: Boolean(item.unread ?? (item.isRead === undefined ? false : !item.isRead))
  };
}

function SystemStateCard({ error = false, loading = false, message }: { error?: boolean; loading?: boolean; message: string }) {
  return (
    <MeshCard style={{ alignItems: "center", gap: 10, padding: 18 }}>
      {loading ? <ActivityIndicator color={mesh.green700} /> : null}
      <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: 13, fontWeight: "600", textAlign: "center" }}>{message}</Text>
    </MeshCard>
  );
}

function unwrapData(value: unknown) {
  const root = asRecord(value);
  return asRecord(root?.data) ?? root;
}

function profileName(value: unknown) {
  const profile = unwrapData(value);
  const candidate = profile?.name ?? profile?.fullName ?? profile?.displayName ?? profile?.username;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : "";
}

function profileEmail(value: unknown) {
  const profile = unwrapData(value);
  const candidate = profile?.email ?? profile?.emailOrPhone ?? profile?.phone;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dashboardStats(value: unknown) {
  const root = unwrapData(value);
  const stats = asRecord(root?.stats) ?? root;
  return {
    contacts: numberValue(stats?.contactsCount ?? stats?.contactCount ?? stats?.contacts),
    notes: numberValue(stats?.notesCount ?? stats?.noteCount ?? stats?.notes),
    streak: numberValue(stats?.streakDays ?? stats?.streak)
  };
}

function SystemMeshHeader({
  action,
  nav,
  title
}: {
  action?: ReactNode;
  nav: NavFn;
  title: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: insets.top + 142,
        overflow: "hidden",
        paddingHorizontal: 20,
        paddingTop: insets.top + 14
      }}
    >
      <MeshGradientView
        pointerEvents="none"
        style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
        columns={4}
        rows={4}
        colors={[
          "#064532", "#0B573E", "#166B4B", "#0E7A55",
          "#ECF6EF", "#F4FAF6", "#DDEFE5", "#A7CDB8",
          "#FFFFFF", "#FFFFFF", "#FBFDFB", "#F4FAF6",
          "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"
        ]}
        points={[
          [0, 0],    [0.35, 0],    [0.72, 0],    [1, 0],
          [0, 0.28], [0.35, 0.32], [0.72, 0.30], [1, 0.26],
          [0, 0.62], [0.35, 0.66], [0.72, 0.70], [1, 0.66],
          [0, 1],    [0.35, 1],    [0.72, 1],    [1, 1]
        ]}
        smoothsColors
      />

      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <HeaderCircleBtn icon="chevron-back" onPress={() => nav("dashboard")} />
        {action ?? <View style={{ width: 52 }} />}
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: "#064532",
          fontSize: mesh.font.formTitle,
          fontWeight: "900",
          letterSpacing: -0.2,
          marginTop: 14,
          textAlign: "center"
        }}
      >
        {title}
      </Text>
    </View>
  );
}

export function NotificationsScreen({ t, lang, nav }: Props) {
  const [items, setItems] = useState<ApiNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getNotifications();
      const apiItems = extractArray(response, "notifications").map(normalizeNotification).filter(Boolean) as ApiNotificationItem[];
      setItems(apiItems);
    } catch (err) {
      setItems([]);
      setError(errorMessage(err, "Cannot load notifications."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const grouped = useMemo(() => items.reduce<Record<string, ApiNotificationItem[]>>((acc, item) => {
    acc[item.section] = acc[item.section] || [];
    acc[item.section].push(item);
    return acc;
  }, {}), [items]);

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      setError("");
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (err) {
      setError(errorMessage(err, "Cannot mark notifications as read."));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationPress = (item: ApiNotificationItem) => {
    if (item.unread) {
      setItems((current) => current.map((notification) => (notification.id === item.id ? { ...notification, unread: false } : notification)));
      markNotificationAsRead(item.id).catch(() => undefined);
    }

    if (item.noteId) {
      nav("noteDetail", { id: item.noteId });
    } else if (item.contactId) {
      nav("contactDetail", { id: item.contactId });
    } else {
      console.warn("Notification has no navigation target", item);
    }
  };

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      <SystemMeshHeader
        nav={nav}
        title={t("notifications")}
        action={
          <Pressable
            disabled={markingAll || items.length === 0}
            onPress={handleMarkAll}
            hitSlop={8}
            style={{
              backgroundColor: "rgba(255,255,255,0.88)",
              borderRadius: 999,
              opacity: markingAll || items.length === 0 ? 0.55 : 1,
              paddingHorizontal: 14,
              paddingVertical: 9
            }}
          >
            <Text style={{ color: mesh.green800, fontSize: mesh.font.bodySm, fontWeight: "800" }}>
              {markingAll ? "Marking..." : t("markAllRead")}
            </Text>
          </Pressable>
        }
      />

      <MeshScroll style={{ paddingHorizontal: 16, paddingTop: 0, marginTop: -8 }} bottom={60}>
        {loading ? <SystemStateCard loading message="Loading notifications from API..." /> : null}
        {!loading && error ? <SystemStateCard error message={error} /> : null}
        {!loading && !error && items.length === 0 ? <SystemStateCard message="No notifications from API." /> : null}
        {Object.entries(grouped).map(([section, items]) => (
          <View key={section}>
            <SectionLabel style={{ paddingHorizontal: 4, paddingTop: 14, paddingBottom: 8 }}>{section === "today" ? t("section_today") : t("section_earlier")}</SectionLabel>
            <MeshCard style={{ backgroundColor: "rgba(255,255,255,0.92)", borderColor: "rgba(6,69,50,0.055)", elevation: 1, paddingHorizontal: 14, shadowColor: "#064532", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.035, shadowRadius: 14 }}>
              {items.map((item, index) => (
                <Pressable key={item.id} onPress={() => handleNotificationPress(item)} style={{ borderBottomWidth: index < items.length - 1 ? 1 : 0, borderColor: mesh.line, flexDirection: "row", gap: 12, paddingVertical: 14 }}>
                  <View style={{ alignItems: "center", backgroundColor: `${item.color}20`, borderRadius: 12, height: 40, justifyContent: "center", width: 40 }}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "900" }}>{lang === "vi" ? item.title : item.titleEn}</Text>
                    <Text style={{ color: mesh.ink700, fontSize: 13, lineHeight: 19, marginTop: 3 }}>{lang === "vi" ? item.body : item.bodyEn}</Text>
                    <Text style={{ color: mesh.ink500, fontSize: 11, marginTop: 6 }}>{item.time}</Text>
                  </View>
                  {item.unread ? <View style={{ backgroundColor: mesh.green700, borderRadius: 4, height: 8, marginTop: 6, width: 8 }} /> : null}
                </Pressable>
              ))}
            </MeshCard>
          </View>
        ))}
      </MeshScroll>
    </MeshScreen>
  );
}

export function AllUpcomingScreen({ t, lang, nav }: Props) {
  const filters = [t("filterAll"), t("filterReminder"), t("filterSpecial")];
  const [items, setItems] = useState<Upcoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUpcoming() {
      try {
        setLoading(true);
        setError("");
        const response = await getDashboard();
        const normalized = extractArray(response, "upcoming").map(normalizeApiUpcoming).filter(Boolean) as Upcoming[];
        if (!active) return;
        setItems(normalized);
      } catch (err) {
        if (!active) return;
        setItems([]);
        setError(errorMessage(err, "Cannot load upcoming items from API."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUpcoming();

    return () => {
      active = false;
    };
  }, []);

  function openUpcoming(item: Upcoming) {
    if (item.kind !== "reminder") return;

    if (item.noteId) {
      nav("noteDetail", { id: item.noteId });
      return;
    }

    console.warn("Missing noteId for reminder upcoming", item);
  }

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      <SystemMeshHeader nav={nav} title={t("allUpcoming")} />
      <MeshScroll style={{ marginTop: -6, paddingHorizontal: 16, paddingTop: 0 }} bottom={60}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {filters.map((filter, index) => (
            <MeshChip key={filter} active={index === 0} style={{ backgroundColor: index === 0 ? mesh.green700 : "#FFFFFF", borderColor: index === 0 ? mesh.green700 : mesh.line, borderWidth: 1 }}>
              {filter}
            </MeshChip>
          ))}
        </View>
        {loading ? <SystemStateCard loading message="Loading upcoming items from API..." /> : null}
        {!loading && error ? <SystemStateCard error message={error} /> : null}
        {!loading && !error && items.length === 0 ? <SystemStateCard message="No upcoming items from API." /> : null}
        {!loading && !error && items.length > 0 ? (
          <MeshCard style={{ backgroundColor: "rgba(255,255,255,0.92)", borderColor: "rgba(6,69,50,0.055)", elevation: 1, paddingHorizontal: 14, shadowColor: "#064532", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.035, shadowRadius: 14 }}>
            {items.map((item, index) => (
              <Pressable key={item.id} onPress={() => openUpcoming(item)} style={{ alignItems: "center", borderBottomWidth: index < items.length - 1 ? 1 : 0, borderColor: mesh.line, flexDirection: "row", gap: 12, paddingVertical: 14 }}>
                <View style={{ alignItems: "center", backgroundColor: mesh.bgSubtle, borderRadius: 12, height: 40, justifyContent: "center", width: 40 }}>
                  <Ionicons name={item.kind === "reminder" ? "notifications-outline" : "calendar-outline"} size={18} color={item.kind === "reminder" ? mesh.green700 : mesh.pink} />
                </View>
                <View style={{ width: 54 }}>
                  <Text style={{ color: mesh.green700, fontSize: 16, fontWeight: "900" }}>{item.time}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{lang === "vi" ? item.title : item.titleEn}</Text>
                  <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{lang === "vi" ? item.sub : item.subEn}</Text>
                </View>
                <Text style={{ color: mesh.green700, fontSize: 11, fontWeight: "900" }}>{lang === "vi" ? item.tag : item.tagEn}</Text>
              </Pressable>
            ))}
          </MeshCard>
        ) : null}
      </MeshScroll>
    </MeshScreen>
  );
}

export function RecentContactsScreen({ t, nav }: Props) {
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecentContacts() {
      try {
        setLoading(true);
        setError("");
        const response = await getDashboard();
        const normalized = extractArray(response, "recentContacts").map(normalizeApiContact).filter(Boolean) as Contact[];
        if (!active) return;
        setRecentContacts(normalized);
      } catch (err) {
        if (!active) return;
        setRecentContacts([]);
        setError(errorMessage(err, "Cannot load recent contacts from API."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecentContacts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      <SystemMeshHeader nav={nav} title={t("recentContactsTitle")} />
      <MeshScroll style={{ marginTop: -6, paddingHorizontal: 16, paddingTop: 0 }} bottom={60}>
        {loading ? <SystemStateCard loading message="Loading recent contacts from API..." /> : null}
        {!loading && error ? <SystemStateCard error message={error} /> : null}
        {!loading && !error && recentContacts.length === 0 ? <SystemStateCard message="No recent contacts from API." /> : null}
        {!loading && !error && recentContacts.length > 0 ? (
          <MeshCard style={{ backgroundColor: "rgba(255,255,255,0.92)", borderColor: "rgba(6,69,50,0.055)", elevation: 1, paddingHorizontal: 14, shadowColor: "#064532", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.035, shadowRadius: 14 }}>
            {recentContacts.map((contact, index) => {
              const status = statusById(contact.status);
              return (
                <Pressable key={contact.id} onPress={() => nav("contactDetail", { id: contact.id })} style={{ alignItems: "center", borderBottomWidth: index < recentContacts.length - 1 ? 1 : 0, borderColor: mesh.line, flexDirection: "row", gap: 12, paddingVertical: 12 }}>
                  <Avatar name={contact.name} size={44} dot={status?.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{contact.name}</Text>
                    {contact.interactions ? (
                      <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{contact.interactions} interactions</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
                </Pressable>
              );
            })}
          </MeshCard>
        ) : null}
      </MeshScroll>
    </MeshScreen>
  );
}

function SubHeader({ title, nav }: { title: string; nav: NavFn }) {
  return (
    <MeshHeader style={{ paddingBottom: 30 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <HeaderCircleBtn icon="chevron-back" onPress={() => nav("back")} />
        <Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{title}</Text>
      </View>
    </MeshHeader>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "900", marginTop: 20, marginBottom: 8 }}>{children}</Text>;
}

function BottomSave({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderColor: mesh.line, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 }}>
      <Pressable disabled={disabled} onPress={onPress} style={{ borderRadius: mesh.radiusXl, backgroundColor: disabled ? mesh.ink400 : mesh.green700, paddingVertical: 15, alignItems: "center" }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 15 }}>{label}</Text>
      </Pressable>
    </View>
  );
}

export function EditProfileScreen({ t, nav }: Props) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getProfile()
      .then((response) => {
        if (!active) return;
        const root = asRecord(response);
        const data = asRecord(root?.data) ?? root;
        const user = asRecord(data?.user) ?? asRecord(root?.user) ?? data;
        setName(text(user?.name ?? user?.fullName));
        setBio(text(user?.bio ?? user?.description));
        setEmail(text(user?.email));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Cannot load profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      await updateProfile({
        bio: bio.trim() || undefined,
        name: trimmedName
      });
      setSuccessMessage(t("save"));
      nav("settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <SubHeader title={t("editProfile")} nav={nav} />
      <MeshScroll style={{ marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 24 }} bottom={140}>
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <ActivityIndicator color={mesh.green700} />
          </View>
        ) : null}
        {error ? <Text style={{ color: mesh.pink, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{error}</Text> : null}
        {successMessage ? <Text style={{ color: mesh.green700, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{successMessage}</Text> : null}
        <View style={{ alignItems: "center", marginBottom: 2 }}>
          <View style={{ position: "relative" }}>
            <Avatar name={name} size={92} />
            <View style={{ position: "absolute", right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: mesh.green700, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={{ color: mesh.ink500, fontSize: 13, marginTop: 10 }}>{t("tapChangeAvatar")}</Text>
        </View>

        <FieldLabel>{t("name")}</FieldLabel>
        <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: mesh.radiusLg, paddingHorizontal: 14, backgroundColor: "#FFFFFF" }}>
          <MeshTextInput value={name} onChangeText={setName} placeholder={t("name")} />
        </View>
        <FieldLabel>{t("bio")}</FieldLabel>
        <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: mesh.radiusLg, paddingHorizontal: 14, backgroundColor: "#FFFFFF" }}>
          <MeshTextInput value={bio} onChangeText={setBio} placeholder={t("bio")} multiline />
        </View>
        <FieldLabel>Email</FieldLabel>
        <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: mesh.radiusLg, paddingHorizontal: 14, backgroundColor: mesh.bgSubtle }}>
          <TextInput value={email} editable={false} style={{ minHeight: 48, color: mesh.ink500, fontSize: 15 }} />
        </View>
      </MeshScroll>
      <BottomSave disabled={saving || loading} label={saving ? "Saving..." : t("save")} onPress={handleSave} />
    </MeshScreen>
  );
}

export function ChangePasswordScreen({ t, nav }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New password confirmation does not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await changePassword({
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      nav("settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <SubHeader title={t("changePassword")} nav={nav} />
      <MeshScroll style={{ marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 24 }} bottom={140}>
        {error ? <Text style={{ color: mesh.pink, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{error}</Text> : null}
        <FieldLabel>{t("currentPassword")}</FieldLabel>
        <PasswordBox value={currentPassword} onChangeText={setCurrentPassword} />
        <FieldLabel>{t("newPassword")}</FieldLabel>
        <PasswordBox value={newPassword} onChangeText={setNewPassword} placeholder={t("min8")} />
        <FieldLabel>{t("confirmNewPassword")}</FieldLabel>
        <PasswordBox value={confirmNewPassword} onChangeText={setConfirmNewPassword} />
        <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 20, marginTop: 18 }}>{t("passwordHint")}</Text>
      </MeshScroll>
      <BottomSave disabled={saving} label={saving ? "Saving..." : t("save")} onPress={handleSave} />
    </MeshScreen>
  );
}

function PasswordBox({ onChangeText, placeholder, value }: { onChangeText: (value: string) => void; placeholder?: string; value: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: mesh.radiusLg, paddingHorizontal: 14, backgroundColor: "#FFFFFF" }}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={mesh.ink400} secureTextEntry style={{ minHeight: 48, color: mesh.ink900, fontSize: 15 }} />
    </View>
  );
}
export function LanguageScreen({ t, lang, nav }: Props) {
  const options = [
    { id: "vi", label: "Tiếng Việt", sub: "Vietnamese" },
    { id: "en", label: "English", sub: "English (US)" }
  ];

  return (
    <MeshScreen>
      <SubHeader title={t("languageScreen")} nav={nav} />
      <MeshScroll style={{ marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 14 }} bottom={60}>
        {options.map((item) => {
          const active = lang === item.id;
          return (
            <Pressable key={item.id} onPress={() => nav("back")} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, marginBottom: 10, borderRadius: mesh.radiusXl, borderWidth: active ? 1.5 : 1, borderColor: active ? mesh.green700 : mesh.line, backgroundColor: "#FFFFFF", ...mesh.shadow }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{item.label}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
              </View>
              {active ? (
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: mesh.green700 }}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
        <Text style={{ color: mesh.ink500, fontSize: 12, lineHeight: 18, marginTop: 14 }}>{t("languageHint")}</Text>
      </MeshScroll>
    </MeshScreen>
  );
}

export function NotifPrefsScreen({ t, lang, nav }: Props) {
  const [allow, setAllow] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [special, setSpecial] = useState(true);
  const [nudge, setNudge] = useState(false);
  const [quiet, setQuiet] = useState(true);

  return (
    <MeshScreen>
      <SubHeader title={t("notificationPrefs")} nav={nav} />
      <MeshScroll style={{ marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: mesh.bg, paddingHorizontal: 20, paddingTop: 14 }} bottom={60}>
        <SettingRow icon="notifications-outline" tone={mesh.orange} title={t("notifAllow")} desc={t("notifAllowDesc")} value={allow} onChange={setAllow} />
        <SectionLabel style={{ marginTop: 22, marginBottom: 8, paddingLeft: 4 }}>{t("notificationTypes")}</SectionLabel>
        <MeshCard style={{ overflow: "hidden" }}>
          <SettingRow inline disabled={!allow} icon="alarm-outline" tone={mesh.orange} title={t("notifReminder")} desc={t("notifReminderDesc")} value={reminder && allow} onChange={setReminder} />
          <Divider />
          <SettingRow inline disabled={!allow} icon="calendar-outline" tone={mesh.pink} title={t("notifSpecial")} desc={t("notifSpecialDesc")} value={special && allow} onChange={setSpecial} />
          <Divider />
          <SettingRow inline disabled={!allow} icon="sparkles-outline" tone={mesh.green700} title={t("notifSuggestion")} desc={t("notifSuggestionDesc")} value={nudge && allow} onChange={setNudge} />
        </MeshCard>
        <SectionLabel style={{ marginTop: 22, marginBottom: 8, paddingLeft: 4 }}>{lang === "vi" ? "KHÁC" : t("other")}</SectionLabel>
        <MeshCard style={{ overflow: "hidden" }}>
          <SettingRow inline icon="moon-outline" tone={mesh.blue} title={t("notifQuiet")} desc={t("notifQuietDesc")} value={quiet} onChange={setQuiet} />
        </MeshCard>
      </MeshScroll>
    </MeshScreen>
  );
}

function Divider() {
  return <View style={{ height: 1, marginHorizontal: 16, backgroundColor: mesh.line }} />;
}

function SettingRow({
  icon,
  tone,
  title,
  desc,
  value,
  onChange,
  disabled = false,
  inline = false
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  title: string;
  desc: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  inline?: boolean;
}) {
  return (
    <View style={{ opacity: disabled ? 0.5 : 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: inline ? 0 : mesh.radiusLg, borderWidth: inline ? 0 : 1, borderColor: mesh.line, backgroundColor: inline ? "transparent" : "#FFFFFF", ...(inline ? {} : mesh.shadow) }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${tone}20` }}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{desc}</Text>
      </View>
      <Switch value={value} disabled={disabled} onChange={onChange} />
    </View>
  );
}

function Switch({ value, disabled, onChange }: { value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable onPress={() => !disabled && onChange(!value)} style={{ width: 44, height: 26, borderRadius: 13, padding: 3, backgroundColor: value ? mesh.green700 : "#D1CFC8", alignItems: value ? "flex-end" : "flex-start" }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }} />
    </Pressable>
  );
}

export function StatusInUseScreen({ t, nav }: Props) {
  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <SubHeader title={t("statusInUseTitle")} nav={nav} />
      <View style={{ flex: 1, marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", padding: 20 }}>
        <View style={{ flexDirection: "row", gap: 12, padding: 16, borderRadius: mesh.radiusLg, borderWidth: 1, borderColor: mesh.line, backgroundColor: "rgba(217,87,122,0.04)", marginBottom: 18 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(217,87,122,0.12)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="help-circle-outline" size={18} color={mesh.pink} />
          </View>
          <Text style={{ flex: 1, color: mesh.ink700, fontSize: 14, lineHeight: 21 }}>{t("statusInUseDesc", { n: 18 })}</Text>
        </View>
        <ChoiceRow icon="people-outline" tone={mesh.pink} title={t("moveToOther")} desc={t("moveToOtherDesc")} onPress={() => nav("back")} />
        <ChoiceRow icon="pricetag-outline" tone={mesh.green700} title={t("pickAnother")} desc={t("pickAnotherDesc")} onPress={() => nav("back")} />
        <Pressable onPress={() => nav("back")} style={{ marginTop: 18, borderRadius: mesh.radiusXl, borderWidth: 1, borderColor: mesh.line, paddingVertical: 14, alignItems: "center", backgroundColor: "#FFFFFF" }}>
          <Text style={{ color: mesh.ink700, fontSize: 15, fontWeight: "900" }}>{t("cancelAction")}</Text>
        </Pressable>
      </View>
    </MeshScreen>
  );
}

function ChoiceRow({ icon, tone, title, desc, onPress }: { icon: keyof typeof Ionicons.glyphMap; tone: string; title: string; desc: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, marginBottom: 10, borderRadius: mesh.radiusXl, backgroundColor: "#FFFFFF", ...mesh.shadow }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${tone}20` }}>
        <Ionicons name={icon} size={20} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={mesh.ink400} />
    </Pressable>
  );
}

export function ConfirmShowcaseScreen({ t, nav, kind }: Props & { kind: "note" | "contact" | "status" | "special" }) {
  const map = {
    note: ["deleteNoteTitle", "deleteNoteDesc"],
    contact: ["deleteContactTitle", "deleteContactDesc"],
    status: ["deleteStatusTitle", "deleteStatusDesc"],
    special: ["deleteSpecialTitle", "deleteSpecialDesc"]
  } as const;
  const [titleKey, descKey] = map[kind];

  return (
    <MeshScreen>
      <MeshHeader>
        <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "900" }}>{kind === "status" ? t("status") : kind === "note" ? t("notes") : t("contacts")}</Text>
      </MeshHeader>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
        <MeshCard style={{ padding: 18 }}>
          <Text style={{ color: mesh.ink900, fontSize: 17, fontWeight: "900" }}>{t(titleKey)}</Text>
          <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 20, marginTop: 6 }}>{t(descKey)}</Text>
        </MeshCard>
      </View>
      <ConfirmDialog open title={t(titleKey)} desc={t(descKey)} confirmLabel={t("delete")} cancelLabel={t("cancel")} onClose={() => nav("back")} onConfirm={() => nav("back")} />
    </MeshScreen>
  );
}

function EmptyShell({
  t,
  nav,
  header,
  title,
  desc,
  ctaLabel,
  ctaIcon = "add",
  onCta,
  withTabs = true,
  tab = "home"
}: Props & {
  header: ReactNode;
  title: string;
  desc: string;
  ctaLabel?: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  onCta?: () => void;
  withTabs?: boolean;
  tab?: "home" | "contacts" | "notes" | "status";
}) {
  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <MeshHeader style={{ paddingBottom: 30 }}>{header}</MeshHeader>
      <View style={{ flex: 1, marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 80 }}>
        <CircleArt icon={ctaIcon === "pricetag-outline" ? "pricetag-outline" : ctaIcon === "notifications-outline" ? "notifications-outline" : "people-outline"} />
        <Text style={{ color: mesh.ink900, fontSize: 20, fontWeight: "900", marginTop: 22, textAlign: "center" }}>{title}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: "center", maxWidth: 280 }}>{desc}</Text>
        {ctaLabel ? (
          <Pressable onPress={onCta} style={{ marginTop: 28, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999, backgroundColor: mesh.green700, flexDirection: "row", alignItems: "center", gap: 8, shadowColor: mesh.green700, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}>
            <Ionicons name={ctaIcon} size={18} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900" }}>{ctaLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {withTabs ? (
        <BottomNav
          active={tab}
          t={t}
          onQuickCreateContact={() => nav("createContact")}
          onQuickCreateNote={() => nav("createNote")}
          onTab={(id) => nav(id === "home" ? "dashboard" : id)}
        />
      ) : null}
    </MeshScreen>
  );
}

function CircleArt({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.10)" }}>
      <View style={{ position: "absolute", inset: 14, borderRadius: 46, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(31,112,72,0.35)" }} />
      <Ionicons name={icon} size={44} color={mesh.green700} />
    </View>
  );
}

export function StatusEmptyScreen({ t, nav }: Props) {
  return (
    <EmptyShell
      t={t}
      lang="en"
      nav={nav}
      tab="status"
      header={<View><Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "900" }}>{t("status")}</Text><Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 6 }}>{t("statusSub")}</Text></View>}
      title={t("emptyStatusTitle")}
      desc={t("emptyStatusDesc")}
      ctaLabel={t("newStatus")}
      ctaIcon="pricetag-outline"
      onCta={() => nav("createStatus")}
    />
  );
}

export function NotifEmptyScreen({ t, lang, nav }: Props) {
  return (
    <EmptyShell
      t={t}
      lang={lang}
      nav={nav}
      withTabs={false}
      header={<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><HeaderCircleBtn icon="chevron-back" onPress={() => nav("back")} /><Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{t("notifications")}</Text></View>}
      title={t("emptyNotifTitle")}
      desc={t("emptyNotifDesc")}
      ctaIcon="notifications-outline"
    />
  );
}

export function DashboardEmptyScreen({ t, lang, nav }: Props) {
  return (
    <EmptyShell
      t={t}
      lang={lang}
      nav={nav}
      tab="home"
      header={<View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}><View><Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 4 }}>{t("goodMorning")}</Text><Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "900" }}>{t("greeting")} Quang</Text></View><HeaderCircleBtn icon="notifications-outline" /></View>}
      title={t("emptyDashTitle")}
      desc={t("emptyDashDesc")}
      ctaLabel={t("addFirstContact")}
      ctaIcon="people-outline"
      onCta={() => nav("createContact")}
    />
  );
}

export function SettingsScreen({ t, lang, nav }: Props) {
  const [profileNameVal, setProfileNameVal] = useState("");
  const [profileEmailVal, setProfileEmailVal] = useState("");
  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [notesCount, setNotesCount] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([getProfile(), getDashboard()])
      .then(([profileRes, dashRes]) => {
        if (!active) return;
        setProfileNameVal(profileName(profileRes));
        setProfileEmailVal(profileEmail(profileRes));
        const stats = dashboardStats(dashRes);
        if (stats.contacts !== null) setContactsCount(stats.contacts);
        if (stats.notes !== null) setNotesCount(stats.notes);
        if (stats.streak !== null) setStreakDays(stats.streak);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const displayName = profileNameVal || "—";
  const displayEmail = profileEmailVal || "—";

  const sections = [
    {
      label: t("account"),
      items: [
        { icon: "person-outline" as const, label: t("profile"), trail: displayName, route: "editProfile" },
        { icon: "mail-outline" as const, label: "Email", trail: displayEmail },
        { icon: "lock-closed-outline" as const, label: t("changePassword"), route: "changePassword" }
      ]
    },
    {
      label: t("preferences"),
      items: [
        { icon: "globe-outline" as const, label: t("language"), trail: lang === "vi" ? "Tiếng Việt" : "English", route: "language" },
        { icon: "notifications-outline" as const, label: t("notifications"), route: "notifPrefs" },
        { icon: "moon-outline" as const, label: t("darkMode"), toggle: false }
      ]
    },
    {
      label: t("about"),
      items: [
        { icon: "help-circle-outline" as const, label: t("help") },
        { icon: "shield-checkmark-outline" as const, label: t("privacy") },
        { icon: "star-outline" as const, label: t("rateApp") }
      ]
    }
  ];

  return (
    <MeshScreen>
      <MeshHeader style={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("dashboard")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{t("settings")}</Text>
        </View>
        <View style={{ alignItems: "center", paddingTop: 18 }}>
          {loading ? (
            <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" style={{ marginBottom: 8 }} />
          ) : null}
          <Avatar name={displayName} size={84} ring />
          <Text style={{ color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 12 }}>{displayName}</Text>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>{displayEmail}</Text>
          <Pressable onPress={() => nav("editProfile")} style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.18)" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>{t("editProfile")}</Text>
          </Pressable>
        </View>
      </MeshHeader>

      <MeshScroll style={{ marginTop: -34, paddingHorizontal: 16 }} bottom={80}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { value: contactsCount, label: t("contacts"), color: mesh.green700 },
            { value: notesCount, label: t("notes"), color: mesh.blue },
            { value: streakDays, label: t("streakDays"), color: mesh.orange }
          ].map((item) => (
            <MeshCard key={item.label} style={{ flex: 1, padding: 14, alignItems: "center" }}>
              <Text style={{ color: item.color, fontSize: 22, fontWeight: "900" }}>
                {loading ? "—" : item.value !== null ? String(item.value) : "—"}
              </Text>
              <Text style={{ color: mesh.ink500, fontSize: 11, marginTop: 4 }}>{item.label}</Text>
            </MeshCard>
          ))}
        </View>

        {sections.map((section) => (
          <View key={section.label}>
            <SectionLabel style={{ paddingHorizontal: 4, paddingTop: 20, paddingBottom: 8 }}>{section.label}</SectionLabel>
            <MeshCard style={{ paddingHorizontal: 14 }}>
              {section.items.map((item, index) => (
                <Pressable key={item.label} onPress={() => ("route" in item && item.route ? nav(item.route) : undefined)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: index < section.items.length - 1 ? 1 : 0, borderColor: mesh.line }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={item.icon} size={16} color={mesh.green700} />
                  </View>
                  <Text style={{ flex: 1, color: mesh.ink900, fontSize: 14, fontWeight: "800" }}>{item.label}</Text>
                  {"trail" in item && item.trail ? <Text style={{ color: mesh.ink500, fontSize: 13 }}>{item.trail}</Text> : null}
                  {"toggle" in item ? <Switch value={Boolean(item.toggle)} onChange={() => {}} /> : <Ionicons name="chevron-forward" size={14} color={mesh.ink400} />}
                </Pressable>
              ))}
            </MeshCard>
          </View>
        ))}

        <Pressable style={{ marginTop: 20, borderRadius: mesh.radiusLg, borderWidth: 1, borderColor: "rgba(217,87,122,0.3)", backgroundColor: "#FFFFFF", paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
          <Ionicons name="log-out-outline" size={16} color={mesh.pink} />
          <Text style={{ color: mesh.pink, fontSize: 14, fontWeight: "900" }}>{t("signOut")}</Text>
        </Pressable>
        <Text style={{ textAlign: "center", color: mesh.ink400, fontSize: 11, marginTop: 18 }}>Mesh v1.0.0</Text>
      </MeshScroll>
    </MeshScreen>
  );
}

export function NotesEmptyScreen({ t, nav }: Props) {
  return (
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 8 }}>
          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 32, fontWeight: "900" }}>{t("notes")}</Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20, marginTop: 6 }}>{t("notesSub")}</Text>
          </View>
          <HeaderCircleBtn icon="search-outline" onPress={() => nav("search")} />
        </View>
      </MeshHeader>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingBottom: 88 }}>
        <CircleArt icon="document-text-outline" />
        <Text style={{ color: mesh.ink900, fontSize: 22, fontWeight: "900", marginTop: 22, textAlign: "center" }}>{t("noNotesTitle")}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, marginTop: 10, textAlign: "center", maxWidth: 280 }}>{t("noNotesDesc")}</Text>
        <Pressable onPress={() => nav("createNote")} style={{ marginTop: 24, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 999, backgroundColor: mesh.green700, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900" }}>{t("createFirstNote")}</Text>
        </Pressable>
      </View>
      <BottomNav
        active="notes"
        t={t}
        onQuickCreateContact={() => nav("createContact")}
        onQuickCreateNote={() => nav("createNote")}
        onTab={(id) => nav(id === "home" ? "dashboard" : id)}
      />
    </MeshScreen>
  );
}
