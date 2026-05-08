export type TabKey = "home" | "contacts" | "notes" | "status";

export type RelationshipStatus = {
  id: string;
  name: string;
  color: string;
};

export type Contact = {
  id: string;
  name: string;
  initials: string;
  statusId?: string;
  source?: string;
  phone?: string;
  email?: string;
  address?: string;
  social?: string;
  noteCount: number;
  reminderCount: number;
  specialCount: number;
};

export type Note = {
  id: string;
  contactId: string;
  title: string;
  content: string;
  createdAt: string;
  reminderAt?: string;
};

export type UpcomingItem = {
  id: string;
  type: "reminder" | "special";
  title: string;
  subtitle: string;
  time: string;
  dueLabel: string;
};
