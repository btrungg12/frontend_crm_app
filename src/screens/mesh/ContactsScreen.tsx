import { Ionicons } from "@expo/vector-icons";
import { MeshGradientView } from "expo-mesh-gradient";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createContact, deleteContact, getContactById, getContactTimeline, getContacts, updateContact } from "../../api/contactApi";
import { extractArray, normalizeApiContact } from "../../api/screenAdapters";
import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { Avatar, BottomNav, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshChip, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, StatusChip, TFn, TipCard } from "../../mesh/MeshComponents";
import { Contact, contactById, Lang, statuses } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

const leafPng = require("../../../assets/leaf.png");

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
                  <Avatar name={contact.name} size={40} />
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
          height: insets.top + 430,
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
        <Image source={leafPng} resizeMode="contain" style={{ height: 260, left: -116, opacity: 0.14, position: "absolute", top: insets.top + 78, transform: [{ rotate: "10deg" }], width: 300 }} />
        <Image source={leafPng} resizeMode="contain" style={{ height: 270, opacity: 0.16, position: "absolute", right: -120, top: insets.top + 72, transform: [{ rotate: "-12deg" }], width: 330 }} />

        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("contacts")} />
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800", letterSpacing: -0.2 }}>{t("contactProfile")}</Text>
          <HeaderCircleBtn icon="ellipsis-horizontal" />
        </View>
        <View style={{ alignItems: "center", marginTop: 52 }}>
          <Avatar name={contact.name} size={126} ring />
          <Text style={{ color: mesh.green800, fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 22, textAlign: "center" }}>{contact.name}</Text>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 7, marginTop: 12 }}>
            <View style={{ backgroundColor: statusMeta?.color || mesh.green700, borderRadius: 5, height: 10, width: 10 }} />
            <Text style={{ color: mesh.ink700, fontSize: 14, fontWeight: "600" }}>{statusMeta?.name || contact.status || "-"}</Text>
          </View>
        </View>
      </View>

      <MeshScroll style={{ backgroundColor: "#F7FAF7", marginTop: -48, paddingHorizontal: 16, position: "relative", zIndex: 2 }} bottom={100}>
        {deleteError ? (
          <Text style={{ color: mesh.pink, fontSize: 12, lineHeight: 18, marginTop: 8, paddingHorizontal: 4 }}>{deleteError}</Text>
        ) : null}

        <MeshCard style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 28, borderWidth: 1, elevation: 2, marginTop: 0, paddingHorizontal: 20, paddingVertical: 16, shadowColor: "#064532", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.06, shadowRadius: 24 }}>
          <InfoRow icon="call-outline" label={t("phone")} value={contact.phone || "-"} />
          <InfoRow icon="mail-outline" label="Email" value={contact.email || "-"} />
          <InfoRow icon="location-outline" label={t("address")} value={contact.address || "-"} last />
        </MeshCard>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 28, paddingBottom: 14 }}>
          <Text style={{ color: mesh.green800, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>{t("timeline")}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {tabs.map((item) => (
            <MeshChip key={item.id} active={tab === item.id} onPress={() => setTab(item.id)} style={{ backgroundColor: tab === item.id ? mesh.green700 : "#FFFFFF", borderWidth: 1, borderColor: tab === item.id ? mesh.green700 : mesh.line }}>
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
                <MeshCard style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.05)", borderRadius: 22, borderWidth: 1, elevation: 1, padding: 18, shadowColor: "#064532", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color, fontSize: 13, fontWeight: "800", letterSpacing: 0.8 }}>{item.label.toUpperCase()}</Text>
                    <Text style={{ color: mesh.ink500, fontSize: 13 }}>{item.date}</Text>
                  </View>
                  <Text style={{ color: mesh.ink900, fontSize: 18, fontWeight: "700", marginTop: 10 }}>{item.title}</Text>
                  <Text style={{ color: mesh.ink500, fontSize: 15, lineHeight: 22, marginTop: 8 }}>{item.desc}</Text>
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
    <View style={{ alignItems: "center", borderBottomWidth: last ? 0 : 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", gap: 16, paddingVertical: 16 }}>
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 16, height: 52, justifyContent: "center", width: 52 }}>
        <Ionicons name={icon} size={23} color={mesh.green700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink500, fontSize: 15 }}>{label}</Text>
        <Text style={{ color: mesh.ink900, fontSize: 18, fontWeight: "700", marginTop: 5 }}>{value}</Text>
      </View>
    </View>
  );
}

export function CreateContactScreen({ t, nav, edit = false, contactId }: Props & { edit?: boolean; contactId?: string }) {
  const insets = useSafeAreaInsets();
  const existing = edit && contactId ? contactById(contactId) : undefined;
  const [name, setName] = useState(existing?.name || "");
  const [phone, setPhone] = useState(existing?.phone || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [status, setStatus] = useState(existing?.status || "st-close");
  const [statusOpen, setStatusOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError(t("nameRequired") || "Name is required");
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        statusId: status || undefined,
        source: "Work"
      };
      if (edit && contactId) {
        await updateContact(contactId, payload);
        nav("contactDetail", { id: contactId });
      } else {
        await createContact(payload);
        nav("contacts");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save contact";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MeshScreen>
      <View
        style={{
          height: insets.top + 310,
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
            [0, 0.3],
            [0.35, 0.34],
            [0.7, 0.32],
            [1, 0.28],
            [0, 0.6],
            [0.35, 0.64],
            [0.7, 0.68],
            [1, 0.64],
            [0, 1],
            [0.35, 1],
            [0.7, 1],
            [1, 1]
          ]}
          smoothsColors
        />

        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav(edit ? "contactDetail" : "contacts", { id: contactId })} />
          <Text style={{ color: "#064532", fontSize: 18, fontWeight: "800", letterSpacing: -0.2 }}>{edit ? t("editContact") : t("createContact")}</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              alignItems: "center",
              backgroundColor: saving ? "rgba(6,69,50,0.45)" : mesh.green700,
              borderRadius: 999,
              elevation: 3,
              flexDirection: "row",
              gap: 6,
              justifyContent: "center",
              minWidth: 72,
              paddingHorizontal: 18,
              paddingVertical: 10,
              shadowColor: "#064532",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16
            }}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>{t("save")}</Text>
            }
          </Pressable>
        </View>
        <View style={{ alignItems: "center", marginTop: 26 }}>
          <View style={{ position: "relative" }}>
            <Avatar name={existing?.name || name || "New Contact"} size={112} />
            <View style={{ alignItems: "center", backgroundColor: mesh.green700, borderColor: "#FFFFFF", borderRadius: 18, borderWidth: 3, bottom: 2, height: 36, justifyContent: "center", position: "absolute", right: 2, width: 36 }}>
              <Ionicons name="camera-outline" size={17} color="#FFFFFF" />
            </View>
          </View>
          <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "800", marginTop: 10 }}>{t("addAvatar")}</Text>
        </View>
      </View>

      <MeshScroll style={{ backgroundColor: "#F7FAF7", marginTop: -18, paddingHorizontal: 16, paddingTop: 0 }} bottom={120}>
        {saveError ? (
          <View style={{ backgroundColor: "rgba(220,38,38,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(220,38,38,0.2)", paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={{ flex: 1, color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{saveError}</Text>
          </View>
        ) : null}
        <FormSection title={t("basicInfo")}>
          <FormRow icon="person-outline" label={`${t("name")} *`} value={name} onChangeText={setName} placeholder={t("enterName")} />
          <FormRow icon="call-outline" label={t("phone")} value={phone} onChangeText={setPhone} placeholder={t("enterPhone")} />
          <FormRow icon="mail-outline" label="Email" value={email} onChangeText={setEmail} placeholder={t("enterEmail")} last />
        </FormSection>

        <FormSection title={t("relationshipInfo")}>
          <Pressable onPress={() => setStatusOpen(true)} style={{ alignItems: "center", borderBottomWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
            <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42 }}>
              <Ionicons name="people-outline" size={20} color={mesh.green700} />
            </View>
            <Text style={{ color: "#073F33", flex: 1, fontSize: 14, fontWeight: "800" }}>{t("relationship")}</Text>
            <StatusChip statusId={status} />
            <Ionicons name="chevron-down" size={14} color={mesh.ink400} />
          </Pressable>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
            <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42 }}>
              <Ionicons name="link-outline" size={20} color={mesh.green700} />
            </View>
            <Text style={{ color: "#073F33", flex: 1, fontSize: 14, fontWeight: "800" }}>{t("source")}</Text>
            <View style={{ borderRadius: 999, backgroundColor: mesh.bgSubtle, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: mesh.green700, fontSize: 12, fontWeight: "700" }}>Work</Text>
            </View>
          </View>
        </FormSection>

        <FormSection title={t("specialDays")}>
          <View style={{ alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
            <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42 }}>
              <Ionicons name="calendar-outline" size={20} color={mesh.green700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "800" }}>{t("addSpecialDay")}</Text>
              <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{t("addSpecialHint")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
          </View>
        </FormSection>

        <FormSection title={t("moreInfo")}>
          <FormRow icon="location-outline" label={t("address")} value="" placeholder={t("enterAddress")} />
          <FormRow icon="globe-outline" label={t("social")} value="" placeholder="Facebook, LinkedIn, Zalo..." />
          <FormRow icon="document-text-outline" label={t("moreNote")} value="" placeholder={t("enterMoreNote")} last />
        </FormSection>

        <View style={{ marginBottom: 24, marginTop: 16 }}>
          <TipCard>{t("canAddLater")}</TipCard>
        </View>
      </MeshScroll>

      <StatusPicker open={statusOpen} value={status} onClose={() => setStatusOpen(false)} onPick={setStatus} t={t} />
    </MeshScreen>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
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
        shadowRadius: 20
      }}
    >
      <Text style={{ color: mesh.green800, fontSize: 13, fontWeight: "800", letterSpacing: 1.2, marginBottom: 12 }}>{title.toUpperCase()}</Text>
      <View style={{ borderColor: "rgba(6,69,50,0.10)", borderRadius: 20, borderWidth: 1, overflow: "hidden" }}>{children}</View>
    </View>
  );
}

function FormRow({ icon, label, value, onChangeText, placeholder, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onChangeText?: (value: string) => void; placeholder?: string; last?: boolean }) {
  return (
    <View style={{ alignItems: "center", borderBottomWidth: last ? 0 : 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
      <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 42, justifyContent: "center", width: 42 }}>
        <Ionicons name={icon} size={20} color={mesh.green700} />
      </View>
      <Text style={{ color: "#073F33", fontSize: 14, fontWeight: "800", width: 110 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8C9691" style={{ color: mesh.ink900, flex: 1, fontSize: 14, textAlign: "right" }} />
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
          {statuses.map((status) => (
            <Pressable
              key={status.id}
              onPress={() => {
                onPick(status.id);
                onClose();
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: mesh.line }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: status.color }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>{status.name}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{status.desc}</Text>
              </View>
              {value === status.id ? <Ionicons name="checkmark" size={18} color={mesh.green700} /> : null}
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
