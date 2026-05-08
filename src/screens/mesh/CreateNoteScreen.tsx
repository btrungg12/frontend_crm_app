import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

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
      <ReminderPicker open={reminderOpen} onClose={() => setReminderOpen(false)} onPick={setReminder} t={t} lang={lang} />
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

function ReminderPicker({
  open,
  onClose,
  onPick,
  t,
  lang
}: {
  open: boolean;
  onClose: () => void;
  onPick: (value: string) => void;
  t: TFn;
  lang: Lang;
}) {
  const [preset, setPreset] = useState("today");
  const [time, setTime] = useState("18:00");
  const [day, setDay] = useState(20);
  const isVi = lang === "vi";
  const presets = [
    { id: "today", label: isVi ? "Hôm nay" : "Today" },
    { id: "tomorrow", label: isVi ? "Ngày mai" : "Tomorrow" },
    { id: "weekend", label: isVi ? "Cuối tuần này" : "This weekend" },
    { id: "nextweek", label: isVi ? "Tuần sau" : "Next week" },
    { id: "custom", label: isVi ? "Tùy chọn" : "Custom" }
  ];
  const slots = [
    { id: "morning", label: isVi ? "Buổi sáng" : "Morning", value: "09:00" },
    { id: "afternoon", label: isVi ? "Buổi chiều" : "Afternoon", value: "14:00" },
    { id: "evening", label: isVi ? "Buổi tối" : "Evening", value: "18:00" }
  ];
  const days = Array.from({ length: 14 }, (_, index) => 17 + index);
  const weekDays = isVi ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dateLabel = isVi ? `T${(day % 7) + 1}, ${String(day).padStart(2, "0")}/05` : `${weekDays[day % 7]}, ${String(day).padStart(2, "0")}/05`;

  const save = () => {
    onPick(`${time}, ${dateLabel}`);
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginBottom: 18 }} />
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
            <View style={{ width: 36 }} />
            <Text style={{ flex: 1, textAlign: "center", color: mesh.green800, fontSize: 18, fontWeight: "900" }}>
              {isVi ? "Khi nào nhắc bạn?" : "When should we remind you?"}
            </Text>
            <Pressable
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={18} color={mesh.ink700} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {presets.map((item) => {
              const active = preset === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setPreset(item.id)}
                  style={{
                    borderRadius: 999,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? mesh.green700 : mesh.line,
                    backgroundColor: active ? "rgba(31,112,72,0.08)" : "#FFFFFF",
                    paddingHorizontal: 14,
                    paddingVertical: 8
                  }}
                >
                  <Text style={{ color: active ? mesh.green800 : mesh.ink700, fontSize: 13, fontWeight: "700" }}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <SheetLabel>{isVi ? "Chọn ngày" : "Pick date"}</SheetLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 6 }} style={{ marginBottom: 18 }}>
            {days.map((item) => {
              const active = item === day;
              return (
                <Pressable
                  key={item}
                  onPress={() => setDay(item)}
                  style={{
                    width: 48,
                    borderRadius: 12,
                    borderWidth: active ? 0 : 1,
                    borderColor: mesh.line,
                    backgroundColor: active ? mesh.green700 : "#FFFFFF",
                    paddingVertical: 8,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: active ? "#FFFFFF" : mesh.ink500, fontSize: 10, fontWeight: "700", opacity: 0.85 }}>{weekDays[item % 7]}</Text>
                  <Text style={{ color: active ? "#FFFFFF" : mesh.ink900, fontSize: 16, fontWeight: "900", marginTop: 2 }}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <SheetLabel>{isVi ? "Chọn giờ" : "Pick time"}</SheetLabel>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
            {slots.map((item) => {
              const active = time === item.value;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setTime(item.value)}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    borderWidth: active ? 1.5 : 1,
                    borderColor: active ? mesh.green700 : mesh.line,
                    backgroundColor: active ? "rgba(31,112,72,0.06)" : "#FFFFFF",
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "700" }}>{item.label}</Text>
                  <Text style={{ color: mesh.green800, fontSize: 16, fontWeight: "900", marginTop: 2 }}>{item.value}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: mesh.line, borderRadius: 14, paddingHorizontal: 14, marginBottom: 18, minHeight: 52 }}>
            <Ionicons name="time-outline" size={18} color={mesh.ink500} />
            <TextInput value={time} onChangeText={setTime} style={{ flex: 1, color: mesh.ink900, fontSize: 16, fontWeight: "600" }} />
          </View>

          <Pressable onPress={save} style={{ borderRadius: mesh.radiusLg, backgroundColor: mesh.green800, paddingVertical: 15, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>{t("save")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetLabel({ children }: { children: string }) {
  return <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "900", marginBottom: 8 }}>{children}</Text>;
}
