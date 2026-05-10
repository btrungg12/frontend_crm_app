import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { DashboardMeshBackground } from "../../components/DashboardMeshBackground";
import { Avatar, BottomNav, ContactAvatarRow, MeshCard, MeshHeader, MeshScreen, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { contacts, Lang, statusById, upcoming } from "../../mesh/meshData";
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
  const recent = [contacts[0], contacts[7], contacts[8], contacts[9]];
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 80, 160],
    outputRange: [1, 0.65, 0],
    extrapolate: "clamp"
  });
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [0, -40],
    extrapolate: "clamp"
  });

  return (
    <MeshScreen>
      <Animated.View
        pointerEvents="none"
        style={{
          opacity: heroOpacity,
          transform: [{ translateY: heroTranslateY }]
        }}
      >
        <DashboardMeshBackground />
      </Animated.View>

      <MeshHeader variant="transparent" style={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <Pressable onPress={() => nav("settings")}>
            <Avatar name="Trung" size={44} ring />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 }}>
              {lang === "vi" ? "T03 10 Th 5" : "TUE 10 May"}
            </Text>
            <Pressable onPress={() => nav("notifications")} style={{ position: "relative" }}>
              <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
              <View style={{ position: "absolute", right: -2, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#28C56E", borderWidth: 1.5, borderColor: "#F8FCF7" }} />
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 46 }}>
          <Text style={{ color: mesh.green800, fontSize: 32, fontWeight: "900", letterSpacing: -0.4 }}>
            {t("greeting")}, Trung <Text style={{ fontSize: 28 }}>👋</Text>
          </Text>
          <Text style={{ color: mesh.ink500, fontSize: 16, lineHeight: 23, marginTop: 10 }}>{t("greetingSub")}</Text>
        </View>
      </MeshHeader>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 12 }}>
            <SectionLabel style={{ color: mesh.green700, fontSize: 15 }}>
              {t("upcoming")} <Text style={{ color: mesh.ink500 }}>(4)</Text>
            </SectionLabel>
            <Pressable onPress={() => nav("allUpcoming")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800" }}>{t("viewAll")}</Text>
              <Ionicons name="chevron-forward" size={14} color={mesh.green700} />
            </Pressable>
          </View>

          <MeshCard style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
            {upcoming.map((item, index) => {
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
                    <Text style={{ width: 56, color: mesh.green700, fontSize: 16, fontWeight: "900" }}>{item.time}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>
                        {lang === "vi" ? item.title : item.titleEn}
                      </Text>
                      <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{lang === "vi" ? item.sub : item.subEn}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: mesh.bgSubtle }}>
                      <Ionicons name={isReminder ? "time-outline" : "calendar-outline"} size={11} color={mesh.green700} />
                      <Text style={{ color: mesh.green700, fontSize: 11, fontWeight: "800" }}>{lang === "vi" ? item.tag : item.tagEn}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
                  </Pressable>
                  {index < upcoming.length - 1 ? <View style={{ height: 1, backgroundColor: mesh.line, marginHorizontal: 10 }} /> : null}
                </View>
              );
            })}
          </MeshCard>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, paddingTop: 14, paddingBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mesh.green600 }} />
              <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "600" }}>{t("reminderLegend")}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mesh.ink300 }} />
              <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "600" }}>{t("specialDayLegend")}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 14, paddingBottom: 14 }}>
            <SectionLabel style={{ color: mesh.green700, fontSize: 15 }}>{t("recentContacts")}</SectionLabel>
            <Pressable onPress={() => nav("recentContacts")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800" }}>{t("viewAll")}</Text>
              <Ionicons name="chevron-forward" size={14} color={mesh.green700} />
            </Pressable>
          </View>

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
        </View>
      </Animated.ScrollView>

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
