import { Ionicons } from "@expo/vector-icons";
import { MeshGradientView } from "expo-mesh-gradient";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuickCreateSheet } from "../../components/QuickCreateSheet";
import { Avatar, BottomNav, BottomNavScrim, NavFn, TFn } from "../../mesh/MeshComponents";
import { Lang, statusById } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

// ─── Types ───────────────────────────────────────────────────────────────────

type NoteFilter = "all" | "reminders" | "pinned";
type NoteSort   = "newest" | "oldest";

type NoteItem = {
  id: string;
  person: { id: string; name: string; statusId?: string };
  title?: string | null;
  content: string;
  createdAt: Date;
  reminderAt?: Date | null;
  isPinned?: boolean;
};

type NoteSection = { key: string; title: string; data: NoteItem[] };

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODAY = new Date(2026, 4, 19); // May 19 2026

// IDs match meshData.ts mockNotes (n1–n4) so NoteDetailScreen can find them.
const MOCK_NOTES: NoteItem[] = [
  {
    id: "n1",
    person: { id: "c1", name: "Nguyễn Văn An", statusId: "st-close" },
    title: "Gọi điện hỏi thăm công việc",
    content:
      "Hôm nay nên gọi hỏi thăm tình hình công việc mới của An, xem có cần hỗ trợ gì không. An đang phụ trách dự án mới ở công ty, có thể hơi áp lực.",
    createdAt: new Date(2026, 4, 19, 9, 0),
    reminderAt: new Date(2026, 4, 19, 18, 0),
  },
  {
    id: "n2",
    person: { id: "cx", name: "Chí Nam", statusId: "st-work" },
    title: null,
    content:
      "Sinh nhật Nam vào cuối tuần này, chuẩn bị quà và gửi sớm để tránh bị muộn. Ý tưởng: tặng cuốn sách Nam đã nhắc đến tuần trước.",
    createdAt: new Date(2026, 4, 19, 8, 30),
    reminderAt: new Date(2026, 4, 23, 9, 0),
    isPinned: true,
  },
  {
    id: "n3",
    person: { id: "c2", name: "Trần Mai Anh", statusId: "st-work" },
    title: "Sở thích cá nhân",
    content:
      "Mai Anh thích đọc sách và café cuối tuần. Có thể rủ đi cà phê tuần sau, quán Phin gần văn phòng.",
    createdAt: new Date(2026, 4, 18, 8, 30),
    reminderAt: null,
  },
  {
    id: "n4",
    person: { id: "cy", name: "Ánh Minh", statusId: "st-school" },
    title: null,
    content:
      "Ánh Minh vừa chuyển về Hà Nội. Nên liên hệ để gặp gỡ khi có dịp, có thể rủ đi ăn tối tuần tới.",
    createdAt: new Date(2026, 4, 15, 10, 20),
    reminderAt: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function formatReminderLabel(d: Date, today: Date): string {
  const diffDays = Math.round(
    (startOfDay(d).getTime() - startOfDay(today).getTime()) / 86_400_000
  );
  const time = `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`;
  if (diffDays === 0) return `${time}, Hôm nay`;
  if (diffDays === 1) return `${time}, Ngày mai`;
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `${time}, ${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

function formatCreatedLabel(d: Date, today: Date): string {
  const diffDays = Math.round(
    (startOfDay(today).getTime() - startOfDay(d).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function getSectionKey(d: Date, today: Date): "today" | "yesterday" | "thisweek" | "older" {
  const diffDays = Math.round(
    (startOfDay(today).getTime() - startOfDay(d).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "thisweek";
  return "older";
}

function matchSearch(note: NoteItem, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  return (
    note.person.name.toLowerCase().includes(lower) ||
    (note.title?.toLowerCase().includes(lower) ?? false) ||
    note.content.toLowerCase().includes(lower)
  );
}

const SECTION_LABELS: Record<string, string> = {
  today: "HÔM NAY",
  yesterday: "HÔM QUA",
  thisweek: "TUẦN NÀY",
  older: "TRƯỚC ĐÓ",
};
const SECTION_ORDER = ["today", "yesterday", "thisweek", "older"] as const;

// ─── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({ note, onPress }: { note: NoteItem; onPress: () => void }) {
  const status = statusById(note.person.statusId);

  return (
    <Pressable onPress={onPress} style={styles.cardWrap}>
      <View style={styles.card}>
        {/* Avatar */}
        <Avatar name={note.person.name} size={44} />

        {/* Main content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Person + status */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Text
              numberOfLines={1}
              style={{ color: mesh.ink900, fontSize: mesh.font.cardTitle, fontWeight: "700", flexShrink: 1 }}
            >
              {note.person.name}
            </Text>
            {status ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.color }} />
                <Text style={{ color: mesh.ink500, fontSize: mesh.font.caption, fontWeight: "500" }}>
                  {status.name}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Optional title */}
          {note.title ? (
            <Text
              numberOfLines={1}
              style={{ color: mesh.ink700, fontSize: mesh.font.bodySm, fontWeight: "600", marginBottom: 3 }}
            >
              {note.title}
            </Text>
          ) : null}

          {/* Content preview */}
          <Text
            numberOfLines={note.title ? 2 : 3}
            style={{
              color: mesh.ink500,
              fontSize: mesh.font.bodySm,
              lineHeight: mesh.lineHeight.bodySm,
              marginBottom: 8,
            }}
          >
            {note.content}
          </Text>

          {/* Footer: reminder chip OR created meta */}
          {note.reminderAt ? (
            <View style={styles.reminderChip}>
              <Ionicons name="alarm-outline" size={11} color={mesh.green700} />
              <Text style={styles.reminderChipText}>
                {formatReminderLabel(note.reminderAt, TODAY)}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="time-outline" size={12} color={mesh.ink300} />
              <Text style={{ color: mesh.ink400, fontSize: mesh.font.caption }}>
                {formatCreatedLabel(note.createdAt, TODAY)}
              </Text>
            </View>
          )}
        </View>

        {/* Bookmark — visible only when pinned */}
        {note.isPinned ? (
          <Ionicons name="bookmark" size={18} color={mesh.green700} style={{ marginTop: 2 }} />
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Custom header ────────────────────────────────────────────────────────────

function NotesHeader({
  search,
  onSearch,
  onNew,
}: {
  search: string;
  onSearch: (v: string) => void;
  onNew: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <MeshGradientView
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
        columns={4}
        rows={4}
        colors={[
          "#064532", "#0B573E", "#1D704F", "#2F805E",
          "#DDEFE5", "#EAF6EF", "#BFDCCB", "#74AE8D",
          "#FFFFFF", "#FFFFFF", "#F8FCF7", "#EEF8F0",
          "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
          "#FFFFFF", "#FFFFFF",
        ]}
        points={[
          [0, 0],    [0.35, 0],    [0.7, 0],    [1, 0],
          [0, 0.36], [0.35, 0.38], [0.7, 0.34], [1, 0.3],
          [0, 0.66], [0.35, 0.68], [0.7, 0.72], [1, 0.7],
          [0, 1],    [0.35, 1],    [0.7, 1],    [1, 1],
        ]}
        smoothsColors
      />

      {/* Leaf decoration */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require("../../../assets/leaf_2.png")}
          style={styles.headerLeaf}
        />
      </View>

      {/* Title row */}
      <View style={styles.headerTitleRow}>
        <View>
          <Text style={styles.headerTitle}>Notes</Text>
          <Text style={styles.headerSubtitle}>Small memories that matter</Text>
        </View>
        <Pressable onPress={onNew} style={styles.headerAddBtn}>
          <Ionicons name="add" size={22} color={mesh.ink900} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={mesh.ink400} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Search notes or people..."
          placeholderTextColor={mesh.ink400}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}

// ─── Filter row ───────────────────────────────────────────────────────────────

function FilterRow({
  filter,
  sort,
  onFilter,
  onSort,
}: {
  filter: NoteFilter;
  sort: NoteSort;
  onFilter: (f: NoteFilter) => void;
  onSort: (s: NoteSort) => void;
}) {
  const filters: { id: NoteFilter; label: string }[] = [
    { id: "all",       label: "Tất cả" },
    { id: "reminders", label: "Nhắc nhở" },
    { id: "pinned",    label: "Đã ghim" },
  ];

  return (
    <View style={styles.filterRow}>
      {filters.map((f) => {
        const active = filter === f.id;
        return (
          <Pressable
            key={f.id}
            onPress={() => onFilter(f.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Sort chip */}
      <Pressable
        onPress={() => onSort(sort === "newest" ? "oldest" : "newest")}
        style={[styles.chip, styles.sortChip]}
      >
        <Ionicons
          name={sort === "newest" ? "arrow-down" : "arrow-up"}
          size={12}
          color={mesh.ink700}
        />
        <Text style={styles.chipText}>
          {sort === "newest" ? "Mới nhất" : "Cũ nhất"}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = { t: TFn; lang: Lang; nav: NavFn };

export function NotesScreen({ t, lang, nav }: Props) {
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [sort,   setSort]   = useState<NoteSort>("newest");
  const [search, setSearch] = useState("");
  const [quickCreateMode, setQuickCreateMode] = useState<"note" | "contact" | null>(null);

  const sections = useMemo<NoteSection[]>(() => {
    const filtered = MOCK_NOTES.filter((note) => {
      if (!matchSearch(note, search)) return false;
      if (filter === "reminders" && !note.reminderAt) return false;
      if (filter === "pinned" && !note.isPinned) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime();
      return sort === "newest" ? -diff : diff;
    });

    const groups: Record<string, NoteItem[]> = {};
    for (const note of sorted) {
      const key = getSectionKey(note.createdAt, TODAY);
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    }

    return SECTION_ORDER
      .filter((key) => (groups[key]?.length ?? 0) > 0)
      .map((key) => ({ key, title: SECTION_LABELS[key], data: groups[key] }));
  }, [filter, sort, search]);

  return (
    <View style={styles.root}>
      {/* Header and filter are fixed above the list — not inside ListHeaderComponent */}
      <NotesHeader search={search} onSearch={setSearch} onNew={() => nav("createNote")} />
      <FilterRow filter={filter} sort={sort} onFilter={setFilter} onSort={setSort} />

      <SectionList<NoteItem, NoteSection>
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 180 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={40} color={mesh.ink200} />
            <Text style={styles.emptyTitle}>Chưa có ghi chú</Text>
            <Text style={styles.emptyDesc}>Ghi lại những điều quan trọng về mọi người.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionLabel}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => nav("noteDetail", { id: item.id })} />
        )}
      />

      <BottomNavScrim color="#FAFCF9" />

      <BottomNav
        active="notes"
        t={t}
        onQuickCreateContact={() => setQuickCreateMode("contact")}
        onQuickCreateNote={() => setQuickCreateMode("note")}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "contacts") nav("contacts");
          else if (id === "status") nav("status");
        }}
      />

      <QuickCreateSheet
        open={quickCreateMode !== null}
        mode={quickCreateMode}
        onClose={() => setQuickCreateMode(null)}
        t={t}
        lang={lang}
        nav={nav}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFCF9",
  },

  // Header
  header: {
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeaf: {
    position: "absolute",
    right: -16,
    top: 0,
    width: 160,
    height: 160,
    opacity: 0.13,
    transform: [{ rotate: "8deg" }],
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    color: "#004B3A",
    fontSize: mesh.font.screenTitle,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: "#6B726E",
    fontSize: mesh.font.bodySm,
    marginTop: 2,
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: mesh.green700,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.08)",
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: mesh.ink900,
    fontSize: mesh.font.body,
  },

  // Filter row
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: mesh.green700,
    borderColor: mesh.green700,
  },
  chipText: {
    color: mesh.ink700,
    fontSize: mesh.font.caption,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sortChip: {
    paddingHorizontal: 12,
  },

  // Section label
  sectionLabel: {
    color: mesh.ink400,
    fontSize: mesh.font.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },

  // Card
  cardWrap: {
    marginBottom: 10,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.06)",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  // Reminder chip
  reminderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(15,67,41,0.07)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reminderChipText: {
    color: mesh.green700,
    fontSize: mesh.font.caption,
    fontWeight: "700",
  },

  // Empty state
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: mesh.ink500,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    color: mesh.ink400,
    fontSize: mesh.font.bodySm,
    textAlign: "center",
    lineHeight: mesh.lineHeight.bodySm,
  },
});
