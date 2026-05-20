import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MeshGradientView } from "expo-mesh-gradient";
import * as ImagePicker from "expo-image-picker";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, LayoutChangeEvent, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createContact, deleteContact, getContactById, getContactTimeline, getContacts, updateContact } from "../../api/contactApi";
import { getStatuses } from "../../api/statusApi";
import { extractArray, normalizeApiContact, normalizeApiStatus } from "../../api/screenAdapters";
import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { QuickCreateSheet } from "../../components/QuickCreateSheet";
import { CreateNoteScreen } from "./CreateNoteScreen";
import { Avatar, BottomNav, BottomNavScrim, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshChip, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, StatusChip, TFn, TipCard } from "../../mesh/MeshComponents";
import { GradientAvatar } from "../../components/GradientAvatar";
import { Contact, Lang, Status, statuses as mockStatuses, statusById } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

const leafPng = require("../../../assets/leaf.png");

// ─── CreateContactScreen helpers ─────────────────────────────────────────────

const WHEEL_H = 44;

const SHEET_FONT = {
  action:             16,   // Cancel / Done
  title:              18,   // Sheet title
  input:              16,   // Event name input
  label:              13,   // "Select date" label
  preview:            14,   // Date preview chip
  wheelNormal:        18,   // Day / year unselected
  wheelSelected:      24,   // Day / year selected
  wheelMonthNormal:   16,   // Month unselected
  wheelMonthSelected: 18,   // Month selected
} as const;

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const YEARS_ARR = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

type SpecialDay = { id: string; title: string; date: Date | null };
type DateTarget  = { kind: "birthday" } | { kind: "specialDay"; index: number };
// "specialDay" in AddField means it appears in the popup menu but is handled separately (not added to activeFields)
type AddField    = "birthday" | "howYouMet" | "specialDay" | "address" | "social" | "note";

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ── WheelCol ──────────────────────────────────────────────────────────────────

function WheelCol({
  items, selectedIndex, onSelect,
  width = 72,
  fontSize     = SHEET_FONT.wheelNormal,
  fontSizeSelected = SHEET_FONT.wheelSelected,
}: {
  items: string[]; selectedIndex: number; onSelect: (i: number) => void;
  width?: number; fontSize?: number; fontSizeSelected?: number;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * WHEEL_H, animated: false });
    }, 60);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / WHEEL_H);
    onSelect(Math.max(0, Math.min(idx, items.length - 1)));
  };

  return (
    <View style={{ width, height: WHEEL_H * 5, overflow: "hidden" }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute", left: 0, right: 0,
          top: WHEEL_H * 2, height: WHEEL_H,
          backgroundColor: "rgba(31,112,72,0.08)",
          borderRadius: 10, zIndex: 1,
        }}
      />
      <ScrollView
        ref={ref}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: WHEEL_H * 2 }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        {items.map((item, i) => (
          <View key={i} style={{ height: WHEEL_H, justifyContent: "center", alignItems: "center" }}>
            <Text
              maxFontSizeMultiplier={1.1}
              style={{
                fontSize:   i === selectedIndex ? fontSizeSelected : fontSize,
                fontWeight: i === selectedIndex ? "800" : "400",
                color:      i === selectedIndex ? mesh.green700 : mesh.ink400,
              }}
            >{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── WheelDatePicker ───────────────────────────────────────────────────────────

function WheelDatePicker({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const init   = value ?? new Date();
  const [dayIdx,   setDayIdx]   = useState(init.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(init.getMonth());
  const yearStr = String(init.getFullYear());
  const initYrIdx = YEARS_ARR.indexOf(yearStr);
  const [yearIdx,  setYearIdx]  = useState(initYrIdx >= 0 ? initYrIdx : 0);

  useEffect(() => {
    const year   = Number(YEARS_ARR[yearIdx]);
    const maxDay = daysInMonth(monthIdx, year);
    const day    = Math.min(dayIdx + 1, maxDay);
    onChange(new Date(year, monthIdx, day));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIdx, monthIdx, yearIdx]);

  const maxDay = daysInMonth(monthIdx, Number(YEARS_ARR[yearIdx]));
  const days   = Array.from({ length: maxDay }, (_, i) => String(i + 1));

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, paddingVertical: 8 }}>
      <WheelCol
        items={days}
        selectedIndex={Math.min(dayIdx, maxDay - 1)}
        onSelect={setDayIdx}
        width={52}
        fontSize={SHEET_FONT.wheelNormal}
        fontSizeSelected={SHEET_FONT.wheelSelected}
      />
      <WheelCol
        items={MONTHS_LONG}
        selectedIndex={monthIdx}
        onSelect={setMonthIdx}
        width={152}
        fontSize={SHEET_FONT.wheelMonthNormal}
        fontSizeSelected={SHEET_FONT.wheelMonthSelected}
      />
      <WheelCol
        items={YEARS_ARR}
        selectedIndex={yearIdx}
        onSelect={setYearIdx}
        width={76}
        fontSize={SHEET_FONT.wheelNormal}
        fontSizeSelected={SHEET_FONT.wheelSelected}
      />
    </View>
  );
}

// ── AdditionalRow ─────────────────────────────────────────────────────────────

function AdditionalRow({
  icon, label, value, onChangeText, multiline = false, onRemove, onFocus, last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string;
  onChangeText?: (v: string) => void; multiline?: boolean;
  onRemove: () => void; onFocus?: () => void; last?: boolean;
}) {
  return (
    <View style={{
      borderBottomWidth: last ? 0 : 1, borderColor: "rgba(6,69,50,0.055)",
      flexDirection: "row", alignItems: "flex-start",
      gap: 12, paddingHorizontal: 14, paddingVertical: 10,
    }}>
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.055)", borderRadius: 13, height: 38, justifyContent: "center", width: 38, flexShrink: 0, marginTop: 2 }}>
        <Ionicons name={icon} size={18} color={mesh.green700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "600", marginBottom: 2 }}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          onFocus={onFocus}
          placeholder="—"
          placeholderTextColor="#8C9691"
          style={{ color: mesh.ink900, fontSize: 14, fontWeight: "400" }}
        />
      </View>
      <Pressable onPress={onRemove} hitSlop={8} style={{ paddingTop: 10 }}>
        <Ionicons name="close-circle-outline" size={18} color={mesh.ink300} />
      </Pressable>
    </View>
  );
}

// ── SpecialDayRow ─────────────────────────────────────────────────────────────

function SpecialDayRow({
  item, onPress, onRemove, last = false, fallbackLabel, selectDateLabel,
}: {
  item: SpecialDay; onPress: () => void; onRemove: () => void;
  last?: boolean; fallbackLabel: string; selectDateLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderBottomWidth: last ? 0 : 1, borderColor: "rgba(6,69,50,0.055)",
        flexDirection: "row", alignItems: "center",
        gap: 12, paddingHorizontal: 14, paddingVertical: 10,
      }}
    >
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.055)", borderRadius: 13, height: 38, justifyContent: "center", width: 38, flexShrink: 0 }}>
        <Ionicons name="calendar-outline" size={18} color={mesh.green700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "700" }}>
          {item.title || fallbackLabel}
        </Text>
        <Text style={{ color: item.date ? mesh.green700 : mesh.ink400, fontSize: 12, marginTop: 2 }}>
          {item.date ? formatDateShort(item.date) : selectDateLabel}
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Ionicons name="close-circle-outline" size={18} color={mesh.ink300} />
      </Pressable>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  highlightId?: string;
  highlightName?: string;
  refresh?: number;
};

const SUCCESS_HOLD_MS = 750;
const HIGHLIGHT_MS = 2800;

