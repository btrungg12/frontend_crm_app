import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ConfirmDialog,
  HeaderCircleBtn,
  MeshScreen,
  MeshScroll,
  NavFn,
  TFn,
} from "../../mesh/MeshComponents";
import { deleteNote, getNote, getNotes } from "../../api/noteApi";
import { extractArray } from "../../api/screenAdapters";
import { contactById, Lang, notes as mockNotes } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  noteId?: string;
  variant?: "A" | "B"; // kept for AppShell compatibility; only one layout used
};

type ApiNoteDetail = {
  contactId?: string;
  contactName?: string;
  content: string;
  createdLabel?: string;
  id: string;
  reminder?: string;
  title?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitNoteContent(content: string): { firstLine: string; rest: string } {
  const normalized = content.trim();
  const lines = normalized.split(/\r?\n/);

  const firstIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstIndex === -1) {
    return { firstLine: "", rest: "" };
  }

  const firstLine = lines[firstIndex].trim();

  const before = lines.slice(0, firstIndex);
  const after = lines.slice(firstIndex + 1);

  const rest = [...before, ...after].join("\n").trim();

  return { firstLine, rest };
}

function makeCreatedLabel(note: (typeof mockNotes)[number]): string {
  const prefix: Record<string, string> = {
    today:     "Tạo hôm nay",
    yesterday: "Tạo hôm qua",
    thisweek:  "Tạo tuần này",
  };
  const base = prefix[note.section] ?? "Đã tạo";
  const time = (note.timeEn || note.time || "").replace(/^[A-Za-z]+,\s*/, "");
  return time ? `${base}, ${time}` : base;
}

function normalizeMockNote(note: (typeof mockNotes)[number]): ApiNoteDetail {
  const contact    = contactById(note.contact ?? undefined);
  const rawTitle   = note.title?.trim() || null;
  // Treat as untitled if the title is just the contact's name (old data pattern)
  const isFakeTitle = rawTitle !== null && contact?.name === rawTitle;
  return {
    contactId:    note.contact ?? undefined,
    contactName:  contact?.name,
    content:      note.contentEn || note.preview,
    createdLabel: makeCreatedLabel(note),
    id:           note.id,
    reminder:     note.reminder || undefined,
    title:        isFakeTitle ? null : rawTitle,
  };
}

// ─── API response normalizer ──────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function formatDateLabel(iso: string | null | undefined): string {
  if (!iso) return "Đã tạo";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Đã tạo";
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const months = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;
  if (diffDays === 0) return `Tạo hôm nay, ${timeStr}`;
  if (diffDays === 1) return `Tạo hôm qua, ${timeStr}`;
  if (diffDays < 7)  return `Tạo tuần này, ${days[d.getDay()]} ${timeStr}`;
  return `Đã tạo, ${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatReminderLabel(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const months = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} · ${hh}:${mm}`;
}

function normalizeApiNote(response: unknown): ApiNoteDetail | null {
  // Unwrap common envelope shapes: { data: { note } } / { data: {...} } / raw object
  const root = asRecord(response);
  if (!root) return null;
  const dataObj = asRecord(root.data) ?? root;
  const noteObj = asRecord(dataObj.note) ?? dataObj;

  const id = typeof noteObj._id === "string" ? noteObj._id
            : typeof noteObj.id  === "string" ? noteObj.id
            : null;
  const content = typeof noteObj.content === "string" ? noteObj.content
                : typeof noteObj.body    === "string" ? noteObj.body
                : null;
  if (!id || !content) return null;

  // Contact — may be embedded object or just an id string
  const contactObj = asRecord(noteObj.contact ?? noteObj.person);
  const contactId = typeof noteObj.contactId === "string" ? noteObj.contactId
                  : typeof contactObj?._id   === "string" ? String(contactObj._id)
                  : typeof contactObj?.id    === "string" ? String(contactObj.id)
                  : undefined;
  const contactName = typeof contactObj?.name     === "string" ? String(contactObj.name)
                    : typeof contactObj?.fullName  === "string" ? String(contactObj.fullName)
                    : undefined;

  const title = typeof noteObj.title === "string" && noteObj.title.trim()
              ? noteObj.title.trim() : null;

  const createdLabel = formatDateLabel(
    typeof noteObj.interactionDate === "string" ? noteObj.interactionDate
    : typeof noteObj.createdAt     === "string" ? noteObj.createdAt
    : null
  );

  // Reminder — backend returns { reminder: { enabled, remindAt } }
  const reminderObj = asRecord(noteObj.reminder);
  const reminderEnabled = Boolean(reminderObj?.enabled ?? noteObj.reminderEnabled);
  const remindAt = reminderEnabled
    ? (typeof reminderObj?.remindAt === "string" ? String(reminderObj.remindAt)
       : typeof noteObj.remindAt    === "string" ? String(noteObj.remindAt)
       : null)
    : null;

  return {
    contactId,
    contactName,
    content,
    createdLabel,
    id,
    reminder: formatReminderLabel(remindAt),
    title,
  };
}

