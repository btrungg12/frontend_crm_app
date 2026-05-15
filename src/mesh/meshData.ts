export type Lang = "en" | "vi";

export type Status = {
  id: string;
  name: string;
  desc: string;
  color: string;
  count: number;
  icon: string;
};

export type Contact = {
  id: string;
  name: string;
  initials: string;
  status: string;
  interactions: number;
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
  section: "today" | "yesterday" | "thisweek";
  contact: string | null;
  title: string;
  preview: string;
  content: string;
  contentEn: string;
  time: string;
  timeEn?: string;
  reminder?: string;
  reminderEn?: string;
  bookmark: boolean;
  hasNew?: boolean;
  kind?: "reminder";
};

export type Upcoming = {
  contactId?: string;
  id: string;
  icon: string;
  noteId?: string;
  relatedId?: string;
  time: string;
  title: string;
  titleEn: string;
  sub: string;
  subEn: string;
  tag: string;
  tagEn: string;
  kind: "reminder" | "special" | "birthday";
};

const STRINGS = {
  en: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    clear: "Clear",
    search: "Search",
    optional: "(optional)",
    greeting: "Hi",
    greetingSub: "What would you like to capture today?",
    upcoming: "UPCOMING",
    viewAll: "View all",
    recentContacts: "RECENT CONTACTS",
    addContact: "Add contact",
    reminderLegend: "Reminder (note with reminder)",
    specialDayLegend: "Special day",
    tabHome: "Home",
    tabContacts: "Contacts",
    tabNotes: "Notes",
    tabStatus: "Status",
    notes: "Notes",
    notesSub: "Manage what matters\nin your relationships.",
    searchNote: "Search notes...",
    fAll: "All",
    fReminder: "With reminder",
    fNoPerson: "No person",
    fRecent: "Recent",
    section_today: "TODAY",
    section_yesterday: "YESTERDAY",
    section_thisweek: "THIS WEEK",
    newNote: "New note",
    noteContent: "Content",
    noteTitle: "Title",
    pickPerson: "Choose person",
    attachToPerson: "Attach this note to someone",
    enterTitle: "Enter title...",
    whatToWrite: "What would you like to capture?",
    addReminder: "Add reminder",
    reminderHint: "Pick a date and time to be reminded",
    reminder: "Reminder",
    person: "Person",
    saveNote: "Save note",
    noteHint: "Notes about a person help you keep\nmemories and important details.",
    noteDetailHint: "Notes help you remember what matters about someone\nso you can build and nurture great relationships.",
    once: "Once",
    editNote: "Edit note",
    changePerson: "Change person",
    editReminder: "Edit\nreminder",
    deleteNote: "Delete note",
    deleteNoteTitle: "Delete this note?",
    deleteNoteDesc: "This action can't be undone.",
    interactions: "{n} interactions",
    searchResults: "Results",
    noResults: "No results",
    noResultsFor: 'No results for "{q}"',
    tryAnother: "Try a different keyword.",
    recentSearches: "RECENT SEARCHES",
    clearAll: "Clear all",
    contacts: "Contacts",
    contactsCount: "{n} contacts",
    searchContactPh: "Search by name, phone, email...",
    filter: "Filter",
    contactProfile: "Profile",
    tlAll: "All",
    tlNotes: "Notes",
    tlSpecial: "Special",
    tlReminders: "Reminders",
    reminders: "Reminders",
    specialDays: "Special days",
    timeline: "Timeline",
    addNote: "Add note",
    addSpecial: "Add event",
    editContact: "Edit contact",
    createContact: "New contact",
    addAvatar: "Add avatar",
    basicInfo: "Basic info",
    name: "Name",
    phone: "Phone",
    enterName: "Enter name",
    enterPhone: "Enter phone",
    enterEmail: "Enter email",
    relationshipInfo: "Relationship info",
    relationship: "Relationship",
    source: "How you met",
    addSpecialDay: "+ Add special day",
    addSpecialHint: "Birthday, anniversary, first meeting...",
    moreInfo: "Other",
    address: "Address",
    enterAddress: "Enter address",
    social: "Social",
    moreNote: "Notes",
    enterMoreNote: "Anything else about this person...",
    canAddLater: "You can always add more details to a contact\nafter creating it.",
    chooseStatus: "Choose status",
    deleteContact: "Delete contact",
    deleteContactTitle: "Delete contact?",
    deleteContactDesc: "All notes about this person will be unlinked from them.",
    noContactsTitle: "No contacts yet",
    noContactsDesc: "Add people who matter to start\nbuilding meaningful relationships.",
    addFirstContact: "Add first contact",
    statuses: "Status"
    ,
    status: "Status",
    statusSub: "Manage your relationships",
    searchStatus: "Search status...",
    statusList: "STATUS LIST",
    aboutStatus: "About status",
    aboutStatusDesc: "Status helps you organize relationships\nso you can manage and remember them better.",
    createStatus: "Create status",
    editStatus: "Edit status",
    statusFormSub: "Create a status to easily organize your relationships.",
    statusName: "Status name",
    enterStatusName: "Enter status name...",
    statusColor: "Color",
    statusColorDesc: "Choose a color to represent this status.",
    statusPreviewDesc: "See how your status will appear.",
    tip: "Tip",
    statusTip: "Use a short name and a recognizable color\nto make it easy to manage.",
    deleteStatus: "Delete status",
    deleteStatusTitle: "Delete this status?",
    deleteStatusDesc: "Contacts using this status will be moved to Other."
    ,
    notifications: "Notifications",
    markAllRead: "Mark all as read",
    section_earlier: "EARLIER",
    allUpcoming: "All upcoming",
    recentContactsTitle: "Recent contacts",
    filterAll: "All",
    filterReminder: "Reminders",
    filterSpecial: "Special days",
    settings: "Settings",
    editProfile: "Edit profile",
    bio: "Bio",
    tapChangeAvatar: "Tap to change avatar",
    changePassword: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    passwordHint: "Use uppercase, numbers, and 8+ characters.",
    min8: "Min 8 characters",
    languageScreen: "Language",
    languageHint: "You can change the language any time in Settings.",
    notificationPrefs: "Notifications",
    notificationTypes: "NOTIFICATION TYPES",
    other: "OTHER",
    notifAllow: "Allow notifications",
    notifAllowDesc: "Receive reminders and important updates.",
    notifReminder: "Reminders",
    notifReminderDesc: "Notes with reminder times.",
    notifSpecial: "Special days",
    notifSpecialDesc: "Birthdays, anniversaries, and important dates.",
    notifSuggestion: "Connection nudges",
    notifSuggestionDesc: "Gentle suggestions to reconnect.",
    notifQuiet: "Quiet hours",
    notifQuietDesc: "Mute notifications at night.",
    statusInUseTitle: "Status in use",
    statusInUseDesc: "{n} contacts are currently using this status. Choose what happens before deleting it.",
    moveToOther: "Move to Other",
    moveToOtherDesc: 'All contacts move to the "Other" status',
    pickAnother: "Pick another status",
    pickAnotherDesc: "Pick a different status for them",
    cancelAction: "Cancel action",
    deleteSpecialTitle: "Delete special day?",
    deleteSpecialDesc: "This special day will be removed from the contact.",
    emptyStatusTitle: "No statuses yet",
    emptyStatusDesc: "Create statuses to organize your relationships.",
    emptyNotifTitle: "No notifications",
    emptyNotifDesc: "You are all caught up for now.",
    emptyDashTitle: "Start with your first contact",
    emptyDashDesc: "Add people who matter to begin building meaningful relationships.",
    newStatus: "New status",
    goodMorning: "Good morning"
    ,
    account: "ACCOUNT",
    profile: "Profile",
    preferences: "PREFERENCES",
    language: "Language",
    darkMode: "Dark mode",
    about: "ABOUT",
    help: "Help",
    privacy: "Privacy",
    rateApp: "Rate app",
    streakDays: "Streak",
    signOut: "Sign out",
    noNotesTitle: "No notes yet",
    noNotesDesc: "Capture thoughts, reminders, and important details about people.",
    createFirstNote: "Create first note"
  },
  vi: {
    save: "Lưu",
    cancel: "Hủy",
    delete: "Xóa",
    edit: "Sửa",
    clear: "Xóa",
    search: "Tìm kiếm",
    optional: "(tùy chọn)",
    greeting: "Xin chào",
    greetingSub: "Hôm nay bạn muốn ghi lại điều gì?",
    upcoming: "SẮP TỚI",
    viewAll: "Xem tất cả",
    recentContacts: "LIÊN HỆ GẦN ĐÂY",
    addContact: "Thêm liên hệ",
    reminderLegend: "Reminder (ghi chú có nhắc nhở)",
    specialDayLegend: "Dịp đặc biệt",
    tabHome: "Trang chủ",
    tabContacts: "Danh bạ",
    tabNotes: "Ghi chú",
    tabStatus: "Trạng thái",
    notes: "Ghi chú",
    notesSub: "Quản lý những điều quan trọng\ntrong mối quan hệ của bạn.",
    searchNote: "Tìm ghi chú...",
    fAll: "Tất cả",
    fReminder: "Có nhắc",
    fNoPerson: "Không người",
    fRecent: "Gần đây",
    section_today: "HÔM NAY",
    section_yesterday: "HÔM QUA",
    section_thisweek: "TUẦN NÀY",
    newNote: "Ghi chú mới",
    noteContent: "Nội dung",
    noteTitle: "Tiêu đề",
    pickPerson: "Chọn người",
    attachToPerson: "Gắn ghi chú với một người",
    enterTitle: "Nhập tiêu đề...",
    whatToWrite: "Bạn muốn ghi lại điều gì?",
    addReminder: "Thêm nhắc nhở",
    reminderHint: "Chọn ngày và giờ để được nhắc",
    reminder: "Nhắc nhở",
    person: "Người",
    saveNote: "Lưu ghi chú",
    noteHint: "Ghi chú về một người sẽ giúp bạn lưu giữ\nnhững kỷ niệm và thông tin quan trọng.",
    noteDetailHint: "Ghi chú giúp bạn ghi lại những điều quan trọng\nvề một người để xây dựng và duy trì mối quan hệ tốt đẹp.",
    once: "Một lần",
    editNote: "Sửa ghi chú",
    changePerson: "Đổi người",
    editReminder: "Chỉnh sửa\nnhắc nhở",
    deleteNote: "Xóa ghi chú",
    deleteNoteTitle: "Xóa ghi chú?",
    deleteNoteDesc: "Hành động này không thể hoàn tác.",
    interactions: "{n} tương tác",
    searchResults: "Kết quả tìm kiếm",
    noResults: "Không tìm thấy kết quả",
    noResultsFor: 'Không có kết quả cho "{q}"',
    tryAnother: "Thử từ khóa khác.",
    recentSearches: "TÌM KIẾM GẦN ĐÂY",
    clearAll: "Xóa tất cả",
    contacts: "Danh bạ",
    contactsCount: "{n} liên hệ",
    searchContactPh: "Tìm theo tên, số điện thoại, email...",
    filter: "Bộ lọc",
    contactProfile: "Hồ sơ",
    tlAll: "Tất cả",
    tlNotes: "Ghi chú",
    tlSpecial: "Dịp đặc biệt",
    tlReminders: "Nhắc nhở",
    reminders: "Nhắc nhở",
    specialDays: "Ngày đặc biệt",
    timeline: "Dòng thời gian",
    addNote: "Thêm ghi chú",
    addSpecial: "Thêm sự kiện",
    editContact: "Sửa liên hệ",
    createContact: "Tạo liên hệ",
    addAvatar: "Thêm ảnh đại diện",
    basicInfo: "Thông tin cơ bản",
    name: "Tên",
    phone: "Số điện thoại",
    enterName: "Nhập tên",
    enterPhone: "Nhập số điện thoại",
    enterEmail: "Nhập email",
    relationshipInfo: "Thông tin mối quan hệ",
    relationship: "Mối quan hệ",
    source: "Nguồn quen biết",
    addSpecialDay: "+ Thêm ngày đặc biệt",
    addSpecialHint: "Sinh nhật, kỷ niệm, ngày gặp gỡ đầu tiên...",
    moreInfo: "Thông tin khác",
    address: "Địa chỉ",
    enterAddress: "Nhập địa chỉ",
    social: "Mạng xã hội",
    moreNote: "Ghi chú thêm",
    enterMoreNote: "Thông tin khác về người này...",
    canAddLater: "Bạn có thể bổ sung thêm thông tin cho liên hệ\nsau khi tạo.",
    chooseStatus: "Chọn trạng thái",
    deleteContact: "Xóa liên hệ",
    deleteContactTitle: "Xóa liên hệ?",
    deleteContactDesc: "Tất cả ghi chú liên quan sẽ bị mất kết nối với người này.",
    noContactsTitle: "Chưa có liên hệ nào",
    noContactsDesc: "Thêm những người quan trọng để bắt đầu\nxây dựng các mối quan hệ ý nghĩa.",
    addFirstContact: "Thêm liên hệ đầu tiên",
    statuses: "Trạng thái"
    ,
    status: "Trạng thái",
    statusSub: "Quản lý các mối quan hệ của bạn",
    searchStatus: "Tìm trạng thái...",
    statusList: "DANH SÁCH TRẠNG THÁI",
    aboutStatus: "Về trạng thái",
    aboutStatusDesc: "Trạng thái giúp bạn phân loại mối quan hệ\nđể quản lý và ghi nhớ tốt hơn.",
    createStatus: "Tạo trạng thái",
    editStatus: "Sửa trạng thái",
    statusFormSub: "Tạo trạng thái để phân loại các mối quan hệ của bạn dễ dàng hơn.",
    statusName: "Tên trạng thái",
    enterStatusName: "Nhập tên trạng thái...",
    statusColor: "Màu đại diện",
    statusColorDesc: "Chọn màu để đại diện cho trạng thái này.",
    statusPreviewDesc: "Xem trước trạng thái của bạn sẽ hiển thị như thế nào.",
    tip: "Mẹo",
    statusTip: "Đặt tên ngắn gọn và chọn màu phù hợp để dễ\ndàng nhận diện và quản lý.",
    deleteStatus: "Xóa trạng thái",
    deleteStatusTitle: "Xóa trạng thái?",
    deleteStatusDesc: "Các liên hệ đang dùng trạng thái này sẽ được chuyển sang Khác."
    ,
    notifications: "Thông báo",
    markAllRead: "Đánh dấu đã đọc",
    section_earlier: "TRƯỚC ĐÓ",
    allUpcoming: "Tất cả sắp tới",
    recentContactsTitle: "Liên hệ gần đây",
    filterAll: "Tất cả",
    filterReminder: "Nhắc nhở",
    filterSpecial: "Dịp đặc biệt",
    settings: "Cài đặt"
  }
} as const;

