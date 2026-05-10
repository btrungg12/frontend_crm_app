import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNav, MeshScreen, MeshScroll, NavFn, TFn } from "../../mesh/MeshComponents";
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

const avatarPhotos: Record<string, string> = {
  user: "https://randomuser.me/api/portraits/men/32.jpg",
  c1: "https://randomuser.me/api/portraits/men/75.jpg",
  c8: "https://randomuser.me/api/portraits/women/65.jpg",
  c9: "https://randomuser.me/api/portraits/men/46.jpg",
  c10: "https://randomuser.me/api/portraits/women/44.jpg"
};

export function DashboardScreen({ lang, nav }: Props) {
  const insets = useSafeAreaInsets();
  const recent = [contacts[0], contacts[7], contacts[8], contacts[9]];

  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 340, overflow: "hidden" }}>
        <View style={{ position: "absolute", top: -142, right: -120, width: 478, height: 386, borderRadius: 245, backgroundColor: "#004D3D", opacity: 0.94 }} />
        <View style={{ position: "absolute", top: 110, left: -98, width: 348, height: 225, borderRadius: 180, backgroundColor: "#DCEBE3", opacity: 0.82 }} />
        <View style={{ position: "absolute", top: 185, right: -18, width: 220, height: 170, opacity: 0.75 }}>
          <LeafCluster />
        </View>
      </View>

      <MeshScroll style={{ flex: 1 }} bottom={150}>
        <View style={{ paddingTop: insets.top + 22, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable onPress={() => nav("settings")}>
              <Image source={{ uri: avatarPhotos.user }} style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: "#EFE7DA" }} />
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 18 }}>T03 10 Thg 10</Text>
              <Pressable onPress={() => nav("notifications")} style={{ position: "relative" }}>
                <Ionicons name="notifications-outline" size={34} color="#FFFFFF" />
                <View style={{ position: "absolute", right: 0, top: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: "#1AB463", borderWidth: 2, borderColor: "#006548" }} />
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: 84 }}>
            <Text style={{ color: mesh.green800, fontSize: 34, fontWeight: "900", letterSpacing: -0.5 }}>
              Xin chào, Trung <Text style={{ fontSize: 30 }}>👋</Text>
            </Text>
            <Text style={{ color: "#62676F", fontSize: 20, lineHeight: 28, marginTop: 16 }}>Hôm nay bạn muốn ghi lại điều gì?</Text>
          </View>

          <SectionHeader title="UPCOMING" count="(4)" action="Xem tất cả" onPress={() => nav("allUpcoming")} style={{ marginTop: 78 }} />

          <View>
            {upcoming.map((item, index) => {
              const isReminder = item.kind === "reminder";
              const title = ["Gọi cho An", "Sinh nhật Minh", "Kỷ niệm 2 năm gặp nhau", "Nhắc mua quà cho Nam"][index] || (lang === "vi" ? item.title : item.titleEn);
              const sub = ["Hôm nay", "Ngày mai", "22/05", "23/05"][index] || (lang === "vi" ? item.sub : item.subEn);
              const tag = ["Trong 2 giờ", "Ngày mai", "2 ngày nữa", "3 ngày nữa"][index] || (lang === "vi" ? item.tag : item.tagEn);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => (isReminder ? nav("noteDetail", { id: "n1" }) : undefined)}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 22, borderBottomWidth: index < upcoming.length - 1 ? 1 : 0, borderColor: "#E2E7E2" }}
                >
                  <View style={{ width: 58, height: 58, borderRadius: 14, backgroundColor: "#F0F5F0", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={iconMap[item.icon as keyof typeof iconMap] || "ellipse-outline"} size={30} color={mesh.green700} />
                  </View>
                  <Text style={{ width: 74, marginLeft: 18, color: "#008745", fontSize: 24, lineHeight: 28, fontWeight: "900" }}>{item.time}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: "#121917", fontSize: 18, fontWeight: "900" }}>{title}</Text>
                    <Text style={{ color: "#6B7077", fontSize: 16, marginTop: 6 }}>{sub}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#EEF3EC", marginLeft: 8 }}>
                    <Ionicons name={isReminder ? "time-outline" : "calendar-outline"} size={16} color={mesh.green700} />
                    <Text style={{ color: mesh.green700, fontSize: 15, fontWeight: "800" }}>{tag}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={26} color={mesh.green700} style={{ marginLeft: 12 }} />
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, paddingTop: 22, paddingBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: "#0EA05A" }} />
              <Text style={{ color: "#6B7077", fontSize: 14 }}>Reminder (ghi chú có nhắc nhở)</Text>
            </View>
            <View style={{ width: 1, height: 20, backgroundColor: "#D9DEDA" }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: "#E8EDE8" }} />
              <Text style={{ color: "#6B7077", fontSize: 14 }}>Dịp đặc biệt</Text>
            </View>
          </View>

          <SectionHeader title="LIÊN HỆ GẦN ĐÂY" action="Xem tất cả" onPress={() => nav("recentContacts")} style={{ marginTop: 48 }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 22 }}>
            {recent.map((contact) => {
              const status = statusById(contact.status);
              return (
                <Pressable key={contact.id} onPress={() => nav("contactDetail", { id: contact.id })} style={{ width: 78, alignItems: "center" }}>
                  <View style={{ position: "relative" }}>
                    <Image source={{ uri: avatarPhotos[contact.id] }} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#EEF2F0" }} />
                    <View style={{ position: "absolute", right: 1, bottom: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: status?.color || "#10A957", borderWidth: 3, borderColor: "#FFFFFF" }} />
                  </View>
                  <Text numberOfLines={2} style={{ marginTop: 12, textAlign: "center", color: "#1F2933", fontSize: 17, lineHeight: 24 }}>
                    {contact.name.split(" ").slice(-2).join("\n")}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => nav("createContact")} style={{ width: 78, alignItems: "center" }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "#EFE5D6" }}>
                <Ionicons name="add" size={38} color={mesh.green700} />
              </View>
              <Text style={{ marginTop: 12, textAlign: "center", color: "#62676F", fontSize: 17, lineHeight: 24 }}>Thêm{"\n"}liên hệ</Text>
            </Pressable>
          </View>
        </View>
      </MeshScroll>

      <BottomNav
        active="home"
        t={() => ""}
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

function SectionHeader({ title, count, action, onPress, style }: { title: string; count?: string; action: string; onPress: () => void; style?: object }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }, style]}>
      <Text style={{ color: mesh.green800, fontSize: 21, fontWeight: "900", letterSpacing: 0.4 }}>
        {title} {count ? <Text style={{ color: "#5B6067" }}>{count}</Text> : null}
      </Text>
      <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ color: mesh.green700, fontSize: 17, fontWeight: "700" }}>{action}</Text>
        <Ionicons name="chevron-forward" size={26} color={mesh.green700} />
      </Pressable>
    </View>
  );
}

function LeafCluster() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: "absolute", right: 30, top: 0, width: 74, height: 150, borderRadius: 70, backgroundColor: "rgba(133,190,163,0.55)", transform: [{ rotate: "16deg" }] }} />
      <View style={{ position: "absolute", right: -4, top: 54, width: 80, height: 144, borderRadius: 70, backgroundColor: "rgba(90,167,128,0.5)", transform: [{ rotate: "38deg" }] }} />
      <View style={{ position: "absolute", right: 92, top: 90, width: 66, height: 124, borderRadius: 62, backgroundColor: "rgba(169,211,190,0.58)", transform: [{ rotate: "76deg" }] }} />
    </View>
  );
}
