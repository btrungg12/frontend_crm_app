import { Contact, Note, RelationshipStatus, UpcomingItem } from "../types";

export const statuses: RelationshipStatus[] = [
  { id: "close", name: "Close Friend", color: "#20865C" },
  { id: "work", name: "Work", color: "#1E88C8" },
  { id: "family", name: "Family", color: "#A56DDE" },
  { id: "important", name: "Important", color: "#D19400" }
];

export const contacts: Contact[] = [
  {
    id: "c1",
    name: "Nguyễn Văn An",
    initials: "VA",
    statusId: "close",
    source: "Work",
    phone: "+84 912 345 678",
    email: "an.nguyen@gmail.com",
    address: "Quận 1, TP.HCM",
    social: "@an.nguyen",
    noteCount: 12,
    reminderCount: 3,
    specialCount: 2
  },
  {
    id: "c2",
    name: "Trần Mai Anh",
    initials: "MA",
    statusId: "work",
    source: "Work",
    phone: "+84 905 123 456",
    email: "maianh@gmail.com",
    noteCount: 5,
    reminderCount: 1,
    specialCount: 1
  },
  {
    id: "c3",
    name: "Lê Anh Dũng",
    initials: "AD",
    statusId: "close",
    phone: "+84 988 765 432",
    email: "dung.le@gmail.com",
    noteCount: 8,
    reminderCount: 2,
    specialCount: 1
  },
  {
    id: "c4",
    name: "Trần Minh",
    initials: "TM",
    statusId: "work",
    noteCount: 2,
    reminderCount: 0,
    specialCount: 1
  },
  {
    id: "c5",
    name: "Hoàng Nam",
    initials: "HN",
    statusId: "important",
    noteCount: 4,
    reminderCount: 1,
    specialCount: 2
  }
];

export const notes: Note[] = [
  {
    id: "n1",
    contactId: "c1",
    title: "Gọi điện hỏi thăm công việc",
    content: "Reach out to check on An's new work today, see if any help is needed. An is leading a new project at the company, might feel some pressure.",
    createdAt: "Today",
    reminderAt: "18:00, Today"
  },
  {
    id: "n2",
    contactId: "c5",
    title: "Nhắc mua quà cho Nam",
    content: "Nam's birthday is this weekend. Need to prepare a gift and send it early.",
    createdAt: "Today",
    reminderAt: "09:00"
  },
  {
    id: "n3",
    contactId: "c2",
    title: "Trần Mai Anh",
    content: "Mai Anh enjoys reading and coffee on weekends.",
    createdAt: "Today",
    reminderAt: "08:30"
  },
  {
    id: "n4",
    contactId: "c1",
    title: "Ý tưởng dự án mới",
    content: "Ứng dụng giúp quản lý các mối quan hệ và những ngày quan trọng.",
    createdAt: "Yesterday"
  }
];

export const upcoming: UpcomingItem[] = [
  {
    id: "u1",
    type: "reminder",
    title: "Call An",
    subtitle: "Today",
    time: "18:00",
    dueLabel: "In 2 hours"
  },
  {
    id: "u2",
    type: "special",
    title: "Minh's birthday",
    subtitle: "Tomorrow",
    time: "-",
    dueLabel: "Tomorrow"
  },
  {
    id: "u3",
    type: "special",
    title: "2-year anniversary",
    subtitle: "22/05",
    time: "-",
    dueLabel: "In 2 days"
  },
  {
    id: "u4",
    type: "reminder",
    title: "Buy Nam's gift",
    subtitle: "23/05",
    time: "09:00",
    dueLabel: "In 3 days"
  }
];

export function statusFor(contact: Contact) {
  return statuses.find((status) => status.id === contact.statusId);
}

export function contactFor(note: Note) {
  return contacts.find((contact) => contact.id === note.contactId);
}