export function makeT(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>): string => {
    const current = STRINGS[lang] as Record<string, string>;
    const fallback = STRINGS.en as Record<string, string>;
    let value: string = current[key] || fallback[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([name, replacement]) => {
        value = value.replace(`{${name}}`, String(replacement));
      });
    }
    return value;
  };
}

export const statuses: Status[] = [
  { id: "st-close", name: "Close Friend", desc: "Best friends", color: "#2F8F5F", count: 24, icon: "people" },
  { id: "st-work", name: "Work", desc: "Colleagues", color: "#3B7BD9", count: 18, icon: "briefcase" },
  { id: "st-family", name: "Family", desc: "Family & relatives", color: "#8B5CD6", count: 12, icon: "home" },
  { id: "st-school", name: "School", desc: "Classmates & teachers", color: "#D4A519", count: 15, icon: "school" },
  { id: "st-love", name: "Love", desc: "Crushes & partners", color: "#3FA398", count: 3, icon: "heart" },
  { id: "st-other", name: "Other", desc: "Other relationships", color: "#E07543", count: 7, icon: "people" }
];

export const contacts: Contact[] = [
  { id: "c1", name: "Nguyễn Văn An", initials: "VA", status: "st-close", interactions: 7, source: "Work", phone: "+84 912 345 678", email: "an.nguyen@gmail.com", address: "Quận 1, TP.HCM", social: "@an.nguyen", noteCount: 12, reminderCount: 3, specialCount: 2 },
  { id: "c2", name: "Trần Mai Anh", initials: "MA", status: "st-work", interactions: 4, source: "Work", phone: "+84 905 123 456", email: "maianh@gmail.com", noteCount: 5, reminderCount: 1, specialCount: 1 },
  { id: "c3", name: "Lê Anh Dũng", initials: "AD", status: "st-close", interactions: 12, phone: "+84 988 765 432", email: "dung.le@gmail.com", noteCount: 8, reminderCount: 2, specialCount: 1 },
  { id: "c4", name: "Phạm Minh Bảo", initials: "MB", status: "st-work", interactions: 3, noteCount: 3, reminderCount: 0, specialCount: 0 },
  { id: "c5", name: "Bùi Thảo Bình", initials: "TB", status: "st-family", interactions: 9, noteCount: 6, reminderCount: 1, specialCount: 2 },
  { id: "c6", name: "Hoàng Quốc Cường", initials: "QC", status: "st-other", interactions: 1, noteCount: 1, reminderCount: 0, specialCount: 0 },
  { id: "c7", name: "Đỗ Thùy Chi", initials: "TC", status: "st-close", interactions: 5, noteCount: 4, reminderCount: 1, specialCount: 1 },
  { id: "c8", name: "Trần Minh", initials: "TM", status: "st-work", interactions: 8, noteCount: 7, reminderCount: 2, specialCount: 1 },
  { id: "c9", name: "Lê Hoàng Nam", initials: "HN", status: "st-school", interactions: 6, noteCount: 5, reminderCount: 1, specialCount: 1 },
  { id: "c10", name: "Phạm Thảo Vy", initials: "TV", status: "st-love", interactions: 11, noteCount: 9, reminderCount: 3, specialCount: 2 }
];

