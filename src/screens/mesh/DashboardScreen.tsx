import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { getDashboard } from "../../api/dashboardApi";
import { extractArray, normalizeApiContact, normalizeApiUpcoming } from "../../api/screenAdapters";
import { DashboardMeshBackground } from "../../components/DashboardMeshBackground";
import { Avatar, BottomNav, ContactAvatarRow, MeshCard, MeshHeader, MeshScreen, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { Contact, Lang, statusById, Upcoming } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

const iconMap = {
  call: "call-outline",
  calendar: "calendar-outline",
  gift: "gift-outline",
  bag: "bag-handle-outline"
} as const;

export function DashboardScreen({ t, lang, nav }: Props) {
  const [recent, setRecent] = useState<Contact[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<Upcoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getDashboard()
      .then((response) => {
        if (!active) return;

        const recentContacts = extractArray(response, "recentContacts").map(normalizeApiContact).filter(Boolean) as Contact[];
        const upcomingList = extractArray(response, "upcoming").map(normalizeApiUpcoming).filter(Boolean) as Upcoming[];

        setRecent(recentContacts.slice(0, 4));
        setUpcomingItems(upcomingList.slice(0, 4));
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setRecent([]);
        setUpcomingItems([]);
        setError(err instanceof Error && err.message ? err.message : "Cannot load dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <MeshScreen>
      <DashboardMeshBackground />

      <MeshHeader variant="transparent" style={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <Pressable onPress={() => nav("settings")}>
            <Avatar name="Trung" size={44} ring />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15, letterSpacing: 0.3 }}>
              {lang === "vi" ? "T03 10 Th 5" : "TUE 10 May"}
            </Text>
            <Pressable onPress={() => nav("notifications")} style={{ position: "relative" }}>
              <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
              <View style={{ position: "absolute", right: -2, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#28C56E", borderWidth: 1.5, borderColor: "#F8FCF7" }} />
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 46 }}>
          <Text style={{ color: mesh.green800, fontSize: 32, fontWeight: "800", letterSpacing: -0.4 }}>
            {t("greeting")}, Trung <Text style={{ fontSize: 28 }}>👋</Text>
          </Text>
          <Text style={{ color: mesh.ink500, fontSize: 16, lineHeight: 23, marginTop: 10 }}>{t("greetingSub")}</Text>
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
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 12 }}>
            <SectionLabel style={{ color: mesh.green700, fontSize: 15 }}>
              {t("upcoming")} <Text style={{ color: mesh.ink500 }}>({upcomingItems.length})</Text>
            </SectionLabel>
            <Pressable onPress={() => nav("allUpcoming")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "700" }}>{t("viewAll")}</Text>
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
            <MeshCard style={{ backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "rgba(6,69,50,0.06)", elevation: 0, shadowOpacity: 0.03, paddingHorizontal: 6, paddingVertical: 6 }}>
              {upcomingItems.map((item, index) => {
              const isReminder = item.kind === "reminder";
              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() => (isReminder ? nav("noteDetail", { id: "n1" }) : undefined)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 10, paddingVertical: 14 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={iconMap[item.icon as keyof typeof iconMap] || "ellipse-outline"} size={20} color={mesh.green700} />
                    </View>
                    <Text style={{ width: 56, color: mesh.green700, fontSize: 16, fontWeight: "700" }}>{item.time}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>
                        {lang === "vi" ? item.title : item.titleEn}
                      </Text>
                      <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{lang === "vi" ? item.sub : item.subEn}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: mesh.bgSubtle }}>
                      <Ionicons name={isReminder ? "time-outline" : "calendar-outline"} size={11} color={mesh.green700} />
                      <Text style={{ color: mesh.green700, fontSize: 11, fontWeight: "700" }}>{lang === "vi" ? item.tag : item.tagEn}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
                  </Pressable>
                  {index < upcomingItems.length - 1 ? <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.08)", marginHorizontal: 10 }} /> : null}
                </View>
              );
              })}
            </MeshCard>
          )}

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, paddingTop: 14, paddingBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mesh.green600 }} />
              <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "500" }}>{t("reminderLegend")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mesh.ink300 }} />
              <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "500" }}>{t("specialDayLegend")}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 14, paddingBottom: 14 }}>
            <SectionLabel style={{ color: mesh.green700, fontSize: 15 }}>{t("recentContacts")}</SectionLabel>
            <Pressable onPress={() => nav("recentContacts")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "700" }}>{t("viewAll")}</Text>
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
                  <Text numberOfLines={2} style={{ textAlign: "center", color: mesh.ink700, fontSize: 12, fontWeight: "700", lineHeight: 15 }}>
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
                <Text style={{ textAlign: "center", color: mesh.green700, fontSize: 12, fontWeight: "700", lineHeight: 15 }}>{t("addContact")}</Text>
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
