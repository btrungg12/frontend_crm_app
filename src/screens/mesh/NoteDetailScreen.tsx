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
  const hasTitle     = !!note?.title?.trim();

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

    const mock = mockNotes.find((item) => item.id === noteId);

    if (!active) return () => { active = false; };

    if (!mock) {
      setNote(null);
      setError("Note not found.");
      setLoading(false);
      return () => { active = false; };
    }

    setNote(normalizeMockNote(mock));
    setLoading(false);

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
    // TODO: call delete note API
    setConfirmDeleteOpen(false);
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

  return (
    <MeshScreen style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.topBar}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} />
          <HeaderCircleBtn icon="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
        </View>

        {hasTitle ? (
          <>
            <Text style={styles.title}>{note.title}</Text>
            <NoteMetaRow contactName={contactName} createdLabel={createdLabel} />
            {reminder ? <ReminderChip reminder={reminder} /> : null}
          </>
        ) : (
          <View style={styles.noTitleMetaWrap}>
            <NoteMetaRow contactName={contactName} createdLabel={createdLabel} />
            {reminder ? <ReminderChip reminder={reminder} /> : null}
          </View>
        )}
      </View>

      {/* ── Scrollable content ── */}
      <MeshScroll style={styles.scroll} bottom={48}>
        <View style={[styles.contentCard, !hasTitle && styles.contentCardNoTitle]}>
          <Text style={styles.contentText}>{content}</Text>
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
    marginBottom: 36,
  },

  title: {
    color: mesh.green800,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  noTitleMetaWrap: {
    marginTop: 20,
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

  // Content
  scroll: {
    paddingHorizontal: 24,
  },

  contentCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.08)",
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#064532",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },

  contentCardNoTitle: {
    marginTop: 14,
  },

  contentText: {
    color: mesh.ink900,
    fontSize: 16,
    lineHeight: 27,
  },

  // Reminder
  reminderChip: {
    alignSelf: "flex-start",
    marginTop: 12,
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
