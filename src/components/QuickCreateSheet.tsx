import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createContact, getContacts } from "../api/contactApi";
import { submitCreateNote } from "../api/noteApi";
import { getStatuses } from "../api/statusApi";
import { extractArray, normalizeApiStatus } from "../api/screenAdapters";
import { Avatar, NavFn, StatusChip, TFn } from "../mesh/MeshComponents";
import { Lang, Status, statuses as mockStatuses, statusById } from "../mesh/meshData";
import { mesh } from "../mesh/meshTheme";

// ─── Types ────────────────────────────────────────────────────────────────────

type PickerContact = { id: string; name: string; status?: string };
type Preset = { id: string; label: string; sublabel: string; date: Date };

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function setTimeH(date: Date, hour: number, minute = 0): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function nextSaturday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatPresetDateTime(date: Date, lang: Lang): string {
  const isVi = lang === "vi";
  const weekdays = isVi
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = isVi
    ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} · ${hh}:${mm}`;
}

function formatReminderChip(date: Date, lang: Lang): string {
  const days = lang === "vi"
    ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = lang === "vi"
    ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} · ${hh}:${mm}`;
}

function getPresets(lang: Lang): Preset[] {
  const isVi = lang === "vi";
  const now = new Date();
  const tomorrow  = setTimeH(addDays(now, 1),  9);
  const weekend   = setTimeH(nextSaturday(now), 9);
  const nextWeek  = setTimeH(addDays(now, 7),  9);
  const nextMonth = setTimeH(addDays(now, 31), 9);
  return [
    { id: "tomorrow",  label: isVi ? "Sáng mai"      : "Tomorrow morning", sublabel: formatPresetDateTime(tomorrow,  lang), date: tomorrow  },
    { id: "weekend",   label: isVi ? "Cuối tuần này" : "This weekend",     sublabel: formatPresetDateTime(weekend,   lang), date: weekend   },
    { id: "nextweek",  label: isVi ? "Tuần sau"      : "Next week",        sublabel: formatPresetDateTime(nextWeek,  lang), date: nextWeek  },
    { id: "nextmonth", label: isVi ? "Tháng sau"     : "Next month",       sublabel: formatPresetDateTime(nextMonth, lang), date: nextMonth },
  ];
}

// ─── Note parser ──────────────────────────────────────────────────────────────

const TITLE_MAX = 100;
const CONTENT_MAX = 1000;

