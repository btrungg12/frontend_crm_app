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

function defaultReminderDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  return d;
}

function formatReminderChip(date: Date, lang: Lang): string {
  const days = lang === "vi"
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = lang === "vi"
    ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = days[date.getDay()];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day}, ${d} ${m} · ${hh}:${mm}`;
}

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // convert to Mon = 0
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export function CreateNoteScreen({ t, lang, nav, edit = false, noteId, initialPerson }: Props) {
  const insets = useSafeAreaInsets();
  const isVi = lang === "vi";

  // Form states — start empty; edit mode fills via useEffect
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [person, setPerson] = useState<string | null>(initialPerson || null);
  const [personLabel, setPersonLabel] = useState("");
  const [personQuery, setPersonQuery] = useState("");
  const [personFocused, setPersonFocused] = useState(false);
  const [apiContacts, setApiContacts] = useState<PickerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false);
  const [reminderAt, setReminderAt] = useState<Date | null>(null);
  const [hadReminder, setHadReminder] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const [personError, setPersonError] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(edit);
  const [loadError, setLoadError] = useState("");

  // Load note data when in edit mode
  useEffect(() => {
    if (!edit) return;
    if (!noteId) {
      setLoadError("Missing note id");
      setLoadingNote(false);
      return;
    }

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
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load note.");
      })
      .finally(() => { if (active) setLoadingNote(false); });

    return () => { active = false; };
  }, [edit, noteId]);

  // Load contacts for inline suggestions on mount
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
      .catch((err) => {
        if (!active) return;
        setContactsError(err instanceof Error ? err.message : "Cannot load contacts.");
      })
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

      if (!token) {
        setSaveError("Please log in before saving notes.");
        return;
      }

      if (edit) {
        if (!noteId) {
          setSaveError("Missing note id.");
          return;
        }
        await updateNote(noteId, {
          contactId: person,
          title: title.trim() || undefined,
          content: content.trim()
        });
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

  // Loading state while fetching note for edit
  if (loadingNote) {
    return (
      <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={mesh.green700} />
        </View>
      </MeshScreen>
    );
  }

  // Error state (missing noteId or API failure in edit mode)
  if (loadError) {
    return (
      <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <Ionicons name="alert-circle-outline" size={48} color={mesh.pink} />
          <Text style={{ color: mesh.ink900, fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 16, marginBottom: 8 }}>
            {loadError}
          </Text>
          <Pressable
            onPress={() => nav("notes")}
            style={{ marginTop: 16, borderRadius: 24, backgroundColor: mesh.green700, paddingHorizontal: 20, paddingVertical: 12 }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Back to Notes</Text>
          </Pressable>
        </View>
      </MeshScreen>
    );
  }

  const showBell = contentFocused || content.trim().length > 0 || reminderAt !== null;

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      {/* Gradient background */}
      <View
        pointerEvents="none"
        style={{
          height: insets.top + 335,
          left: 0,
          overflow: "hidden",
          position: "absolute",
          right: 0,
          top: 0
        }}
      >
        <MeshGradientView
          style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
          columns={4}
          rows={4}
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
          source={leaf2Png}
          resizeMode="contain"
          style={{
            height: 250,
            opacity: 0.2,
            position: "absolute",
            right: -92,
            top: insets.top + 78,
            transform: [{ rotate: "-6deg" }],
            width: 340
          }}
        />
      </View>

      {/* Top bar + title */}
      <View
        style={{
          left: 0,
          paddingHorizontal: 20,
          paddingTop: insets.top + 14,
          position: "absolute",
          right: 0,
          top: 0,
          zIndex: 3
        }}
      >
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
                ? apiContacts
                    .filter((c) => c.name.toLowerCase().includes(personQuery.trim().toLowerCase()))
                    .slice(0, 4)
                : []
            }
            focused={personFocused}
            error={personError}
            loading={contactsLoading}
            onFocus={() => setPersonFocused(true)}
            onBlur={() => setTimeout(() => setPersonFocused(false), 150)}
            onChangeText={(value) => {
              setPersonQuery(value);
              setPersonLabel(value);
              setPerson(null);
              setPersonError(false);
            }}
            onSelectTyped={() => {
              setPersonLabel(personQuery.trim());
              setPerson(null);
              setPersonFocused(false);
            }}
            onSelectContact={(c) => {
              setPerson(c.id);
              setPersonLabel(c.name);
              setPersonQuery(c.name);
              setPersonError(false);
              setPersonFocused(false);
            }}
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

          {/* Content — bell icon lives inside this box */}
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
                  onPress={() => setReminderSheetOpen(true)}
                  hitSlop={8}
                  style={{
                    alignItems: "center",
                    backgroundColor: reminderAt ? mesh.green700 : "rgba(31,112,72,0.10)",
                    borderRadius: 16,
                    height: 32,
                    justifyContent: "center",
                    width: 32
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color={reminderAt ? "#FFFFFF" : mesh.green700}
                  />
                </Pressable>
              ) : undefined
            }
          />
          {contentError ? <ErrorText>{isVi ? "Nội dung là bắt buộc." : "Content is required."}</ErrorText> : null}

          {/* Reminder chip — appears below content when a reminder is set */}
          {reminderAt ? (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <Pressable
                onPress={() => setReminderSheetOpen(true)}
                style={{
                  alignItems: "center",
                  backgroundColor: "rgba(31,112,72,0.10)",
                  borderRadius: 999,
                  flexDirection: "row",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 7
                }}
              >
                <Ionicons name="notifications-outline" size={14} color={mesh.green700} />
                <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "700" }}>
                  {formatReminderChip(reminderAt, lang)}
                </Text>
              </Pressable>
              <Pressable onPress={() => setReminderAt(null)} hitSlop={8} style={{ marginLeft: 6 }}>
                <Ionicons name="close-circle" size={20} color={mesh.ink400} />
              </Pressable>
            </View>
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

      {/* Reminder date+time sheet */}
      <ReminderDateTimeSheet
        open={reminderSheetOpen}
        onClose={() => setReminderSheetOpen(false)}
        onConfirm={(date) => setReminderAt(date)}
        value={reminderAt}
        lang={lang}
        t={t}
      />
    </MeshScreen>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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
          padding: 0,
          paddingRight: bellNode != null ? 40 : 0
        }}
      />
      {/* Counter — absolute bottom-right */}
      <Text style={{ bottom: 10, color: mesh.ink500, fontSize: 12, position: "absolute", right: 14 }}>{counter}</Text>
      {/* Bell icon — absolute top-right, only when bellNode provided */}
      {bellNode != null ? (
        <View style={{ position: "absolute", right: 14, top: 10 }}>{bellNode}</View>
      ) : null}
    </View>
  );
}

function PersonInlineInput({
  contacts,
  error,
  focused,
  loading,
  onBlur,
  onChangeText,
  onFocus,
  onSelectContact,
  onSelectTyped,
  selectedPersonId,
  value
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
  const borderColor = error
    ? "rgba(217,87,122,0.55)"
    : focused
    ? mesh.green700
    : "rgba(6,69,50,0.10)";

  return (
    <View>
      {/* Text input row */}
      <View
        style={{
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderColor,
          borderRadius: 20,
          borderWidth: 1,
          flexDirection: "row",
          gap: 12,
          minHeight: 64,
          paddingHorizontal: 14,
          paddingVertical: 10
        }}
      >
        {trimmed || selectedPersonId ? (
          <Avatar name={trimmed || "?"} size={40} />
        ) : (
          <IconBox icon="person-outline" />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Type a person name..."
          placeholderTextColor={mesh.ink400}
          returnKeyType="done"
          style={{ color: mesh.ink900, flex: 1, fontSize: mesh.font.input, padding: 0 }}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={mesh.ink400} />
          </Pressable>
        ) : null}
      </View>

      {/* Inline suggestion panel */}
      {showSuggestions ? (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(6,69,50,0.08)",
            borderRadius: 20,
            borderWidth: 1,
            elevation: 2,
            marginTop: 8,
            overflow: "hidden",
            shadowColor: "#064532",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12
          }}
        >
          {/* Row 0 — exactly what user typed */}
          <Pressable
            onPress={onSelectTyped}
            style={{
              alignItems: "center",
              borderBottomWidth: contacts.length > 0 || loading ? 1 : 0,
              borderColor: "rgba(6,69,50,0.06)",
              flexDirection: "row",
              gap: 12,
              minHeight: 62,
              paddingHorizontal: 12,
              paddingVertical: 10
            }}
          >
            <Avatar name={trimmed} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{trimmed}</Text>
            </View>
            <Ionicons name="return-down-back-outline" size={16} color={mesh.ink400} />
          </Pressable>

          {/* Existing contact rows */}
          {contacts.map((contact, index) => (
            <Pressable
              key={contact.id}
              onPress={() => onSelectContact(contact)}
              style={{
                alignItems: "center",
                borderBottomWidth: index < contacts.length - 1 ? 1 : 0,
                borderColor: "rgba(6,69,50,0.06)",
                flexDirection: "row",
                gap: 12,
                minHeight: 62,
                paddingHorizontal: 12,
                paddingVertical: 10
              }}
            >
              <Avatar name={contact.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{contact.name}</Text>
                {contact.status ? (
                  <View style={{ marginTop: 3 }}>
                    <StatusChip statusId={contact.status} />
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
            </Pressable>
          ))}

          {/* Loading spinner while contacts fetch */}
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
  items,
  onSelect,
  scrollRef,
  selectedIndex
}: {
  items: string[];
  onSelect: (index: number) => void;
  scrollRef: { current: ScrollView | null };
  selectedIndex: number;
}) {
  const wheelHeight = WHEEL_ITEM_H * 5;

  return (
    <View style={{ height: wheelHeight, overflow: "hidden", width: 72 }}>
      {/* Centre-row highlight */}
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
        contentContainerStyle={{
          paddingBottom: WHEEL_ITEM_H * 2,
          paddingTop: WHEEL_ITEM_H * 2
        }}
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
            <Text
              style={{
                color: index === selectedIndex ? mesh.green800 : mesh.ink300,
                fontSize: index === selectedIndex ? 22 : 18,
                fontWeight: index === selectedIndex ? "800" : "400"
              }}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Reminder date+time bottom sheet ─────────────────────────────────────────

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
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  // Sync to incoming value each time the sheet opens
  useEffect(() => {
    if (!open) return;
    const d = value ?? defaultReminderDate();
    setCurrent(new Date(d));
    const minuteIdx = Math.min(Math.round(d.getMinutes() / 5), MINUTES.length - 1);
    setTimeout(() => {
      hourRef.current?.scrollTo({ y: d.getHours() * WHEEL_ITEM_H, animated: false });
      minuteRef.current?.scrollTo({ y: minuteIdx * WHEEL_ITEM_H, animated: false });
    }, 80);
  }, [open]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const selectedDay = current.getDate();
  const cells = buildMonthCells(year, month);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const dayNames = isVi
    ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const monthNames = isVi
    ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function prevMonth() {
    const d = new Date(current);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    setCurrent(d);
  }

  function nextMonth() {
    const d = new Date(current);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    setCurrent(d);
  }

  function selectDay(day: number) {
    const d = new Date(current);
    d.setDate(day);
    setCurrent(d);
  }

  function handleConfirm() {
    onConfirm(new Date(current));
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}
      >
        <Pressable
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: 32,
            paddingHorizontal: 20,
            paddingTop: 12
          }}
        >
          {/* Handle bar */}
          <View style={{ alignSelf: "center", backgroundColor: mesh.ink200, borderRadius: 2, height: 4, marginBottom: 18, width: 40 }} />

          {/* Header */}
          <View style={{ alignItems: "center", flexDirection: "row", marginBottom: 20 }}>
            <View style={{ width: 36 }} />
            <Text style={{ color: mesh.green800, flex: 1, fontSize: 17, fontWeight: "800", textAlign: "center" }}>
              {isVi ? "Chọn ngày & giờ" : "Set reminder"}
            </Text>
            <Pressable
              onPress={onClose}
              style={{ alignItems: "center", backgroundColor: mesh.bgSubtle, borderRadius: 18, height: 36, justifyContent: "center", width: 36 }}
            >
              <Ionicons name="close" size={18} color={mesh.ink700} />
            </Pressable>
          </View>

          {/* Month navigation */}
          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Pressable onPress={prevMonth} hitSlop={10} style={{ padding: 4 }}>
              <Ionicons name="chevron-back" size={20} color={mesh.green700} />
            </Pressable>
            <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>
              {monthNames[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={10} style={{ padding: 4 }}>
              <Ionicons name="chevron-forward" size={20} color={mesh.green700} />
            </Pressable>
          </View>

          {/* Day-name headers (Mon–Sun) */}
          <View style={{ flexDirection: "row", marginBottom: 4 }}>
            {dayNames.map((d) => (
              <View key={d} style={{ alignItems: "center", flex: 1, paddingVertical: 4 }}>
                <Text style={{ color: mesh.ink400, fontSize: 11, fontWeight: "700" }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
            {cells.map((day, idx) => {
              const isSelected = day === selectedDay;
              const isToday = day !== null && day === todayDay && month === todayMonth && year === todayYear;
              return (
                <View key={idx} style={{ aspectRatio: 1, padding: 2, width: "14.28%" }}>
                  {day !== null ? (
                    <Pressable
                      onPress={() => selectDay(day)}
                      style={{
                        alignItems: "center",
                        backgroundColor: isSelected
                          ? mesh.green700
                          : isToday
                          ? "rgba(31,112,72,0.10)"
                          : "transparent",
                        borderRadius: 999,
                        flex: 1,
                        justifyContent: "center"
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? "#FFFFFF" : isToday ? mesh.green700 : mesh.ink900,
                          fontSize: 13,
                          fontWeight: isSelected || isToday ? "800" : "500"
                        }}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
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
              onSelect={(idx) => {
                const d = new Date(current);
                d.setHours(idx);
                setCurrent(d);
              }}
            />
            <Text style={{ color: mesh.ink900, fontSize: 26, fontWeight: "800", marginBottom: 2 }}>:</Text>
            <WheelColumn
              items={MINUTES}
              selectedIndex={Math.min(Math.round(current.getMinutes() / 5), MINUTES.length - 1)}
              scrollRef={minuteRef}
              onSelect={(idx) => {
                const d = new Date(current);
                d.setMinutes(idx * 5);
                setCurrent(d);
              }}
            />
          </View>

          {/* Confirm */}
          <Pressable
            onPress={handleConfirm}
            style={{ alignItems: "center", backgroundColor: mesh.green700, borderRadius: 24, marginTop: 20, paddingVertical: 14 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>{t("save")}</Text>
          </Pressable>
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
