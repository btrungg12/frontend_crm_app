import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { BottomNav, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, TFn, TipCard } from "../../mesh/MeshComponents";
import { Lang, statuses } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

const statusIconMap = {
  people: "people-outline",
  briefcase: "briefcase-outline",
  home: "home-outline",
  school: "school-outline",
  heart: "heart-outline"
} as const;

export function StatusScreen({ t, nav }: Props) {
  return (
    <MeshScreen>
      <MeshHeroHeader title={t("status")} subtitle={t("statusSub")} right={<HeaderCircleBtn icon="add" onPress={() => nav("createStatus")} />}>
        <View style={{ height: 44, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
          <Ionicons name="search" size={18} color={mesh.ink400} />
          <Text style={{ color: "#8A928D", fontSize: 14 }}>{t("searchStatus")}</Text>
        </View>
      </MeshHeroHeader>

      <MeshScroll style={{ paddingHorizontal: 16, paddingTop: 14 }} bottom={112}>
        <SectionLabel style={{ marginBottom: 8 }}>{t("statusList")}</SectionLabel>
        <MeshCard style={{ backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "rgba(6,69,50,0.06)", elevation: 0, shadowOpacity: 0.03, paddingHorizontal: 14 }}>
          {statuses.map((status, index) => (
            <Pressable
              key={status.id}
              onPress={() => nav("createStatus", { id: status.id })}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: index < statuses.length - 1 ? 1 : 0, borderColor: "rgba(6,69,50,0.08)" }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: `${status.color}20` }}>
                <Ionicons name={(statusIconMap[status.icon as keyof typeof statusIconMap] || "people-outline") as keyof typeof Ionicons.glyphMap} size={20} color={status.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{status.name}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{status.desc}</Text>
              </View>
              <Text style={{ color: status.color, fontSize: 17, fontWeight: "900" }}>{status.count}</Text>
              <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
            </Pressable>
          ))}
        </MeshCard>

        <MeshCard style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "rgba(6,69,50,0.06)", elevation: 0, shadowOpacity: 0.03, marginTop: 18, padding: 14, flexDirection: "row", gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.10)" }}>
            <Ionicons name="bulb-outline" size={18} color={mesh.green600} />
          </View>
          <Text style={{ flex: 1, color: mesh.ink500, fontSize: 13, lineHeight: 20 }}>
            <Text style={{ color: mesh.green700, fontWeight: "900" }}>{t("aboutStatus")}</Text>
            {"\n"}
            {t("aboutStatusDesc")}
          </Text>
        </MeshCard>
      </MeshScroll>

      <BottomNav
        active="status"
        t={t}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "contacts") nav("contacts");
          else if (id === "notes") nav("notes");
          else if (id === "fab") nav("createNote");
        }}
      />
    </MeshScreen>
  );
}

export function CreateStatusScreen({ t, nav, statusId }: Props & { statusId?: string }) {
  const existing = statusId ? statuses.find((status) => status.id === statusId) : undefined;
  const [name, setName] = useState(existing?.name || "");
  const [color, setColor] = useState(existing?.color || statuses[0].color);
  const [confirm, setConfirm] = useState(false);
  const palette = ["#2F8F5F", "#3B7BD9", "#8B5CD6", "#D9577A", "#E07543", "#E6B53E", "#3FA398", "#93A1A0"];

  return (
    <MeshScreen>
      <MeshHeader style={{ paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("status")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 60, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{existing ? t("editStatus") : t("createStatus")}</Text>
          <Pressable onPress={() => nav("status")} style={{ borderRadius: 999, backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: mesh.green700, fontWeight: "900", fontSize: 13 }}>{t("save")}</Text>
          </Pressable>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: "center", alignSelf: "center", maxWidth: 280 }}>{t("statusFormSub")}</Text>
      </MeshHeader>

      <MeshScroll style={{ backgroundColor: "#FFFFFF", marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20 }} bottom={100}>
        <FieldLabel>
          {t("statusName")} <Text style={{ color: mesh.pink }}>*</Text>
        </FieldLabel>
        <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 }}>
          <TextInput value={name} onChangeText={setName} placeholder={t("enterStatusName")} placeholderTextColor={mesh.ink400} style={{ color: mesh.ink900, fontSize: 15 }} />
          <Text style={{ position: "absolute", right: 12, bottom: 6, color: mesh.ink400, fontSize: 11 }}>{name.length}/30</Text>
        </View>

        <FieldLabel>
          {t("statusColor")} <Text style={{ color: mesh.pink }}>*</Text>
        </FieldLabel>
        <Text style={{ color: mesh.ink500, fontSize: 12, marginBottom: 12 }}>{t("statusColorDesc")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {palette.map((item) => (
            <Pressable
              key={item}
              onPress={() => setColor(item)}
              style={{ width: "22%", aspectRatio: 1, borderRadius: 999, backgroundColor: item, alignItems: "center", justifyContent: "center", borderWidth: color === item ? 3 : 0, borderColor: "#FFFFFF", shadowColor: item, shadowOpacity: color === item ? 0.35 : 0, shadowRadius: 8 }}
            >
              {color === item ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
            </Pressable>
          ))}
        </View>

        <FieldLabel>Preview</FieldLabel>
        <Text style={{ color: mesh.ink500, fontSize: 12, marginBottom: 12 }}>{t("statusPreviewDesc")}</Text>
        <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 999, backgroundColor: `${color}20`, paddingHorizontal: 12, paddingVertical: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ color, fontWeight: "900", fontSize: 13 }}>{name || t("statusName")}</Text>
        </View>

        <View style={{ marginTop: 22 }}>
          <TipCard>
            <Text style={{ color: mesh.green700, fontWeight: "900" }}>{t("tip")}</Text>
            {"\n"}
            {t("statusTip")}
          </TipCard>
        </View>

        {existing ? (
          <Pressable onPress={() => setConfirm(true)} style={{ marginTop: 20, borderRadius: 14, borderWidth: 1, borderColor: `${mesh.pink}55`, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
            <Ionicons name="trash-outline" size={16} color={mesh.pink} />
            <Text style={{ color: mesh.pink, fontSize: 14, fontWeight: "900" }}>{t("deleteStatus")}</Text>
          </Pressable>
        ) : null}
      </MeshScroll>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => nav("status")} title={t("deleteStatusTitle")} desc={t("deleteStatusDesc")} confirmLabel={t("delete")} cancelLabel={t("cancel")} />
    </MeshScreen>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "900", marginTop: 20, marginBottom: 8 }}>{children}</Text>;
}