type SavePhase = "idle" | "saving" | "success";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractCreatedId(response: unknown): string | undefined {
  const root = response && typeof response === "object" ? (response as Record<string, any>) : null;
  if (!root) return undefined;

  return (
    root?.data?.contact?._id ||
    root?.data?.contact?.id ||
    root?.contact?._id ||
    root?.contact?.id ||
    root?.data?._id ||
    root?.data?.id ||
    root?._id ||
    root?.id
  );
}

export function ContactsScreen({ t, lang, nav, highlightId, highlightName, refresh }: Props) {
  const [filter, setFilter] = useState("all");
  const [apiContacts, setApiContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickCreateMode, setQuickCreateMode] = useState<"note" | "contact" | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollContainerRef = useRef<View>(null);
  const rowRefs = useRef<Record<string, View | null>>({});
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [pendingHighlight, setPendingHighlight] = useState<{ id?: string; name?: string } | null>(null);
  const sourceContacts = apiContacts;
  const filters = [{ id: "all", label: t("fAll"), color: null }, ...mockStatuses.slice(0, 4).map((status) => ({ id: status.id, label: status.name, color: status.color }))];
  const list = filter === "all" ? sourceContacts : sourceContacts.filter((contact) => contact.status === filter);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getContacts();
      const normalized = extractArray(response, "contacts").map(normalizeApiContact).filter(Boolean) as Contact[];
      setApiContacts(normalized);
      setError("");
    } catch (err) {
      setApiContacts([]);
      setError(err instanceof Error && err.message ? err.message : "Cannot load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (refresh) {
      loadContacts();
    }
  }, [refresh, loadContacts]);

  useEffect(() => {
    if (highlightId || highlightName) {
      // Reset filter to "all" so newly created contact is visible
      setFilter("all");
      setPendingHighlight({ id: highlightId, name: highlightName });
    }
  }, [highlightId, highlightName, refresh]);

  // Find target contact from pending highlight
  const targetContact = useMemo(() => {
    if (!pendingHighlight) return null;

    if (pendingHighlight.id) {
      const found = list.find((c) => c.id === pendingHighlight.id);
      if (found) return found;
    }

    if (pendingHighlight.name) {
      const normalizedName = pendingHighlight.name.trim().toLowerCase();
      return list.find((c) => c.name.trim().toLowerCase() === normalizedName) ?? null;
    }

    return null;
  }, [pendingHighlight, list]);

  // Scroll to and highlight target contact
  useEffect(() => {
    if (!targetContact) return;

    let cancelled = false;
    let attempts = 0;

    const highlightAndScroll = () => {
      if (cancelled) return;

      const rowRef = rowRefs.current[targetContact.id];

      if (rowRef && scrollContainerRef.current) {
        rowRef.measureLayout(
          scrollContainerRef.current,
          (_x, y) => {
            if (cancelled) return;

            scrollRef.current?.scrollTo({
              y: Math.max(0, y - 120),
              animated: true,
            });

            setActiveHighlightId(targetContact.id);

            setTimeout(() => {
              setActiveHighlightId((current) =>
                current === targetContact.id ? null : current
              );
            }, HIGHLIGHT_MS);

            setPendingHighlight(null);
          },
          () => {
            // measureLayout failed, retry
            if (attempts < 10) {
              attempts += 1;
              setTimeout(highlightAndScroll, 120);
            }
          }
        );
        return;
      }

      // Row ref or container not ready, retry
      if (attempts < 10) {
        attempts += 1;
        setTimeout(highlightAndScroll, 120);
      }
    };

    const timer = setTimeout(highlightAndScroll, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [targetContact]);


  const grouped = useMemo(() => {
    return list.reduce<Record<string, Contact[]>>((acc, contact) => {
      const key = contact.name[0].toUpperCase();
      acc[key] = acc[key] || [];
      acc[key].push(contact);
      return acc;
    }, {});
  }, [list]);

  return (
    <MeshScreen>
      <MeshHeroHeader
        left={<Avatar name="Trung Nguyen" size={48} ring />}
        right={<HeaderCircleBtn icon="add" onPress={() => nav("createContact")} />}
        title={t("contacts")}
        subtitle={t("contactsCount", { n: sourceContacts.length })}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => nav("search", { type: "contacts" })} style={{ flex: 1, height: 44, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
            <Ionicons name="search" size={18} color={mesh.ink400} />
            <Text numberOfLines={1} style={{ flex: 1, color: "#8A928D", fontSize: mesh.font.body }}>{t("searchContactPh")}</Text>
          </Pressable>
          <Pressable style={{ height: 44, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14 }}>
            <Ionicons name="options-outline" size={16} color={mesh.ink700} />
            <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "700" }}>{t("filter")}</Text>
          </Pressable>
        </View>
      </MeshHeroHeader>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 150 }}
        automaticallyAdjustKeyboardInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          {filters.map((item) => (
            <MeshChip key={item.id} active={filter === item.id} onPress={() => setFilter(item.id)} style={{ backgroundColor: filter === item.id ? mesh.green700 : "#FFFFFF", borderColor: filter === item.id ? mesh.green700 : "rgba(6,69,50,0.12)" }}>
              {item.label}
            </MeshChip>
          ))}
        </View>

        <View
          ref={scrollContainerRef}
          collapsable={false}
          style={{ paddingHorizontal: 20, paddingTop: 8 }}
        >
          {loading ? (
            <InlineState label="Loading contacts..." loading />
          ) : error ? (
            <InlineState label={error} error />
          ) : list.length === 0 ? (
            <InlineState label="No contacts from API." />
          ) : Object.keys(grouped).sort().map((key) => (
            <View key={key}>
              <Text style={{ color: "#7A837E", fontSize: mesh.font.bodySm, fontWeight: "700", marginTop: 18, marginBottom: 8 }}>{key}</Text>
              {grouped[key].map((contact, index) => {
                const highlighted = activeHighlightId === contact.id;
                return (
                <Pressable
                  key={contact.id}
                  ref={(ref) => { rowRefs.current[contact.id] = ref as unknown as View | null; }}
                  collapsable={false}
                  onPress={() => nav("contactDetail", { id: contact.id })}
                  style={[
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 10,
                      borderBottomWidth: index < grouped[key].length - 1 ? 1 : 0,
                      borderColor: "rgba(6,69,50,0.08)",
                    },
                    highlighted && {
                      backgroundColor: "#EAF5EF",
                      borderColor: "#CFE5D8",
                      borderWidth: 1,
                      borderRadius: 18,
                      paddingHorizontal: 10,
                      marginHorizontal: -10,
                    },
                  ]}
                >
                  <GradientAvatar name={contact.name} statusColor={statusById(contact.status)?.color} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: mesh.ink900, fontSize: mesh.font.cardTitle, fontWeight: "700" }}>{contact.name}</Text>
                    <View style={{ marginTop: 3 }}>
                      <StatusChip statusId={contact.status} />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
                </Pressable>
              );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNavScrim />

      <BottomNav
        active="contacts"
        t={t}
        onQuickCreateContact={() => setQuickCreateMode("contact")}
        onQuickCreateNote={() => setQuickCreateMode("note")}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "notes") nav("notes");
          else if (id === "status") nav("status");
        }}
      />

      <QuickCreateSheet
        open={quickCreateMode !== null}
        onClose={() => setQuickCreateMode(null)}
      >
        {quickCreateMode === "note" && (
          <CreateNoteScreen
            t={t}
            lang={lang}
            nav={nav}
            presentation="sheet"
            onCloseSheet={() => setQuickCreateMode(null)}
            onCreated={(result) => {
              setQuickCreateMode(null);
              nav("notes", {
                highlightId: result.id,
                highlightLatest: result.highlightLatest,
                refresh: Date.now(),
              });
            }}
          />
        )}
        {quickCreateMode === "contact" && (
          <CreateContactScreen
            t={t}
            lang={lang}
            nav={nav}
            presentation="sheet"
            onCloseSheet={() => setQuickCreateMode(null)}
            onCreated={(result) => {
              setQuickCreateMode(null);
              nav("contacts", {
                highlightId: result.id,
                highlightName: result.name,
                refresh: Date.now(),
              });
            }}
          />
        )}
      </QuickCreateSheet>
    </MeshScreen>
  );
}

