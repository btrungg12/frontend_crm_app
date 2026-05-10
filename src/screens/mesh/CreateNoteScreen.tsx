import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, MeshScreen, NavFn, StatusChip, TFn } from "../../mesh/MeshComponents";
import { contactById, contacts, Lang } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  edit?: boolean;
  initialPerson?: string;
};

const titleLimit = 100;
const contentLimit = 1000;

export function CreateNoteScreen({ t, lang, nav, edit = false, initialPerson }: Props) {
  const insets = useSafeAreaInsets();
  const isVi = lang === "vi";
  const [title, setTitle] = useState(edit ? "Gọi điện hỏi thăm công việc" : "");
  const [content, setContent] = useState(
    edit
      ? "Hôm nay nên gọi hỏi thăm tình hình công việc mới của An, xem có cần hỗ trợ gì không.\n\nAn đang phụ trách dự án mới ở công ty."
      : ""
  );
  const [person, setPerson] = useState<string | null>(edit ? "c1" : initialPerson || null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminder, setReminder] = useState<string | null>(null);
  const [personError, setPersonError] = useState(false);
  const [contentError, setContentError] = useState(false);
  const contact = contactById(person);

  const clear = () => {
    setTitle("");
    setContent("");
    setPerson(null);
    setReminder(null);
    setPersonError(false);
    setContentError(false);
  };

  const save = () => {
    const missingPerson = !person;
    const missingContent = content.trim().length === 0;
    setPersonError(missingPerson);
    setContentError(missingContent);

    if (missingPerson || missingContent) return;

    nav(edit ? "noteDetail" : "notes");
  };

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      <LinearGradient
        colors={["#043326", "#07583D", "#08764A", "#F7FAF7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ minHeight: insets.top + 220, paddingHorizontal: 20, paddingTop: insets.top + 14, overflow: "hidden" }}
      >
        <LeafDecor />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => nav(edit ? "noteDetail" : "dashboard")}
            style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...mesh.shadow }}
          >
            <Ionicons name="chevron-back" size={24} color={mesh.green700} />
          </Pressable>
          <Pressable onPress={clear} hitSlop={10}>
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>{t("clear")}</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 34, maxWidth: 300 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: -0.8 }}>
            {edit ? t("editNote") : t("newNote")}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, marginTop: -58, backgroundColor: "transparent" }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: insets.bottom + 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 28,
            paddingHorizontal: 18,
            paddingTop: 22,
            paddingBottom: 20,
            borderWidth: 1,
            borderColor: "rgba(6,69,50,0.06)",
            shadowColor: "#064532",
            shadowOpacity: 0.05,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 2
          }}
        >
        <FieldLabel error={personError} first>{t("person").toUpperCase()}</FieldLabel>
        <ChoiceCard
          icon="person-outline"
          title={contact ? contact.name : t("pickPerson")}
          subtitle={contact ? undefined : t("attachToPerson")}
          onPress={() => setPickerOpen(true)}
          error={personError}
          left={contact ? <Avatar name={contact.name} size={44} /> : undefined}
          trailing={contact ? <StatusChip statusId={contact.status} /> : undefined}
        />
        {personError ? <ErrorText>{isVi ? "Vui lòng chọn người." : "Please choose a person."}</ErrorText> : null}

        <FieldLabel>
          {t("noteTitle").toUpperCase()} <Text style={{ color: mesh.ink500 }}>{t("optional").toUpperCase()}</Text>
        </FieldLabel>
        <InputCard
          icon="document-text-outline"
          value={title}
          onChangeText={setTitle}
          placeholder={t("enterTitle")}
          maxLength={titleLimit}
          counter={`${title.length}/${titleLimit}`}
        />

        <FieldLabel>
          {t("noteContent").toUpperCase()} <Text style={{ color: mesh.pink }}>*</Text>
        </FieldLabel>
        <InputCard
          icon="create-outline"
          value={content}
          onChangeText={(value) => {
            setContent(value);
            if (value.trim()) setContentError(false);
          }}
          placeholder={t("whatToWrite")}
          maxLength={contentLimit}
          counter={`${content.length}/${contentLimit}`}
          multiline
          error={contentError}
        />
        {contentError ? <ErrorText>{isVi ? "Nội dung là bắt buộc." : "Content is required."}</ErrorText> : null}

        <FieldLabel>
          {t("reminder").toUpperCase()} <Text style={{ color: mesh.ink500 }}>{t("optional").toUpperCase()}</Text>
        </FieldLabel>
        <ChoiceCard
          icon="notifications-outline"
          title={reminder || t("addReminder")}
          subtitle={reminder ? t("once") : t("reminderHint")}
          onPress={() => setReminderOpen(true)}
          trailing={
            reminder ? (
              <Pressable onPress={() => setReminder(null)} hitSlop={8}>
                <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "900" }}>{t("clear")}</Text>
              </Pressable>
            ) : undefined
          }
        />

        <View style={{ marginTop: 18, borderRadius: 18, backgroundColor: "rgba(31,112,72,0.08)", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <IconBox icon="bulb-outline" />
          <Text style={{ flex: 1, color: mesh.ink500, fontSize: 13, lineHeight: 20 }}>{t("noteHint").replace("\n", " ")}</Text>
        </View>
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.94)", paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 10, borderTopWidth: 1, borderColor: "rgba(6,69,50,0.06)" }}>
        <Pressable onPress={save} style={{ borderRadius: 26, overflow: "hidden", ...mesh.shadow }}>
          <LinearGradient colors={[mesh.green800, mesh.green700, "#008A55"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>{edit ? t("save") : t("saveNote")}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ContactPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id) => {
          setPerson(id);
          setPersonError(false);
        }}
        t={t}
      />
      <ReminderPicker open={reminderOpen} onClose={() => setReminderOpen(false)} onPick={setReminder} t={t} lang={lang} />
    </MeshScreen>
  );
}

