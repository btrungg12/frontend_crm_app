import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MeshGradientView } from "expo-mesh-gradient";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getContacts } from "../../api/contactApi";
import { deleteNoteReminder, getNoteById, submitCreateNote, updateNote, upsertNoteReminder } from "../../api/noteApi";
import { getToken } from "../../storage/tokenStorage";
import { Avatar, MeshScreen, NavFn, StatusChip, TFn } from "../../mesh/MeshComponents";
import { Lang } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  edit?: boolean;
  noteId?: string;
  initialPerson?: string;
};

const titleLimit = 100;
const contentLimit = 1000;
const leaf2Png = require("../../../assets/leaf_2.png");

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const WHEEL_ITEM_H = 44;
const DAY_CELL_H = 38; // fixed row height — keeps 6-row grid stable across months

type PickerContact = {
  id: string;
  name: string;
  status?: string;
};

type NoteEditData = {
  contactId: string | null;
  contactName: string;
  contactStatus: string;
  content: string;
  id: string;
  remindAt: string | null;
  title: string;
};

type Preset = { id: string; label: string; sublabel: string; date: Date };

// ─── Helper functions ─────────────────────────────────────────────────────────

function defaultReminderDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatReminderChip(date: Date, lang: Lang): string {
  const days = lang === "vi"
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = lang === "vi"
    ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} · ${hh}:${mm}`;
}

function formatMonthYear(year: number, month: number, lang: Lang): string {
  const months = lang === "vi"
    ? ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
       "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
    : ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"];
  return `${months[month]} ${year}`;
}

/** Always returns exactly 42 cells (6 rows × 7 cols) so the calendar height never changes. */
function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const numDays = daysInMonth(year, month);
  const offset = (firstDay + 6) % 7; // Mon = 0
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function getPresets(lang: Lang): Preset[] {
  const isVi = lang === "vi";
  const now = new Date();
  const dow = now.getDay(); // 0 = Sun

  const monthShort = isVi
    ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const daysToSat = dow === 6 ? 7 : (6 - dow + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysToSat);
  saturday.setHours(9, 0, 0, 0);

  const daysToMon = dow === 1 ? 7 : (1 - dow + 7) % 7 || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMon);
  monday.setHours(9, 0, 0, 0);

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);

  return [
    {
      id: "tomorrow",
      label: isVi ? "Sáng ngày mai" : "Tomorrow morning",
      sublabel: `${isVi ? "Ngày mai" : "Tomorrow"} · 09:00`,
      date: tomorrow
    },
    {
      id: "weekend",
      label: isVi ? "Cuối tuần này" : "This weekend",
      sublabel: `${isVi ? "Thứ 7" : "Saturday"} · 09:00`,
      date: saturday
    },
    {
      id: "nextweek",
      label: isVi ? "Tuần sau" : "Next week",
      sublabel: `${isVi ? "Thứ 2" : "Monday"} · 09:00`,
      date: monday
    },
    {
      id: "nextmonth",
      label: isVi ? "Tháng sau" : "Next month",
      sublabel: `1 ${monthShort[nextMonth.getMonth()]} · 09:00`,
      date: nextMonth
    }
  ];
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function CreateNoteScreen({ t, lang, nav, edit = false, noteId, initialPerson }: Props) {
  const insets = useSafeAreaInsets();
  const isVi = lang === "vi";

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [person, setPerson] = useState<string | null>(initialPerson || null);
  const [personLabel, setPersonLabel] = useState("");
  const [personQuery, setPersonQuery] = useState("");
  const [personFocused, setPersonFocused] = useState(false);
  const [apiContacts, setApiContacts] = useState<PickerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");

  // Reminder sheet state: "none" | "preset" | "custom"
  const [reminderSheet, setReminderSheet] = useState<"none" | "preset" | "custom">("none");
  const [reminderAt, setReminderAt] = useState<Date | null>(null);
  const [hadReminder, setHadReminder] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  // Validation / save
  const [personError, setPersonError] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(edit);
  const [loadError, setLoadError] = useState("");

  // Load note in edit mode
  useEffect(() => {
    if (!edit) return;
    if (!noteId) { setLoadError("Missing note id"); setLoadingNote(false); return; }

    let active = true;
    setLoadingNote(true);
    setLoadError("");

    getNoteById(noteId)
      .then((response) => {
        if (!active) return;
        const data = normalizeEditNote(response);
        if (!data) { setLoadError("Note not found."); return; }
        setTitle(data.title);
        setContent(data.content);
        setPerson(data.contactId);
        setPersonLabel(data.contactName);
        setPersonQuery(data.contactName);
        if (data.remindAt) {
          setReminderAt(new Date(data.remindAt));
          setHadReminder(true);
        }
      })
      .catch((err) => { if (active) setLoadError(err instanceof Error ? err.message : "Failed to load note."); })
      .finally(() => { if (active) setLoadingNote(false); });

    return () => { active = false; };
  }, [edit, noteId]);

  // Load contacts on mount
  useEffect(() => {
    let active = true;
    setContactsLoading(true);
    setContactsError("");
    getContacts()
      .then((response) => {
        if (!active) return;
        const normalized = extractArray(response, "contacts").map(normalizePickerContact).filter(Boolean) as PickerContact[];
        setApiContacts(normalized);
      })
      .catch((err) => { if (active) setContactsError(err instanceof Error ? err.message : "Cannot load contacts."); })
      .finally(() => { if (active) setContactsLoading(false); });
    return () => { active = false; };
  }, []);

  const clear = () => {
    setTitle("");
    setContent("");
    if (!edit) { setPerson(initialPerson || null); setPersonLabel(""); setPersonQuery(""); }
    setReminderAt(null);
    setContentFocused(false);
    setPersonError(false);
    setContentError(false);
    setSaveError("");
  };

  const save = async () => {
    const typedName = personLabel.trim() || personQuery.trim();
    const missingPerson = !person && typedName.length === 0;
    const missingContent = content.trim().length === 0;
    setPersonError(missingPerson);
    setContentError(missingContent);
    setSaveError("");
    if (missingPerson || missingContent) return;

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) { setSaveError("Please log in before saving notes."); return; }

      if (edit) {
        if (!noteId) { setSaveError("Missing note id."); return; }
        await updateNote(noteId, { contactId: person, title: title.trim() || undefined, content: content.trim() });
        if (reminderAt) {
          await upsertNoteReminder(noteId, { enabled: true, remindAt: reminderAt.toISOString() });
        } else if (hadReminder) {
          await deleteNoteReminder(noteId);
        }
        nav("noteDetail", { id: noteId });
      } else {
        await submitCreateNote({
          contactId: person || undefined,
          content: content.trim(),
          interactionDate: new Date().toISOString(),
          reminderEnabled: Boolean(reminderAt),
          remindAt: reminderAt?.toISOString(),
          title: title.trim() || undefined
        });
        nav("notes");
      }
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : "Could not save note.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingNote) {
    return (
      <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={mesh.green700} />
        </View>
      </MeshScreen>
    );
  }

  if (loadError) {
    return (
      <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <Ionicons name="alert-circle-outline" size={48} color={mesh.pink} />
          <Text style={{ color: mesh.ink900, fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 16, marginBottom: 8 }}>{loadError}</Text>
          <Pressable onPress={() => nav("notes")} style={{ marginTop: 16, borderRadius: 24, backgroundColor: mesh.green700, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Back to Notes</Text>
          </Pressable>
        </View>
      </MeshScreen>
    );
  }

  const showBell = contentFocused || content.trim().length > 0 || reminderAt !== null;

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      {/* Mesh gradient background */}
      <View pointerEvents="none" style={{ height: insets.top + 335, left: 0, overflow: "hidden", position: "absolute", right: 0, top: 0 }}>
        <MeshGradientView
          style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
          columns={4} rows={4}
          colors={[
            "#064532", "#0B573E", "#1D704F", "#2F805E",
            "#DDEFE5", "#EAF6EF", "#BFDCCB", "#74AE8D",
            "#FFFFFF", "#FFFFFF", "#F8FCF7", "#EEF8F0",
            "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"
          ]}
          points={[
            [0, 0], [0.35, 0], [0.7, 0], [1, 0],
            [0, 0.36], [0.35, 0.38], [0.7, 0.34], [1, 0.3],
            [0, 0.66], [0.35, 0.68], [0.7, 0.72], [1, 0.7],
            [0, 1], [0.35, 1], [0.7, 1], [1, 1]
          ]}
          smoothsColors
        />
        <Image
          source={leaf2Png} resizeMode="contain"
          style={{ height: 250, opacity: 0.2, position: "absolute", right: -92, top: insets.top + 78, transform: [{ rotate: "-6deg" }], width: 340 }}
        />
      </View>

      {/* Top bar + title */}
      <View style={{ left: 0, paddingHorizontal: 20, paddingTop: insets.top + 14, position: "absolute", right: 0, top: 0, zIndex: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => edit && noteId ? nav("noteDetail", { id: noteId }) : nav("dashboard")}
            style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...mesh.shadow }}
          >
            <Ionicons name="chevron-back" size={24} color={mesh.green700} />
          </Pressable>
          <Pressable onPress={clear} hitSlop={10}>
            <Text style={{ color: mesh.green800, fontSize: 15, fontWeight: "800" }}>{t("clear")}</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 18, maxWidth: 320 }}>
          <Text style={{ color: "#064532", fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40 }}>
            {edit ? t("editNote") : t("newNote")}
          </Text>
          <Text style={{ color: "#5D6863", fontSize: 15, lineHeight: 22, marginTop: 6, maxWidth: 300 }}>
            {edit ? "Update the details you want to remember." : "Capture something meaningful\nso you won't forget."}
          </Text>
        </View>
      </View>

      {/* Form card */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(6,69,50,0.06)",
          borderRadius: 30,
          borderWidth: 1,
          bottom: insets.bottom + 88,
          elevation: 3,
          left: 18,
          overflow: "hidden",
          position: "absolute",
          right: 18,
          shadowColor: "#064532",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          top: insets.top + 195,
          zIndex: 2
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16, paddingTop: 22 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Person */}
          <FieldLabel error={personError} first>
            {t("person").toUpperCase()} <Text style={{ color: mesh.pink }}>*</Text>
          </FieldLabel>
          <PersonInlineInput
            value={personQuery}
            selectedPersonId={person}
            contacts={
              personQuery.trim().length > 0
                ? apiContacts.filter((c) => c.name.toLowerCase().includes(personQuery.trim().toLowerCase())).slice(0, 4)
                : []
            }
            focused={personFocused}
            error={personError}
            loading={contactsLoading}
            onFocus={() => setPersonFocused(true)}
            onBlur={() => setTimeout(() => setPersonFocused(false), 150)}
            onChangeText={(value) => { setPersonQuery(value); setPersonLabel(value); setPerson(null); setPersonError(false); }}
            onSelectTyped={() => { setPersonLabel(personQuery.trim()); setPerson(null); setPersonFocused(false); }}
            onSelectContact={(c) => { setPerson(c.id); setPersonLabel(c.name); setPersonQuery(c.name); setPersonError(false); setPersonFocused(false); }}
          />
          {personError ? <ErrorText>{isVi ? "Vui lòng nhập tên người." : "Please enter a person name."}</ErrorText> : null}

          {/* Title */}
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

          {/* Content — bell icon is bottom-left inside this box */}
          <FieldLabel>
            {t("noteContent").toUpperCase()} <Text style={{ color: mesh.pink }}>*</Text>
          </FieldLabel>
          <InputCard
            icon="create-outline"
            value={content}
            onChangeText={(value) => { setContent(value); if (value.trim()) setContentError(false); }}
            onFocus={() => setContentFocused(true)}
            onBlur={() => setContentFocused(false)}
            placeholder={t("whatToWrite")}
            maxLength={contentLimit}
            counter={`${content.length}/${contentLimit}`}
            multiline
            error={contentError}
            bellNode={
              showBell ? (
                <Pressable
                  onPress={() => setReminderSheet("preset")}
                  hitSlop={8}
                  style={{
                    alignItems: "center",
                    backgroundColor: reminderAt ? mesh.green700 : "rgba(31,112,72,0.08)",
                    borderRadius: 16,
                    height: 32,
                    justifyContent: "center",
                    width: 32
                  }}
                >
                  <Ionicons name="notifications-outline" size={16} color={reminderAt ? "#FFFFFF" : mesh.green700} />
                </Pressable>
              ) : undefined
            }
          />
          {contentError ? <ErrorText>{isVi ? "Nội dung là bắt buộc." : "Content is required."}</ErrorText> : null}

          {/* Reminder chip — full-width row, appears below content when set */}
          {reminderAt ? (
            <Pressable
              onPress={() => setReminderSheet("preset")}
              style={{
                alignItems: "center",
                alignSelf: "stretch",
                backgroundColor: "rgba(31,112,72,0.08)",
                borderColor: "rgba(31,112,72,0.10)",
                borderRadius: 18,
                borderWidth: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 8,
                minHeight: 44,
                paddingHorizontal: 14,
                paddingVertical: 10
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Ionicons name="notifications-outline" size={16} color={mesh.green700} />
                <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                  {formatReminderChip(reminderAt, lang)}
                </Text>
              </View>
              <Pressable onPress={() => setReminderAt(null)} hitSlop={8} style={{ marginLeft: 8 }}>
                <Ionicons name="close-circle" size={20} color={mesh.ink400} />
              </Pressable>
            </Pressable>
          ) : null}

          {/* Hint */}
          <View style={{ marginTop: 20, borderRadius: 18, backgroundColor: "rgba(31,112,72,0.10)", paddingHorizontal: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconBox icon="bulb-outline" />
            <Text style={{ flex: 1, color: mesh.green800, fontSize: 15, lineHeight: 24 }}>{t("noteHint").replace("\n", " ")}</Text>
          </View>
          {saveError ? <ErrorText>{saveError}</ErrorText> : null}
        </ScrollView>
      </View>

      {/* Save button */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 4, backgroundColor: "rgba(255,255,255,0.94)", paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 10, borderTopWidth: 1, borderColor: "rgba(6,69,50,0.06)" }}>
        <Pressable disabled={saving} onPress={save} style={{ borderRadius: 28, opacity: saving ? 0.75 : 1, overflow: "hidden", ...mesh.shadow }}>
          <LinearGradient colors={[mesh.green800, mesh.green700, "#008A55"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="save-outline" size={20} color="#FFFFFF" />}
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>{saving ? "Saving..." : edit ? t("save") : t("saveNote")}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Preset sheet → open first when bell/chip tapped */}
      <ReminderPresetSheet
        open={reminderSheet === "preset"}
        value={reminderAt}
        lang={lang}
        onClose={() => setReminderSheet("none")}
        onSelectPreset={(date) => { setReminderAt(date); setReminderSheet("none"); }}
        onCustom={() => setReminderSheet("custom")}
      />

      {/* Custom date+time sheet */}
      <ReminderDateTimeSheet
        open={reminderSheet === "custom"}
        value={reminderAt}
        lang={lang}
        t={t}
        onClose={() => setReminderSheet("none")}
        onConfirm={(date) => { setReminderAt(date); setReminderSheet("none"); }}
      />
    </MeshScreen>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children, error = false, first = false }: { children: ReactNode; error?: boolean; first?: boolean }) {
  return (
    <Text style={{ color: error ? mesh.pink : mesh.green700, fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8, marginTop: first ? 0 : 18 }}>
      {children}
    </Text>
  );
}

function ErrorText({ children }: { children: string }) {
  return <Text style={{ color: mesh.pink, fontSize: 12, fontWeight: "700", marginTop: 8 }}>{children}</Text>;
}

function IconBox({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 16, height: 48, justifyContent: "center", width: 48 }}>
      <Ionicons name={icon} size={24} color={mesh.green700} />
    </View>
  );
}

function InputCard({
  bellNode,
  counter,
  error = false,
  icon,
  maxLength,
  multiline = false,
  onBlur,
  onChangeText,
  onFocus,
  placeholder,
  value
}: {
  bellNode?: ReactNode;
  counter: string;
  error?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  maxLength: number;
  multiline?: boolean;
  onBlur?: () => void;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  placeholder: string;
  value: string;
}) {
  const isEmptyMultiline = multiline && value.length === 0;

  return (
    <View
      style={{
        alignItems: multiline && !isEmptyMultiline ? "flex-start" : "center",
        borderColor: error ? "rgba(217,87,122,0.55)" : "rgba(6,69,50,0.10)",
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: "row",
        gap: 12,
        minHeight: multiline ? 148 : 64,
        paddingBottom: 20,
        paddingHorizontal: 14,
        paddingTop: multiline && !isEmptyMultiline ? 14 : 10
      }}
    >
      <IconBox icon={icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={mesh.ink400}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline && !isEmptyMultiline ? "top" : "center"}
        style={{
          color: mesh.ink900,
          flex: 1,
          fontSize: 14,
          lineHeight: multiline ? 21 : undefined,
          minHeight: multiline && !isEmptyMultiline ? 92 : 30,
          padding: 0
        }}
      />
      {/* Counter — absolute bottom-right */}
      <Text style={{ bottom: 10, color: mesh.ink500, fontSize: 12, position: "absolute", right: 14 }}>{counter}</Text>
      {/* Bell — absolute bottom-left, inside the content padding zone */}
      {bellNode != null ? (
        <View style={{ position: "absolute", left: 18, bottom: 12, zIndex: 2 }}>{bellNode}</View>
      ) : null}
    </View>
  );
}

function PersonInlineInput({
  contacts, error, focused, loading, onBlur, onChangeText, onFocus,
  onSelectContact, onSelectTyped, selectedPersonId, value
}: {
  contacts: PickerContact[];
  error: boolean;
  focused: boolean;
  loading: boolean;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onSelectContact: (contact: PickerContact) => void;
  onSelectTyped: () => void;
  selectedPersonId: string | null;
  value: string;
}) {
  const trimmed = value.trim();
  const showSuggestions = focused && trimmed.length > 0;
  const borderColor = error ? "rgba(217,87,122,0.55)" : focused ? mesh.green700 : "rgba(6,69,50,0.10)";

  return (
    <View>
      <View style={{ alignItems: "center", backgroundColor: "#FFFFFF", borderColor, borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 10 }}>
        {trimmed || selectedPersonId ? <Avatar name={trimmed || "?"} size={40} /> : <IconBox icon="person-outline" />}
        <TextInput
          value={value} onChangeText={onChangeText} onFocus={onFocus} onBlur={onBlur}
          placeholder="Type a person name..." placeholderTextColor={mesh.ink400} returnKeyType="done"
          style={{ color: mesh.ink900, flex: 1, fontSize: mesh.font.input, padding: 0 }}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={mesh.ink400} />
          </Pressable>
        ) : null}
      </View>

      {showSuggestions ? (
        <View style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.08)", borderRadius: 20, borderWidth: 1, elevation: 2, marginTop: 8, overflow: "hidden", shadowColor: "#064532", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 }}>
          <Pressable
            onPress={onSelectTyped}
            style={{ alignItems: "center", borderBottomWidth: contacts.length > 0 || loading ? 1 : 0, borderColor: "rgba(6,69,50,0.06)", flexDirection: "row", gap: 12, minHeight: 62, paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Avatar name={trimmed} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{trimmed}</Text>
            </View>
            <Ionicons name="return-down-back-outline" size={16} color={mesh.ink400} />
          </Pressable>

          {contacts.map((contact, index) => (
            <Pressable
              key={contact.id}
              onPress={() => onSelectContact(contact)}
              style={{ alignItems: "center", borderBottomWidth: index < contacts.length - 1 ? 1 : 0, borderColor: "rgba(6,69,50,0.06)", flexDirection: "row", gap: 12, minHeight: 62, paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Avatar name={contact.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{contact.name}</Text>
                {contact.status ? <View style={{ marginTop: 3 }}><StatusChip statusId={contact.status} /></View> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
            </Pressable>
          ))}

          {loading && contacts.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={mesh.green700} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── Wheel picker column ──────────────────────────────────────────────────────

function WheelColumn({
  fontSize = 18,
  fontSizeSelected = 22,
  items,
  onSelect,
  scrollRef,
  selectedIndex,
  width = 72
}: {
  fontSize?: number;
  fontSizeSelected?: number;
  items: string[];
  onSelect: (index: number) => void;
  scrollRef: { current: ScrollView | null };
  selectedIndex: number;
  width?: number;
}) {
  const wheelHeight = WHEEL_ITEM_H * 5;

  return (
    <View style={{ height: wheelHeight, overflow: "hidden", width }}>
      {/* Centre-row highlight strip */}
      <View
        pointerEvents="none"
        style={{
          backgroundColor: "rgba(31,112,72,0.10)",
          borderRadius: 12,
          height: WHEEL_ITEM_H,
          left: 0,
          position: "absolute",
          right: 0,
          top: WHEEL_ITEM_H * 2,
          zIndex: 1
        }}
      />
      <ScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingBottom: WHEEL_ITEM_H * 2, paddingTop: WHEEL_ITEM_H * 2 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_H);
          onSelect(Math.max(0, Math.min(idx, items.length - 1)));
        }}
      >
        {items.map((item, index) => (
          <Pressable
            key={item}
            onPress={() => {
              (scrollRef.current as any)?.scrollTo({ y: index * WHEEL_ITEM_H, animated: true });
              onSelect(index);
            }}
            style={{ alignItems: "center", height: WHEEL_ITEM_H, justifyContent: "center" }}
          >
            <Text style={{
              color: index === selectedIndex ? mesh.green800 : mesh.ink300,
              fontSize: index === selectedIndex ? fontSizeSelected : fontSize,
              fontWeight: index === selectedIndex ? "800" : "400"
            }}>
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Month/year wheel picker ──────────────────────────────────────────────────

function MonthYearWheelPicker({
  initialMonth,
  initialYear,
  lang,
  onConfirm
}: {
  initialMonth: number;
  initialYear: number;
  lang: Lang;
  onConfirm: (year: number, month: number) => void;
}) {
  const isVi = lang === "vi";
  const [tempMonth, setTempMonth] = useState(initialMonth);
  const [tempYear, setTempYear] = useState(initialYear);
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const monthNames = isVi
    ? ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
       "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"]
    : ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 1 + i);
  const yearStrings = years.map(String);

  useEffect(() => {
    const yearIdx = years.indexOf(initialYear);
    setTimeout(() => {
      monthScrollRef.current?.scrollTo({ y: initialMonth * WHEEL_ITEM_H, animated: false });
      if (yearIdx >= 0) yearScrollRef.current?.scrollTo({ y: yearIdx * WHEEL_ITEM_H, animated: false });
    }, 80);
  }, []);

  return (
    <View>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="calendar-outline" size={20} color={mesh.green700} />
          <Text style={{ color: mesh.green800, fontSize: 16, fontWeight: "800" }}>
            {isVi ? "Chọn tháng/năm" : "Select month/year"}
          </Text>
        </View>
        <Pressable
          onPress={() => onConfirm(tempYear, tempMonth)}
          style={{ alignItems: "center", backgroundColor: mesh.green700, borderRadius: 18, height: 36, justifyContent: "center", width: 36 }}
        >
          <Ionicons name="checkmark" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Two-column wheel */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <WheelColumn
          items={monthNames}
          selectedIndex={tempMonth}
          scrollRef={monthScrollRef}
          onSelect={(idx) => setTempMonth(idx)}
          width={152}
          fontSize={14}
          fontSizeSelected={16}
        />
        <WheelColumn
          items={yearStrings}
          selectedIndex={Math.max(0, years.indexOf(tempYear))}
          scrollRef={yearScrollRef}
          onSelect={(idx) => setTempYear(years[idx])}
          width={84}
          fontSize={16}
          fontSizeSelected={20}
        />
      </View>
    </View>
  );
}

// ─── Reminder preset sheet ────────────────────────────────────────────────────

function ReminderPresetSheet({
  lang,
  onClose,
  onCustom,
  onSelectPreset,
  open,
  value
}: {
  lang: Lang;
  onClose: () => void;
  onCustom: () => void;
  onSelectPreset: (date: Date) => void;
  open: boolean;
  value: Date | null;
}) {
  const isVi = lang === "vi";
  const presets = getPresets(lang);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
          {/* Handle */}
          <View style={{ alignSelf: "center", backgroundColor: mesh.ink200, borderRadius: 2, height: 4, marginBottom: 20, width: 40 }} />

          {/* Title */}
          <Text style={{ color: mesh.green800, fontSize: 18, fontWeight: "800", marginBottom: 4 }}>
            {isVi ? "Thêm nhắc nhở" : "Add reminder"}
          </Text>
          <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 19, marginBottom: 20 }}>
            {isVi ? "Chọn thời gian có sẵn hoặc tùy chọn." : "Choose a preset or set a custom date and time."}
          </Text>

          {/* Preset rows */}
          {presets.map((preset, index) => (
            <Pressable
              key={preset.id}
              onPress={() => onSelectPreset(preset.date)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderTopWidth: index === 0 ? 1 : 0,
                borderBottomWidth: 1,
                borderColor: "rgba(6,69,50,0.07)"
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{preset.label}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 13, marginTop: 2 }}>{preset.sublabel}</Text>
              </View>
              {/* Radio circle */}
              <View style={{
                width: 20, height: 20, borderRadius: 10,
                borderWidth: 1.5,
                borderColor: value && Math.abs(preset.date.getTime() - value.getTime()) < 5000 ? mesh.green700 : mesh.ink200,
                backgroundColor: value && Math.abs(preset.date.getTime() - value.getTime()) < 5000 ? mesh.green700 : "transparent",
                alignItems: "center", justifyContent: "center"
              }}>
                {value && Math.abs(preset.date.getTime() - value.getTime()) < 5000 ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" }} />
                ) : null}
              </View>
            </Pressable>
          ))}

          {/* Custom row */}
          <Pressable
            onPress={onCustom}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(6,69,50,0.07)" }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: mesh.green700, fontSize: 15, fontWeight: "700" }}>
                {isVi ? "Tùy chọn ngày & giờ" : "Custom date & time"}
              </Text>
              <Text style={{ color: mesh.ink500, fontSize: 13, marginTop: 2 }}>
                {isVi ? "Chọn ngày và giờ bất kỳ" : "Pick any date and time"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={mesh.ink400} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Reminder date+time sheet ─────────────────────────────────────────────────

function ReminderDateTimeSheet({
  lang,
  onClose,
  onConfirm,
  open,
  t,
  value
}: {
  lang: Lang;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  open: boolean;
  t: TFn;
  value: Date | null;
}) {
  const isVi = lang === "vi";
  const [current, setCurrent] = useState<Date>(() => value ?? defaultReminderDate());
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());
  const [monthYearOpen, setMonthYearOpen] = useState(false);
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!open) return;
    const d = value ?? defaultReminderDate();
    setCurrent(new Date(d));
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setMonthYearOpen(false);
    const minuteIdx = Math.min(Math.round(d.getMinutes() / 5), MINUTES.length - 1);
    setTimeout(() => {
      hourRef.current?.scrollTo({ y: d.getHours() * WHEEL_ITEM_H, animated: false });
      minuteRef.current?.scrollTo({ y: minuteIdx * WHEEL_ITEM_H, animated: false });
    }, 80);
  }, [open]);

  const cells = buildMonthCells(viewYear, viewMonth);
  const today = new Date();

  // The selected day is highlighted only if viewYear/viewMonth match the selected date
  const selDay = current.getFullYear() === viewYear && current.getMonth() === viewMonth
    ? current.getDate() : -1;

  function goPrevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function goNextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const d = new Date(current);
    d.setFullYear(viewYear);
    d.setMonth(viewMonth);
    d.setDate(day);
    setCurrent(d);
  }

  function handleConfirmMonthYear(year: number, month: number) {
    const safeDay = Math.min(current.getDate(), daysInMonth(year, month));
    const d = new Date(current);
    d.setFullYear(year);
    d.setMonth(month);
    d.setDate(safeDay);
    setCurrent(d);
    setViewYear(year);
    setViewMonth(month);
    setMonthYearOpen(false);
  }

  function handleConfirm() {
    onConfirm(new Date(current));
    onClose();
  }

  const dayNames = isVi
    ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}>
          {/* Handle */}
          <View style={{ alignSelf: "center", backgroundColor: mesh.ink200, borderRadius: 2, height: 4, marginBottom: 18, width: 40 }} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 36 }} />
            <Text style={{ color: mesh.green800, flex: 1, fontSize: 17, fontWeight: "800", textAlign: "center" }}>
              {isVi ? "Chọn ngày & giờ" : "Pick date & time"}
            </Text>
            <Pressable onPress={onClose} style={{ alignItems: "center", backgroundColor: mesh.bgSubtle, borderRadius: 18, height: 36, justifyContent: "center", width: 36 }}>
              <Ionicons name="close" size={18} color={mesh.ink700} />
            </Pressable>
          </View>

          {monthYearOpen ? (
            /* Month/year wheel picker — replaces calendar+time area temporarily */
            <MonthYearWheelPicker
              initialMonth={viewMonth}
              initialYear={viewYear}
              lang={lang}
              onConfirm={handleConfirmMonthYear}
            />
          ) : (
            <>
              {/* Fixed-height calendar navigation — arrows never move */}
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 36, marginBottom: 10 }}>
                {/* Tappable month/year label */}
                <Pressable
                  onPress={() => setMonthYearOpen(true)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>
                    {formatMonthYear(viewYear, viewMonth, lang)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={mesh.green700} />
                </Pressable>
                {/* Prev / Next arrows */}
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Pressable onPress={goPrevMonth} hitSlop={10} style={{ alignItems: "center", height: 36, justifyContent: "center", width: 36 }}>
                    <Ionicons name="chevron-back" size={20} color={mesh.green700} />
                  </Pressable>
                  <Pressable onPress={goNextMonth} hitSlop={10} style={{ alignItems: "center", height: 36, justifyContent: "center", width: 36 }}>
                    <Ionicons name="chevron-forward" size={20} color={mesh.green700} />
                  </Pressable>
                </View>
              </View>

              {/* Day-name headers */}
              <View style={{ flexDirection: "row", marginBottom: 4 }}>
                {dayNames.map((d) => (
                  <View key={d} style={{ alignItems: "center", flex: 1, paddingVertical: 4 }}>
                    <Text style={{ color: mesh.ink400, fontSize: 11, fontWeight: "700" }}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar grid — ALWAYS 6 rows × 7 cols (42 cells), height is fixed */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", height: 6 * DAY_CELL_H, marginBottom: 4 }}>
                {cells.map((day, idx) => {
                  const isSelected = day === selDay;
                  const isToday = day !== null && day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                  return (
                    <View key={idx} style={{ width: "14.28%", height: DAY_CELL_H, alignItems: "center", justifyContent: "center" }}>
                      {day !== null ? (
                        <Pressable
                          onPress={() => selectDay(day)}
                          style={{
                            width: 32, height: 32, borderRadius: 16,
                            alignItems: "center", justifyContent: "center",
                            backgroundColor: isSelected ? mesh.green700 : isToday ? "rgba(31,112,72,0.10)" : "transparent"
                          }}
                        >
                          <Text style={{
                            color: isSelected ? "#FFFFFF" : isToday ? mesh.green700 : mesh.ink900,
                            fontSize: 13,
                            fontWeight: isSelected || isToday ? "800" : "500"
                          }}>
                            {day}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              {/* Divider */}
              <View style={{ backgroundColor: mesh.line, height: 1, marginVertical: 14 }} />

              {/* Time wheel picker */}
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 }}>
                <WheelColumn
                  items={HOURS}
                  selectedIndex={current.getHours()}
                  scrollRef={hourRef}
                  onSelect={(idx) => { const d = new Date(current); d.setHours(idx); setCurrent(d); }}
                />
                <Text style={{ color: mesh.ink900, fontSize: 26, fontWeight: "800", marginBottom: 2 }}>:</Text>
                <WheelColumn
                  items={MINUTES}
                  selectedIndex={Math.min(Math.round(current.getMinutes() / 5), MINUTES.length - 1)}
                  scrollRef={minuteRef}
                  onSelect={(idx) => { const d = new Date(current); d.setMinutes(idx * 5); setCurrent(d); }}
                />
              </View>

              {/* Confirm */}
              <Pressable
                onPress={handleConfirm}
                style={{ alignItems: "center", backgroundColor: mesh.green700, borderRadius: 24, marginTop: 20, paddingVertical: 14 }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>{t("save")}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function extractArray(response: unknown, key: string) {
  if (Array.isArray(response)) return response;
  const root = asRecord(response);
  if (!root) return [];
  if (Array.isArray(root[key])) return root[key];
  if (Array.isArray(root.data)) return root.data;
  const data = asRecord(root.data);
  if (data && Array.isArray(data[key])) return data[key];
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function extractNoteData(response: unknown): unknown {
  const root = asRecord(response);
  if (!root) return response;
  const data = asRecord(root.data);
  if (data?.note) return data.note;
  if (data?.content) return data;
  if (root.note) return root.note;
  if (root.content) return root;
  return response;
}

function normalizeEditNote(response: unknown): NoteEditData | null {
  const item = asRecord(extractNoteData(response));
  if (!item) return null;

  const id = typeof item._id === "string" ? item._id : typeof item.id === "string" ? item.id : null;
  const content = typeof item.content === "string" ? item.content : typeof item.body === "string" ? item.body : null;
  if (!id || !content) return null;

  const contactRecord = asRecord(item.contact ?? item.person);
  const contactId =
    typeof item.contactId === "string" ? item.contactId :
    typeof contactRecord?._id === "string" ? String(contactRecord._id) :
    typeof contactRecord?.id === "string" ? String(contactRecord.id) :
    null;

  const contactName =
    typeof contactRecord?.name === "string" ? String(contactRecord.name) :
    typeof contactRecord?.fullName === "string" ? String(contactRecord.fullName) :
    "";

  const statusRecord = asRecord(contactRecord?.status);
  const contactStatus =
    typeof item.statusId === "string" ? item.statusId :
    typeof statusRecord?._id === "string" ? String(statusRecord._id) :
    "";

  const title = typeof item.title === "string" ? item.title : "";
  const reminderRecord = asRecord(item.reminder);
  const reminderEnabled = Boolean(reminderRecord?.enabled ?? item.reminderEnabled);
  const remindAt = reminderEnabled
    ? (typeof reminderRecord?.remindAt === "string" ? String(reminderRecord.remindAt) :
       typeof item.remindAt === "string" ? item.remindAt : null)
    : null;

  return { contactId, contactName, contactStatus, content, id, remindAt, title };
}

function normalizePickerContact(value: unknown): PickerContact | null {
  const item = asRecord(value);
  if (!item) return null;

  const idValue = item._id ?? item.id;
  const nameValue = item.name ?? item.fullName;
  const statusRecord = asRecord(item.status);
  const statusValue = item.statusId ?? statusRecord?._id ?? statusRecord?.id ?? item.status;

  if (typeof idValue !== "string" || typeof nameValue !== "string") return null;

  return {
    id: idValue,
    name: nameValue,
    status: typeof statusValue === "string" ? statusValue : undefined
  };
}