/** True for mock dev IDs like "n1", "n2"; false for real MongoDB ObjectIds */
function isMockNoteId(id: string) {
  return /^n\d+$/.test(id);
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── NoteMetaRow ──────────────────────────────────────────────────────────────

function NoteMetaRow({
  contactName,
  createdLabel,
}: {
  contactName?: string;
  createdLabel: string;
}) {
  const displayName = contactName || "Unknown person";
  const initials    = getInitials(displayName);
  const isLongName  = displayName.length > 20;

  return (
    <View style={styles.noteMetaRow}>
      <View style={styles.avatarMini}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {isLongName ? (
        <View style={styles.metaStack}>
          <Text style={styles.contactName} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>
          <Text style={styles.createdText}>{createdLabel}</Text>
        </View>
      ) : (
        <View style={styles.metaInline}>
          <Text style={styles.contactName} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.createdText}>{createdLabel}</Text>
        </View>
      )}
    </View>
  );
}

// ─── ReminderChip ─────────────────────────────────────────────────────────────

function ReminderChip({ reminder }: { reminder: string }) {
  return (
    <Pressable
      style={styles.reminderChip}
      onPress={() => {
        // TODO: edit reminder later
      }}
    >
      <Ionicons name="notifications-outline" size={14} color={mesh.green700} />
      <Text style={styles.reminderChipText} numberOfLines={1} ellipsizeMode="tail">
        {reminder}
      </Text>
    </Pressable>
  );
}

// ─── NoteActionMenu ───────────────────────────────────────────────────────────