function parseNoteDraft(text: string): { title: string | null; content: string } {
  const raw = text.trim();
  if (!raw) return { title: null, content: "" };
  const lines = raw.split("\n");
  const firstLine = lines[0].trim();
  const rest = lines.slice(1).join("\n").trim();
  if (firstLine.length > 0 && firstLine.length <= TITLE_MAX && rest.length > 0) {
    return { title: firstLine, content: rest };
  }
  return { title: null, content: raw };
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizePickerContact(value: unknown): PickerContact | null {
  const item = asRecord(value);
  if (!item) return null;
  const idValue   = item._id ?? item.id;
  const nameValue = item.name ?? item.fullName;
  const statusRecord = asRecord(item.status);
  const statusValue  = item.statusId ?? statusRecord?._id ?? statusRecord?.id ?? item.status;
  if (typeof idValue !== "string" || typeof nameValue !== "string") return null;
  return { id: idValue, name: nameValue, status: typeof statusValue === "string" ? statusValue : undefined };
}

// ─── Sheet height ─────────────────────────────────────────────────────────────

const SHEET_H = Dimensions.get("window").height * 0.78;

// ─── QuickCreateSheet (main) ──────────────────────────────────────────────────

export function QuickCreateSheet({
  open, mode, onClose, t, lang, nav,
}: {
  open: boolean;
  mode: "note" | "contact" | null;
  onClose: () => void;
  t: TFn;
  lang: Lang;
  nav: NavFn;
}) {
  const insets = useSafeAreaInsets();
  const translateY    = useRef(new Animated.Value(SHEET_H)).current;
  const overlayAnim   = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (open) {
      translateY.setValue(SHEET_H);
      overlayAnim.setValue(0);
      setModalVisible(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 240,
          mass: 0.9,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_H,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setModalVisible(false));
    }
  }, [open]);

  const handleDismiss = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_H,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const isVi = lang === "vi";

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleDismiss}>

      {/* ── Dim overlay ── */}
      <Animated.View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, { opacity: overlayAnim }]}
      >
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(8,28,18,0.48)" }]}
          onPress={handleDismiss}
        />
      </Animated.View>

      {/* ── Sheet ── */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: SHEET_H,
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          shadowColor: "#064532",
          shadowOpacity: 0.14,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: -10 },
          elevation: 20,
          transform: [{ translateY }],
        }}
      >
        {/* Handle bar */}
        <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, marginTop: 10, marginBottom: 4 }} />

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 }}>
          <Text style={{ flex: 1, color: mesh.green800, fontSize: 20, fontWeight: "900", letterSpacing: -0.4 }}>
            {mode === "note"
              ? (isVi ? "Ghi chú nhanh" : "Quick Note")
              : (isVi ? "Thêm liên hệ" : "New Contact")
            }
          </Text>
          <Pressable
            onPress={handleDismiss}
            hitSlop={8}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(6,69,50,0.07)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="close" size={18} color={mesh.ink700} />
          </Pressable>
        </View>

        {/* Form — takes remaining space */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
          {mode === "note"
            ? <QuickNoteForm t={t} lang={lang} onClose={handleDismiss} nav={nav} insets={insets} />
            : <QuickContactForm t={t} lang={lang} onClose={handleDismiss} nav={nav} insets={insets} />
          }
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── QuickNoteForm ────────────────────────────────────────────────────────────

function QuickNoteForm({
  t, lang, onClose, nav, insets,
}: {
  t: TFn;
  lang: Lang;
  onClose: () => void;
  nav: NavFn;
  insets: { bottom: number };
}) {
  const isVi = lang === "vi";

  // ── Person state
  const [personId,      setPersonId]      = useState<string | null>(null);
  const [personLabel,   setPersonLabel]   = useState("");
  const [personQuery,   setPersonQuery]   = useState("");
  const [personFocused, setPersonFocused] = useState(false);
  const [apiContacts,   setApiContacts]   = useState<PickerContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // ── Note state
  const [noteText,    setNoteText]    = useState("");
  const noteRef = useRef<TextInput>(null);

  // ── Reminder state
  const [reminderAt,    setReminderAt]    = useState<Date | null>(null);
  const [showPresets,   setShowPresets]   = useState(false);
  const presets = getPresets(lang);

  // ── Save state
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState("");
  const [personError, setPersonError] = useState(false);
  const [contentError, setContentError] = useState(false);

  // Load contacts
  useEffect(() => {
    let active = true;
    setContactsLoading(true);
    getContacts()
      .then((res) => {
        if (!active) return;
        const normalized = extractArray(res, "contacts")
          .map(normalizePickerContact)
          .filter(Boolean) as PickerContact[];
        setApiContacts(normalized);
      })
      .catch(() => {})
      .finally(() => { if (active) setContactsLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredContacts = personQuery.trim().length > 0
    ? apiContacts.filter((c) => c.name.toLowerCase().includes(personQuery.trim().toLowerCase())).slice(0, 4)
    : [];

  const reminderLabel = reminderAt ? formatReminderChip(reminderAt, lang) : null;
  const draftIsEmpty  = noteText.trim().length === 0;

  const save = async () => {
    const typedName = personLabel.trim() || personQuery.trim();
    const missingPerson  = !personId && typedName.length === 0;
    const missingContent = noteText.trim().length === 0;

    setPersonError(missingPerson);
    setContentError(missingContent);
    setSaveError("");
    if (missingPerson || missingContent) return;

    setSaving(true);
    try {
      const { title, content } = parseNoteDraft(noteText);
      await submitCreateNote({
        contactId:       personId || undefined,
        newContactName:  personId ? undefined : (typedName || undefined),
        content,
        title:           title || undefined,
        interactionDate: new Date().toISOString(),
        reminderEnabled: Boolean(reminderAt),
        remindAt:        reminderAt?.toISOString(),
      });
      onClose();
      nav("notes");
    } catch (err) {
      setSaveError(err instanceof Error && err.message ? err.message : "Could not save note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Person pill ── */}
      <QuickPersonPill
        value={personQuery}
        selectedPersonId={personId}
        contacts={filteredContacts}
        focused={personFocused}
        loading={contactsLoading}
        error={personError}
        lang={lang}
        onFocus={() => setPersonFocused(true)}
        onBlur={() => setTimeout(() => setPersonFocused(false), 150)}
        onChangeText={(v) => {
          setPersonQuery(v);
          setPersonLabel(v);
          setPersonId(null);
          setPersonError(false);
        }}
        onSelectContact={(c) => {
          setPersonId(c.id);
          setPersonLabel(c.name);
          setPersonQuery(c.name);
          setPersonError(false);
          setPersonFocused(false);
        }}
      />
      {personError ? (
        <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", marginTop: 5, marginLeft: 4 }}>
          {isVi ? "Vui lòng nhập tên người." : "Please enter a person name."}
        </Text>
      ) : null}

      {/* ── Note canvas ── */}
      <Pressable
        onPress={() => noteRef.current?.focus()}
        style={{
          marginTop: 14,
          minHeight: 160,
          borderRadius: 22,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: contentError ? "rgba(217,87,122,0.4)" : "rgba(6,69,50,0.08)",
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 44,
          shadowColor: "#064532",
          shadowOpacity: 0.044,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <TextInput
          ref={noteRef}
          value={noteText}
          onChangeText={(v) => { setNoteText(v.slice(0, CONTENT_MAX)); if (v.trim()) setContentError(false); }}
          placeholder={isVi ? "Bạn muốn ghi nhớ điều gì?" : "What would you like to remember?"}
          placeholderTextColor={mesh.ink400}
          multiline
          textAlignVertical="top"
          style={{
            color: mesh.ink900,
            fontSize: 16,
            lineHeight: 26,
            fontWeight: "400",
            padding: 0,
            margin: 0,
            minHeight: 100,
            textAlignVertical: "top",
          } as any}
        />
        <View style={{ position: "absolute", left: 18, right: 18, bottom: 12, borderTopWidth: 1, borderTopColor: "rgba(6,69,50,0.07)", paddingTop: 8, alignItems: "flex-end" }}>
          <Text style={{ color: mesh.ink400, fontSize: 12 }}>{noteText.length}/{CONTENT_MAX}</Text>
        </View>
      </Pressable>
      {contentError ? (
        <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", marginTop: 5, marginLeft: 4 }}>
          {isVi ? "Nội dung là bắt buộc." : "Content is required."}
        </Text>
      ) : null}

      {/* ── Reminder chip ── */}
      <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => setShowPresets((v) => !v)}
          style={[qStyles.reminderChipBase, !reminderAt && qStyles.reminderChipEmpty]}
        >
          {reminderAt ? (
            <LinearGradient
              colors={["rgba(255,255,255,0.98)", "rgba(231,247,238,0.68)", "rgba(250,254,251,0.98)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={qStyles.reminderChipInner}
            >
              <View style={qStyles.reminderIconCircle}>
                <Ionicons name="notifications-outline" size={13} color={mesh.green700} />
              </View>
              <Text numberOfLines={1} style={qStyles.reminderText}>{reminderLabel}</Text>
            </LinearGradient>
          ) : (
            <View style={qStyles.reminderChipInner}>
              <View style={qStyles.reminderIconCircle}>
                <Ionicons name="notifications-outline" size={13} color={mesh.green700} />
              </View>
              <Text numberOfLines={1} style={qStyles.reminderText}>{isVi ? "Nhắc nhở" : "Reminder"}</Text>
            </View>
          )}
        </Pressable>
        {reminderAt ? (
          <Pressable
            onPress={() => { setReminderAt(null); setShowPresets(false); }}
            hitSlop={8}
            style={qStyles.reminderClearBtn}
          >
            <Ionicons name="close" size={13} color={mesh.ink500} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Reminder preset list (inline) ── */}
      {showPresets ? (
        <View style={{ marginTop: 8, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.07)", overflow: "hidden", shadowColor: "#064532", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
          {presets.map((preset, index) => (
            <Pressable
              key={preset.id}
              onPress={() => { setReminderAt(preset.date); setShowPresets(false); }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderTopWidth: index === 0 ? 0 : 1,
                borderColor: "rgba(6,69,50,0.07)",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "700" }}>{preset.label}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 1 }}>{preset.sublabel}</Text>
              </View>
              <View style={{
                width: 18, height: 18, borderRadius: 9,
                borderWidth: 1.5,
                borderColor: reminderAt && Math.abs(preset.date.getTime() - reminderAt.getTime()) < 5000 ? mesh.green700 : mesh.ink200,
                backgroundColor: reminderAt && Math.abs(preset.date.getTime() - reminderAt.getTime()) < 5000 ? mesh.green700 : "transparent",
                alignItems: "center", justifyContent: "center"
              }}>
                {reminderAt && Math.abs(preset.date.getTime() - reminderAt.getTime()) < 5000 ? (
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#FFFFFF" }} />
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* ── Save error ── */}
      {saveError ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, backgroundColor: "rgba(217,87,122,0.08)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="alert-circle-outline" size={14} color={mesh.pink} />
          <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", flex: 1 }}>{saveError}</Text>
        </View>
      ) : null}

      {/* ── Save button ── */}
      <Pressable
        onPress={save}
        disabled={saving}
        style={{ marginTop: 18, borderRadius: 26, opacity: saving ? 0.75 : 1, overflow: "hidden" }}
      >
        <LinearGradient
          colors={[mesh.green800, mesh.green700, "#008A55"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}
        >
          {saving
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Ionicons name="save-outline" size={19} color="#FFFFFF" />
          }
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
            {saving ? (isVi ? "Đang lưu..." : "Saving...") : t("saveNote")}
          </Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

// ─── QuickContactForm ─────────────────────────────────────────────────────────

function QuickContactForm({
  t, lang, onClose, nav, insets,
}: {
  t: TFn;
  lang: Lang;
  onClose: () => void;
  nav: NavFn;
  insets: { bottom: number };
}) {
  const isVi = lang === "vi";

  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState("");
  const [statusOpen, setStatusOpen] = useState(false);

  const [apiStatuses,    setApiStatuses]    = useState<Status[]>([]);
  const [statusesLoaded, setStatusesLoaded] = useState(false);

  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");
  const [nameError, setNameError] = useState(false);

  // Load statuses
  useEffect(() => {
    let active = true;
    getStatuses()
      .then((res) => {
        if (!active) return;
        const normalized = extractArray(res, "statuses")
          .map(normalizeApiStatus)
          .filter(Boolean) as Status[];
        if (normalized.length > 0) setApiStatuses(normalized);
        else setApiStatuses(mockStatuses);
      })
      .catch(() => { if (active) setApiStatuses(mockStatuses); })
      .finally(() => { if (active) setStatusesLoaded(true); });
    return () => { active = false; };
  }, []);

  const pickerStatuses = statusesLoaded && apiStatuses.length > 0 ? apiStatuses : mockStatuses;
  const currentStatus  = status ? (pickerStatuses.find((s) => s.id === status) ?? statusById(status)) : null;

  const isMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

  const save = async () => {
    if (!name.trim()) {
      setNameError(true);
      setSaveError(t("nameRequired") || (isVi ? "Tên là bắt buộc." : "Name is required."));
      return;
    }
    setNameError(false);
    setSaveError("");
    setSaving(true);
    try {
      await createContact({
        name:     name.trim(),
        phone:    phone.trim()     || undefined,
        email:    email.trim()     || undefined,
        statusId: status && isMongoId(status) ? status : undefined,
      });
      onClose();
      nav("contacts");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : (isVi ? "Không thể lưu liên hệ." : "Failed to save contact."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Field card ── */}
        <View style={{
          borderRadius: 24,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderWidth: 1,
          borderColor: "rgba(6,69,50,0.07)",
          overflow: "hidden",
          shadowColor: "#064532",
          shadowOpacity: 0.025,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 1,
        }}>
          <QFieldRow
            icon="person-outline"
            label={`${t("name")} *`}
            value={name}
            placeholder={t("enterName")}
            onChangeText={(v) => { setName(v); if (v.trim()) { setNameError(false); setSaveError(""); } }}
            error={nameError}
          />
          <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.055)", marginLeft: 66 }} />
          <QFieldRow
            icon="call-outline"
            label={t("phone")}
            value={phone}
            placeholder={t("enterPhone")}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.055)", marginLeft: 66 }} />
          <QFieldRow
            icon="mail-outline"
            label="Email"
            value={email}
            placeholder={t("enterEmail")}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ height: 1, backgroundColor: "rgba(6,69,50,0.055)", marginLeft: 66 }} />
          {/* Relationship / Status row */}
          <Pressable
            onPress={() => setStatusOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              minHeight: 58,
              paddingHorizontal: 14,
              gap: 12,
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: "rgba(31,112,72,0.055)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ionicons name="people-outline" size={18} color={mesh.green700} />
            </View>
            <Text style={{ width: 120, color: mesh.ink700, fontSize: 14, fontWeight: "700" }} numberOfLines={1}>
              {t("relationship")}
            </Text>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
              {currentStatus ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: currentStatus.color }} />
                  <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "600" }} numberOfLines={1}>{currentStatus.name}</Text>
                </View>
              ) : (
                <Text style={{ color: mesh.ink300, fontSize: 14 }}>{"Choose"}</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={mesh.ink300} />
            </View>
          </Pressable>
        </View>

        {/* ── Save error ── */}
        {saveError ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, backgroundColor: "rgba(217,87,122,0.08)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Ionicons name="alert-circle-outline" size={14} color={mesh.pink} />
            <Text style={{ color: mesh.pink, fontSize: 13, fontWeight: "600", flex: 1 }}>{saveError}</Text>
          </View>
        ) : null}

        {/* ── Save button ── */}
        <Pressable
          onPress={save}
          disabled={saving}
          style={{ marginTop: 18, borderRadius: 26, opacity: saving ? 0.75 : 1, overflow: "hidden" }}
        >
          <LinearGradient
            colors={[mesh.green800, mesh.green700, "#008A55"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            {saving
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
            }
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
              {saving ? (isVi ? "Đang lưu..." : "Saving...") : t("save")}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* ── Status picker (sub-modal) ── */}
      <QuickStatusPicker
        open={statusOpen}
        value={status}
        statuses={pickerStatuses}
        onClose={() => setStatusOpen(false)}
        onPick={(v) => { setStatus(v); setStatusOpen(false); }}
        lang={lang}
      />
    </>
  );
}

// ─── QuickPersonPill ──────────────────────────────────────────────────────────

function QuickPersonPill({
  contacts, error, focused, loading, lang,
  onBlur, onChangeText, onFocus, onSelectContact, selectedPersonId, value,
}: {
  contacts: PickerContact[];
  error: boolean;
  focused: boolean;
  loading: boolean;
  lang: Lang;
  onBlur: () => void;
  onChangeText: (v: string) => void;
  onFocus: () => void;
  onSelectContact: (c: PickerContact) => void;
  selectedPersonId: string | null;
  value: string;
}) {
  const trimmed = value.trim();
  const showSuggestions = focused && trimmed.length > 0 && (contacts.length > 0 || loading);

  const borderColor = error
    ? "rgba(217,87,122,0.55)"
    : focused ? mesh.green700
    : "rgba(6,69,50,0.08)";

  return (
    <View style={{ zIndex: 20 }}>
      {/* Pill */}
      <View style={{
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(255,255,255,0.96)",
        borderWidth: 1,
        borderColor,
        paddingLeft: 14,
        paddingRight: value.length > 0 ? 10 : 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: "#064532",
        shadowOpacity: 0.044,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}>
        {selectedPersonId
          ? <Avatar name={trimmed || "?"} size={28} />
          : (
            <View style={{ width: 24, height: 50, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ionicons name="person-outline" size={19} color={mesh.green700} style={{ transform: [{ translateY: 1 }] }} />
            </View>
          )
        }
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={lang === "vi" ? "Nhập tên người..." : "Type a person name..."}
          placeholderTextColor={mesh.ink400}
          returnKeyType="done"
          style={{
            flex: 1,
            height: 50,
            color: mesh.ink900,
            fontSize: 15,
            fontWeight: "400",
            paddingTop: 0,
            paddingBottom: 0,
            paddingVertical: 0,
            includeFontPadding: false,
            textAlignVertical: "center",
          } as any}
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={mesh.ink400} />
          </Pressable>
        ) : null}
      </View>

      {/* Suggestions dropdown */}
      {showSuggestions ? (
        <View style={{
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(6,69,50,0.08)",
          borderRadius: 18,
          borderWidth: 1,
          elevation: 4,
          marginTop: 5,
          overflow: "hidden",
          shadowColor: "#064532",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
        }}>
          {contacts.map((contact, index) => (
            <Pressable
              key={contact.id}
              onPress={() => onSelectContact(contact)}
              style={{
                alignItems: "center",
                borderBottomWidth: index < contacts.length - 1 ? 1 : 0,
                borderColor: "rgba(6,69,50,0.06)",
                flexDirection: "row",
                gap: 10,
                minHeight: 52,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Avatar name={contact.name} size={32} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "700" }}>{contact.name}</Text>
                {contact.status ? (
                  <View style={{ marginTop: 2 }}>
                    <StatusChip statusId={contact.status} />
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={15} color={mesh.ink400} />
            </Pressable>
          ))}
          {loading && contacts.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={mesh.green700} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── QFieldRow ────────────────────────────────────────────────────────────────

function QFieldRow({
  icon, label, value, placeholder, onChangeText, keyboardType, autoCapitalize, error,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "sentences";
  error?: boolean;
}) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      minHeight: 58,
      paddingHorizontal: 14,
      gap: 12,
      borderColor: error ? "rgba(217,87,122,0.3)" : "transparent",
      borderWidth: error ? 1 : 0,
    }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: error ? "rgba(217,87,122,0.06)" : "rgba(31,112,72,0.055)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Ionicons name={icon} size={18} color={error ? mesh.pink : mesh.green700} />
      </View>
      <Text style={{ width: 120, color: mesh.ink700, fontSize: 14, fontWeight: "700" }} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={mesh.ink300}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          flex: 1,
          color: mesh.ink900,
          fontSize: 14,
          fontWeight: "400",
          paddingTop: 0,
          paddingBottom: 0,
          paddingVertical: 0,
          textAlign: "right",
          includeFontPadding: false,
          textAlignVertical: "center",
        } as any}
      />
    </View>
  );
}

// ─── QuickStatusPicker ────────────────────────────────────────────────────────

function QuickStatusPicker({
  open, value, statuses, onClose, onPick, lang,
}: {
  open: boolean;
  value: string;
  statuses: Status[];
  onClose: () => void;
  onPick: (v: string) => void;
  lang: Lang;
}) {
  const isVi = lang === "vi";
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginBottom: 16 }} />
          <Text style={{ color: mesh.green800, fontSize: 18, fontWeight: "800", marginBottom: 14 }}>
            {isVi ? "Chọn nhóm quan hệ" : "Choose relationship"}
          </Text>
          {statuses.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => onPick(s.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 13,
                borderBottomWidth: 1,
                borderColor: "rgba(6,69,50,0.07)",
                gap: 12,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
              <Text style={{ flex: 1, color: mesh.ink900, fontSize: 15, fontWeight: "600" }}>{s.name}</Text>
              {value === s.id ? (
                <Ionicons name="checkmark-circle" size={20} color={mesh.green700} />
              ) : (
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: mesh.ink200 }} />
              )}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const qStyles = StyleSheet.create({
  reminderChipBase: {
    alignSelf: "flex-start",
    minHeight: 38,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(31,112,72,0.065)",
    shadowColor: "#064532",
    shadowOpacity: 0.044,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  reminderChipEmpty: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderColor: "rgba(6,69,50,0.065)",
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  reminderChipInner: {
    minHeight: 38,
    paddingLeft: 8,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  reminderIconCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,112,72,0.055)",
    flexShrink: 0,
  },
  reminderText: {
    flexShrink: 1,
    color: mesh.green700,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    letterSpacing: -0.05,
    includeFontPadding: false,
    textAlignVertical: "center",
  } as any,
  reminderClearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(6,69,50,0.045)",
  },
});
