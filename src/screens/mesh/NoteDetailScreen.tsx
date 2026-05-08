import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ActionTile } from "./parts/ActionTile";
import { Avatar, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshHeader, MeshScreen, MeshScroll, NavFn, StatusChip, TFn, TipCard } from "../../mesh/MeshComponents";
import { contactById, Lang, notes } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  noteId?: string;
  variant?: "A" | "B";
};

export function NoteDetailScreen({ t, lang, nav, noteId = "n1", variant = "A" }: Props) {
  const note = notes.find((item) => item.id === noteId) || notes[0];
  const contact = contactById(note.contact);
  const [confirm, setConfirm] = useState(false);
  const content = lang === "vi" ? note.content : note.contentEn || note.content;
  const reminder = lang === "vi" ? note.reminder : note.reminderEn || note.reminder;

  if (variant === "B" && contact) {
    return (
      <MeshScreen>
        <MeshHeader>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4 }}>
            <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", flex: 1, textAlign: "center", paddingRight: 40 }}>{t("notes")}</Text>
            <HeaderCircleBtn icon="ellipsis-horizontal" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 16 }}>
            <Avatar name={contact.name} size={68} ring />
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 19, fontWeight: "900" }}>{contact.name}</Text>
              <View style={{ marginTop: 4 }}>
                <StatusChip statusId={contact.status} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
                <Ionicons name="sparkles-outline" size={12} color="rgba(255,255,255,0.92)" />
                <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 12 }}>{t("interactions", { n: contact.interactions })}</Text>
              </View>
            </View>
          </View>
        </MeshHeader>

        <MeshScroll style={{ paddingHorizontal: 16, marginTop: -10 }} bottom={40}>
          <MeshCard style={{ padding: 18 }}>
            <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800" }}>{t("noteTitle")}</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <Text style={{ flex: 1, color: mesh.ink900, fontSize: 19, fontWeight: "900", marginTop: 4, letterSpacing: -0.3 }}>{note.title}</Text>
              <Ionicons name="create-outline" size={18} color={mesh.green700} style={{ marginTop: 6 }} />
            </View>
            <Divider />
            <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800" }}>{t("noteContent")}</Text>
            <Text style={{ color: mesh.ink700, fontSize: 15, lineHeight: 24, marginTop: 6 }}>{content}</Text>
            <Divider />
            <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "800", marginBottom: 8 }}>{t("reminder")}</Text>
            <ReminderRow reminder={reminder || "18:00, Today"} t={t} />
          </MeshCard>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
            <ActionTile icon="create-outline" label={t("editNote")} color={mesh.green700} onPress={() => nav("editNote")} />
            <ActionTile icon="person-outline" label={t("changePerson")} color={mesh.blue} />
            <ActionTile icon="notifications-outline" label={t("editReminder")} color={mesh.orange} />
            <ActionTile icon="trash-outline" label={t("deleteNote")} color={mesh.pink} onPress={() => setConfirm(true)} />
          </View>
          <View style={{ marginTop: 18 }}>
            <TipCard>{t("noteDetailHint")}</TipCard>
          </View>
        </MeshScroll>

        <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => nav("notes")} title={t("deleteNoteTitle")} desc={t("deleteNoteDesc")} confirmLabel={t("delete")} cancelLabel={t("cancel")} />
      </MeshScreen>
    );
  }

  return (
    <MeshScreen>
      <MeshHeader style={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} />
          <HeaderCircleBtn icon="ellipsis-horizontal" dark />
        </View>
        <View style={{ paddingTop: 36 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "900", lineHeight: 34, letterSpacing: -0.4 }}>{note.title}</Text>
          {contact ? (
            <Pressable style={{ alignSelf: "flex-start", marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="person-outline" size={14} color={mesh.green800} />
              <Text style={{ color: mesh.green800, fontSize: 13, fontWeight: "800" }}>{contact.name}</Text>
              <Ionicons name="chevron-forward" size={14} color={mesh.green800} />
            </Pressable>
          ) : null}
        </View>
      </MeshHeader>

      <MeshScroll style={{ backgroundColor: "#FFFFFF", marginTop: -22, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20 }} bottom={120}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Ionicons name="document-text-outline" size={18} color={mesh.green700} />
          <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "900" }}>{t("noteContent")}</Text>
        </View>
        <Text style={{ color: mesh.ink700, fontSize: 15, lineHeight: 25 }}>{content}</Text>
        <Divider />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="notifications-outline" size={18} color={mesh.green700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "800" }}>{t("reminder")}</Text>
            <ReminderRow reminder={reminder || "18:00, Today"} t={t} compact />
          </View>
        </View>
      </MeshScroll>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 4, backgroundColor: "rgba(255,255,255,0.96)", borderTopWidth: 1, borderColor: mesh.line, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 28 }}>
        <ActionTile icon="create-outline" label={t("editNote")} color={mesh.green700} onPress={() => nav("editNote")} />
        <ActionTile icon="person-outline" label={t("changePerson")} color={mesh.blue} />
        <ActionTile icon="notifications-outline" label={t("editReminder")} color={mesh.orange} />
        <ActionTile icon="trash-outline" label={t("deleteNote")} color={mesh.pink} onPress={() => setConfirm(true)} />
      </View>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => nav("notes")} title={t("deleteNoteTitle")} desc={t("deleteNoteDesc")} confirmLabel={t("delete")} cancelLabel={t("cancel")} />
    </MeshScreen>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: mesh.line, marginVertical: 14 }} />;
}

function ReminderRow({ reminder, t, compact = false }: { reminder: string; t: TFn; compact?: boolean }) {
  return (
    <View style={{ marginTop: compact ? 8 : 0, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: mesh.bgSubtle, flexDirection: "row", alignItems: "center", gap: 12 }}>
      {!compact ? (
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.12)" }}>
          <Ionicons name="notifications-outline" size={16} color={mesh.green700} />
        </View>
      ) : (
        <Ionicons name="calendar-outline" size={18} color={mesh.green700} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "900" }}>{reminder}</Text>
        {!compact ? <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{t("once")}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
    </View>
  );
}