function NoteActionMenu({
  visible,
  onClose,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <View style={styles.actionMenu}>
          <Pressable
            style={styles.menuItem}
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={18} color={mesh.green700} />
            <Text style={styles.menuItemText}>Sửa note</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={18} color={mesh.pink} />
            <Text style={[styles.menuItemText, { color: mesh.pink }]}>Xóa note</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function NoteDetailScreen({ t, lang: _lang, nav, noteId }: Props) {
  const insets = useSafeAreaInsets();

  const [note,              setNote]              = useState<ApiNoteDetail | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState("");
  const [menuOpen,          setMenuOpen]          = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const contactName  = note?.contactName;
  const content      = note?.content ?? "";
  const reminder     = note?.reminder;
  const createdLabel = note?.createdLabel ?? "Tạo hôm nay";

  useEffect(() => {
    let active = true;

    if (!noteId) {
      setNote(null);
      setError("Missing note id.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");

    // Use mock data instantly for dev IDs (n1-n4); hit the real API for all others.
    if (isMockNoteId(noteId)) {
      const mock = mockNotes.find((item) => item.id === noteId);
      if (mock) {
        setNote(normalizeMockNote(mock));
      } else {
        setError("Note not found.");
      }
      setLoading(false);
      return () => { active = false; };
    }

    // Try GET /api/notes/:id first; if backend doesn't have that route yet
    // (returns HTML 404 "Cannot GET ..."), fall back to GET /api/notes + find by id.
    getNote(noteId)
      .then((response) => {
        if (!active) return;
        const normalized = normalizeApiNote(response);
        if (!normalized) throw new Error("not_found");
        setNote(normalized);
      })
      .catch(async (err) => {
        if (!active) return;

        // Detect "route not implemented" — backend returns HTML, which apiRequest
        // likely throws as a non-JSON / generic error (not a clean HTTP status).
        const msg = err instanceof Error ? err.message : String(err);
        const isHtml = msg.includes("<!DOCTYPE") || msg.includes("<html") || msg.includes("Cannot GET");
        const status = (err as { status?: number })?.status;

        if (isHtml || status === 404) {
          // Fallback: load full list and find by id
          try {
            const listResponse = await getNotes();
            const allRaw = extractArray(listResponse, "notes");
            const found = allRaw.find((raw: any) => (raw._id ?? raw.id) === noteId);
            if (!active) return;
            if (found) {
              const normalized = normalizeApiNote(found);
              if (normalized) { setNote(normalized); return; }
            }
            setError("Note not found.");
          } catch {
            if (active) setError("Cannot load note.");
          }
        } else if (msg === "not_found") {
          setError("Note not found.");
        } else {
          setError(msg || "Failed to load note.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [noteId]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleEditNote() {
    setMenuOpen(false);
    if (note) nav("editNote", { id: note.id });
  }

  function handleAskDelete() {
    setMenuOpen(false);
    setConfirmDeleteOpen(true);
  }

  function handleDeleteNote() {
    setConfirmDeleteOpen(false);
    if (!note) { nav("notes"); return; }

    // Fire-and-forget: navigate away immediately; delete runs in background.
    // Mock notes don't have a real API record to delete.
    if (!isMockNoteId(note.id)) {
      deleteNote(note.id).catch((err) => {
        console.warn("Delete note failed:", err?.message ?? err);
      });
    }

    nav("notes");
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return <NoteStateScreen nav={nav} title={t("notes")} message="Loading note..." loading />;
  }

  if (error || !note) {
    return <NoteStateScreen nav={nav} title={t("notes")} message={error || "Note not found."} error />;
  }

  // ── Main render ───────────────────────────────────────────────────────────

  const { firstLine, rest } = splitNoteContent(content);

  return (
    <MeshScreen style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.topBar}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} />
          <HeaderCircleBtn icon="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <MeshScroll style={styles.scroll} bottom={48}>
        {/* ── Metadata ── */}
        <View style={styles.metadataSection}>
          <NoteMetaRow contactName={contactName} createdLabel={createdLabel} />
        </View>

        {/* ── Reminder chip ── */}
        {reminder && <ReminderChip reminder={reminder} />}

        {/* ── Note content card ── */}
        <View style={styles.noteCanvas}>
          {firstLine && <Text style={styles.noteFirstLine}>{firstLine}</Text>}
          {rest && <Text style={[styles.noteBody, firstLine && { marginTop: 14 }]}>{rest}</Text>}
        </View>
      </MeshScroll>

      {/* ── Menu + confirm ── */}
      <NoteActionMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={handleEditNote}
        onDelete={handleAskDelete}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteNote}
        title={t("deleteNoteTitle")}
        desc={t("deleteNoteDesc")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
      />
    </MeshScreen>
  );
}

// ─── State screens (loading / error) ──────────────────────────────────────────

function NoteStateScreen({
  error = false,
  loading = false,
  message,
  nav,
  title,
}: {
  error?: boolean;
  loading?: boolean;
  message: string;
  nav: NavFn;
  title: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <MeshScreen style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.topBar}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} />
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {loading ? <ActivityIndicator color={mesh.green700} /> : null}
        <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: 14, lineHeight: 21, marginTop: 12, textAlign: "center" }}>{message}</Text>
        <Pressable
          onPress={() => nav("notes")}
          style={{ marginTop: 20, borderRadius: 999, backgroundColor: mesh.green700, paddingHorizontal: 18, paddingVertical: 11 }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Back to Notes</Text>
        </Pressable>
      </View>
    </MeshScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFCF9",
  },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    color: mesh.green800,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  // NoteMetaRow
  noteMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },

  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,69,50,0.12)",
    flexShrink: 0,
  },

  avatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: mesh.green700,
  },

  metaInline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  metaStack: {
    flex: 1,
    minWidth: 0,
  },

  contactName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    color: mesh.ink900,
  },

  metaDot: {
    marginHorizontal: 6,
    color: mesh.ink400,
    fontSize: 13,
  },

  createdText: {
    fontSize: 13,
    color: mesh.ink500,
    flexShrink: 0,
  },

  // Metadata section
  metadataSection: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
  },

  // Content
  scroll: {
    paddingHorizontal: 20,
  },

  // Note canvas
  noteCanvas: {
    marginTop: 8,
    marginHorizontal: 0,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.08)",
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: "#064532",
    shadowOpacity: 0.035,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  noteFirstLine: {
    color: mesh.ink900,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.25,
  },

  noteBody: {
    color: mesh.ink900,
    fontSize: 19,
    lineHeight: 31,
    fontWeight: "400",
  },

  // Reminder
  reminderChip: {
    alignSelf: "flex-start",
    marginTop: 0,
    marginHorizontal: 0,
    marginBottom: 12,
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(31,112,72,0.045)",
    borderWidth: 1,
    borderColor: "rgba(31,112,72,0.10)",
  },

  reminderChipText: {
    color: mesh.green700,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.05,
  },

  // Action menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  actionMenu: {
    position: "absolute",
    top: 96,
    right: 24,
    width: 178,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.08)",
    shadowColor: "#064532",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: "hidden",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  menuItemText: {
    color: mesh.ink900,
    fontSize: 14,
    fontWeight: "700",
  },

  menuDivider: {
    height: 1,
    backgroundColor: "rgba(6,69,50,0.08)",
  },
});
