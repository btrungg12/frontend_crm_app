import { apiRequest } from "./client";

type NoteQuery = {
  contactId?: string;
  search?: string;
};

export type CreateNotePayload = {
  /** ID of an existing contact from the contacts list */
  contactId?: string;
  /** Name typed by the user when no existing contact was selected */
  contactName?: string;
  /** If true, backend will create contact if it doesn't exist */
  createContactIfMissing?: boolean;
  /** The note content (required) */
  content: string;
  /** The note title (optional, derived from first line) */
  title?: string;
  /** The interaction date (optional) */
  interactionDate?: string;
};

export type UpdateNotePayload = {
  title?: string;
  content?: string;
};

export type UpdateNoteReminderPayload = {
  enabled: boolean;
  remindAt?: string | null;
  content?: string;
};

type SubmitCreateNotePayload = {
  /** ID of an existing contact from the contacts list */
  contactId?: string;
  /** Name typed by the user when no existing contact was selected */
  newContactName?: string;
  content: string;
  interactionDate?: string;
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

export async function getNote(noteId: string) {
  return await apiRequest(`/notes/${noteId}`, {
    method: "GET",
  });
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

export async function updateNoteReminder(noteId: string, payload: UpdateNoteReminderPayload) {
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
  // Build the note body according to the API spec:
  //   POST /api/notes
  //   Required: content + (contactId  OR  contactName + createContactIfMissing: true)
  //   Optional: title, interactionDate
  const noteBody: Record<string, unknown> = {
    content: payload.content,
    interactionDate: payload.interactionDate,
    title: payload.title,
  };

  if (payload.contactId) {
    noteBody.contactId = payload.contactId;
  } else if (payload.newContactName?.trim()) {
    noteBody.contactName = payload.newContactName.trim();
    noteBody.createContactIfMissing = true;
  } else {
    throw new Error("Note requires a contact");
  }

  const noteResponse = unwrapData(
    await createNote(noteBody)
  ) as Record<string, unknown>;

  const noteId = noteResponse._id ?? noteResponse.id;

  // Reminder is handled by a separate endpoint after the note is created
  if (payload.reminderEnabled && payload.remindAt && typeof noteId === "string") {
    await upsertNoteReminder(noteId, {
      enabled: true,
      remindAt: payload.remindAt,
    });
  }

  return noteResponse;
}