export const notes: Note[] = [
  {
    id: "n1",
    section: "today",
    contact: "c1",
    title: "Gọi điện hỏi thăm công việc",
    preview: "Gọi điện hỏi thăm công việc mới của An, hỗ trợ nếu cần.",
    content: "Hôm nay nên gọi hỏi thăm tình hình công việc mới của An, xem có cần hỗ trợ gì không.\n\nAn đang phụ trách dự án mới ở công ty, có thể hơi áp lực.\n\nMình nên động viên và nếu cần thì giúp đỡ.",
    contentEn: "Reach out to check on An's new work today, see if any help is needed.\n\nAn is leading a new project at the company, might feel some pressure.\n\nI should be encouraging and offer help if needed.",
    time: "18:00",
    reminder: "18:00, Hôm nay",
    reminderEn: "18:00, Today",
    bookmark: false
  },
  {
    id: "n2",
    section: "today",
    contact: null,
    title: "Nhắc mua quà cho Nam",
    preview: "Sinh nhật Nam vào cuối tuần này, chuẩn bị quà và gửi sớm.",
    content: "Sinh nhật Nam vào cuối tuần này. Cần chuẩn bị quà và gửi sớm để tránh bị muộn.\n\nÝ tưởng: tặng cuốn sách Nam đã nhắc đến tuần trước.",
    contentEn: "Nam's birthday is this weekend. Need to prepare a gift and send it early.\n\nIdea: that book Nam mentioned last week.",
    time: "09:00",
    reminder: "09:00, T7 này",
    reminderEn: "09:00, This Sat",
    bookmark: false,
    hasNew: true,
    kind: "reminder"
  },
  {
    id: "n3",
    section: "today",
    contact: "c2",
    title: "Trần Mai Anh",
    preview: "Mai Anh thích đọc sách và café cuối tuần. Có thể rủ đi cà phê.",
    content: "Mai Anh thích đọc sách và café cuối tuần.\n\nCó thể rủ đi cà phê tuần sau, quán Phin gần văn phòng.",
    contentEn: "Mai Anh enjoys reading and coffee on weekends.\n\nCould invite her for coffee next week - Phin cafe near the office.",
    time: "08:30",
    bookmark: false
  },
  {
    id: "n4",
    section: "yesterday",
    contact: null,
    title: "Ý tưởng dự án mới",
    preview: "Ứng dụng giúp quản lý các mối quan hệ và những ngày quan trọng.",
    content: "Ứng dụng giúp quản lý các mối quan hệ và những ngày quan trọng.\n\nNgười dùng có thể tạo ghi chú gắn với từng người để xây dựng mối quan hệ tốt đẹp.",
    contentEn: "An app to manage relationships and important moments.\n\nUsers can attach notes to each person to build better relationships.",
    time: "10:20",
    bookmark: false
  },
  {
    id: "n5",
    section: "thisweek",
    contact: "c9",
    title: "Lê Hoàng Nam",
    preview: "Nam sắp chuyển công tác, nhớ liên lạc để giữ kết nối.",
    content: "Nam sắp chuyển công tác sang Đà Nẵng vào tháng sau. Mình nên liên lạc để giữ kết nối.",
    contentEn: "Nam is moving to Da Nang next month. Should stay in touch.",
    time: "T3, 20:15",
    timeEn: "Tue, 20:15",
    bookmark: false
  }
];