function InlineState({ error = false, label, loading = false }: { error?: boolean; label: string; loading?: boolean }) {
  return (
    <View style={{ alignItems: "center", borderColor: "rgba(6,69,50,0.06)", borderRadius: 22, borderWidth: 1, marginTop: 10, padding: 18 }}>
      {loading ? <ActivityIndicator color={mesh.green700} size="small" style={{ marginBottom: 8 }} /> : null}
      <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: mesh.font.bodySm, lineHeight: mesh.lineHeight.bodySm, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

// ── Timeline helpers ──────────────────────────────────────────────────────────

type TimelineItem = {
  date: string;
  desc: string;
  icon: string;
  kind: "note" | "reminder" | "special";
  label: string;
  title: string;
};

function asRec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Unwrap various backend shapes → raw contact object */
function extractContactData(response: unknown): unknown {
  const root = asRec(response);
  if (!root) return response;
  const data = asRec(root.data);
  if (data?.contact) return data.contact;
  if (data?.name) return data;
  if (root.contact) return root.contact;
  if (root.name) return root;
  return response;
}

/** Unwrap various backend shapes → raw array */
function extractTimelineArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  const root = asRec(response);
  if (!root) return [];
  if (Array.isArray(root.timeline)) return root.timeline;
  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.items)) return root.items;
  const data = asRec(root.data);
  if (data) {
    if (Array.isArray(data.timeline)) return data.timeline;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
}

function normalizeTimelineItem(value: unknown): TimelineItem | null {
  const item = asRec(value);
  if (!item) return null;

  const rawKind = String(item.kind ?? item.type ?? "note").toLowerCase();
  const kind: TimelineItem["kind"] = rawKind.includes("special")
    ? "special"
    : rawKind.includes("reminder")
    ? "reminder"
    : "note";

  const iconMap: Record<TimelineItem["kind"], string> = {
    note: "document-text-outline",
    reminder: "notifications-outline",
    special: "calendar-outline"
  };
  const labelMap: Record<TimelineItem["kind"], string> = {
    note: "Note",
    reminder: "Reminder",
    special: "Special Day"
  };

  const rawTitle = String(item.title ?? item.name ?? item.content ?? "");
  const title = rawTitle.split("\n")[0] || labelMap[kind];
  const desc = String(item.content ?? item.desc ?? item.description ?? "");
  const rawDate = item.createdAt ?? item.date ?? item.remindAt ?? item.dueAt;
  const dateObj = typeof rawDate === "string" ? new Date(rawDate) : null;
  const date =
    dateObj && !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "--";

  return { date, desc, icon: iconMap[kind], kind, label: labelMap[kind], title };
}

// ── ContactDetailScreen ───────────────────────────────────────────────────────

