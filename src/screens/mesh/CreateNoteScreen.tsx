import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import { Avatar, HeaderCircleBtn, MeshHeader, MeshScreen, MeshScroll, NavFn, StatusChip, TFn, TipCard } from "../../mesh/MeshComponents";
import { contactById, contacts, Lang } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  edit?: boolean;
};

export function CreateNoteScreen({ t, lang, nav, edit = false }: Props) {
  const [title, setTitle] = useState(edit ? "Gọi điện hỏi thăm công việc" : "");
  const [content, setContent] = useState(
    edit
      ? "Hôm nay nên gọi hỏi thăm tình hình công việc mới của An, xem có cần hỗ trợ gì không.\n\nAn đang phụ trách dự án mới ở công ty."
      : ""
  );
  const [person, setPerson] = useState<string | null>(edit ? "c1" : null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminder, setReminder] = useState<string | null>(null);
  const contact = contactById(person);

  return (
    <MeshScreen>
      <MeshHeader style={{ paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 4 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav(edit ? "noteDetail" : "dashboard")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: mesh.ink900, fontSize: 17, fontWeight: "900" }}>
            {edit ? t("editNote") : t("newNote")}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 14, fontWeight: "800" }}>{t("clear")}</Text>
        </View>
      </MeshHeader>

      <MeshScroll style={{ backgroundColor: "#FFFFFF", marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 18 }} bottom={120}>
        <FieldLabel>{t("person")}</FieldLabel>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{ padding: 14, borderRadius: 14, borderWidth: contact ? 1 : 1.5, borderStyle: contact ? "solid" : "dashed", borderColor: contact ? mesh.line : mesh.green300, backgroundColor: contact ? "#FFFFFF" : "rgba(31,112,72,0.03)", flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          {contact ? (
            <Avatar name={contact.name} size={40} />
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(31,112,72,0.08)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person-outline" size={20} color={mesh.green700} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: contact ? mesh.ink900 : mesh.ink700, fontSize: 15, fontWeight: "900" }}>{contact ? contact.name : t("pickPerson")}</Text>
            <View style={{ marginTop: 3 }}>{contact ? <StatusChip statusId={contact.status} /> : <Text style={{ color: mesh.ink500, fontSize: 13 }}>{t("attachToPerson")}</Text>}</View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={mesh.ink400} />
        </Pressable>

        <FieldLabel>
          {t("noteTitle")} <Text style={{ color: mesh.ink400, fontWeight: "600" }}>{t("optional")}</Text>
        </FieldLabel>
        <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 }}>
          <TextInput value={title} onChangeText={setTitle} placeholder={t("enterTitle")} placeholderTextColor={mesh.ink400} style={{ color: mesh.ink900, fontSize: 15 }} />
          <Text style={{ position: "absolute", right: 12, bottom: 6, color: mesh.ink400, fontSize: 11 }}>{title.length}/100</Text>
        </View>

        <FieldLabel>
          {t("noteContent")} <Text style={{ color: mesh.pink }}>*</Text>
        </FieldLabel>
        <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24, minHeight: 144 }}>
          <TextInput value={content} onChangeText={setContent} placeholder={t("whatToWrite")} placeholderTextColor={mesh.ink400} multiline textAlignVertical="top" style={{ minHeight: 96, color: mesh.ink900, fontSize: 15, lineHeight: 23 }} />
          <Text style={{ position: "absolute", right: 12, bottom: 6, color: mesh.ink400, fontSize: 11 }}>{content.length}/1000</Text>
        </View>

        <FieldLabel>
          {t("reminder")} <Text style={{ color: mesh.ink400, fontWeight: "600" }}>{t("optional")}</Text>
        </FieldLabel>
        <Pressable
          onPress={() => setReminderOpen(true)}
          style={{ padding: 14, borderRadius: 14, borderWidth: reminder ? 1 : 1.5, borderStyle: reminder ? "solid" : "dashed", borderColor: reminder ? mesh.line : mesh.green300, backgroundColor: reminder ? "#FFFFFF" : "rgba(31,112,72,0.03)", flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(31,112,72,0.08)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="notifications-outline" size={20} color={mesh.green700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{reminder || t("addReminder")}</Text>
            <Text style={{ color: mesh.ink500, fontSize: 13, marginTop: 2 }}>{t("reminderHint")}</Text>
          </View>
          {reminder ? (
            <Pressable onPress={() => setReminder(null)}>
              <Text style={{ color: mesh.pink, fontWeight: "900", fontSize: 13 }}>{t("clear")}</Text>
            </Pressable>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={mesh.ink400} />
          )}
        </Pressable>

        <View style={{ marginTop: 22 }}>
          <TipCard>{t("noteHint")}</TipCard>
        </View>
      </MeshScroll>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.96)", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, borderTopWidth: 1, borderColor: mesh.line }}>
        <Pressable onPress={() => nav(edit ? "noteDetail" : "notes")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: mesh.green700, borderRadius: 24, paddingVertical: 16 }}>
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{edit ? t("save") : t("saveNote")}</Text>
        </Pressable>
      </View>

      <ContactPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(id) => setPerson(id)} t={t} />
      <ReminderPicker open={reminderOpen} onClose={() => setReminderOpen(false)} onPick={setReminder} />
    </MeshScreen>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "900", marginTop: 20, marginBottom: 8 }}>{children}</Text>;
}

function ContactPicker({ open, onClose, onPick, t }: { open: boolean; onClose: () => void; onPick: (id: string) => void; t: TFn }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginBottom: 14 }} />
          <Text style={{ textAlign: "center", color: mesh.green800, fontSize: 18, fontWeight: "900", marginBottom: 16 }}>{t("pickPerson")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: mesh.bgSubtle, borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 12 }}>
            <Ionicons name="search" size={16} color={mesh.ink400} />
            <Text style={{ color: mesh.ink400, fontSize: 14 }}>{t("search")}</Text>
          </View>
          {contacts.slice(0, 6).map((contact) => (
            <Pressable
              key={contact.id}
              onPress={() => {
                onPick(contact.id);
                onClose();
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: mesh.line }}
            >
              <Avatar name={contact.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{contact.name}</Text>
                <View style={{ marginTop: 3 }}>
                  <StatusChip statusId={contact.status} />
                </View>
              </View>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReminderPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (value: string) => void }) {
  const values = ["18:00, Today", "09:00, Tomorrow", "19:00, This weekend"];
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginBottom: 18 }} />
          {values.map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                onPick(value);
                onClose();
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: mesh.line }}
            >
              <Ionicons name="calendar-outline" size={20} color={mesh.green700} />
              <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>{value}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
