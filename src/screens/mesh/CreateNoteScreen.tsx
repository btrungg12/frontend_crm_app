import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MeshGradientView } from "expo-mesh-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getContacts } from "../../api/contactApi";
import { deleteNoteReminder, getNote, getNoteById, getNotes, submitCreateNote, updateNote, upsertNoteReminder } from "../../api/noteApi";
import { getToken } from "../../storage/tokenStorage";
import { Avatar, MeshScreen, NavFn, StatusChip, TFn } from "../../mesh/MeshComponents";
import { Lang } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";
import { useAppData } from "../../state/AppDataContext";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  edit?: boolean;
  noteId?: string;
  initialPerson?: string;
  /** "sheet" = rendered inside a QuickCreateSheet bottom sheet */
  presentation?: "page" | "sheet";
  onCloseSheet?: () => void;
  onCreated?: (result: { type: "note"; id?: string; highlightLatest?: boolean }) => void;
};

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 1000;
const leaf2Png = require("../../../assets/leaf_2.png");

const SUCCESS_HOLD_MS = 750;
const HIGHLIGHT_MS = 2800;

type SavePhase = "idle" | "saving" | "success";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractCreatedId(response: unknown): string | undefined {
  const root = response && typeof response === "object" ? (response as Record<string, any>) : null;
  if (!root) return undefined;

  return (
    root?.data?.note?._id ||
    root?.data?.note?.id ||
    root?.note?._id ||
    root?.note?.id ||
    root?.data?._id ||
    root?.data?.id ||
    root?._id ||
    root?.id
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const WHEEL_ITEM_H = 44;
const DAY_CELL_H = 38;

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

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function setTime(date: Date, hour: number, minute = 0): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function nextSaturday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatPresetDateTime(date: Date, lang: Lang): string {
  const isVi = lang === "vi";
  const weekdays = isVi
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = isVi
    ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} · ${hh}:${mm}`;
}

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

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const numDays = daysInMonth(year, month);
  const offset = (firstDay + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function getPresets(lang: Lang): Preset[] {
  const isVi = lang === "vi";
  const now = new Date();
  const tomorrow  = setTime(addDays(now, 1),  9);
  const weekend   = setTime(nextSaturday(now), 9);
  const nextWeek  = setTime(addDays(now, 7),  9);
  const nextMonth = setTime(addDays(now, 31), 9);
  return [
    { id: "tomorrow",  label: isVi ? "Sáng mai"       : "Tomorrow morning", sublabel: formatPresetDateTime(tomorrow,  lang), date: tomorrow  },
    { id: "weekend",   label: isVi ? "Cuối tuần này"  : "This weekend",     sublabel: formatPresetDateTime(weekend,   lang), date: weekend   },
    { id: "nextweek",  label: isVi ? "Tuần sau"        : "Next week",        sublabel: formatPresetDateTime(nextWeek,  lang), date: nextWeek  },
    { id: "nextmonth", label: isVi ? "Tháng sau"       : "Next month",       sublabel: formatPresetDateTime(nextMonth, lang), date: nextMonth },
  ];
}

// ─── Title / content parser ───────────────────────────────────────────────────

function parseNoteDraftFromComposer(
  firstLine: string,
  bodyText: string
): { title: string | null; content: string } {
  const cleanFirst = firstLine.trim();
  const cleanBody  = bodyText.trim();
  const rawText    = [cleanFirst, cleanBody].filter(Boolean).join("\n");

  if (!rawText) return { title: null, content: "" };

  // Use first line as title only when it fits and body has content
  const useAsTitle =
    cleanFirst.length > 0 &&
    cleanFirst.length <= TITLE_MAX_LENGTH &&
    cleanBody.length > 0;

  // Important: content MUST include the full text including first line
  // title is the first line, content is the complete text
  if (useAsTitle) return { title: cleanFirst, content: rawText };
  return { title: null, content: rawText };
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function CreateNoteScreen({ t, lang, nav, edit = false, noteId, initialPerson, presentation = "page", onCloseSheet, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const isVi   = lang === "vi";
  const isSheet = presentation === "sheet";
  const { refreshNotes, refreshContacts, invalidateDashboard } = useAppData();

  // ── Editor state
  const [firstLine, setFirstLine] = useState("");
  const [bodyText,  setBodyText]  = useState("");

  // ── Person state
  const [person,        setPerson]        = useState<string | null>(initialPerson || null);
  const [personLabel,   setPersonLabel]   = useState("");
  const [personQuery,   setPersonQuery]   = useState("");
  const [personFocused, setPersonFocused] = useState(false);
  const [apiContacts,   setApiContacts]   = useState<PickerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // ── Reminder state
  const [reminderSheet, setReminderSheet] = useState<"none" | "preset" | "custom">("none");
  const [reminderAt,    setReminderAt]    = useState<Date | null>(null);
  const [hadReminder,   setHadReminder]   = useState(false);

  // ── UI state
  const [personError,  setPersonError]  = useState(false);
  const [contentError, setContentError] = useState(false);
  const [saveError,    setSaveError]    = useState("");
  const [savePhase,    setSavePhase]    = useState<SavePhase>("idle");
  const [loadingNote,  setLoadingNote]  = useState(edit);
  const [loadError,    setLoadError]    = useState("");

  const saving = savePhase === "saving";
  const saveSuccess = savePhase === "success";

  const bodyRef      = useRef<TextInput>(null);
  const firstLineRef = useRef<TextInput>(null);

  // Derived state (computed each render)
  const hasBody      = bodyText.length > 0;
  const hasFirstLine = firstLine.trim().length > 0;

  // showBody: true when user has pressed Enter or bodyText has content (edit mode)
  const [showBody, setShowBody] = useState(false);

  // Load existing note in edit mode
  useEffect(() => {
    if (!edit) return;
    if (!noteId) { setLoadError("Missing note id"); setLoadingNote(false); return; }
    let active = true;
    setLoadingNote(true);
    setLoadError("");
    const applyNoteData = (raw: unknown) => {
      const data = normalizeEditNote(raw);
      if (!data) { setLoadError("Note not found."); return; }
      // content includes full text; title = first line
      // Reconstruct composer: firstLine = title, bodyText = lines after first
      if (data.title) {
        setFirstLine(data.title);
        // Strip first line from content if content starts with title
        const afterTitle = data.content.startsWith(data.title)
          ? data.content.slice(data.title.length).replace(/^\n/, "")
          : data.content;
        setBodyText(afterTitle);
        if (afterTitle.trim()) setShowBody(true);
      } else {
        const lines = data.content.split("\n");
        setFirstLine(lines[0] ?? "");
        const bodyContent = lines.slice(1).join("\n");
        setBodyText(bodyContent);
        if (bodyContent.trim()) setShowBody(true);
      }
      setPerson(data.contactId);
      setPersonLabel(data.contactName);
      setPersonQuery(data.contactName);
      if (data.remindAt) {
        setReminderAt(new Date(data.remindAt));
        setHadReminder(true);
      }
    };

    getNote(noteId)
      .then((response) => {
        if (!active) return;
        applyNoteData(response);
      })
      .catch(async (err) => {
        if (!active) return;
        // Fallback: if GET /api/notes/:id not implemented yet (returns HTML)
        const msg = err instanceof Error ? err.message : String(err);
        const isHtml = msg.includes("<!DOCTYPE") || msg.includes("<html") || msg.includes("Cannot GET");
        if (isHtml || (err as { status?: number })?.status === 404) {
          try {
            const listResponse = await getNotes();
            const found = extractArray(listResponse, "notes").find((raw: any) => (raw._id ?? raw.id) === noteId);
            if (!active) return;
            if (found) { applyNoteData(found); return; }
            setLoadError("Note not found.");
          } catch {
            if (active) setLoadError("Cannot load note.");
          }
        } else {
          setLoadError(msg || "Failed to load note.");
        }
      })
      .finally(() => { if (active) setLoadingNote(false); });
    return () => { active = false; };
  }, [edit, noteId]);

  // Load contacts for autocomplete
  useEffect(() => {
    let active = true;
    setContactsLoading(true);
    getContacts()
      .then((response) => {
        if (!active) return;
        const normalized = extractArray(response, "contacts")
          .map(normalizePickerContact)
          .filter(Boolean) as PickerContact[];
        setApiContacts(normalized);
      })
      .catch(() => {})
      .finally(() => { if (active) setContactsLoading(false); });
    return () => { active = false; };
  }, []);

  // Draft length for counter
  const draftText   = [firstLine, bodyText].filter((s) => s.trim()).join("\n");
  const draftLength = draftText.length;

  // Placeholder only shows when both fields are empty
  const draftIsEmpty = firstLine.trim().length === 0 && bodyText.trim().length === 0;

  const clear = () => {
    setFirstLine("");
    setBodyText("");
    setShowBody(false);
    if (!edit) { setPerson(initialPerson || null); setPersonLabel(""); setPersonQuery(""); }
    setReminderAt(null);
    setPersonError(false);
    setContentError(false);
    setSaveError("");
  };

  // Handle newline in first-line input: split text and move to body
  const handleFirstLineChange = (value: string) => {
    if (value.includes("\n")) {
      const parts = value.split(/\r?\n/);
      const nextFirst         = parts[0] ?? "";
      const nextBodyFromFirst = parts.slice(1).join("\n");
      setFirstLine(nextFirst);
      setBodyText((prev) =>
        [nextBodyFromFirst, prev].filter(Boolean).join(prev ? "\n" : "")
      );
      setShowBody(true);
      if (nextFirst.trim() || nextBodyFromFirst.trim()) setContentError(false);
      requestAnimationFrame(() => { bodyRef.current?.focus(); });
      return;
    }
    setFirstLine(value);
    if (value.trim() || bodyText.trim()) setContentError(false);
  };

  const handleBodyChange = (value: string) => {
    setBodyText(value);
    if (firstLine.trim() || value.trim()) setContentError(false);
  };

  const save = async () => {
    const typedName     = personLabel.trim() || personQuery.trim();
    const missingPerson = !person && typedName.length === 0;
    const { title, content } = parseNoteDraftFromComposer(firstLine, bodyText);
    const missingContent = !content.trim();

    setPersonError(missingPerson);
    setContentError(missingContent);
    setSaveError("");
    if (missingPerson || missingContent) return;

    try {
      const token = await getToken();
      if (!token) { setSaveError("Please log in before saving notes."); return; }

      if (edit) {
        if (!noteId) { setSaveError("Missing note id."); return; }
        setSavePhase("saving");
        await updateNote(noteId, { contactId: person, title: title || undefined, content });
        if (reminderAt) {
          await upsertNoteReminder(noteId, { enabled: true, remindAt: reminderAt.toISOString() });
        } else if (hadReminder) {
          await deleteNoteReminder(noteId);
        }
        await refreshNotes(true);
        invalidateDashboard();
        setSavePhase("success");
        await delay(SUCCESS_HOLD_MS);
        if (isSheet) { onCreated?.({ type: "note", id: noteId }); onCloseSheet?.(); } else { nav("noteDetail", { id: noteId }); }
      } else {
        setSavePhase("saving");
        const response = await submitCreateNote({
          contactId:       person || undefined,
          newContactName:  person ? undefined : (typedName || undefined),
          content,
          title:           title || undefined,
          interactionDate: new Date().toISOString(),
          reminderEnabled: Boolean(reminderAt),
          remindAt:        reminderAt?.toISOString(),
        });

        const createdId = extractCreatedId(response);

        await refreshNotes(true);
        // If new contact was created from note, refresh contacts too
        if (!person && typedName) {
          await refreshContacts(true);
        }
        invalidateDashboard();

        setSavePhase("success");
        await delay(SUCCESS_HOLD_MS);

        if (isSheet) {
          onCreated?.({
            type: "note",
            id: createdId,
            highlightLatest: !createdId,
          });
          onCloseSheet?.();
        } else {
          nav("notes", {
            highlightId: createdId,
            highlightLatest: !createdId,
            refresh: Date.now(),
          });
        }
      }
    } catch (err) {
      setSavePhase("idle");
      setSaveError(err instanceof Error && err.message ? err.message : "Could not save note.");
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────────

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

  const reminderLabel = reminderAt ? formatReminderChip(reminderAt, lang) : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      {!isSheet && <StatusBar style="light" />}

      {/* ── Full-screen mesh background — dark green top fading to white ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <MeshGradientView
          style={StyleSheet.absoluteFillObject}
          columns={4}
          rows={5}
          colors={[
            "#064532", "#0A5B40", "#168057", "#CDE9DA",
            "#9FCDB8", "#DDF1E7", "#F4FBF7", "#FFFFFF",
            "#F7FCF8", "#FFFFFF", "#FFFFFF", "#F8FCF7",
            "#FFFFFF", "#FFFFFF", "#F9FCF9", "#FFFFFF",
            "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
          ]}
          points={[
            [0, 0],    [0.35, 0],    [0.7, 0],    [1, 0],
            [0, 0.25], [0.35, 0.22], [0.7, 0.25], [1, 0.22],
            [0, 0.5],  [0.35, 0.48], [0.7, 0.52], [1, 0.5],
            [0, 0.75], [0.35, 0.72], [0.7, 0.76], [1, 0.74],
            [0, 1],    [0.35, 1],    [0.7, 1],    [1, 1],
          ]}
          smoothsColors
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.00)",
            "rgba(255,255,255,0.24)",
            "rgba(255,255,255,0.72)",
            "rgba(255,255,255,0.96)",
          ]}
          locations={[0, 0.22, 0.52, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <Image
          source={leaf2Png}
          resizeMode="contain"
          style={{
            position: "absolute",
            right: -70,
            top: insets.top + 70,
            width: 290,
            height: 210,
            opacity: 0.15,
            transform: [{ rotate: "-6deg" }],
          }}
        />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: isSheet ? insets.bottom + 80 : insets.bottom + 110 }}
      >
        {/* ── Header (transparent — background comes from root) ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: isSheet ? 18 : insets.top + 14, paddingBottom: 24 }}>

          {/* Top bar */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable
              onPress={() => isSheet ? onCloseSheet?.() : (edit && noteId ? nav("noteDetail", { id: noteId }) : nav("dashboard"))}
              style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: "#FFFFFF",
                alignItems: "center", justifyContent: "center",
                ...mesh.shadow,
              }}
            >
              <Ionicons name="chevron-back" size={24} color={mesh.green700} />
            </Pressable>
            <Pressable onPress={clear} hitSlop={10}>
              <Text style={{ color: mesh.green800, fontSize: 15, fontWeight: "800" }}>{t("clear")}</Text>
            </Pressable>
          </View>

          {/* Title + subtitle */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: "#064532", fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40 }}>
              {edit ? t("editNote") : t("newNote")}
            </Text>
            <Text style={{ color: "#5D6863", fontSize: 15, lineHeight: 22, marginTop: 6, maxWidth: 300 }}>
              {edit
                ? "Update the details you want to remember."
                : "Capture something meaningful\nso you won't forget."}
            </Text>
          </View>
        </View>

        {/* ── Person pill ── */}
        <PersonPill
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
          onChangeText={(v) => {
            setPersonQuery(v);
            setPersonLabel(v);
            setPerson(null);
            setPersonError(false);
          }}
          onSelectContact={(c) => {
            setPerson(c.id);
            setPersonLabel(c.name);
            setPersonQuery(c.name);
            setPersonError(false);
            setPersonFocused(false);
          }}
        />
        {personError ? (
          <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", marginHorizontal: 24, marginTop: 6 }}>
            {isVi ? "Vui lòng nhập tên người." : "Please enter a person name."}
          </Text>
        ) : null}

        {/* ── Note canvas ── */}
        <Pressable
          onPress={() => {
            if (bodyText.trim().length > 0 || showBody) bodyRef.current?.focus();
            else firstLineRef.current?.focus();
          }}
          style={{
            marginHorizontal: 24,
            marginTop: 14,
            minHeight: 360,
            borderRadius: 30,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: contentError ? "rgba(217,87,122,0.4)" : "rgba(6,69,50,0.08)",
            paddingHorizontal: 22,
            paddingTop: 22,
            paddingBottom: 56,
            shadowColor: "#064532",
            shadowOpacity: 0.048,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 5 },
            elevation: 2,
          }}
        >
          {/* First line: placeholder only shown when entire draft is empty */}
          <TextInput
            ref={firstLineRef}
            value={firstLine}
            onChangeText={handleFirstLineChange}
            placeholder={
              draftIsEmpty
                ? (isVi ? "Bạn muốn ghi nhớ điều gì?" : "What would you like to remember?")
                : ""
            }
            placeholderTextColor={mesh.ink400}
            style={{
              color: mesh.ink900,
              fontSize: 16,
              lineHeight: 27,
              fontWeight: hasFirstLine ? "700" : "400",
              padding: 0,
              margin: 0,
              minHeight: 27,
            }}
            multiline
          />

          {/* Body text — only rendered after user presses Enter or has content */}
          {(showBody || hasBody) ? (
            <TextInput
              ref={bodyRef}
              value={bodyText}
              onChangeText={handleBodyChange}
              placeholder=""
              placeholderTextColor={mesh.ink400}
              style={{
                marginTop: 6,
                color: mesh.ink900,
                fontSize: 16,
                lineHeight: 27,
                fontWeight: "400",
                padding: 0,
                margin: 0,
                textAlignVertical: "top",
                minHeight: 120,
              }}
              multiline
              textAlignVertical="top"
            />
          ) : null}

          {/* Counter footer — number only */}
          <View
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              bottom: 16,
              borderTopWidth: 1,
              borderTopColor: "rgba(6,69,50,0.07)",
              paddingTop: 10,
              alignItems: "flex-end",
            }}
          >
            <Text style={{ color: mesh.ink400, fontSize: 13 }}>{draftLength}/{CONTENT_MAX_LENGTH}</Text>
          </View>
        </Pressable>
        {contentError ? (
          <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", marginHorizontal: 24, marginTop: 6 }}>
            {isVi ? "Nội dung là bắt buộc." : "Content is required."}
          </Text>
        ) : null}

        {/* ── Reminder chip ── */}
        <View style={{ marginHorizontal: 24, marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => setReminderSheet("preset")}
            style={[styles.reminderChipBase, !reminderAt && styles.reminderChipEmpty]}
          >
            {reminderAt ? (
              <LinearGradient
                colors={["rgba(255,255,255,0.98)", "rgba(231,247,238,0.68)", "rgba(250,254,251,0.98)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reminderChipGradient}
              >
                <View style={styles.reminderIconCircle}>
                  <Ionicons name="notifications-outline" size={14} color={mesh.green700} style={{ transform: [{ translateY: 0.5 }] }} />
                </View>
                <Text numberOfLines={1} style={styles.reminderText}>
                  {reminderLabel}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.reminderChipInner}>
                <View style={styles.reminderIconCircle}>
                  <Ionicons name="notifications-outline" size={14} color={mesh.green700} style={{ transform: [{ translateY: 0.5 }] }} />
                </View>
                <Text numberOfLines={1} style={styles.reminderText}>
                  {isVi ? "Nhắc nhở" : "Reminder"}
                </Text>
              </View>
            )}
          </Pressable>
          {reminderAt ? (
            <Pressable
              onPress={() => setReminderAt(null)}
              hitSlop={8}
              style={styles.reminderClearButton}
            >
              <Ionicons name="close" size={14} color={mesh.ink500} />
            </Pressable>
          ) : null}
        </View>

        {/* Save error */}
        {saveError ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginHorizontal: 20,
              marginTop: 14,
              backgroundColor: "rgba(217,87,122,0.08)",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="alert-circle-outline" size={15} color={mesh.pink} />
            <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", flex: 1 }}>{saveError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Save button ── */}
      <View
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: 0,
          zIndex: 4,
          backgroundColor: "rgba(255,255,255,0.94)",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 10,
          borderTopWidth: 1,
          borderColor: "rgba(6,69,50,0.06)",
        }}
      >
        <Pressable
          disabled={savePhase === "saving" || savePhase === "success"}
          onPress={save}
          style={{ borderRadius: 28, opacity: savePhase !== "idle" ? 0.75 : 1, overflow: "hidden" }}
        >
          <LinearGradient
            colors={[mesh.green800, mesh.green700, "#008A55"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            {savePhase === "saving" ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : savePhase === "success" ? (
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>
              {savePhase === "saving" ? "Saving..." : savePhase === "success" ? "Saved" : edit ? t("save") : t("saveNote")}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ── Reminder sheets ── */}
      <ReminderPresetSheet
        open={reminderSheet === "preset"}
        value={reminderAt}
        lang={lang}
        onClose={() => setReminderSheet("none")}
        onSelectPreset={(date) => { setReminderAt(date); setReminderSheet("none"); }}
        onCustom={() => setReminderSheet("custom")}
      />
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

// ─── PersonPill ───────────────────────────────────────────────────────────────

function PersonPill({
  contacts, error, focused, loading, onBlur, onChangeText, onFocus,
  onSelectContact, selectedPersonId, value,
}: {
  contacts: PickerContact[];
  error: boolean;
  focused: boolean;
  loading: boolean;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onSelectContact: (contact: PickerContact) => void;
  selectedPersonId: string | null;
  value: string;
}) {
  const trimmed = value.trim();
  // Dropdown only when existing contacts match — never show the raw typed name as an item
  const showSuggestions = focused && trimmed.length > 0 && (contacts.length > 0 || loading);

  const borderColor = error
    ? "rgba(217,87,122,0.55)"
    : focused ? mesh.green700
    : "rgba(6,69,50,0.08)";

  return (
    <View style={{ marginLeft: 24, width: 248, zIndex: 20 }}>
      {/* Pill input */}
      <View
        style={{
          height: 52,
          maxHeight: 52,
          overflow: "hidden",
          borderRadius: 26,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderWidth: 1,
          borderColor,
          paddingLeft: 15,
          paddingRight: value.length > 0 ? 10 : 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          shadowColor: "#064532",
          shadowOpacity: 0.048,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        {selectedPersonId
          ? (
            <View style={styles.personAvatarSlot}>
              <Avatar name={trimmed || "?"} size={30} />
            </View>
          )
          : (
            <View style={styles.personIconSlot}>
              <Ionicons
                name="person-outline"
                size={20}
                color={mesh.green700}
                style={styles.personIcon}
              />
            </View>
          )
        }
        {/* Show Text when contact is selected; TextInput when searching */}
        {selectedPersonId ? (
          <View style={{ flex: 1, minWidth: 0, justifyContent: "center", overflow: "hidden" }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: mesh.ink900,
                fontSize: 16,
                lineHeight: 22,
                fontWeight: "400",
                includeFontPadding: false,
              } as any}
            >
              {value}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1, minWidth: 0, overflow: "hidden", justifyContent: "center" }}>
            <TextInput
              value={value}
              onChangeText={onChangeText}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="Type a person name..."
              placeholderTextColor={mesh.ink400}
              returnKeyType="done"
              multiline={false}
              numberOfLines={1}
              style={{
                height: 52,
                color: mesh.ink900,
                fontSize: 16,
                fontWeight: "400",
                lineHeight: 22,
                paddingTop: 0,
                paddingBottom: 0,
                paddingVertical: 0,
                includeFontPadding: false,
                textAlignVertical: "center",
              } as any}
            />
          </View>
        )}
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={mesh.ink400} />
          </Pressable>
        ) : null}
      </View>

      {/* Autocomplete dropdown — only real contacts, never raw typed name */}
      {showSuggestions ? (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(6,69,50,0.08)",
            borderRadius: 20,
            borderWidth: 1,
            elevation: 4,
            marginTop: 6,
            overflow: "hidden",
            shadowColor: "#064532",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.07,
            shadowRadius: 14,
            zIndex: 20,
          }}
        >
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
                minHeight: 56,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Avatar name={contact.name} size={34} />
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
          {loading && contacts.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 14 }}>
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
          <View style={{ alignSelf: "center", backgroundColor: mesh.ink200, borderRadius: 2, height: 4, marginBottom: 20, width: 40 }} />

          <Text style={{ color: mesh.green800, fontSize: 18, fontWeight: "800", marginBottom: 4 }}>
            {isVi ? "Thêm nhắc nhở" : "Add reminder"}
          </Text>
          <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 19, marginBottom: 20 }}>
            {isVi ? "Chọn thời gian có sẵn hoặc tùy chọn." : "Choose a preset or set a custom date and time."}
          </Text>

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
  const [timeError, setTimeError] = useState("");
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!open) return;
    const d = value ?? defaultReminderDate();
    setCurrent(new Date(d));
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setMonthYearOpen(false);
    setTimeError("");
    const minuteIdx = Math.min(Math.round(d.getMinutes() / 5), MINUTES.length - 1);
    setTimeout(() => {
      hourRef.current?.scrollTo({ y: d.getHours() * WHEEL_ITEM_H, animated: false });
      minuteRef.current?.scrollTo({ y: minuteIdx * WHEEL_ITEM_H, animated: false });
    }, 80);
  }, [open]);

  const cells = buildMonthCells(viewYear, viewMonth);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOnCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const selDay = current.getFullYear() === viewYear && current.getMonth() === viewMonth
    ? current.getDate() : -1;

  function goPrevMonth() {
    if (isOnCurrentMonth) return;
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
    if (current.getTime() <= Date.now()) {
      setTimeError(isVi ? "Thời gian nhắc nhở phải ở tương lai." : "Reminder time must be in the future.");
      return;
    }
    setTimeError("");
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
          <View style={{ alignSelf: "center", backgroundColor: mesh.ink200, borderRadius: 2, height: 4, marginBottom: 18, width: 40 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 36 }} />
            <Text style={{ color: mesh.green800, flex: 1, fontSize: 17, fontWeight: "800", textAlign: "center" }}>
              {isVi ? "Chọn ngày & giờ" : "Pick date & time"}
            </Text>
            <Pressable
              onPress={onClose}
              style={{ alignItems: "center", backgroundColor: mesh.bgSubtle, borderRadius: 18, height: 36, justifyContent: "center", width: 36 }}
            >
              <Ionicons name="close" size={18} color={mesh.ink700} />
            </Pressable>
          </View>

          {monthYearOpen ? (
            <MonthYearWheelPicker
              initialMonth={viewMonth}
              initialYear={viewYear}
              lang={lang}
              onConfirm={handleConfirmMonthYear}
            />
          ) : (
            <>
              <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 36, marginBottom: 10 }}>
                <Pressable onPress={() => setMonthYearOpen(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>
                    {formatMonthYear(viewYear, viewMonth, lang)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={mesh.green700} />
                </Pressable>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Pressable
                    onPress={goPrevMonth}
                    disabled={isOnCurrentMonth}
                    hitSlop={10}
                    style={{ alignItems: "center", height: 36, justifyContent: "center", opacity: isOnCurrentMonth ? 0.25 : 1, width: 36 }}
                  >
                    <Ionicons name="chevron-back" size={20} color={mesh.green700} />
                  </Pressable>
                  <Pressable onPress={goNextMonth} hitSlop={10} style={{ alignItems: "center", height: 36, justifyContent: "center", width: 36 }}>
                    <Ionicons name="chevron-forward" size={20} color={mesh.green700} />
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: "row", marginBottom: 4 }}>
                {dayNames.map((d) => (
                  <View key={d} style={{ alignItems: "center", flex: 1, paddingVertical: 4 }}>
                    <Text style={{ color: mesh.ink400, fontSize: 11, fontWeight: "700" }}>{d}</Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", height: 6 * DAY_CELL_H, marginBottom: 4 }}>
                {cells.map((day, idx) => {
                  const isSelected = day === selDay;
                  const isToday = day !== null && day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                  const isPast = day !== null && new Date(viewYear, viewMonth, day).getTime() < todayStart.getTime();
                  return (
                    <View key={idx} style={{ width: "14.28%", height: DAY_CELL_H, alignItems: "center", justifyContent: "center" }}>
                      {day !== null ? (
                        <Pressable
                          onPress={() => !isPast && selectDay(day)}
                          disabled={isPast}
                          style={{
                            width: 32, height: 32, borderRadius: 16,
                            alignItems: "center", justifyContent: "center",
                            opacity: isPast ? 0.28 : 1,
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

              <View style={{ backgroundColor: mesh.line, height: 1, marginVertical: 14 }} />

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

              {timeError ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, backgroundColor: "rgba(217,87,122,0.08)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="alert-circle-outline" size={15} color={mesh.pink} />
                  <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", flex: 1 }}>{timeError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleConfirm}
                style={{ alignItems: "center", backgroundColor: mesh.green700, borderRadius: 24, marginTop: 14, paddingVertical: 14 }}
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

// ─── Reminder chip styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Person pill ──
  personIconSlot: {
    width: 24,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  personIcon: {
    transform: [{ translateY: 1 }],
  },
  personAvatarSlot: {
    width: 30,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Reminder chip ──
  reminderChipBase: {
    alignSelf: "flex-start",
    minHeight: 40,
    maxWidth: "82%",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(31,112,72,0.065)",
    shadowColor: "#064532",
    shadowOpacity: 0.048,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  reminderChipEmpty: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderColor: "rgba(6,69,50,0.065)",
    shadowOpacity: 0.01,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reminderChipGradient: {
    minHeight: 40,
    paddingLeft: 8,
    paddingRight: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderChipInner: {
    minHeight: 40,
    paddingLeft: 8,
    paddingRight: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderIconCircle: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,112,72,0.055)",
    flexShrink: 0,
  },
  reminderText: {
    flexShrink: 1,
    color: mesh.green700,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: -0.05,
    includeFontPadding: false,
    textAlignVertical: "center",
  } as any,
  reminderClearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.045)",
    shadowColor: "#064532",
    shadowOpacity: 0.006,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

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

  const idValue   = item._id ?? item.id;
  const nameValue = item.name ?? item.fullName;
  const statusRecord = asRecord(item.status);
  const statusValue  = item.statusId ?? statusRecord?._id ?? statusRecord?.id ?? item.status;

  if (typeof idValue !== "string" || typeof nameValue !== "string") return null;

  return {
    id:     idValue,
    name:   nameValue,
    status: typeof statusValue === "string" ? statusValue : undefined,
  };
}
