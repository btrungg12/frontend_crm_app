import { apiRequest } from "./client";
import { quickCreateContact } from "./contactApi";

type NoteQuery = {
  contactId?: string;
  search?: string;
};

type SubmitCreateNotePayload = {
  contactId?: string;
  content: string;
  interactionDate?: string;
  newContactName?: string;
  remindAt?: string;
  reminderEnabled?: boolean;
  title?: string;
};

function unwrapData<T>(response: T): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }

  return response;
}

export async function getNotes(params: NoteQuery = {}) {
  return await apiRequest("/notes", {
    query: {
      contactId: params.contactId,
      search: params.search
    }
  });
}

export async function getNoteById(noteId: string) {
  return await apiRequest(`/notes/${noteId}`);
}

export async function createNote(payload: Record<string, unknown>) {
  return await apiRequest("/notes", {
    body: payload,
    method: "POST"
  });
}

export async function updateNote(noteId: string, payload: Record<string, unknown>) {
  return await apiRequest(`/notes/${noteId}`, {
    body: payload,
    method: "PATCH"
  });
}

export async function deleteNote(noteId: string) {
  return await apiRequest(`/notes/${noteId}`, {
    method: "DELETE"
  });
}

export async function upsertNoteReminder(noteId: string, payload: Record<string, unknown>) {
  return await apiRequest(`/notes/${noteId}/reminder`, {
    body: payload,
    method: "PUT"
  });
}

export async function deleteNoteReminder(noteId: string) {
  return await apiRequest(`/notes/${noteId}/reminder`, {
    method: "DELETE"
  });
}

export async function submitCreateNote(payload: SubmitCreateNotePayload) {
  let contactId = payload.contactId;

  if (!contactId && payload.newContactName?.trim()) {
    const contactResponse = unwrapData(await quickCreateContact(payload.newContactName.trim())) as Record<string, unknown>;
    const createdContactId = contactResponse._id ?? contactResponse.id;
    if (typeof createdContactId === "string") {
      contactId = createdContactId;
    }
  }

  if (!contactId) {
    throw new Error("Note requires a contact");
  }

  const noteResponse = unwrapData(
    await createNote({
      contactId,
      content: payload.content,
      interactionDate: payload.interactionDate,
      title: payload.title
    })
  ) as Record<string, unknown>;

  const noteId = noteResponse._id ?? noteResponse.id;

  if (payload.reminderEnabled && payload.remindAt && typeof noteId === "string") {
    await upsertNoteReminder(noteId, {
      enabled: true,
      remindAt: payload.remindAt
    });
  }

  return noteResponse;
}
