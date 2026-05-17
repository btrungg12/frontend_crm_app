import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { getNotes } from "../../api/noteApi";
import { extractArray, normalizeApiNote } from "../../api/screenAdapters";
import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { Avatar, BottomNav, HeaderCircleBtn, MeshCard, MeshChip, MeshScreen, MeshScroll, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { contactById, Lang, Note } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

export function NotesScreen({ t, lang, nav }: Props) {
  const [filter, setFilter] = useState("all");
  const [apiNotes, setApiNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sourceNotes = apiNotes;
  const filters = [
    { id: "all", label: t("fAll") },
    { id: "rem", label: t("fReminder") },
    { id: "rec", label: t("fRecent") }
  ];

  useEffect(() => {
    let active = true;

    getNotes()
      .then((response) => {
        if (!active) return;
        const normalized = extractArray(response, "notes").map(normalizeApiNote).filter(Boolean) as Note[];
        setApiNotes(normalized);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setApiNotes([]);
        setError(err instanceof Error && err.message ? err.message : "Cannot load notes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    return sourceNotes.reduce<Record<string, Note[]>>((acc, note) => {
      if (filter === "rem" && !note.reminder) return acc;
      acc[note.section] = acc[note.section] || [];
      acc[note.section].push(note);
      return acc;
    }, {});
  }, [filter, sourceNotes]);

  const sectionLabel = {
    today: t("section_today"),
    yesterday: t("section_yesterday"),
    thisweek: t("section_thisweek")
  } as Record<string, string>;

  return (
    <MeshScreen>
      <MeshHeroHeader title={t("notes")} subtitle={t("notesSub")} right={<HeaderCircleBtn icon="search" onPress={() => nav("search", { type: "notes" })} />}>
        <Pressable
          onPress={() => nav("search", { type: "notes" })}
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

        {loading ? (
          <InlineState label="Loading notes..." loading />
        ) : error ? (
          <InlineState label={error} error />
        ) : sourceNotes.length === 0 ? (
          <InlineState label="No notes from API." />
        ) : Object.entries(grouped).map(([section, items]) => (
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
                    <Avatar name={contact?.name || note.title || "?"} size={40} />

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{contact?.name || note.title}</Text>
                      <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "500", marginTop: 1 }}>{note.title}</Text>
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

function InlineState({ error = false, label, loading = false }: { error?: boolean; label: string; loading?: boolean }) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 10 }}>
      <MeshCard style={{ alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 22, borderWidth: 1, elevation: 0, padding: 18, shadowOpacity: 0.02 }}>
        {loading ? <ActivityIndicator color={mesh.green700} size="small" style={{ marginBottom: 8 }} /> : null}
        <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: 13, lineHeight: 19, textAlign: "center" }}>{label}</Text>
      </MeshCard>
    </View>
  );
}
