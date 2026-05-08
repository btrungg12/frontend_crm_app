import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Avatar, HeaderCircleBtn, MeshCard, MeshScreen, MeshScroll, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { contactById, Lang, notes } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  initialQ?: string;
};

export function SearchScreen({ t, lang, nav, initialQ = "An" }: Props) {
  const [query, setQuery] = useState(initialQ);
  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return notes.filter((note) => !q || note.title.toLowerCase().includes(q) || note.preview.toLowerCase().includes(q) || note.contentEn.toLowerCase().includes(q));
  }, [query]);

  return (
    <MeshScreen style={{ backgroundColor: "#FFFFFF" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderColor: mesh.line, backgroundColor: "#FFFFFF" }}>
        <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} style={{ width: 36, height: 36, backgroundColor: mesh.bgSubtle, shadowOpacity: 0, elevation: 0 }} />
        <View style={{ flex: 1, height: 42, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: mesh.bgSubtle, borderRadius: 12, paddingHorizontal: 12 }}>
          <Ionicons name="search" size={18} color={mesh.ink400} />
          <TextInput value={query} onChangeText={setQuery} autoFocus placeholder={t("searchNote")} placeholderTextColor={mesh.ink400} style={{ flex: 1, color: mesh.ink900, fontSize: 15 }} />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close" size={16} color={mesh.ink400} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <MeshScroll style={{ paddingHorizontal: 16 }} bottom={32}>
        {!query ? (
          <View style={{ paddingTop: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 }}>
              <SectionLabel>{t("recentSearches")}</SectionLabel>
              <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800" }}>{t("clearAll")}</Text>
            </View>
            {["An", "Nam", "Birthday", "Coffee"].map((item) => (
              <Pressable key={item} onPress={() => setQuery(item)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: mesh.line }}>
                <Ionicons name="time-outline" size={18} color={mesh.ink400} />
                <Text style={{ flex: 1, color: mesh.ink700, fontSize: 15 }}>{item}</Text>
                <Ionicons name="close" size={16} color={mesh.ink400} />
              </Pressable>
            ))}
          </View>
        ) : matches.length > 0 ? (
          <View style={{ paddingTop: 8 }}>
            <Text style={{ color: mesh.ink500, fontSize: 13, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 6 }}>
              {matches.length} {t("searchResults").toLowerCase()}
            </Text>
            {matches.map((note) => {
              const contact = contactById(note.contact);
              const preview = lang === "vi" ? note.preview : note.contentEn.split("\n")[0];
              return (
                <Pressable key={note.id} onPress={() => nav("noteDetail", { id: note.id })}>
                  <MeshCard style={{ flexDirection: "row", gap: 12, padding: 14, marginBottom: 10 }}>
                    {contact ? (
                      <Avatar name={contact.name} size={40} />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: mesh.bgSubtle }}>
                        <Ionicons name="document-text-outline" size={18} color={mesh.green700} />
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{note.title}</Text>
                      <Text numberOfLines={2} style={{ color: mesh.ink500, fontSize: 13, lineHeight: 19, marginTop: 2 }}>
                        {preview}
                      </Text>
                    </View>
                  </MeshCard>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="search" size={28} color={mesh.ink400} />
            </View>
            <Text style={{ color: mesh.ink900, fontSize: 17, fontWeight: "900", marginBottom: 6 }}>{t("noResults")}</Text>
            <Text style={{ color: mesh.ink500, fontSize: 14, textAlign: "center", lineHeight: 21 }}>
              {t("noResultsFor", { q: query })}
              {"\n"}
              {t("tryAnother")}
            </Text>
          </View>
        )}
      </MeshScroll>
    </MeshScreen>
  );
}
