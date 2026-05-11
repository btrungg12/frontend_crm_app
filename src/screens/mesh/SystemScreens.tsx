import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { getDashboard } from "../../api/dashboardApi";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../../api/notificationApi";
import { extractArray, normalizeApiContact } from "../../api/screenAdapters";
import { Avatar, BottomNav, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshChip, MeshHeader, MeshScreen, MeshScroll, MeshTextInput, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { Contact, contacts, Lang, notes, statusById, upcoming } from "../../mesh/meshData";
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
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  section: "today" | "earlier";
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

  const id = text(item._id ?? item.id ?? item.relatedId);
  if (!id) return null;

  const type = text(item.type, "REMINDER");
  const meta = notificationMeta(type);
  const content = text(item.content ?? item.message ?? item.body, meta.title);
  const title = text(item.title, meta.title);
  const createdAt = item.createdAt ?? item.updatedAt ?? item.time;

  return {
    body: content,
    bodyEn: content,
    color: meta.color,
    icon: meta.icon,
    id,
    section: notificationSection(createdAt),
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
      const normalized = extractArray(response, "notifications").map(normalizeNotification).filter(Boolean) as ApiNotificationItem[];
      setItems(normalized);
    } catch (err) {
      setItems([]);
      setError(errorMessage(err, "Cannot load notifications from API."));
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

    nav("noteDetail");
  };

  return (
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("dashboard")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{t("notifications")}</Text>
          <Pressable disabled={markingAll || items.length === 0} onPress={handleMarkAll} hitSlop={8} style={{ opacity: markingAll || items.length === 0 ? 0.55 : 1 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>{markingAll ? "Marking..." : t("markAllRead")}</Text>
          </Pressable>
        </View>
      </MeshHeader>

      <MeshScroll style={{ paddingHorizontal: 16, paddingTop: 8 }} bottom={60}>
        {loading ? <SystemStateCard loading message="Loading notifications from API..." /> : null}
        {!loading && error ? <SystemStateCard error message={error} /> : null}
        {!loading && !error && items.length === 0 ? <SystemStateCard message="No notifications from API." /> : null}
        {Object.entries(grouped).map(([section, items]) => (
          <View key={section}>
            <SectionLabel style={{ paddingHorizontal: 4, paddingTop: 14, paddingBottom: 8 }}>{section === "today" ? t("section_today") : t("section_earlier")}</SectionLabel>
            <MeshCard style={{ paddingHorizontal: 14 }}>
              {items.map((item, index) => (
                <Pressable key={item.id} onPress={() => handleNotificationPress(item)} style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: index < items.length - 1 ? 1 : 0, borderColor: mesh.line }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${item.color}20` }}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "900" }}>{lang === "vi" ? item.title : item.titleEn}</Text>
                    <Text style={{ color: mesh.ink700, fontSize: 13, lineHeight: 19, marginTop: 3 }}>{lang === "vi" ? item.body : item.bodyEn}</Text>
                    <Text style={{ color: mesh.ink500, fontSize: 11, marginTop: 6 }}>{item.time}</Text>
                  </View>
                  {item.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mesh.green700, marginTop: 6 }} /> : null}
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

  return (
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("dashboard")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{t("allUpcoming")}</Text>
        </View>
      </MeshHeader>
      <MeshScroll style={{ paddingHorizontal: 16, paddingTop: 14 }} bottom={60}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {filters.map((filter, index) => (
            <MeshChip key={filter} active={index === 0} style={{ backgroundColor: index === 0 ? mesh.green700 : "#FFFFFF", borderWidth: 1, borderColor: index === 0 ? mesh.green700 : mesh.line }}>
              {filter}
            </MeshChip>
          ))}
        </View>
        <MeshCard style={{ paddingHorizontal: 14 }}>
          {upcoming.map((item, index) => (
            <Pressable key={item.id} onPress={() => item.kind === "reminder" && nav("noteDetail")} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: index < upcoming.length - 1 ? 1 : 0, borderColor: mesh.line }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center" }}>
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
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("dashboard")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{t("recentContactsTitle")}</Text>
        </View>
      </MeshHeader>
      <MeshScroll style={{ paddingHorizontal: 16, paddingTop: 14 }} bottom={60}>
        {loading ? <SystemStateCard loading message="Loading recent contacts from API..." /> : null}
        {!loading && error ? <SystemStateCard error message={error} /> : null}
        {!loading && !error && recentContacts.length === 0 ? <SystemStateCard message="No recent contacts from API." /> : null}
        {!loading && !error && recentContacts.length > 0 ? (
        <MeshCard style={{ paddingHorizontal: 14 }}>
          {recentContacts.map((contact, index) => {
            const status = statusById(contact.status);
            return (
              <Pressable key={contact.id} onPress={() => nav("contactDetail", { id: contact.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: index < recentContacts.length - 1 ? 1 : 0, borderColor: mesh.line }}>
                <Avatar name={contact.name} size={44} dot={status?.color} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{contact.name}</Text>
                  <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{contact.interactions} interactions</Text>
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

function BottomSave({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderColor: mesh.line, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 }}>
      <Pressable onPress={onPress} style={{ borderRadius: mesh.radiusXl, backgroundColor: mesh.green700, paddingVertical: 15, alignItems: "center" }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 15 }}>{label}</Text>
      </Pressable>
    </View>
  );
}

export function EditProfileScreen({ t, lang, nav }: Props) {
  const [name, setName] = useState("Trần Quang");
  const [bio, setBio] = useState(lang === "vi" ? "Đang xây dựng thói quen quan tâm." : "Building the habit of caring more.");

  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <SubHeader title={t("editProfile")} nav={nav} />
      <MeshScroll style={{ marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 24 }} bottom={140}>
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
          <TextInput value="quang@mesh.app" editable={false} style={{ minHeight: 48, color: mesh.ink500, fontSize: 15 }} />
        </View>
      </MeshScroll>
      <BottomSave label={t("save")} onPress={() => nav("back")} />
    </MeshScreen>
  );
}

export function ChangePasswordScreen({ t, nav }: Props) {
  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <SubHeader title={t("changePassword")} nav={nav} />
      <MeshScroll style={{ marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 24 }} bottom={140}>
        <FieldLabel>{t("currentPassword")}</FieldLabel>
        <PasswordBox value="••••••••" />
        <FieldLabel>{t("newPassword")}</FieldLabel>
        <PasswordBox placeholder={t("min8")} />
        <FieldLabel>{t("confirmNewPassword")}</FieldLabel>
        <PasswordBox />
        <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 20, marginTop: 18 }}>{t("passwordHint")}</Text>
      </MeshScroll>
      <BottomSave label={t("save")} onPress={() => nav("back")} />
    </MeshScreen>
  );
}

function PasswordBox({ value, placeholder }: { value?: string; placeholder?: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: mesh.radiusLg, paddingHorizontal: 14, backgroundColor: "#FFFFFF" }}>
      <TextInput value={value} placeholder={placeholder} placeholderTextColor={mesh.ink400} secureTextEntry={!value} style={{ minHeight: 48, color: mesh.ink900, fontSize: 15 }} />
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
      {withTabs ? <BottomNav active={tab} t={t} onTab={(id) => nav(id === "fab" ? "createNote" : id === "home" ? "dashboard" : id)} /> : null}
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
  const sections = [
    {
      label: t("account"),
      items: [
        { icon: "person-outline" as const, label: t("profile"), trail: "Trần Quang", route: "editProfile" },
        { icon: "mail-outline" as const, label: "Email", trail: "quang@mesh.app" },
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
          <Avatar name="Trung Nguyễn" size={84} ring />
          <Text style={{ color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 12 }}>Trung Nguyễn</Text>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>trung@mesh.app</Text>
          <Pressable onPress={() => nav("editProfile")} style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.18)" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>{t("editProfile")}</Text>
          </Pressable>
        </View>
      </MeshHeader>

      <MeshScroll style={{ marginTop: -34, paddingHorizontal: 16 }} bottom={80}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { value: contacts.length, label: t("contacts"), color: mesh.green700 },
            { value: notes.length, label: t("notes"), color: mesh.blue },
            { value: 7, label: t("streakDays"), color: mesh.orange }
          ].map((item) => (
            <MeshCard key={item.label} style={{ flex: 1, padding: 14, alignItems: "center" }}>
              <Text style={{ color: item.color, fontSize: 22, fontWeight: "900" }}>{item.value}</Text>
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
      <BottomNav active="notes" t={t} onTab={(id) => nav(id === "fab" ? "createNote" : id === "home" ? "dashboard" : id)} />
    </MeshScreen>
  );
}