export const upcoming: Upcoming[] = [
  { id: "u1", icon: "call", time: "18:00", title: "Gọi cho An", titleEn: "Call An", sub: "Hôm nay", subEn: "Today", tag: "Trong 2 giờ", tagEn: "In 2 hours", kind: "reminder" },
  { id: "u2", icon: "calendar", time: "-", title: "Sinh nhật Minh", titleEn: "Minh's birthday", sub: "Ngày mai", subEn: "Tomorrow", tag: "Ngày mai", tagEn: "Tomorrow", kind: "special" },
  { id: "u3", icon: "gift", time: "-", title: "Kỷ niệm 2 năm gặp nhau", titleEn: "2-year anniversary", sub: "22/05", subEn: "22/05", tag: "2 ngày nữa", tagEn: "In 2 days", kind: "special" },
  { id: "u4", icon: "bag", time: "09:00", title: "Nhắc mua quà cho Nam", titleEn: "Buy Nam's gift", sub: "23/05", subEn: "23/05", tag: "3 ngày nữa", tagEn: "In 3 days", kind: "reminder" }
];

export const notifications = [
  { section: "today", icon: "notifications-outline", color: "#E07543", title: "Sắp đến nhắc nhở", titleEn: "Reminder coming up", body: "Gọi cho An - 18:00 hôm nay", bodyEn: "Call An - 18:00 today", time: "2h", unread: true },
  { section: "today", icon: "calendar-outline", color: "#D9577A", title: "Dịp đặc biệt", titleEn: "Special day", body: "Sinh nhật Minh vào ngày mai", bodyEn: "Minh's birthday is tomorrow", time: "5h", unread: true },
  { section: "today", icon: "sparkles-outline", color: "#2F8F5F", title: "Gợi ý kết nối", titleEn: "Connection nudge", body: "Bạn chưa liên lạc với Mai Anh gần một tháng", bodyEn: "You haven't reached out to Mai Anh in nearly a month", time: "8h", unread: false },
  { section: "earlier", icon: "gift-outline", color: "#E07543", title: "Kỷ niệm sắp tới", titleEn: "Anniversary soon", body: "Kỷ niệm 2 năm gặp nhau - 22/05", bodyEn: "2-year anniversary - 22/05", time: "Yesterday", unread: false }
];

