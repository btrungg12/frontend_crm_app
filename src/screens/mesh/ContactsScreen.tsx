import { Ionicons } from "@expo/vector-icons";
import { MeshGradientView } from "expo-mesh-gradient";
import * as ImagePicker from "expo-image-picker";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createContact, deleteContact, getContactById, getContactTimeline, getContacts, updateContact } from "../../api/contactApi";
import { extractArray, normalizeApiContact } from "../../api/screenAdapters";
import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { Avatar, BottomNav, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshChip, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, StatusChip, TFn, TipCard } from "../../mesh/MeshComponents";
import { GradientAvatar } from "../../components/GradientAvatar";
import { Contact, contactById, Lang, statuses, statusById } from "../../mesh/meshData";
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
  icon, label, value, onChangeText, multiline = false, onRemove, last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string;
  onChangeText?: (v: string) => void; multiline?: boolean;
  onRemove: () => void; last?: boolean;
}) {
  return (
    <View style={{
      borderBottomWidth: last ? 0 : 1, borderColor: "rgba(6,69,50,0.08)",
      flexDirection: "row", alignItems: "flex-start",
      gap: 12, paddingHorizontal: 12, paddingVertical: 12,
    }}>
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42, flexShrink: 0 }}>
        <Ionicons name={icon} size={20} color={mesh.green700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "700", marginBottom: 2 }}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          placeholder="—"
          placeholderTextColor="#8C9691"
          style={{ color: mesh.ink900, fontSize: 14 }}
        />
      </View>
      <Pressable onPress={onRemove} hitSlop={8} style={{ paddingTop: 11 }}>
        <Ionicons name="close-circle-outline" size={20} color={mesh.ink400} />
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
        borderBottomWidth: last ? 0 : 1, borderColor: "rgba(6,69,50,0.08)",
        flexDirection: "row", alignItems: "center",
        gap: 12, paddingHorizontal: 12, paddingVertical: 12,
      }}
    >
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42, flexShrink: 0 }}>
        <Ionicons name="calendar-outline" size={20} color={mesh.green700} />
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
        <Ionicons name="close-circle-outline" size={20} color={mesh.ink400} />
      </Pressable>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

