import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { Avatar, BottomNav, HeaderCircleBtn, MeshCard, MeshChip, MeshScreen, MeshScroll, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { contactById, Lang, notes } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

export function NotesScreen({ t, lang, nav }: Props) {
  const [filter, setFilter] = useState("all");
  const filters = [
    { id: "all", label: t("fAll") },
    { id: "rem", label: t("fReminder") },
    { id: "np", label: t("fNoPerson") },
    { id: "rec", label: t("fRecent") }
  ];

  const grouped = useMemo(() => {
    return notes.reduce<Record<string, typeof notes>>((acc, note) => {
      if (filter === "rem" && !note.reminder) return acc;
      if (filter === "np" && note.contact) return acc;
      acc[note.section] = acc[note.section] || [];
      acc[note.section].push(note);
      return acc;
    }, {});
  }, [filter]);

  const sectionLabel = {
    today: t("section_today"),
    yesterday: t("section_yesterday"),
    thisweek: t("section_thisweek")
  } as Record<string, string>;

  return (
    <MeshScreen>
      <MeshHeroHeader title={t("notes")} subtitle={t("notesSub")} right={<HeaderCircleBtn icon="search" onPress={() => nav("search")} />}>
        <Pressable
          onPress={() => nav("search")}
          style={{ borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", paddingHorizontal: 16, height: 44, flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <Ionicons name="search" size={18} color={mesh.ink400} />
          <Text style={{ color: "#8A928D", fontSize: 14 }}>{t("searchNote")}</Text>
        </Pressable>
      </MeshHeroHeader>

      <MeshScroll bottom={150}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14 }}>
          {filters.map((item) => (
            <MeshChip key={item.id} active={filter === item.id} onPress={() => setFilter(item.id)}>
              {item.label}
            </MeshChip>
          ))}
          <MeshChip style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.12)" }}>
            <Ionicons name="options-outline" size={14} color={mesh.ink700} />
          </MeshChip>
        </View>

        {Object.entries(grouped).map(([section, items]) => (
          <View key={section} style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            <SectionLabel style={{ paddingHorizontal: 4, paddingBottom: 6 }}>{sectionLabel[section]}</SectionLabel>
            {items.map((note) => {
              const contact = contactById(note.contact);
              const preview = lang === "vi" ? note.preview : note.contentEn.split("\n")[0] || note.preview;
              return (
                <Pressable
                  key={note.id}
                  onPress={() => nav("noteDetail", { id: note.id })}
                  style={{ marginBottom: 10 }}
                >
                  <MeshCard style={{ backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "rgba(6,69,50,0.05)", elevation: 0, shadowOpacity: 0.02, flexDirection: "row", gap: 12, alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 12 }}>
                    {contact ? (
                      <Avatar name={contact.name} size={40} />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: note.kind === "reminder" ? "rgba(31,112,72,0.10)" : mesh.bgSubtle }}>
                        <Ionicons name={note.kind === "reminder" ? "notifications" : "document-text-outline"} size={18} color={mesh.green700} />
                      </View>
                    )}

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{contact ? contact.name : note.title}</Text>
                      {contact ? <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "500", marginTop: 1 }}>{note.title}</Text> : null}
                      <Text numberOfLines={2} style={{ color: mesh.ink500, fontSize: 13, lineHeight: 19, marginTop: 3 }}>
                        {preview}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }}>
                        <Ionicons name="time-outline" size={12} color={mesh.green700} />
                        <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "700" }}>{lang === "vi" ? note.time : note.timeEn || note.time}</Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "center", gap: 6 }}>
                      {note.hasNew ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mesh.green600 }} /> : null}
                      <Ionicons name="bookmark-outline" size={18} color={note.bookmark ? mesh.green700 : mesh.ink300} />
                      <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
                    </View>
                  </MeshCard>
                </Pressable>
              );
            })}
          </View>
        ))}
      </MeshScroll>

      <BottomNav
        active="notes"
        t={t}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "contacts") nav("contacts");
          else if (id === "fab") nav("createNote");
          else if (id === "status") nav("status");
        }}
      />
    </MeshScreen>
  );
}