export function statusById(statusId?: string) {
  return statuses.find((status) => status.id === statusId);
}

export function contactById(contactId?: string | null) {
  return contacts.find((contact) => contact.id === contactId);
}

export function avatarTint(seed: string) {
  const palette = [
    ["#D4E9DC", "#1F7048"],
    ["#DCE2F1", "#3B5CA8"],
    ["#E5DCEF", "#6B45A8"],
    ["#F1DAE0", "#A83B57"],
    ["#F1E0D0", "#A85A2E"],
    ["#F1EBD0", "#8C6E1E"],
    ["#D6ECE8", "#216F65"],
    ["#E2E5E2", "#4F5957"]
  ];
  const index = (seed.charCodeAt(0) + (seed.charCodeAt(1) || 0)) % palette.length;
  return palette[index];
}

export type TimelineItem = {
  kind: "note" | "reminder" | "special";
  icon: string;
  label: string;
  title: string;
  desc: string;
  date: string;
};

export function timelineFor(contactId: string, lang: Lang = "en"): TimelineItem[] {
  if (contactId === "c1") {
    return [
      {
        kind: "reminder",
        icon: "notifications-outline",
        label: lang === "vi" ? "Nhắc nhở" : "Reminder",
        title: lang === "vi" ? "Gọi cho An lúc 18:00" : "Call An at 18:00",
        desc: lang === "vi" ? "Hỏi thăm công việc mới." : "Check on the new job.",
        date: lang === "vi" ? "Hôm nay" : "Today"
      },
      {
        kind: "note",
        icon: "document-text-outline",
        label: lang === "vi" ? "Ghi chú" : "Note",
        title: lang === "vi" ? "Gặp ăn trưa tuần trước" : "Lunch last week",
        desc: lang === "vi" ? "An nhắc mới nhận dự án lớn, hơi áp lực." : "An mentioned a big new project, feeling some pressure.",
        date: "20/05"
      },
      {
        kind: "special",
        icon: "calendar-outline",
        label: lang === "vi" ? "Sinh nhật" : "Birthday",
        title: lang === "vi" ? "Sinh nhật An" : "An's birthday",
        desc: lang === "vi" ? "Lặp lại hàng năm" : "Repeats yearly",
        date: "12/08"
      },
      {
        kind: "note",
        icon: "document-text-outline",
        label: lang === "vi" ? "Ghi chú" : "Note",
        title: lang === "vi" ? "Gặp đầu tiên" : "First met",
        desc: lang === "vi" ? "Gặp qua đồng nghiệp Linh ở cà phê Phin." : "Through colleague Linh at Phin coffee.",
        date: "02/04"
      }
    ];
  }

  return [
    {
      kind: "note",
      icon: "document-text-outline",
      label: lang === "vi" ? "Ghi chú" : "Note",
      title: lang === "vi" ? "Ghi chú đầu tiên" : "First note",
      desc: lang === "vi" ? "Lưu những điều quan trọng về người này." : "Capture important details about this person.",
      date: lang === "vi" ? "Tuần này" : "This week"
    }
  ];
}
