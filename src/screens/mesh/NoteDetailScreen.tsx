import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { deleteNote, getNoteById, getNotes } from "../../api/noteApi";
import { ActionTile } from "./parts/ActionTile";
import { Avatar, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshHeader, MeshScreen, MeshScroll, NavFn, StatusChip, TFn, TipCard } from "../../mesh/MeshComponents";
import { contactById, Lang } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  noteId?: string;
  variant?: "A" | "B";
};

type ApiNoteDetail = {
  contactId?: string;
  contactName?: string;
  contactStatus?: string;
  content: string;
  id: string;
  reminder?: string;
  title: string;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function unwrapNoteResponse(response: unknown) {
  const root = asRecord(response);
  const data = asRecord(root?.data);
  return asRecord(data?.note) ?? asRecord(root?.note) ?? data ?? root;
}

function unwrapNotesResponse(response: unknown) {
  if (Array.isArray(response)) return response;

  const root = asRecord(response);
  const data = root?.data;

  if (Array.isArray(data)) return data;

  const dataRecord = asRecord(data);
  if (Array.isArray(dataRecord?.notes)) return dataRecord.notes;
  if (Array.isArray(dataRecord?.items)) return dataRecord.items;
  if (Array.isArray(dataRecord?.results)) return dataRecord.results;
  if (Array.isArray(root?.notes)) return root.notes;
  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(root?.results)) return root.results;

  return [];
}

function formatReminder(value: unknown) {
  const raw = text(value);
  if (!raw) return "";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const day = date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  return `${time}, ${day}`;
}

function normalizeNoteDetail(response: unknown): ApiNoteDetail | null {
  const item = unwrapNoteResponse(response);
  if (!item) return null;

  const id = text(item._id ?? item.id);
  const content = text(item.content ?? item.body);
  if (!id || !content) return null;

  const contact = asRecord(item.contact ?? item.person);
  const contactId = text(item.contactId ?? contact?._id ?? contact?.id);
  const status = asRecord(contact?.status);
  const reminder = asRecord(item.reminder);
  const reminderValue = reminder?.remindAt ?? item.remindAt;
  const title = text(item.title, content.split("\n")[0] || "Untitled note");

  return {
    contactId: contactId || undefined,
    contactName: text(contact?.name ?? contact?.fullName) || undefined,
    contactStatus: text(item.contactStatus ?? item.statusId ?? contact?.statusId ?? status?._id ?? status?.id ?? contact?.status) || undefined,
    content,
    id,
    reminder: formatReminder(reminderValue) || undefined,
    title
  };
}

async function loadNoteFromApi(noteId: string) {
  try {
    const response = await getNoteById(noteId);
    return normalizeNoteDetail(response);
  } catch {
    const response = await getNotes();
    const list = unwrapNotesResponse(response);
    const match = list.find((item) => {
      const record = asRecord(item);
      return text(record?._id ?? record?.id) === noteId;
    });

    return match ? normalizeNoteDetail(match) : null;
  }
}

function cleanErrorMessage(error: unknown) {
  if (!(error instanceof Error) || !error.message.trim()) {
    return "Cannot load note from API.";
  }

  if (error.message.includes("<!DOCTYPE") || error.message.includes("Cannot GET")) {
    return "Backend does not support note detail endpoint, and this note was not found in the notes list.";
  }

  return error.message;
}