function FieldLabel({ children, error = false, first = false }: { children: ReactNode; error?: boolean; first?: boolean }) {
  return (
    <Text style={{ color: error ? mesh.pink : mesh.green700, fontSize: 12, fontWeight: "800", letterSpacing: 0.9, marginBottom: 8, marginTop: first ? 0 : 18 }}>
      {children}
    </Text>
  );
}

function ErrorText({ children }: { children: string }) {
  return <Text style={{ color: mesh.pink, fontSize: 12, fontWeight: "700", marginTop: 8 }}>{children}</Text>;
}

function IconBox({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.10)" }}>
      <Ionicons name={icon} size={20} color={mesh.green700} />
    </View>
  );
}

function ChoiceCard({
  error = false,
  icon,
  left,
  onPress,
  subtitle,
  title,
  trailing
}: {
  error?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  left?: ReactNode;
  onPress: () => void;
  subtitle?: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderColor: error ? "rgba(217,87,122,0.55)" : "rgba(6,69,50,0.08)",
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        minHeight: 68,
        paddingHorizontal: 12,
        paddingVertical: 10,
        shadowColor: "#064532",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0,
        shadowRadius: 10,
        elevation: 0
      }}
    >
      {left || <IconBox icon={icon} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>{title}</Text>
        {subtitle ? <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 19, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {trailing || <Ionicons name="chevron-forward" size={20} color={mesh.ink400} />}
    </Pressable>
  );
}

function InputCard({
  counter,
  error = false,
  icon,
  maxLength,
  multiline = false,
  onChangeText,
  placeholder,
  value
}: {
  counter: string;
  error?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  maxLength: number;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View
      style={{
        alignItems: multiline ? "flex-start" : "center",
        borderColor: error ? "rgba(217,87,122,0.55)" : "rgba(6,69,50,0.08)",
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        minHeight: multiline ? 138 : 58,
        paddingBottom: 20,
        paddingHorizontal: 14,
        paddingTop: multiline ? 14 : 10
      }}
    >
      <IconBox icon={icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={mesh.ink400}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          color: mesh.ink900,
          flex: 1,
          fontSize: 14,
          lineHeight: multiline ? 21 : undefined,
          minHeight: multiline ? 92 : 30,
          padding: 0
        }}
      />
      <Text style={{ bottom: 10, color: mesh.ink500, fontSize: 12, position: "absolute", right: 14 }}>{counter}</Text>
    </View>
  );
}

function LeafDecor() {
  return (
    <View pointerEvents="none" style={{ bottom: -28, height: 160, opacity: 0.18, position: "absolute", right: -44, width: 200 }}>
      <View style={{ backgroundColor: "#B9E3CB", borderBottomLeftRadius: 22, borderBottomRightRadius: 96, borderTopLeftRadius: 96, borderTopRightRadius: 22, height: 110, position: "absolute", right: 62, top: 24, transform: [{ rotate: "43deg" }], width: 64 }} />
      <View style={{ backgroundColor: "#D9F0E0", borderBottomLeftRadius: 18, borderBottomRightRadius: 80, borderTopLeftRadius: 80, borderTopRightRadius: 18, height: 94, position: "absolute", right: 118, top: 72, transform: [{ rotate: "78deg" }], width: 54 }} />
      <View style={{ backgroundColor: "#8FCDA7", borderBottomLeftRadius: 18, borderBottomRightRadius: 86, borderTopLeftRadius: 86, borderTopRightRadius: 18, height: 98, position: "absolute", right: 18, top: 88, transform: [{ rotate: "112deg" }], width: 56 }} />
    </View>
  );
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