export function ContactsScreen({ t, lang, nav }: Props) {
  const [filter, setFilter] = useState("all");
  const [apiContacts, setApiContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sourceContacts = apiContacts;
  const filters = [{ id: "all", label: t("fAll"), color: null }, ...statuses.slice(0, 4).map((status) => ({ id: status.id, label: status.name, color: status.color }))];
  const list = filter === "all" ? sourceContacts : sourceContacts.filter((contact) => contact.status === filter);

  useEffect(() => {
    let active = true;

    getContacts()
      .then((response) => {
        if (!active) return;
        const normalized = extractArray(response, "contacts").map(normalizeApiContact).filter(Boolean) as Contact[];
        setApiContacts(normalized);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setApiContacts([]);
        setError(err instanceof Error && err.message ? err.message : "Cannot load contacts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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

      <MeshScroll bottom={150}>
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          {filters.map((item) => (
            <MeshChip key={item.id} active={filter === item.id} onPress={() => setFilter(item.id)} style={{ backgroundColor: filter === item.id ? mesh.green700 : "#FFFFFF", borderColor: filter === item.id ? mesh.green700 : "rgba(6,69,50,0.12)" }}>
              {item.label}
            </MeshChip>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {loading ? (
            <InlineState label="Loading contacts..." loading />
          ) : error ? (
            <InlineState label={error} error />
          ) : list.length === 0 ? (
            <InlineState label="No contacts from API." />
          ) : Object.keys(grouped).sort().map((key) => (
            <View key={key}>
              <Text style={{ color: "#7A837E", fontSize: mesh.font.bodySm, fontWeight: "700", marginTop: 18, marginBottom: 8 }}>{key}</Text>
              {grouped[key].map((contact, index) => (
                <Pressable
                  key={contact.id}
                  onPress={() => nav("contactDetail", { id: contact.id })}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: index < grouped[key].length - 1 ? 1 : 0, borderColor: "rgba(6,69,50,0.08)" }}
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
              ))}
            </View>
          ))}
        </View>
      </MeshScroll>

      <BottomNav
        active="contacts"
        t={t}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "notes") nav("notes");
          else if (id === "fab") nav("createNote");
          else if (id === "status") nav("status");
        }}
      />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
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
      getContactTimeline(contactId).catch(() => [])
    ])
      .then(([contactRes, timelineRes]) => {
        if (!active) return;
        const normalized = normalizeApiContact(extractContactData(contactRes));
        if (!normalized) { setError("Contact not found."); return; }
        setContact(normalized);
        setTimelineItems(
          extractTimelineArray(timelineRes).map(normalizeTimelineItem).filter(Boolean) as TimelineItem[]
        );
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
  const statusMeta = contact ? statuses.find((status) => status.id === contact.status) : undefined;

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
        <Image source={leafPng} resizeMode="contain" style={{ height: 220, left: -100, opacity: 0.12, position: "absolute", top: insets.top + 60, transform: [{ rotate: "10deg" }], width: 260 }} />
        <Image source={leafPng} resizeMode="contain" style={{ height: 230, opacity: 0.14, position: "absolute", right: -104, top: insets.top + 56, transform: [{ rotate: "-12deg" }], width: 290 }} />

        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("contacts")} />
          <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800", letterSpacing: -0.1 }}>{t("contactProfile")}</Text>
          <HeaderCircleBtn icon="ellipsis-horizontal" />
        </View>
        <View style={{ alignItems: "center", marginTop: 18 }}>
          <GradientAvatar name={contact.name} statusColor={statusMeta?.color} size={92} ringWidth={2} ringOpacity={0.75} gap={3} />
          <Text style={{ color: mesh.green800, fontSize: 26, fontWeight: "800", letterSpacing: -0.4, lineHeight: 32, marginTop: 14, paddingHorizontal: 24, textAlign: "center" }}>{contact.name}</Text>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 7, marginTop: 8 }}>
            <View style={{ backgroundColor: statusMeta?.color || mesh.green700, borderRadius: 5, height: 9, width: 9 }} />
            <Text style={{ color: mesh.ink700, fontSize: 14, fontWeight: "700" }}>{statusMeta?.name || contact.status || "-"}</Text>
          </View>
        </View>
      </View>

      <MeshScroll style={{ backgroundColor: "#F7FAF7", marginTop: -22, paddingHorizontal: 16, position: "relative", zIndex: 2 }} bottom={100}>
        {deleteError ? (
          <Text style={{ color: mesh.pink, fontSize: 12, lineHeight: 18, marginTop: 8, paddingHorizontal: 4 }}>{deleteError}</Text>
        ) : null}

        <MeshCard style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 24, borderWidth: 1, elevation: 2, marginTop: 0, overflow: "hidden", paddingHorizontal: 20, paddingVertical: 14, shadowColor: "#064532", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18 }}>
          <InfoRow icon="call-outline" label={t("phone")} value={contact.phone || "-"} />
          <InfoRow icon="mail-outline" label="Email" value={contact.email || "-"} />
          <InfoRow icon="location-outline" label={t("address")} value={contact.address || "-"} last />
        </MeshCard>

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

