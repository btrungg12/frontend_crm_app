import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { getDashboard } from "../../api/dashboardApi";
import { extractArray, normalizeApiContact, normalizeApiUpcoming } from "../../api/screenAdapters";
import { getProfile } from "../../api/userApi";
import { DashboardMeshBackground } from "../../components/DashboardMeshBackground";
import { Avatar, BottomNav, ContactAvatarRow, MeshCard, MeshHeader, MeshScreen, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { Contact, Lang, statusById, Upcoming, upcoming as mockUpcoming } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";
import { getToken } from "../../storage/tokenStorage";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function unwrapData(value: unknown) {
  const root = asRecord(value);
  return asRecord(root?.data) ?? root;
}

function readUserName(value: unknown) {
  const profile = unwrapData(value);
  const candidate = profile?.name ?? profile?.fullName ?? profile?.displayName ?? profile?.username;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : "User";
}

function formatCurrentDate(lang: Lang) {
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const date = new Date();
  const weekday = date.toLocaleDateString(locale, { weekday: "short" }).toUpperCase();
  const month = date.toLocaleDateString(locale, { month: "short" });
  return `${weekday} ${date.getDate()} ${month}`;
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

export function DashboardScreen({ t, lang, nav }: Props) {
  const [recent, setRecent] = useState<Contact[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<Upcoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("User");

  function openUpcoming(item: Upcoming) {
    if (item.kind !== "reminder") return;

    if (item.noteId) {
      nav("noteDetail", { id: item.noteId });
      return;
    }

    console.warn("Missing noteId for reminder upcoming", item);
  }

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
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

        const recentContacts = extractArray(dashboardResponse, "recentContacts").map(normalizeApiContact).filter(Boolean) as Contact[];
        const apiUpcoming = extractArray(dashboardResponse, "upcoming").map(normalizeApiUpcoming).filter(Boolean) as Upcoming[];
        const upcomingList = apiUpcoming.length > 0 ? apiUpcoming : mockUpcoming;

        setUserName(readUserName(profileResponse));
        setRecent(recentContacts.slice(0, 4));
        setUpcomingItems(upcomingList.slice(0, 4));
      } catch (err) {
        if (!active) return;
        setRecent([]);
        setUpcomingItems([]);
        setError(err instanceof Error && err.message ? err.message : "Cannot load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

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
              <View style={{ position: "absolute", right: -2, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#28C56E", borderWidth: 1.5, borderColor: "#F8FCF7" }} />
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
            <MeshCard style={{ backgroundColor: "rgba(255,255,255,0.86)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(6,69,50,0.045)", elevation: 0, shadowOpacity: 0.012, paddingHorizontal: 4, paddingVertical: 0 }}>
              {upcomingItems.map((item, index) => {
              const visual = getUpcomingVisual(item);
              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() => openUpcoming(item)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 10, paddingVertical: 8 }}
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
                      <Text style={{ color: visual.pillColor, fontSize: mesh.font.nav, fontWeight: "700" }}>{lang === "vi" ? item.tag : item.tagEn}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={mesh.ink400} />
                  </Pressable>
                  {index < upcomingItems.length - 1 ? <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.045)", marginHorizontal: 8 }} /> : null}
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
              {recent.map((contact) => {
              const status = statusById(contact.status);
              return (
                <Pressable key={contact.id} onPress={() => nav("contactDetail", { id: contact.id })} style={{ width: 64, alignItems: "center", gap: 6 }}>
                  <ContactAvatarRow contact={contact} />
                  <Text numberOfLines={2} style={{ textAlign: "center", color: mesh.ink700, fontSize: mesh.font.caption, fontWeight: "700", lineHeight: 15 }}>
                    {contact.name.split(" ").slice(-2).join(" ")}
                  </Text>
                  <View style={{ width: 0, height: 0, backgroundColor: status?.color }} />
                </Pressable>
              );
              })}
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

      <BottomNav
        active="home"
        t={t}
        onTab={(id) => {
          if (id === "fab") nav("createNote");
          else if (id === "contacts") nav("contacts");
          else if (id === "notes") nav("notes");
          else if (id === "status") nav("status");
        }}
      />
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