export function NoteDetailScreen({ t, lang, nav, noteId, variant = "A" }: Props) {
  const [note, setNote] = useState<ApiNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const contactFallback = note?.contactId ? contactById(note.contactId) : undefined;
  const contactName = note?.contactName || contactFallback?.name;
  const contactStatus = note?.contactStatus || contactFallback?.status;
  const content = note?.content || "";
  const reminder = note?.reminder;

  useEffect(() => {
    let active = true;

    async function loadNote() {
      if (!noteId) {
        setNote(null);
        setError("Missing note id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const normalized = await loadNoteFromApi(noteId);

        if (!active) return;

        if (!normalized) {
          setNote(null);
          setError("Note not found from API.");
          return;
        }

        setNote(normalized);
      } catch (err) {
        if (!active) return;
        setNote(null);
        setError(cleanErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNote();

    return () => {
      active = false;
    };
  }, [noteId]);

  async function handleDeleteNote() {
    if (deleting) return;

    if (!noteId) {
      setDeleteError("Missing note id.");
      setConfirm(false);
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");
      await deleteNote(noteId);
      setConfirm(false);
      nav("notes");
    } catch (err) {
      setConfirm(false);
      setDeleteError(err instanceof Error && err.message ? err.message : "Cannot delete note.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <NoteStateScreen nav={nav} title={t("notes")} message="Loading note from API..." loading />
    );
  }

  if (error || !note) {
    return (
      <NoteStateScreen nav={nav} title={t("notes")} message={error || "Note not found from API."} error />
    );
  }

  if (variant === "B" && contactName) {
    return (
      <MeshScreen>
        <MeshHeader>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4 }}>
            <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", flex: 1, textAlign: "center", paddingRight: 40 }}>{t("notes")}</Text>
            <HeaderCircleBtn icon="ellipsis-horizontal" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 16 }}>
            <Avatar name={contactName} size={68} ring />
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 19, fontWeight: "900" }}>{contactName}</Text>
              {contactStatus ? <View style={{ marginTop: 4 }}><StatusChip statusId={contactStatus} /></View> : null}
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
            <ReminderRow reminder={reminder || "No reminder"} t={t} />
          </MeshCard>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
            <ActionTile icon="create-outline" label={t("editNote")} color={mesh.green700} onPress={() => nav("editNote", { id: note.id })} />
            <ActionTile icon="person-outline" label={t("changePerson")} color={mesh.blue} />
            <ActionTile icon="notifications-outline" label={t("editReminder")} color={mesh.orange} />
            <ActionTile icon="trash-outline" label={t("deleteNote")} color={mesh.pink} onPress={() => setConfirm(true)} />
          </View>
          {deleteError ? <DeleteError text={deleteError} /> : null}
          <View style={{ marginTop: 18 }}>
            <TipCard>{t("noteDetailHint")}</TipCard>
          </View>
        </MeshScroll>

        <ConfirmDialog open={confirm} onClose={() => (deleting ? undefined : setConfirm(false))} onConfirm={handleDeleteNote} title={t("deleteNoteTitle")} desc={deleting ? "Deleting note..." : t("deleteNoteDesc")} confirmLabel={deleting ? "Deleting..." : t("delete")} cancelLabel={t("cancel")} />
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
          {contactName ? (
            <Pressable style={{ alignSelf: "flex-start", marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="person-outline" size={14} color={mesh.green800} />
              <Text style={{ color: mesh.green800, fontSize: 13, fontWeight: "800" }}>{contactName}</Text>
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
            <ReminderRow reminder={reminder || "No reminder"} t={t} compact />
          </View>
        </View>
      </MeshScroll>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 4, backgroundColor: "rgba(255,255,255,0.96)", borderTopWidth: 1, borderColor: mesh.line, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 28 }}>
        <ActionTile icon="create-outline" label={t("editNote")} color={mesh.green700} onPress={() => nav("editNote", { id: note.id })} />
        <ActionTile icon="person-outline" label={t("changePerson")} color={mesh.blue} />
        <ActionTile icon="notifications-outline" label={t("editReminder")} color={mesh.orange} />
        <ActionTile icon="trash-outline" label={t("deleteNote")} color={mesh.pink} onPress={() => setConfirm(true)} />
      </View>
      {deleteError ? <View style={{ position: "absolute", left: 16, right: 16, bottom: 118 }}><DeleteError text={deleteError} /></View> : null}

      <ConfirmDialog open={confirm} onClose={() => (deleting ? undefined : setConfirm(false))} onConfirm={handleDeleteNote} title={t("deleteNoteTitle")} desc={deleting ? "Deleting note..." : t("deleteNoteDesc")} confirmLabel={deleting ? "Deleting..." : t("delete")} cancelLabel={t("cancel")} />
    </MeshScreen>
  );
}

function DeleteError({ text }: { text: string }) {
  return (
    <View style={{ borderRadius: 12, backgroundColor: "rgba(217,87,122,0.10)", marginTop: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
      <Text style={{ color: mesh.pink, fontSize: 12, lineHeight: 17 }}>{text}</Text>
    </View>
  );
}

function NoteStateScreen({ error = false, loading = false, message, nav, title }: { error?: boolean; loading?: boolean; message: string; nav: NavFn; title: string }) {
  return (
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("notes")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 40, color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>{title}</Text>
        </View>
      </MeshHeader>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {loading ? <ActivityIndicator color={mesh.green700} /> : null}
        <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: 14, lineHeight: 21, marginTop: 12, textAlign: "center" }}>{message}</Text>
        <Pressable onPress={() => nav("notes")} style={{ marginTop: 20, borderRadius: 999, backgroundColor: mesh.green700, paddingHorizontal: 18, paddingVertical: 11 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Back to Notes</Text>
        </Pressable>
      </View>
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