export function CreateContactScreen({ t, nav, edit = false, contactId }: Props & { edit?: boolean; contactId?: string }) {
  const insets   = useSafeAreaInsets();
  const existing = edit && contactId ? contactById(contactId) : undefined;

  // ── Core fields ────────────────────────────────────────────────────────────
  const [name,   setName]   = useState(existing?.name  || "");
  const [phone,  setPhone]  = useState(existing?.phone || "");
  const [email,  setEmail]  = useState(existing?.email || "");
  const [status, setStatus] = useState(existing?.status || "st-close");

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
  const [popupBtm,         setPopupBtm]         = useState(0);
  const [datePickerOpen,   setDatePickerOpen]   = useState(false);
  const [dateTarget,       setDateTarget]       = useState<DateTarget | null>(null);
  const [pickerValue,      setPickerValue]      = useState<Date | null>(null);
  const [pickerEventName,  setPickerEventName]  = useState("");
  const [datePickerIsNew,  setDatePickerIsNew]  = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [saveError,        setSaveError]        = useState("");

  const addFieldRef = useRef<View>(null);

  // ── Popup positioning ──────────────────────────────────────────────────────
  const openPopup = () => {
    addFieldRef.current?.measureInWindow((_x, y) => {
      setPopupBtm(Dimensions.get("window").height - y + 8);
      setAddFieldOpen(true);
    });
  };

  const removeField = (f: UniqueField) => setActiveFields(prev => prev.filter(x => x !== f));

  // ── Add field / special day handling ──────────────────────────────────────
  const handleAddField = (f: AddField) => {
    setAddFieldOpen(false);
    if (f === "specialDay") {
      const newIdx = specialDays.length; // capture before state update
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
    // If user cancels a brand-new special day, remove it
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
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name:      name.trim(),
        phone:     phone.trim()     || undefined,
        email:     email.trim()     || undefined,
        statusId:  status           || undefined,
        birthday:  birthday         ? birthday.toISOString() : undefined,
        howYouMet: howYouMet.trim() || undefined,
        address:   address.trim()   || undefined,
        social:    social.trim()    || undefined,
        note:      note.trim()      || undefined,
      };
      if (edit && contactId) {
        await updateContact(contactId, payload);
        nav("contactDetail", { id: contactId });
      } else {
        await createContact(payload);
        nav("contacts");
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  // ── Field meta (popup menu options) ───────────────────────────────────────
  const fieldMeta: { key: AddField; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "birthday",   icon: "gift-outline",          label: t("birthday")   },
    { key: "howYouMet",  icon: "chatbubble-outline",    label: t("howYouMet")  },
    { key: "specialDay", icon: "calendar-outline",      label: t("specialDay") },
    { key: "address",    icon: "location-outline",      label: t("address")    },
    { key: "social",     icon: "globe-outline",         label: t("social")     },
    { key: "note",       icon: "document-text-outline", label: t("moreNote")   },
  ];
  // specialDay is always available (multiple allowed); unique fields hidden once added
  const availableFields = fieldMeta.filter(f =>
    f.key === "specialDay" || !activeFields.includes(f.key as UniqueField)
  );

  const fieldIcon:  Partial<Record<AddField, keyof typeof Ionicons.glyphMap>> = Object.fromEntries(fieldMeta.map(f => [f.key, f.icon]));
  const fieldLabel: Partial<Record<AddField, string>>                         = Object.fromEntries(fieldMeta.map(f => [f.key, f.label]));

  const hasAdditional = activeFields.length > 0 || specialDays.length > 0;

  // Current status for relationship row
  const currentStatus = statusById(status);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <MeshScreen>
      {/* ── Hero header ── */}
      <View style={{ height: insets.top + 276, overflow: "hidden", paddingHorizontal: 20, paddingTop: insets.top + 14, position: "relative" }}>
        <MeshGradientView
          pointerEvents="none"
          style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
          columns={4} rows={4}
          colors={["#064532","#0B573E","#1D704F","#2F805E","#DDEFE5","#EAF6EF","#BFDCCB","#74AE8D","#FFFFFF","#FFFFFF","#F8FCF7","#EEF8F0","#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF"]}
          points={[[0,0],[0.35,0],[0.7,0],[1,0],[0,0.3],[0.35,0.34],[0.7,0.32],[1,0.28],[0,0.6],[0.35,0.64],[0.7,0.68],[1,0.64],[0,1],[0.35,1],[0.7,1],[1,1]]}
          smoothsColors
        />
        {/* Top nav row */}
        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav(edit ? "contactDetail" : "contacts", { id: contactId })} />
          <Text style={{ color: "#064532", fontSize: 18, fontWeight: "800", letterSpacing: -0.2 }}>
            {edit ? t("editContact") : t("createContact")}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              alignItems: "center", backgroundColor: saving ? "rgba(6,69,50,0.45)" : mesh.green700,
              borderRadius: 999, elevation: 3, flexDirection: "row", gap: 6, justifyContent: "center",
              minWidth: 72, paddingHorizontal: 18, paddingVertical: 10,
              shadowColor: "#064532", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16,
            }}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>{t("save")}</Text>}
          </Pressable>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: "center", marginTop: 18 }}>
          <Pressable onPress={pickAvatar} style={{ position: "relative" }}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#FFFFFF" }}
              />
            ) : name.trim() ? (
              <Avatar name={name.trim()} size={100} />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(31,112,72,0.10)", borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="person-outline" size={44} color={mesh.green700} />
              </View>
            )}
            <View style={{ alignItems: "center", backgroundColor: mesh.green700, borderColor: "#FFFFFF", borderRadius: 16, borderWidth: 3, bottom: 0, height: 32, justifyContent: "center", position: "absolute", right: 0, width: 32 }}>
              <Ionicons name="camera-outline" size={15} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={{ color: mesh.green700, fontSize: 13, fontWeight: "700", marginTop: 8 }}>{t("addAvatar")}</Text>
        </View>
      </View>

      {/* ── Scrollable form ── */}
      <ScrollView
        style={{ backgroundColor: "#F7FAF7", marginTop: -18 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {saveError ? (
          <View style={{ backgroundColor: "rgba(220,38,38,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(220,38,38,0.2)", paddingHorizontal: 14, paddingVertical: 10, marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={{ flex: 1, color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{saveError}</Text>
          </View>
        ) : null}

        {/* ── Basic info card (no title) ── */}
        <FormSection>
          <FormRow icon="person-outline" label={`${t("name")} *`} value={name} onChangeText={setName} placeholder={t("enterName")} />
          <FormRow icon="call-outline"   label={t("phone")}       value={phone} onChangeText={setPhone} placeholder={t("enterPhone")} />
          <FormRow icon="mail-outline"   label="Email"            value={email} onChangeText={setEmail} placeholder={t("enterEmail")} />
          {/* Relationship / Status — inline dot + name + chevron */}
          <Pressable
            onPress={() => setStatusOpen(true)}
            style={{ alignItems: "center", borderBottomWidth: 0, flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 14 }}
          >
            <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42 }}>
              <Ionicons name="people-outline" size={20} color={mesh.green700} />
            </View>
            <Text style={{ color: "#073F33", fontSize: 14, fontWeight: "800", flex: 1 }}>{t("relationship")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: currentStatus?.color ?? mesh.ink300 }} />
              <Text style={{ color: mesh.ink700, fontSize: 14, fontWeight: "600" }}>{currentStatus?.name ?? ""}</Text>
              <Ionicons name="chevron-down" size={14} color={mesh.ink400} />
            </View>
          </Pressable>
        </FormSection>

        {/* ── Add field button ── */}
        {availableFields.length > 0 && (
          <View ref={addFieldRef} collapsable={false}>
            <Pressable onPress={openPopup} style={{ alignItems: "center", flexDirection: "row", gap: 10, marginTop: 10, paddingHorizontal: 4, paddingVertical: 6 }}>
              <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.12)", borderRadius: 12, height: 32, justifyContent: "center", width: 32 }}>
                <Ionicons name="add" size={18} color={mesh.green700} />
              </View>
              <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "700" }}>{t("addField")}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Additional information (shown after fields are added) ── */}
        {hasAdditional && (
          <FormSection title={t("additionalInfo")}>
            {/* Birthday row */}
            {activeFields.includes("birthday") && (
              <Pressable
                onPress={() => openDatePicker({ kind: "birthday" })}
                style={{ alignItems: "center", borderBottomWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}
              >
                <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42 }}>
                  <Ionicons name="gift-outline" size={20} color={mesh.green700} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: mesh.ink500, fontSize: 11, fontWeight: "700", marginBottom: 2 }}>{t("birthday")}</Text>
                  <Text style={{ color: birthday ? mesh.green700 : mesh.ink400, fontSize: 14 }}>
                    {birthday ? formatDateShort(birthday) : t("selectDate")}
                  </Text>
                </View>
                <Pressable onPress={() => { removeField("birthday"); setBirthday(null); }} hitSlop={8}>
                  <Ionicons name="close-circle-outline" size={20} color={mesh.ink400} />
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
                <AdditionalRow
                  key={f}
                  icon={fieldIcon[f] ?? "ellipsis-horizontal-outline"}
                  label={fieldLabel[f] ?? f}
                  value={val}
                  onChangeText={setter}
                  multiline={f === "note"}
                  onRemove={() => removeField(f)}
                  last={isLastText}
                />
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
        )}

        <View style={{ marginBottom: 24, marginTop: 16 }}>
          <TipCard>{t("canAddLater")}</TipCard>
        </View>
      </ScrollView>

      {/* ── Status picker bottom sheet ── */}
      <StatusPicker open={statusOpen} value={status} onClose={() => setStatusOpen(false)} onPick={setStatus} t={t} />

      {/* ── Add field popup (transparent, anchored above button) ── */}
      <Modal visible={addFieldOpen} transparent animationType="none" onRequestClose={() => setAddFieldOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setAddFieldOpen(false)}>
          <View style={{
            position: "absolute", left: 20, right: 20, bottom: popupBtm,
            backgroundColor: "#FFFFFF",
            borderRadius: 18, borderWidth: 1, borderColor: "rgba(6,69,50,0.10)",
            shadowColor: "#064532", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 24,
            elevation: 8, paddingVertical: 6,
          }}>
            {availableFields.map((f, i) => (
              <Pressable
                key={`${f.key}-${i}`}
                onPress={() => handleAddField(f.key)}
                style={{ alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: i < availableFields.length - 1 ? 1 : 0, borderColor: "rgba(6,69,50,0.06)" }}
              >
                <Ionicons name={f.icon} size={18} color={mesh.green700} />
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "600" }}>{f.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Date / special-day picker bottom sheet ── */}
      <Modal visible={datePickerOpen} transparent animationType="slide" onRequestClose={cancelDatePicker}>
        {/*
          Backdrop is a separate absolute Pressable so it does NOT wrap the sheet.
          The sheet itself is a plain View — nothing steals touch from the wheel ScrollViews.
        */}
        <View style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
          <Pressable
            onPress={cancelDatePicker}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36 }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
            {/* Header row */}
            <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
              <Pressable onPress={cancelDatePicker} hitSlop={10}>
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={{ color: mesh.ink400, fontSize: SHEET_FONT.action, fontWeight: "700" }}
                >{t("cancel")}</Text>
              </Pressable>
              <Text
                maxFontSizeMultiplier={1.1}
                style={{ color: mesh.green800, fontSize: SHEET_FONT.title, fontWeight: "800" }}
              >
                {dateTarget?.kind === "birthday" ? t("birthday") : t("specialDay")}
              </Text>
              <Pressable onPress={confirmDate} hitSlop={10}>
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={{ color: mesh.green700, fontSize: SHEET_FONT.action, fontWeight: "800" }}
                >{t("done")}</Text>
              </Pressable>
            </View>
            {/* Event name input — only for special days */}
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
            {/* Wheel picker */}
            <WheelDatePicker value={pickerValue} onChange={setPickerValue} />
            {/* Selected date preview chip */}
            {pickerValue && (
              <View style={{ marginHorizontal: 20, marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(31,112,72,0.08)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 }}>
                <Ionicons name="calendar-outline" size={15} color={mesh.green700} />
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={{ color: mesh.green700, fontSize: SHEET_FONT.preview, fontWeight: "800" }}
                >{formatDateShort(pickerValue)}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </MeshScreen>
  );
}