export function ContactDetailScreen({ t, lang, nav, contactId }: Props & { contactId?: string }) {
  const insets = useSafeAreaInsets();
  const [contact, setContact] = useState<Contact | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [apiStatuses, setApiStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!contactId) {
      setError("No contact selected.");
      setLoading(false);
      setContact(null);
      setTimelineItems([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    setContact(null);
    setTimelineItems([]);

    Promise.all([
      getContactById(contactId),
      getContactTimeline(contactId).catch(() => []),
      getStatuses().catch(() => null)
    ])
      .then(([contactRes, timelineRes, statusesRes]) => {
        if (!active) return;
        const normalized = normalizeApiContact(extractContactData(contactRes));
        if (!normalized) { setError("Contact not found."); return; }
        setContact(normalized);
        setTimelineItems(
          extractTimelineArray(timelineRes).map(normalizeTimelineItem).filter(Boolean) as TimelineItem[]
        );
        if (statusesRes) {
          const list = extractArray(statusesRes, "statuses").map(normalizeApiStatus).filter(Boolean) as Status[];
          if (list.length > 0) setApiStatuses(list);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load contact.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [contactId]);

  const tabs = [
    { id: "all", label: t("tlAll") },
    { id: "note", label: t("tlNotes") },
    { id: "special", label: t("tlSpecial") },
    { id: "reminder", label: t("tlReminders") }
  ];
  const filtered = tab === "all" ? timelineItems : timelineItems.filter((item) => item.kind === tab);
  // Look up status: real API statuses first, then mock statuses, then undefined (never show raw ObjectId)
  const statusMeta = contact
    ? (apiStatuses.find((s) => s.id === contact.status) ?? mockStatuses.find((s) => s.id === contact.status))
    : undefined;

  const handleDeleteContact = async () => {
    if (deleting) return;
    if (!contact?.id) {
      setConfirmDelete(false);
      setDeleteError("Missing contact id");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");
      await deleteContact(contact.id);
      setConfirmDelete(false);
      nav("contacts");
    } catch (err) {
      setConfirmDelete(false);
      setDeleteError(err instanceof Error && err.message ? err.message : "Cannot delete contact.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: insets.top }}>
          <ActivityIndicator size="large" color={mesh.green700} />
        </View>
      </MeshScreen>
    );
  }

  if (error || !contact) {
    return (
      <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
        <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("contacts")} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingBottom: 80 }}>
          <Ionicons name="alert-circle-outline" size={48} color={mesh.pink} />
          <Text style={{ color: mesh.ink900, fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 16, marginBottom: 8 }}>
            {error || "Contact not found"}
          </Text>
          <Pressable onPress={() => nav("contacts")} style={{ marginTop: 16, borderRadius: 24, backgroundColor: mesh.green700, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Back to Contacts</Text>
          </Pressable>
        </View>
      </MeshScreen>
    );
  }

  return (
    <MeshScreen style={{ backgroundColor: "#F7FAF7" }}>
      <View
        style={{
          height: insets.top + 335,
          overflow: "hidden",
          paddingHorizontal: 20,
          paddingTop: insets.top + 14,
          position: "relative"
        }}
      >
        <MeshGradientView
          pointerEvents="none"
          style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
          columns={4}
          rows={4}
          colors={[
            "#064532",
            "#0B573E",
            "#1D704F",
            "#2F805E",
            "#DDEFE5",
            "#EAF6EF",
            "#BFDCCB",
            "#74AE8D",
            "#FFFFFF",
            "#FFFFFF",
            "#F8FCF7",
            "#EEF8F0",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF"
          ]}
          points={[
            [0, 0],
            [0.35, 0],
            [0.7, 0],
            [1, 0],
            [0, 0.28],
            [0.35, 0.34],
            [0.7, 0.32],
            [1, 0.28],
            [0, 0.62],
            [0.35, 0.66],
            [0.7, 0.7],
            [1, 0.68],
            [0, 1],
            [0.35, 1],
            [0.7, 1],
            [1, 1]
          ]}
          smoothsColors
        />

        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("contacts")} />
          <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800", letterSpacing: -0.1 }}>{t("contactProfile")}</Text>
          <HeaderCircleBtn icon="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
        </View>
        <View style={{ alignItems: "center", marginTop: 18 }}>
          {contact.avatarUrl ? (
            <View style={{ width: 92, height: 92, borderRadius: 46, overflow: "hidden", borderWidth: 2.5, borderColor: "rgba(255,255,255,0.75)" }}>
              <Image source={{ uri: contact.avatarUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            </View>
          ) : (
            <GradientAvatar name={contact.name} statusColor={statusMeta?.color} size={92} ringWidth={2} ringOpacity={0.75} gap={3} />
          )}
          <Text style={{ color: mesh.green800, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, lineHeight: 32, marginTop: 14, paddingHorizontal: 24, textAlign: "center" }}>{contact.name}</Text>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 7, marginTop: 8 }}>
            <View style={{ backgroundColor: statusMeta?.color || mesh.green700, borderRadius: 5, height: 9, width: 9 }} />
            <Text style={{ color: mesh.ink700, fontSize: 14, fontWeight: "700" }}>{statusMeta?.name || "-"}</Text>
          </View>
        </View>
      </View>

      <MeshScroll style={{ backgroundColor: "#F7FAF7", marginTop: -22, paddingHorizontal: 16, position: "relative", zIndex: 2 }} bottom={100}>
        {deleteError ? (
          <Text style={{ color: mesh.pink, fontSize: 12, lineHeight: 18, marginTop: 8, paddingHorizontal: 4 }}>{deleteError}</Text>
        ) : null}

        {/* Dynamic info card — only renders rows for fields that have data */}
        {(() => {
          type InfoField = { icon: keyof typeof Ionicons.glyphMap; label: string; value: string };
          const fields: InfoField[] = [];
          if (contact.phone)   fields.push({ icon: "call-outline",       label: t("phone"),      value: contact.phone });
          if (contact.email)   fields.push({ icon: "mail-outline",       label: "Email",         value: contact.email });
          if (contact.address) fields.push({ icon: "location-outline",   label: t("address"),    value: contact.address });
          if (contact.source)  fields.push({ icon: "chatbubble-outline", label: t("howYouMet"),  value: contact.source });
          if (contact.birthday) {
            const d = new Date(contact.birthday);
            const formatted = isNaN(d.getTime())
              ? contact.birthday
              : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
            fields.push({ icon: "gift-outline", label: t("birthday"), value: formatted });
          }
          // All social links as individual rows
          const links = contact.socialLinks && contact.socialLinks.length > 0
            ? contact.socialLinks
            : contact.social ? [contact.social] : [];
          links.forEach((link, i) => {
            fields.push({ icon: "globe-outline", label: i === 0 ? t("social") : `${t("social")} ${i + 1}`, value: link });
          });

          if (fields.length === 0) return null;
          return (
            <MeshCard style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 24, borderWidth: 1, elevation: 2, marginTop: 0, overflow: "hidden", paddingHorizontal: 20, paddingVertical: 14, shadowColor: "#064532", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18 }}>
              {fields.map((f, i) => (
                <InfoRow key={`${f.label}-${i}`} icon={f.icon} label={f.label} value={f.value} last={i === fields.length - 1} />
              ))}
            </MeshCard>
          );
        })()}

        {/* Special Days section */}
        {contact.specialDays && contact.specialDays.length > 0 && (
          <>
            <Text style={{ color: mesh.green800, fontSize: 17, fontWeight: "800", letterSpacing: -0.2, paddingHorizontal: 4, paddingTop: 20, paddingBottom: 10 }}>
              {t("specialDay")}
            </Text>
            <MeshCard style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 24, borderWidth: 1, elevation: 2, overflow: "hidden", paddingHorizontal: 20, paddingVertical: 14, shadowColor: "#064532", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18 }}>
              {contact.specialDays.map((sd, i) => {
                const d = new Date(sd.date);
                const formatted = isNaN(d.getTime())
                  ? sd.date
                  : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                return (
                  <InfoRow
                    key={sd.id}
                    icon="calendar-outline"
                    label={sd.name}
                    value={formatted}
                    last={i === (contact.specialDays?.length ?? 0) - 1}
                  />
                );
              })}
            </MeshCard>
          </>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 24, paddingBottom: 12 }}>
          <Text style={{ color: mesh.green800, fontSize: 22, fontWeight: "800", letterSpacing: -0.3, lineHeight: 28 }}>{t("timeline")}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {tabs.map((item) => (
            <MeshChip key={item.id} active={tab === item.id} onPress={() => setTab(item.id)} style={{ backgroundColor: tab === item.id ? mesh.green700 : "#FFFFFF", borderColor: tab === item.id ? mesh.green700 : mesh.line, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 }}>
              {item.label}
            </MeshChip>
          ))}
        </View>

        <View style={{ paddingLeft: 46, position: "relative" }}>
          {filtered.length > 0 ? <View style={{ backgroundColor: "rgba(6,69,50,0.16)", bottom: 22, left: 13, position: "absolute", top: 14, width: 2 }} /> : null}
          {filtered.length === 0 ? (
            <Text style={{ color: mesh.ink400, fontSize: 13, textAlign: "center", paddingVertical: 20 }}>
              No timeline items yet.
            </Text>
          ) : filtered.map((item, index) => {
            const color = item.kind === "reminder" ? mesh.orange : item.kind === "special" ? mesh.pink : mesh.green700;
            return (
              <View key={`${item.title}-${index}`} style={{ position: "relative", marginBottom: 14 }}>
                <View style={{ alignItems: "center", backgroundColor: "#FFFFFF", borderColor: color, borderRadius: 17, borderWidth: 2, height: 34, justifyContent: "center", left: -46, position: "absolute", top: 2, width: 34, zIndex: 2 }}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={15} color={color} />
                </View>
                <MeshCard style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.05)", borderRadius: 20, borderWidth: 1, elevation: 1, padding: 14, shadowColor: "#064532", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.035, shadowRadius: 12 }}>
                  <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color, fontSize: 12, fontWeight: "800", letterSpacing: 1.4 }}>{item.label.toUpperCase()}</Text>
                    <Text style={{ color: mesh.ink500, fontSize: 13, fontWeight: "500" }}>{item.date}</Text>
                  </View>
                  <Text style={{ color: mesh.ink900, fontSize: 18, fontWeight: "800", marginTop: 8 }}>{item.title}</Text>
                  <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 20, marginTop: 6 }}>{item.desc}</Text>
                </MeshCard>
              </View>
            );
          })}
        </View>
      </MeshScroll>
      {/* ── More menu ── */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }} onPress={() => setMenuOpen(false)}>
          <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(6,69,50,0.15)", alignSelf: "center", marginBottom: 12 }} />
            <Pressable
              onPress={() => { setMenuOpen(false); if (contact) nav("editContact", { id: contact.id }); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderColor: "rgba(6,69,50,0.07)" }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(31,112,72,0.09)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="create-outline" size={20} color={mesh.green700} />
              </View>
              <Text style={{ color: mesh.ink900, fontSize: 16, fontWeight: "700" }}>{t("editContact")}</Text>
            </Pressable>
            <Pressable
              onPress={() => { setMenuOpen(false); setConfirmDelete(true); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 24, paddingVertical: 16 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(220,38,38,0.08)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="trash-outline" size={20} color={mesh.pink} />
              </View>
              <Text style={{ color: mesh.pink, fontSize: 16, fontWeight: "700" }}>{t("delete")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
        onConfirm={handleDeleteContact}
        title={t("deleteContactTitle")}
        desc={deleting ? "Deleting contact..." : t("deleteContactDesc")}
        confirmLabel={deleting ? "Deleting..." : t("delete")}
        cancelLabel={t("cancel")}
      />
    </MeshScreen>
  );
}

function InfoRow({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={{ alignItems: "center", borderBottomWidth: last ? 0 : 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", gap: 14, paddingVertical: 13 }}>
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.09)", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }}>
        <Ionicons name={icon} size={20} color={mesh.green700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink500, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: mesh.ink900, fontSize: 16, fontWeight: "700", marginTop: 3 }}>{value}</Text>
      </View>
    </View>
  );
}

export function CreateContactScreen({
  t, nav, edit = false, contactId,
  presentation = "page", onCloseSheet, onCreated,
}: Props & {
  edit?: boolean;
  contactId?: string;
  /** "sheet" = rendered inside a QuickCreateSheet bottom sheet */
  presentation?: "page" | "sheet";
  onCloseSheet?: () => void;
  onCreated?: (result: { type: "contact"; id?: string; name: string; highlightLatest?: boolean }) => void;
}) {
  const isSheet = presentation === "sheet";
  const insets = useSafeAreaInsets();

  // ── Statuses from API (fallback: mock) ────────────────────────────────────
  const [pickerStatuses, setPickerStatuses] = useState<Status[]>(mockStatuses);

  useEffect(() => {
    getStatuses()
      .then((resp) => {
        const normalized = extractArray(resp, "statuses")
          .map(normalizeApiStatus)
          .filter(Boolean) as Status[];
        if (normalized.length > 0) setPickerStatuses(normalized);
      })
      .catch(() => { /* keep mock statuses as fallback */ });
  }, []);

  // ── Core fields ────────────────────────────────────────────────────────────
  const [name,   setName]   = useState("");
  const [phone,  setPhone]  = useState("");
  const [email,  setEmail]  = useState("");
  // Empty string = "no status selected yet" — avoids sending a mock ID to the API
  const [status, setStatus] = useState("");

  // ── Additional text fields (unique ones) ───────────────────────────────────
  const [birthday,     setBirthday]     = useState<Date | null>(null);
  const [howYouMet,    setHowYouMet]    = useState("");
  const [address,      setAddress]      = useState("");
  const [social,       setSocial]       = useState("");
  const [note,         setNote]         = useState("");
  // "specialDay" never goes into activeFields; it's tracked in specialDays[]
  type UniqueField = Exclude<AddField, "specialDay">;
  const [activeFields, setActiveFields] = useState<UniqueField[]>([]);

  // ── Special days ───────────────────────────────────────────────────────────
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [statusOpen,       setStatusOpen]       = useState(false);
  const [addFieldOpen,     setAddFieldOpen]     = useState(false);
  const [popupY,           setPopupY]           = useState(0);
  const [popupX,           setPopupX]           = useState(0);
  const [datePickerOpen,   setDatePickerOpen]   = useState(false);
  const [dateTarget,       setDateTarget]       = useState<DateTarget | null>(null);
  const [pickerValue,      setPickerValue]      = useState<Date | null>(null);
  const [pickerEventName,  setPickerEventName]  = useState("");
  const [datePickerIsNew,  setDatePickerIsNew]  = useState(false);
  const [savePhase,        setSavePhase]        = useState<SavePhase>("idle");
  const [saveError,        setSaveError]        = useState("");
  const [loadingEdit,      setLoadingEdit]      = useState(edit && !!contactId);

  const saving = savePhase === "saving";
  const saveSuccess = savePhase === "success";

  const addFieldRef = useRef<View>(null);
  const scrollRef   = useRef<ScrollView>(null);
  const rowYRef     = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ── Keyboard awareness ─────────────────────────────────────────────────────
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // registerRow: call from onLayout of a View that wraps the field
  const registerRow = (key: string) => (e: LayoutChangeEvent) => {
    rowYRef.current[key] = e.nativeEvent.layout.y;
  };

  // scrollToRow: bring the field above the keyboard
  const scrollToRow = (key: string) => {
    setTimeout(() => {
      const rowY = rowYRef.current[key];
      if (typeof rowY !== "number") return;
      const sectionY     = rowYRef.current["additionalSection"] ?? 0;
      const SECTION_HEADER = 44;
      const base   = sectionY + SECTION_HEADER + rowY;
      const offset = key === "note" ? 130 : 90;
      scrollRef.current?.scrollTo({ y: Math.max(0, base - offset), animated: true });
    }, 260);
  };

  // ── Load existing contact in edit mode ────────────────────────────────────
  useEffect(() => {
    if (!edit || !contactId) return;
    let active = true;
    setLoadingEdit(true);

    getContactById(contactId)
      .then((resp) => {
        if (!active) return;
        const root = asRec(resp);
        const data = asRec(root?.data) ?? root;
        const item = asRec(data?.contact) ?? data;
        if (!item) return;

        if (typeof item.name  === "string") setName(item.name);
        if (typeof item.phone === "string") setPhone(item.phone);
        if (typeof item.email === "string") setEmail(item.email);

        const sr = asRec(item.status);
        const sid = item.statusId ?? sr?._id ?? sr?.id;
        if (typeof sid === "string" && sid) setStatus(sid);

        const newFields: UniqueField[] = [];

        if (typeof item.birthday === "string" && item.birthday) {
          setBirthday(new Date(item.birthday));
          newFields.push("birthday");
        }
        if (typeof item.address === "string" && item.address) {
          setAddress(item.address);
          newFields.push("address");
        }
        if (typeof item.source === "string" && item.source) {
          setHowYouMet(item.source);
          newFields.push("howYouMet");
        }
        const links = Array.isArray(item.socialLinks) ? item.socialLinks : [];
        if (links.length > 0 && typeof links[0] === "string" && links[0]) {
          setSocial(links[0]);
          newFields.push("social");
        }
        if (newFields.length > 0) setActiveFields(newFields);

        if (Array.isArray(item.specialDays) && item.specialDays.length > 0) {
          setSpecialDays(
            item.specialDays.map((sd: unknown, i: number) => {
              const r = asRec(sd);
              const title = typeof r?.occasion === "string" ? r.occasion
                          : typeof r?.name     === "string" ? r.name
                          : "";
              return {
                id:    String(i),
                title,
                date:  typeof r?.date === "string" ? new Date(r.date) : null,
              };
            })
          );
        }
      })
      .catch(() => { /* ignore — form stays empty so user can re-fill */ })
      .finally(() => { if (active) setLoadingEdit(false); });

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, contactId]);

  // ── Popup positioning — measured below the Add field button ───────────────
  const openPopup = () => {
    addFieldRef.current?.measureInWindow((x, y, _w, h) => {
      setPopupY(y + h + 8);
      setPopupX(x);
      setAddFieldOpen(true);
    });
  };

  const removeField = (f: UniqueField) => setActiveFields(prev => prev.filter(x => x !== f));

  // ── Add field / special day handling ──────────────────────────────────────
  const handleAddField = (f: AddField) => {
    setAddFieldOpen(false);
    if (f === "specialDay") {
      const newIdx = specialDays.length;
      setSpecialDays(prev => [...prev, { id: String(Date.now()), title: "", date: null }]);
      setDateTarget({ kind: "specialDay", index: newIdx });
      setPickerValue(null);
      setPickerEventName("");
      setDatePickerIsNew(true);
      setDatePickerOpen(true);
    } else {
      setActiveFields(prev => [...prev, f as UniqueField]);
    }
  };

  // ── Date picker ────────────────────────────────────────────────────────────
  const openDatePicker = (target: DateTarget) => {
    setDateTarget(target);
    if (target.kind === "birthday") {
      setPickerValue(birthday);
      setPickerEventName("");
    } else {
      const sd = specialDays[(target as { kind: "specialDay"; index: number }).index];
      setPickerValue(sd?.date ?? null);
      setPickerEventName(sd?.title ?? "");
    }
    setDatePickerIsNew(false);
    setDatePickerOpen(true);
  };

  const cancelDatePicker = () => {
    if (datePickerIsNew && dateTarget?.kind === "specialDay") {
      const idx = (dateTarget as { kind: "specialDay"; index: number }).index;
      setSpecialDays(prev => prev.filter((_, i) => i !== idx));
    }
    setDatePickerOpen(false);
  };

  const confirmDate = () => {
    if (!dateTarget) return;
    const finalDate = pickerValue ?? new Date();
    if (dateTarget.kind === "birthday") {
      setBirthday(finalDate);
    } else {
      const idx = (dateTarget as { kind: "specialDay"; index: number }).index;
      setSpecialDays(prev =>
        prev.map((sd, i) => i === idx ? { ...sd, title: pickerEventName, date: finalDate } : sd)
      );
    }
    setDatePickerOpen(false);
  };

  // ── Avatar picker ──────────────────────────────────────────────────────────
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) { setSaveError(t("nameRequired") || "Name is required"); return; }
    setSaveError("");
    try {
      const isMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

      const payload: Record<string, unknown> = {
        name:     name.trim(),
        phone:    phone.trim()     || undefined,
        email:    email.trim()     || undefined,
        statusId: status && isMongoId(status) ? status : undefined,
        birthday: birthday         ? birthday.toISOString() : undefined,
        source:   howYouMet.trim() || undefined,
        address:  address.trim()   || undefined,
        socialLinks: social.trim() ? [social.trim()] : undefined,
      };

      const specialDaysPayload = specialDays
        .filter((sd) => sd.date !== null)
        .map((sd) => ({
          occasion:     sd.title.trim() || t("specialDay"),
          date:         sd.date!.toISOString(),
          repeatYearly: true,
        }));
      if (specialDaysPayload.length > 0) {
        payload.specialDays = specialDaysPayload;
      }

      if (edit && contactId) {
        setSavePhase("saving");
        await updateContact(contactId, payload);
        setSavePhase("success");
        await delay(SUCCESS_HOLD_MS);
        if (isSheet) { onCreated?.({ type: "contact", id: contactId, name: name.trim() }); onCloseSheet?.(); } else { nav("contactDetail", { id: contactId }); }
      } else {
        setSavePhase("saving");
        const response = await createContact(payload);
        const createdId = extractCreatedId(response);
        const createdName = name.trim();

        setSavePhase("success");
        await delay(SUCCESS_HOLD_MS);

        if (isSheet) {
          onCreated?.({
            type: "contact",
            id: createdId,
            name: createdName,
            highlightLatest: !createdId,
          });
          onCloseSheet?.();
        } else {
          nav("contacts", {
            highlightId: createdId,
            highlightName: createdName,
            refresh: Date.now(),
          });
        }
      }
    } catch (err: unknown) {
      setSavePhase("idle");
      setSaveError(err instanceof Error ? err.message : "Failed to save contact");
    }
  };

  // ── Field meta (popup menu options) ───────────────────────────────────────
  const clearContactForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setStatus("");
    setBirthday(null);
    setHowYouMet("");
    setAddress("");
    setSocial("");
    setNote("");
    setSpecialDays([]);
    setActiveFields([]);
    setAvatarUri(null);
    setSaveError("");
  };

  const fieldMeta: { key: AddField; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "birthday",   icon: "gift-outline",          label: t("birthday")   },
    { key: "address",    icon: "location-outline",      label: t("address")    },
    { key: "specialDay", icon: "calendar-outline",      label: t("specialDay") },
    { key: "howYouMet",  icon: "chatbubble-outline",    label: t("howYouMet")  },
    { key: "social",     icon: "globe-outline",         label: t("social")     },
    { key: "note",       icon: "document-text-outline", label: t("moreNote")   },
  ];
  const availableFields = fieldMeta.filter(f =>
    f.key === "specialDay" || !activeFields.includes(f.key as UniqueField)
  );

  const fieldIcon:  Partial<Record<AddField, keyof typeof Ionicons.glyphMap>> = Object.fromEntries(fieldMeta.map(f => [f.key, f.icon]));
  const fieldLabel: Partial<Record<AddField, string>>                         = Object.fromEntries(fieldMeta.map(f => [f.key, f.label]));

  const hasAdditional = activeFields.length > 0 || specialDays.length > 0;

  const currentStatus = status
    ? (pickerStatuses.find((s) => s.id === status) ?? statusById(status))
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loadingEdit) {
    return (
      <MeshScreen style={{ backgroundColor: "#F7FBF6" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: insets.top }}>
          <ActivityIndicator size="large" color={mesh.green700} />
        </View>
      </MeshScreen>
    );
  }

  return (
    <MeshScreen style={{ backgroundColor: "#F7FBF6" }}>

      {/* ── Single full-screen light mesh background ── */}
      <MeshGradientView
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        columns={4} rows={4}
        colors={[
          "#DFF0E8","#E8F5EE","#F2FAF5","#F7FBF6",
          "#E8F5EE","#EEF8F2","#F4FAF7","#F8FCF9",
          "#F2FAF5","#F5FBF7","#F8FCFA","#FAFDFB",
          "#F7FBF6","#F9FCF8","#FAFDFB","#FCFEFB",
        ]}
        points={[[0,0],[0.35,0],[0.7,0],[1,0],[0,0.28],[0.35,0.34],[0.7,0.32],[1,0.28],[0,0.62],[0.35,0.66],[0.7,0.7],[1,0.68],[0,1],[0.35,1],[0.7,1],[1,1]]}
        smoothsColors
      />

      {/* Leaf decoration — top-right, very subtle */}
      <Image
        source={leafPng}
        resizeMode="contain"
        style={{ height: 280, opacity: 0.065, position: "absolute", right: -90, top: insets.top - 10, transform: [{ rotate: "-14deg" }], width: 320 }}
      />

      {/* ── Top bar ── */}
      <View style={{ paddingTop: isSheet ? 18 : insets.top + 14, paddingHorizontal: 20, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => isSheet ? onCloseSheet?.() : nav(edit ? "contactDetail" : "contacts", { id: contactId })} />
          <Text
            numberOfLines={1}
            style={{ position: "absolute", left: 96, right: 96, textAlign: "center", color: mesh.green800, fontSize: 20, fontWeight: "900", letterSpacing: -0.3 }}
          >
            {edit ? t("editContact") : t("createContact")}
          </Text>
          <Pressable onPress={clearContactForm} hitSlop={10}>
            <Text style={{ color: mesh.green800, fontSize: 15, fontWeight: "800" }}>{t("clear")}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Scrollable form ── */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={{ backgroundColor: "transparent" }}
          contentContainerStyle={{ paddingBottom: 150 + keyboardHeight }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar ── */}
          <View style={{ alignItems: "center", marginTop: 28, marginBottom: 22 }}>
            <Pressable onPress={pickAvatar} style={{ position: "relative" }}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: "rgba(255,255,255,0.9)" }}
                />
              ) : name.trim() ? (
                <Avatar name={name.trim()} size={92} />
              ) : (
                <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: "rgba(31,112,72,0.09)", borderWidth: 3, borderColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person-outline" size={40} color={mesh.green700} />
                </View>
              )}
              <View style={{ alignItems: "center", backgroundColor: mesh.green700, borderColor: "#FFFFFF", borderRadius: 15, borderWidth: 2.5, bottom: 0, height: 30, justifyContent: "center", position: "absolute", right: 0, width: 30 }}>
                <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "700", marginTop: 9 }}>{t("addAvatar")}</Text>
          </View>

          {/* ── Save error banner ── */}
          {saveError ? (
            <View style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: "rgba(220,38,38,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(220,38,38,0.18)", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={{ flex: 1, color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{saveError}</Text>
            </View>
          ) : null}

          {/* ── Field card: Name / Phone / Email / Relationship ── */}
          <View style={{
            marginHorizontal: 24,
            borderRadius: 28,
            backgroundColor: "rgba(255,255,255,0.92)",
            borderWidth: 1,
            borderColor: "rgba(6,69,50,0.08)",
            overflow: "hidden",
            shadowColor: "#064532",
            shadowOpacity: 0.025,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 1,
          }}>
            <ContactFieldRow
              icon="person-outline"
              label={`${t("name")} *`}
              value={name}
              placeholder={t("enterName")}
              onChangeText={setName}
            />
            <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.055)", marginLeft: 70 }} />
            <ContactFieldRow
              icon="call-outline"
              label={t("phone")}
              value={phone}
              placeholder={t("enterPhone")}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.055)", marginLeft: 70 }} />
            <ContactFieldRow
              icon="mail-outline"
              label="Email"
              value={email}
              placeholder={t("enterEmail")}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.055)", marginLeft: 70 }} />
            <ContactFieldPickerRow
              icon="people-outline"
              label={t("relationship")}
              value={currentStatus?.name ?? ""}
              placeholder="Choose"
              statusColor={currentStatus?.color}
              onPress={() => setStatusOpen(true)}
            />
          </View>

          {/* ── Add field button ── */}
          {availableFields.length > 0 && (
            <View ref={addFieldRef} collapsable={false} style={{ marginLeft: 24, marginTop: 18 }}>
              <Pressable
                onPress={openPopup}
                style={{
                  alignSelf: "flex-start",
                  minHeight: 44,
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: "rgba(31,112,72,0.08)",
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(31,112,72,0.12)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="add" size={16} color={mesh.green700} />
                </View>
                <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "700" }}>{t("addField")}</Text>
              </Pressable>
            </View>
          )}

          {/* ── Additional information (shown after fields are added) ── */}
          {hasAdditional && (
            <View onLayout={registerRow("additionalSection")} style={{ marginHorizontal: 16 }}>
              <FormSection title={t("additionalInfo")}>
                {/* Birthday row */}
                {activeFields.includes("birthday") && (
                  <Pressable
                    onPress={() => openDatePicker({ kind: "birthday" })}
                    style={{ alignItems: "center", borderBottomWidth: 1, borderColor: "rgba(6,69,50,0.055)", flexDirection: "row", gap: 12, paddingHorizontal: 14, paddingVertical: 10 }}
                  >
                    <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.055)", borderRadius: 13, height: 38, justifyContent: "center", width: 38 }}>
                      <Ionicons name="gift-outline" size={18} color={mesh.green700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "600", marginBottom: 2 }}>{t("birthday")}</Text>
                      <Text style={{ color: birthday ? mesh.green700 : mesh.ink400, fontSize: 14 }}>
                        {birthday ? formatDateShort(birthday) : t("selectDate")}
                      </Text>
                    </View>
                    <Pressable onPress={() => { removeField("birthday"); setBirthday(null); }} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={18} color={mesh.ink300} />
                    </Pressable>
                  </Pressable>
                )}

                {/* Text fields (howYouMet / address / social / note) */}
                {(["howYouMet", "address", "social", "note"] as const).filter(f => activeFields.includes(f)).map((f, loopIdx, arr) => {
                  const fieldStateMap: Record<typeof f, [string, (v: string) => void]> = {
                    howYouMet: [howYouMet, setHowYouMet],
                    address:   [address,   setAddress],
                    social:    [social,    setSocial],
                    note:      [note,      setNote],
                  };
                  const [val, setter] = fieldStateMap[f];
                  const isLastText = loopIdx === arr.length - 1 && specialDays.length === 0;
                  return (
                    <View key={f} onLayout={registerRow(f)}>
                      <AdditionalRow
                        icon={fieldIcon[f] ?? "ellipsis-horizontal-outline"}
                        label={fieldLabel[f] ?? f}
                        value={val}
                        onChangeText={setter}
                        multiline={f === "note"}
                        onRemove={() => removeField(f)}
                        onFocus={() => scrollToRow(f)}
                        last={isLastText}
                      />
                    </View>
                  );
                })}

                {/* Special day rows */}
                {specialDays.map((sd, i) => (
                  <SpecialDayRow
                    key={sd.id}
                    item={sd}
                    onPress={() => openDatePicker({ kind: "specialDay", index: i })}
                    onRemove={() => setSpecialDays(prev => prev.filter((_, j) => j !== i))}
                    last={i === specialDays.length - 1}
                    fallbackLabel={t("specialDay")}
                    selectDateLabel={t("selectDate")}
                  />
                ))}
              </FormSection>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Status picker bottom sheet ── */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
          borderTopWidth: 1,
          borderTopColor: "rgba(6,69,50,0.06)",
          paddingBottom: insets.bottom + 14,
          paddingHorizontal: 20,
          paddingTop: 12,
        }}
      >
        <Pressable
          disabled={savePhase === "saving" || savePhase === "success"}
          onPress={handleSave}
          style={{ borderRadius: 999, opacity: savePhase !== "idle" ? 0.82 : 1, overflow: "hidden" }}
        >
          <LinearGradient
            colors={["#064532", "#0B6B48", "#02A45C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              alignItems: "center",
              borderRadius: 999,
              flexDirection: "row",
              gap: 10,
              justifyContent: "center",
              minHeight: 58,
            }}
          >
            {savePhase === "saving" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : savePhase === "success" ? (
              <Ionicons name="checkmark-circle" size={21} color="#FFFFFF" />
            ) : (
              <Ionicons name="save-outline" size={21} color="#FFFFFF" />
            )}
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800" }}>
              {savePhase === "saving" ? "Creating..." : savePhase === "success" ? "Created" : "Save contact"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <StatusPicker open={statusOpen} value={status} statuses={pickerStatuses} onClose={() => setStatusOpen(false)} onPick={setStatus} t={t} />

      {/* ── Add field popup — transparent modal, anchored ABOVE the button ── */}
      <Modal visible={addFieldOpen} transparent animationType="none" onRequestClose={() => setAddFieldOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setAddFieldOpen(false)}>
          <View style={{
            position: "absolute",
            top: Math.max(insets.top + 12, popupY - 8 - availableFields.length * 46 - 16),
            left: popupX,
            width: 260,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.98)",
            borderWidth: 1,
            borderColor: "rgba(6,69,50,0.07)",
            paddingVertical: 8,
            shadowColor: "#064532",
            shadowOpacity: 0.075,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}>
            {availableFields.map((f, i) => (
              <Pressable
                key={`${f.key}-${i}`}
                onPress={() => handleAddField(f.key)}
                style={{
                  minHeight: 46,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  borderBottomWidth: i < availableFields.length - 1 ? 1 : 0,
                  borderColor: "rgba(6,69,50,0.055)",
                }}
              >
                <View style={{ width: 30, alignItems: "center", marginRight: 10 }}>
                  <Ionicons name={f.icon} size={17} color={mesh.green700} />
                </View>
                <Text style={{ flex: 1, color: mesh.ink700, fontSize: 15, fontWeight: "700" }}>{f.label}</Text>
              </Pressable>
            ))}
            {/* Arrow notch — bottom of popup, pointing DOWN toward the Add field button */}
            <View style={{
              position: "absolute",
              bottom: -8,
              left: 28,
              width: 16,
              height: 16,
              backgroundColor: "rgba(255,255,255,0.98)",
              transform: [{ rotate: "45deg" }],
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderColor: "rgba(6,69,50,0.07)",
            }} />
          </View>
        </Pressable>
      </Modal>

      {/* ── Date / special-day picker bottom sheet ── */}
      <Modal visible={datePickerOpen} transparent animationType="slide" onRequestClose={cancelDatePicker}>
        <View style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
          <Pressable
            onPress={cancelDatePicker}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
            <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
              <Pressable onPress={cancelDatePicker} hitSlop={10}>
                <Text maxFontSizeMultiplier={1.1} style={{ color: mesh.ink400, fontSize: SHEET_FONT.action, fontWeight: "700" }}>{t("cancel")}</Text>
              </Pressable>
              <Text maxFontSizeMultiplier={1.1} style={{ color: mesh.green800, fontSize: SHEET_FONT.title, fontWeight: "800" }}>
                {dateTarget?.kind === "birthday" ? t("birthday") : t("specialDay")}
              </Text>
              <Pressable onPress={confirmDate} hitSlop={10}>
                <Text maxFontSizeMultiplier={1.1} style={{ color: mesh.green700, fontSize: SHEET_FONT.action, fontWeight: "800" }}>{t("done")}</Text>
              </Pressable>
            </View>
            {dateTarget?.kind === "specialDay" && (
              <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
                <TextInput
                  value={pickerEventName}
                  onChangeText={setPickerEventName}
                  placeholder={t("eventName")}
                  placeholderTextColor="#8C9691"
                  returnKeyType="done"
                  maxFontSizeMultiplier={1.1}
                  style={{
                    height: 48, borderRadius: 16,
                    backgroundColor: "rgba(31,112,72,0.06)",
                    borderWidth: 1, borderColor: "rgba(31,112,72,0.14)",
                    paddingHorizontal: 16,
                    fontSize: SHEET_FONT.input, color: mesh.ink900, fontWeight: "600",
                  }}
                />
              </View>
            )}
            <WheelDatePicker value={pickerValue} onChange={setPickerValue} />
            {pickerValue && (
              <View style={{ marginHorizontal: 20, marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(31,112,72,0.08)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 }}>
                <Ionicons name="calendar-outline" size={15} color={mesh.green700} />
                <Text maxFontSizeMultiplier={1.1} style={{ color: mesh.green700, fontSize: SHEET_FONT.preview, fontWeight: "800" }}>{formatDateShort(pickerValue)}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </MeshScreen>
  );
}

// ── ContactFieldRow — text-input row inside the main field card ──────────────

function ContactFieldRow({
  icon, label, value, placeholder, onChangeText, keyboardType, autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder?: string;
  onChangeText?: (v: string) => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={{ minHeight: 62, flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.055)", marginRight: 14 }}>
        <Ionicons name={icon} size={18} color={mesh.green700} />
      </View>
      <Text style={{ width: 138, color: mesh.green800, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={mesh.ink300}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{ flex: 1, color: mesh.ink900, fontSize: 15, textAlign: "right", paddingVertical: 0 }}
      />
    </View>
  );
}

// ── ContactFieldPickerRow — tappable picker row (e.g. Relationship) ──────────

function ContactFieldPickerRow({
  icon, label, value, placeholder, onPress, statusColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder?: string;
  onPress?: () => void;
  statusColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ minHeight: 62, flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.055)", marginRight: 14 }}>
        <Ionicons name={icon} size={18} color={mesh.green700} />
      </View>
      <Text style={{ width: 138, color: mesh.green800, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>{label}</Text>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
        {statusColor ? (
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: statusColor }} />
        ) : null}
        <Text style={{ color: value ? mesh.ink700 : mesh.ink300, fontSize: 15 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={mesh.ink400} style={{ marginLeft: 2 }} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.90)",
        borderColor: "rgba(6,69,50,0.055)",
        borderRadius: 28,
        borderWidth: 1,
        elevation: 1,
        marginTop: 16,
        overflow: "hidden",
        shadowColor: "#064532",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.018,
        shadowRadius: 10,
      }}
    >
      {title ? (
        <Text style={{ color: mesh.green800, fontSize: 12, fontWeight: "800", letterSpacing: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 }}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={{ overflow: "hidden" }}>
        {children}
      </View>
    </View>
  );
}

function StatusPicker({ open, value, statuses, onClose, onPick, t }: { open: boolean; value: string; statuses: Status[]; onClose: () => void; onPick: (value: string) => void; t: TFn }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginBottom: 14 }} />
          <Text style={{ textAlign: "center", color: mesh.green800, fontSize: 18, fontWeight: "800", marginBottom: 16 }}>{t("chooseStatus")}</Text>
          {statuses.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => { onPick(s.id); onClose(); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: mesh.line }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: s.color }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>{s.name}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{s.desc}</Text>
              </View>
              {value === s.id ? <Ionicons name="checkmark" size={18} color={mesh.green700} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ContactsEmptyScreen({ t, lang, nav }: Props) {
  const [quickCreateMode, setQuickCreateMode] = useState<"note" | "contact" | null>(null);
  return (
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar name="Trung" size={48} ring />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "800" }}>{t("contacts")}</Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 }}>{t("contactsCount", { n: 0 })}</Text>
          </View>
          <HeaderCircleBtn icon="add" onPress={() => nav("createContact")} />
        </View>
      </MeshHeader>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingBottom: 100 }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(31,112,72,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Ionicons name="person-outline" size={48} color={mesh.green700} />
        </View>
        <Text style={{ color: mesh.ink900, fontSize: 22, fontWeight: "800", marginBottom: 10 }}>{t("noContactsTitle")}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, textAlign: "center" }}>{t("noContactsDesc")}</Text>
        <Pressable onPress={() => nav("createContact")} style={{ marginTop: 24, borderRadius: mesh.radiusMd, paddingHorizontal: 22, paddingVertical: 13, backgroundColor: mesh.green700, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>{t("addFirstContact")}</Text>
        </Pressable>
      </View>
      <BottomNav
        active="contacts"
        t={t}
        onQuickCreateContact={() => setQuickCreateMode("contact")}
        onQuickCreateNote={() => setQuickCreateMode("note")}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "notes") nav("notes");
          else if (id === "status") nav("status");
        }}
      />

      <QuickCreateSheet
        open={quickCreateMode !== null}
        onClose={() => setQuickCreateMode(null)}
      >
        {quickCreateMode === "note" && (
          <CreateNoteScreen
            t={t}
            lang={lang}
            nav={nav}
            presentation="sheet"
            onCloseSheet={() => setQuickCreateMode(null)}
            onCreated={(result) => {
              setQuickCreateMode(null);
              nav("notes", {
                highlightId: result.id,
                highlightLatest: result.highlightLatest,
                refresh: Date.now(),
              });
            }}
          />
        )}
        {quickCreateMode === "contact" && (
          <CreateContactScreen
            t={t}
            lang={lang}
            nav={nav}
            presentation="sheet"
            onCloseSheet={() => setQuickCreateMode(null)}
            onCreated={(result) => {
              setQuickCreateMode(null);
              nav("contacts", {
                highlightId: result.id,
                highlightName: result.name,
                refresh: Date.now(),
              });
            }}
          />
        )}
      </QuickCreateSheet>
    </MeshScreen>
  );
}
