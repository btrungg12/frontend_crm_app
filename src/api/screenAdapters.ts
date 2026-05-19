import type { Contact, ContactSpecialDay, Note, Status, Upcoming } from "../mesh/meshData";

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(value: unknown) {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "--";

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function noteSection(value: unknown): Note["section"] {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "thisweek";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startValue = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (startValue === startToday) return "today";
  if (startValue === startToday - 24 * 60 * 60 * 1000) return "yesterday";

  return "thisweek";
}

export function extractArray(response: unknown, key: string) {
  if (Array.isArray(response)) return response;

  const root = asRecord(response);
  if (!root) return [];

  if (Array.isArray(root[key])) return root[key];
  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.items)) return root.items;

  const data = asRecord(root.data);
  if (data && Array.isArray(data[key])) return data[key];
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;

  return [];
}

export function normalizeApiContact(value: unknown): Contact | null {
  const item = asRecord(value);
  if (!item) return null;

  const id = text(item._id ?? item.id);
  const name = text(item.name ?? item.fullName);
  if (!id || !name) return null;

  const statusRecord = asRecord(item.status);
  const status = text(item.statusId ?? statusRecord?._id ?? statusRecord?.id ?? item.status, "st-other");

  const birthdayRaw = item.birthday;
  const birthday = typeof birthdayRaw === "string" && birthdayRaw ? birthdayRaw : undefined;

  const rawLinks = Array.isArray(item.socialLinks) ? item.socialLinks : [];
  const socialLinks = rawLinks.filter((l): l is string => typeof l === "string" && l.trim().length > 0);

  const avatarUrl = typeof item.avatarUrl === "string" && item.avatarUrl ? item.avatarUrl : undefined;

  // Filter out meaningless default values for source
  const sourceRaw = text(item.source);
  const SOURCE_DEFAULTS = ["chưa phân loại", "chua phan loai", "unknown", "other", "none", ""];
  const source = sourceRaw && !SOURCE_DEFAULTS.includes(sourceRaw.toLowerCase().trim())
    ? sourceRaw : undefined;

  // Extract specialDays array
  const rawSpecialDays = Array.isArray(item.specialDays) ? item.specialDays : [];
  const specialDays: ContactSpecialDay[] = rawSpecialDays.flatMap((sd: unknown): ContactSpecialDay[] => {
    const r = asRecord(sd);
    if (!r) return [];
    const sdId   = text(r._id ?? r.id ?? String(Math.random()));
    const sdName = text(r.name ?? r.occasion ?? r.title, "Special day");
    const sdDate = typeof r.date === "string" ? r.date : "";
    if (!sdDate) return [];
    return [{ id: sdId, name: sdName, date: sdDate, repeatYearly: r.repeatYearly ? true : undefined }];
  });

  return {
    address: text(item.address) || undefined,
    avatarUrl,
    birthday,
    email: text(item.email) || undefined,
    id,
    initials: initials(name),
    interactions: numberValue(item.interactions ?? item.interactionCount),
    name,
    noteCount: numberValue(item.noteCount ?? item.notesCount),
    phone: text(item.phone) || undefined,
    reminderCount: numberValue(item.reminderCount ?? item.remindersCount),
    social: text(item.social) || undefined,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    source,
    specialCount: numberValue(item.specialCount ?? item.specialDaysCount ?? specialDays.length),
    specialDays: specialDays.length > 0 ? specialDays : undefined,
    status
  };
}

export function normalizeApiNote(value: unknown): Note | null {
  const item = asRecord(value);
  if (!item) return null;

  const id = text(item._id ?? item.id);
  const content = text(item.content ?? item.body);
  if (!id || !content) return null;

  const contactRecord = asRecord(item.contact ?? item.person);
  const contact = text(item.contactId ?? contactRecord?._id ?? contactRecord?.id);
  if (!contact) return null;

  const title = text(item.title, content.split("\n")[0] || "Note");
  const createdAt = item.interactionDate ?? item.createdAt ?? item.updatedAt;
  const reminderRecord = asRecord(item.reminder);
  const hasReminder = Boolean(reminderRecord?.enabled ?? item.reminderEnabled);

  return {
    bookmark: Boolean(item.bookmark ?? item.isBookmarked),
    contact,
    content,
    contentEn: content,
    hasNew: Boolean(item.hasNew),
    id,
    kind: hasReminder ? "reminder" : undefined,
    preview: content.split("\n")[0] || content,
    reminder: hasReminder ? formatTime(reminderRecord?.remindAt ?? item.remindAt) : undefined,
    section: noteSection(createdAt),
    time: formatTime(createdAt),
    title
  };
}

export function normalizeApiStatus(value: unknown): Status | null {
  const item = asRecord(value);
  if (!item) return null;

  const id = text(item._id ?? item.id);
  const name = text(item.name);
  if (!id || !name) return null;

  return {
    color: text(item.color, "#2F8F5F"),
    count: numberValue(item.count ?? item.contactCount),
    desc: text(item.desc ?? item.description, name),
    icon: text(item.icon, "people"),
    id,
    name
  };
}

export function normalizeApiUpcoming(value: unknown): Upcoming | null {
  const item = asRecord(value);
  if (!item) return null;

  const id = text(item._id ?? item.id ?? item.relatedId);
  if (!id) return null;

  const rawKind = text(item.kind ?? item.type).toLowerCase();
  const rawTitle = text(item.title ?? item.name ?? item.content);
  const sub = text(item.sub ?? item.subtitle ?? item.dateLabel, "");
  const birthdayText = `${rawKind} ${rawTitle} ${sub} ${text(item.tag)}`.toLowerCase();
  const isBirthday =
    birthdayText.includes("birthday") ||
    birthdayText.includes("sinh nhật") ||
    birthdayText.includes("bday");
  const kind: Upcoming["kind"] = isBirthday ? "birthday" : rawKind.includes("special") ? "special" : "reminder";
  const relatedType = text(item.relatedType ?? item.onModel ?? item.targetType).toLowerCase();
  const targetIsNote = relatedType.includes("note");
  const noteRecord = asRecord(item.note);
  const contactRecord = asRecord(item.contact ?? item.person);
  const relatedId = text(item.relatedId);
  const targetId = text(item.targetId);
  const noteId = kind === "reminder"
    ? text(
      item.noteId ??
      noteRecord?._id ??
      noteRecord?.id ??
      item.relatedNoteId ??
      (targetIsNote ? item.relatedId : undefined) ??
      (targetIsNote ? item.targetId : undefined)
    )
    : "";
  const contactId = text(item.contactId ?? contactRecord?._id ?? contactRecord?.id);
  const title = text(rawTitle, kind === "reminder" ? "Reminder" : kind === "birthday" ? "Birthday" : "Special day");
  const remindAt = item.remindAt ?? item.date ?? item.dueAt ?? item.createdAt;
  const tag = text(item.tag ?? item.relativeTime, formatTime(remindAt));

  return {
    contactId: contactId || undefined,
    icon: kind === "birthday" ? "gift" : kind === "special" ? "gift" : "call",
    id,
    kind,
    noteId: noteId || undefined,
    relatedId: relatedId || targetId || undefined,
    sub,
    subEn: sub,
    tag,
    tagEn: tag,
    time: formatTime(remindAt),
    title,
    titleEn: title
  };
}