function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "rgba(6,69,50,0.06)",
        borderRadius: 24,
        borderWidth: 1,
        elevation: 2,
        marginTop: 16,
        padding: 16,
        shadowColor: "#064532",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      }}
    >
      {title ? (
        <Text style={{ color: mesh.green800, fontSize: 13, fontWeight: "800", letterSpacing: 1.2, marginBottom: 12 }}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={{ borderColor: "rgba(6,69,50,0.10)", borderRadius: 20, borderWidth: 1, overflow: "hidden" }}>
        {children}
      </View>
    </View>
  );
}

function FormRow({
  icon, label, value, onChangeText, placeholder, last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string;
  onChangeText?: (value: string) => void; placeholder?: string; last?: boolean;
}) {
  return (
    <View style={{ alignItems: "center", borderBottomWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42 }}>
        <Ionicons name={icon} size={20} color={mesh.green700} />
      </View>
      <Text style={{ color: "#073F33", fontSize: 14, fontWeight: "800", width: 90 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8C9691"
        style={{ color: mesh.ink900, flex: 1, fontSize: 14, textAlign: "right" }}
      />
    </View>
  );
}

function StatusPicker({ open, value, onClose, onPick, t }: { open: boolean; value: string; onClose: () => void; onPick: (value: string) => void; t: TFn }) {
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

export function ContactsEmptyScreen({ t, nav }: Props) {
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
      <BottomNav active="contacts" t={t} onTab={(id) => {
        if (id === "home") nav("dashboard");
        else if (id === "notes") nav("notes");
        else if (id === "fab") nav("createContact");
        else if (id === "status") nav("status");
      }} />
    </MeshScreen>
  );
}
