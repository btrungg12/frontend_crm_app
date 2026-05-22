import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MeshGradientView } from "expo-mesh-gradient";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createStatus, deleteStatus, getStatuses, updateStatus } from "../../api/statusApi";
import { extractArray, normalizeApiContact, normalizeApiStatus } from "../../api/screenAdapters";
import { GradientAvatar } from "../../components/GradientAvatar";
import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { QuickCreateSheet } from "../../components/QuickCreateSheet";
import { BottomNav, BottomNavScrim, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { CreateNoteScreen } from "./CreateNoteScreen";
import { CreateContactScreen } from "./ContactsScreen";
import { Contact, Lang, Status } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";
import { useAppData } from "../../state/AppDataContext";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
  refresh?: number;
};

const leafPng = require("../../../assets/leaf.png");

const statusIconMap = {
  people: "people-outline",
  briefcase: "briefcase-outline",
  home: "home-outline",
  school: "school-outline",
  heart: "heart-outline"
} as const;

export function StatusScreen({ t, lang, nav, refresh }: Props) {
  const [apiStatuses, setApiStatuses] = useState<Status[]>([]);
  const [error, setError] = useState("");
  const [quickCreateMode, setQuickCreateMode] = useState<"note" | "contact" | null>(null);

  // Long-press action state
  const [actionStatus, setActionStatus] = useState<Status | null>(null);
  const [actionY, setActionY] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Status | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { statuses, contacts, refreshStatuses, refreshContacts, invalidateContacts, invalidateDashboard } = useAppData();

  const sourceStatuses = apiStatuses;

  // Load statuses and contacts from cache on mount
  useEffect(() => {
    refreshStatuses(false);
    refreshContacts(false);
  }, [refreshStatuses, refreshContacts]);

  // Force refresh when refresh prop changes
  useEffect(() => {
    if (refresh) {
      refreshStatuses(true);
    }
  }, [refresh, refreshStatuses]);

  // Process statuses.data when it updates
  useEffect(() => {
    if (!statuses.data) return;

    const normalized = extractArray(statuses.data, "statuses")
      .map(normalizeApiStatus)
      .filter(Boolean) as Status[];

    setApiStatuses(normalized);
    setError("");
  }, [statuses.data]);

  // Update error state from context
  useEffect(() => {
    if (statuses.error) setError(statuses.error);
  }, [statuses.error]);

  // Compute loading states — only show full loading if no data yet
  const isInitialLoading = statuses.loading && !statuses.data;
  const isBackgroundRefreshing = statuses.refreshing && Boolean(statuses.data);

  // Compute contact count per status from cached contacts.
  // c.status may be a raw ID or a name string depending on API shape —
  // resolve to the canonical status ID using both exact match and name fallback.
  const contactCountByStatusId = useMemo<Record<string, number>>(() => {
    if (!contacts.data) return {};
    const counts: Record<string, number> = {};
    const normalized = extractArray(contacts.data, "contacts")
      .map(normalizeApiContact)
      .filter(Boolean);
    const statusNameToId: Record<string, string> = {};
    for (const s of apiStatuses) {
      statusNameToId[s.name.toLowerCase()] = s.id;
    }
    for (const c of normalized) {
      if (!c?.status) continue;
      const cs = c.status;
      // Try exact ID match first, then name-based lookup
      const resolvedId =
        apiStatuses.find((s) => s.id === cs)?.id ??
        statusNameToId[cs.toLowerCase()];
      if (resolvedId) {
        counts[resolvedId] = (counts[resolvedId] || 0) + 1;
      }
    }
    return counts;
  }, [contacts.data, apiStatuses]);

  const { height: windowHeight } = useWindowDimensions();

  function openStatusActions(status: Status, pageY: number) {
    setActionStatus(status);
    setActionY(pageY);
  }

  function closeStatusActions() {
    setActionStatus(null);
  }

  async function handleDeleteStatusFromList() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteStatus(deleteTarget.id);
      await refreshStatuses(true);
      invalidateContacts();
      invalidateDashboard();
      setDeleteTarget(null);
    } catch (err) {
      setError(apiMessage(err, "Cannot delete status."));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const insets = useSafeAreaInsets();

  return (
    <MeshScreen>
      {/* Leaf decoration — top-right, subtle background accent */}
      <Image
        source={leafPng}
        resizeMode="contain"
        pointerEvents="none"
        style={{ height: 280, opacity: 0.10, position: "absolute", right: -90, top: insets.top - 10, transform: [{ rotate: "-14deg" }], width: 320, zIndex: 0 }}
      />

      <MeshHeroHeader title={t("status")} subtitle={t("statusSub")} right={<HeaderCircleBtn icon="add" onPress={() => nav("createStatus")} />} refreshing={isBackgroundRefreshing}>
        <View style={{ height: 44, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
          <Ionicons name="search" size={18} color={mesh.ink400} />
          <Text style={{ color: "#8A928D", fontSize: mesh.font.body }}>{t("searchStatus")}</Text>
        </View>
      </MeshHeroHeader>

      <MeshScroll style={{ paddingHorizontal: 16, paddingTop: 14 }} bottom={150}>
        <SectionLabel style={{ marginBottom: 8 }}>{t("statusList")}</SectionLabel>
        {isInitialLoading ? (
          <InlineState label="Loading statuses..." loading />
        ) : error ? (
          <InlineState label={error} error />
        ) : sourceStatuses.length === 0 ? (
          <InlineState label="No statuses from API." />
        ) : (
          <MeshCard style={{ backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "rgba(6,69,50,0.06)", elevation: 0, shadowOpacity: 0.02, paddingHorizontal: 14, paddingVertical: 6 }}>
            {sourceStatuses.map((status, index) => (
            <Pressable
              key={status.id}
              onPress={() => nav("statusContacts", { statusId: status.id, statusName: status.name, statusColor: status.color })}
              onLongPress={(e) => openStatusActions(status, e.nativeEvent.pageY)}
              delayLongPress={350}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: index < sourceStatuses.length - 1 ? 1 : 0, borderColor: "rgba(6,69,50,0.08)" }}
            >
              <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: `${status.color}20` }}>
                <Ionicons name={(statusIconMap[status.icon as keyof typeof statusIconMap] || "people-outline") as keyof typeof Ionicons.glyphMap} size={20} color={status.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: mesh.font.cardTitle, fontWeight: "700" }}>{status.name}</Text>
                <Text style={{ color: mesh.ink500, fontSize: mesh.font.bodySm, marginTop: 2 }}>{status.desc}</Text>
              </View>
              <Text style={{ color: status.color, fontSize: 18, fontWeight: "700" }}>
                {contactCountByStatusId[status.id] ?? status.count}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
            </Pressable>
            ))}
          </MeshCard>
        )}

        <MeshCard style={{ backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "rgba(6,69,50,0.06)", elevation: 0, shadowOpacity: 0.02, marginTop: 18, padding: 14, flexDirection: "row", gap: 12 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,112,72,0.10)" }}>
            <Ionicons name="bulb-outline" size={16} color={mesh.green600} />
          </View>
          <Text style={{ flex: 1, color: mesh.ink500, fontSize: mesh.font.bodySm, lineHeight: 20 }}>
            <Text style={{ color: mesh.green700, fontWeight: "700" }}>{t("aboutStatus")}</Text>
            {"\n"}
            {t("aboutStatusDesc")}
          </Text>
        </MeshCard>
      </MeshScroll>

      <BottomNavScrim />

      <BottomNav
        active="status"
        t={t}
        onQuickCreateContact={() => setQuickCreateMode("contact")}
        onQuickCreateNote={() => setQuickCreateMode("note")}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "contacts") nav("contacts");
          else if (id === "notes") nav("notes");
        }}
      />

      {/* ── Long-press action sheet — positioned near the pressed row ── */}
      <Modal
        visible={Boolean(actionStatus)}
        transparent
        animationType="fade"
        onRequestClose={closeStatusActions}
      >
        {/* Dim overlay — tap anywhere outside card to close */}
        <Pressable
          onPress={closeStatusActions}
          style={{ backgroundColor: "rgba(8,32,22,0.18)", flex: 1 }}
        >
          {/* Card positioned near the long-pressed row */}
          <View
            style={[
              { left: 18, position: "absolute", right: 18 },
              // If press is in the lower half, anchor card above press point;
              // otherwise anchor it below
              actionY > windowHeight * 0.52
                ? { bottom: windowHeight - actionY + 8 }
                : { top: actionY + 8 },
            ]}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "rgba(6,69,50,0.08)",
                borderRadius: 20,
                borderWidth: 1,
                elevation: 8,
                overflow: "hidden",
                shadowColor: "#0B2F20",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.10,
                shadowRadius: 16,
              }}
            >
              {/* Header */}
              <View style={{ borderBottomColor: "rgba(6,69,50,0.07)", borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 10 }}>
                <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "800" }}>
                  {actionStatus?.name}
                </Text>
              </View>

              {/* Edit */}
              <Pressable
                onPress={() => {
                  const s = actionStatus;
                  closeStatusActions();
                  if (s) nav("createStatus", { id: s.id, status: s });
                }}
                style={{ alignItems: "center", flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 13 }}
              >
                <Ionicons name="create-outline" size={18} color={mesh.green700} />
                <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "700" }}>Edit status</Text>
              </Pressable>

              <View style={{ backgroundColor: "rgba(6,69,50,0.06)", height: 1, marginHorizontal: 0 }} />

              {/* Delete */}
              <Pressable
                onPress={() => {
                  if (!actionStatus) return;
                  setDeleteTarget(actionStatus);
                  closeStatusActions();
                }}
                style={{ alignItems: "center", flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 13 }}
              >
                <Ionicons name="trash-outline" size={18} color={mesh.pink} />
                <Text style={{ color: mesh.pink, fontSize: 14, fontWeight: "700" }}>Delete status</Text>
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Delete confirm from list ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={handleDeleteStatusFromList}
        title={t("deleteStatusTitle")}
        desc={deleteTarget ? `Delete "${deleteTarget.name}"? Contacts will no longer use this status.` : ""}
        confirmLabel={deleting ? "Deleting..." : t("delete")}
        cancelLabel={t("cancel")}
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
    <MeshCard style={{ alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 22, borderWidth: 1, elevation: 0, padding: 18, shadowOpacity: 0.02 }}>
      {loading ? <ActivityIndicator color={mesh.green700} size="small" style={{ marginBottom: 8 }} /> : null}
      <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: mesh.font.bodySm, lineHeight: mesh.lineHeight.bodySm, textAlign: "center" }}>{label}</Text>
    </MeshCard>
  );
}

export function CreateStatusScreen({ t, nav, statusId, initialStatus }: Props & { statusId?: string; initialStatus?: Status }) {
  const { refreshStatuses, invalidateContacts, invalidateDashboard } = useAppData();
  const insets = useSafeAreaInsets();
  const palette = ["#2F8F5F", "#3B7BD9", "#8B5CD6", "#D9577A", "#F5B83B", "#35C7B7"];
  const [name, setName] = useState(() => (initialStatus?.id === statusId ? initialStatus.name : ""));
  const [color, setColor] = useState(() => (initialStatus?.id === statusId ? (initialStatus.color || palette[0]) : palette[0]));
  const [existingStatus, setExistingStatus] = useState<Status | null>(() => (initialStatus?.id === statusId ? initialStatus : null));
  // If initialStatus is provided and matches, skip loading
  const [loading, setLoading] = useState(Boolean(statusId) && !(initialStatus?.id === statusId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const isEdit = Boolean(statusId);

  useEffect(() => {
    let active = true;

    async function loadExistingStatus() {
      if (!statusId) {
        setName("");
        setColor(palette[0]);
        setExistingStatus(null);
        setLoading(false);
        setError("");
        return;
      }

      // If the caller passed the full status object, use it directly — no fetch needed
      if (initialStatus && initialStatus.id === statusId) {
        setExistingStatus(initialStatus);
        setName(initialStatus.name);
        setColor(initialStatus.color || palette[0]);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await getStatuses();
        const list = extractArray(response, "statuses").map(normalizeApiStatus).filter(Boolean) as Status[];
        const match = list.find((status) => status.id === statusId);

        if (!active) return;

        if (!match) {
          setExistingStatus(null);
          setError("Status not found.");
          return;
        }

        setExistingStatus(match);
        setName(match.name);
        setColor(match.color || palette[0]);
      } catch (err) {
        if (!active) return;
        setExistingStatus(null);
        setError(apiMessage(err, "Cannot load status."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadExistingStatus();

    return () => {
      active = false;
    };
  }, [statusId, initialStatus]);

  async function handleSave() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Status name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (statusId) {
        await updateStatus(statusId, {
          color,
          name: trimmedName
        });
      } else {
        await createStatus({
          color,
          name: trimmedName
        });
      }

      await refreshStatuses(true);
      invalidateContacts();
      invalidateDashboard();

      nav("status", { refresh: Date.now() });
    } catch (err) {
      setError(apiMessage(err, "Cannot save status."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!statusId) return;

    try {
      setSaving(true);
      setError("");
      await deleteStatus(statusId);
      await refreshStatuses(true);
      invalidateContacts();
      invalidateDashboard();
      setConfirm(false);
      nav("status", { refresh: Date.now() });
    } catch (err) {
      setConfirm(false);
      setError(apiMessage(err, "Cannot delete status."));
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setName("");
    setColor(palette[0]);
    setError("");
  }

  if (loading) {
    return (
      <StatusFormState nav={nav} title={t("editStatus")} message="Loading status..." loading />
    );
  }

  if (statusId && error && !existingStatus) {
    return (
      <StatusFormState nav={nav} title={t("editStatus")} message={error} error />
    );
  }

  return (
    <MeshScreen>
      {/* Soft top gradient — fades to white so there's no hard header/body split */}
      <MeshGradientView
        pointerEvents="none"
        style={{ height: 330, left: 0, position: "absolute", right: 0, top: 0 }}
        columns={4}
        rows={4}
        colors={[
          "#064532", "#0B573E", "#2F805E", "#DDEFE5",
          "#EAF6EF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
          "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
          "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
        ]}
        points={[
          [0, 0],    [0.35, 0],    [0.7, 0],    [1, 0],
          [0, 0.36], [0.35, 0.38], [0.7, 0.34], [1, 0.3],
          [0, 0.66], [0.35, 0.68], [0.7, 0.72], [1, 0.7],
          [0, 1],    [0.35, 1],    [0.7, 1],    [1, 1],
        ]}
        smoothsColors
      />

      {/* Leaf accent — subtle, top-right */}
      <Image
        source={leafPng}
        resizeMode="contain"
        pointerEvents="none"
        style={{
          height: 260,
          opacity: 0.075,
          position: "absolute",
          right: -78,
          top: insets.top + 120,
          transform: [{ rotate: "-12deg" }],
          width: 260,
          zIndex: 0,
        }}
      />

      {/* ── Top nav: back · clear ── */}
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 24 }}>
        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("status")} />
          <Pressable onPress={handleClear} hitSlop={10}>
            <Text style={{ color: mesh.green700, fontSize: 16, fontWeight: "800" }}>Clear</Text>
          </Pressable>
        </View>

        {/* Large left-aligned title */}
        <Text
          style={{
            color: "#064532",
            fontSize: 31,
            fontWeight: "800",
            letterSpacing: -0.6,
            lineHeight: 37,
            marginTop: 26,
          }}
        >
          {isEdit ? t("editStatus") : "Create status"}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            color: "#66716B",
            fontSize: 15.5,
            lineHeight: 23,
            marginTop: 12,
            maxWidth: 330,
          }}
        >
          Group people by relationship context.
        </Text>
      </View>

      {/* ── Scrollable form content ── */}
      <MeshScroll style={{ paddingHorizontal: 24, paddingTop: 42 }} bottom={150}>

        {/* Inline error */}
        {error ? (
          <View style={{ backgroundColor: "rgba(217,87,122,0.10)", borderRadius: 14, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: mesh.pink, fontSize: 13, lineHeight: 18 }}>{error}</Text>
          </View>
        ) : null}

        {/* Status name */}
        <Text style={{ color: "#064532", fontSize: 14.5, fontWeight: "800", marginBottom: 11 }}>
          Status name
        </Text>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderColor: "rgba(6,69,50,0.10)",
            borderRadius: 17,
            borderWidth: 1,
            height: 68,
            paddingHorizontal: 17,
            paddingTop: 13,
            position: "relative",
          }}
        >
          <TextInput
            value={name}
            onChangeText={(v) => setName(v.slice(0, 30))}
            placeholder="e.g. Investor, Client, Mentor"
            placeholderTextColor="#929B96"
            style={{ color: mesh.ink900, fontSize: 15.5, height: 26, padding: 0 }}
            maxLength={30}
          />
          <Text style={{ bottom: 11, color: mesh.ink400, fontSize: 13, position: "absolute", right: 17 }}>
            {name.length}/30
          </Text>
        </View>

        {/* Choose color */}
        <Text style={{ color: "#064532", fontSize: 14.5, fontWeight: "800", marginBottom: 12, marginTop: 30 }}>
          Choose color
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {palette.map((item) => {
            const active = color === item;
            return (
              <Pressable
                key={item}
                onPress={() => setColor(item)}
                style={{
                  alignItems: "center",
                  backgroundColor: item,
                  borderColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 3,
                  elevation: active ? 3 : 1,
                  height: 48,
                  justifyContent: "center",
                  shadowColor: item,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: active ? 0.18 : 0.06,
                  shadowRadius: active ? 9 : 5,
                  width: 48,
                }}
              >
                {active ? <Ionicons name="checkmark" size={23} color="#FFFFFF" /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Preview */}
        <Text style={{ color: "#064532", fontSize: 14.5, fontWeight: "800", marginBottom: 12, marginTop: 36 }}>
          Preview
        </Text>
        <View
          style={{
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: `${color}12`,
            borderRadius: 999,
            flexDirection: "row",
            gap: 10,
            height: 40,
            paddingHorizontal: 18,
          }}
        >
          <View style={{ backgroundColor: color, borderRadius: 999, height: 8, width: 8 }} />
          <Text style={{ color, fontSize: 15, fontWeight: "800" }}>
            {name.trim() || "Status name"}
          </Text>
        </View>

      </MeshScroll>

      {/* ── Fixed bottom save button ── */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.90)",
          bottom: 0,
          left: 0,
          paddingBottom: Math.max(insets.bottom, 18),
          paddingHorizontal: 24,
          paddingTop: 10,
          position: "absolute",
          right: 0,
        }}
      >
        <Pressable
          disabled={saving}
          onPress={handleSave}
          style={{
            borderRadius: 999,
            elevation: 4,
            opacity: saving ? 0.7 : 1,
            overflow: "hidden",
            shadowColor: "#064532",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.10,
            shadowRadius: 14,
          }}
        >
          <LinearGradient
            colors={[mesh.green800, mesh.green700, "#008A55"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: 10,
              height: 58,
              justifyContent: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={{ color: "#FFFFFF", fontSize: 16.5, fontWeight: "800" }}>
              Save status
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={handleDelete}
        title={t("deleteStatusTitle")}
        desc={t("deleteStatusDesc")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
      />
    </MeshScreen>
  );
}

// ─── StatusContactsScreen ──────────────────────────────────────────────────────
// Dedicated push-screen showing contacts filtered to a single status.

export function StatusContactsScreen({
  t,
  lang: _lang,
  nav,
  statusId,
  statusName,
  statusColor,
}: Props & { statusId: string; statusName: string; statusColor?: string }) {
  const { contacts, statuses: statusesCtx, refreshContacts, refreshStatuses } = useAppData();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    refreshContacts(false);
    refreshStatuses(false);
  }, [refreshContacts, refreshStatuses]);

  // Resolve statuses list so we can do name-based matching if needed
  const apiStatuses = useMemo<Status[]>(() => {
    if (!statusesCtx.data) return [];
    return extractArray(statusesCtx.data, "statuses")
      .map(normalizeApiStatus)
      .filter(Boolean) as Status[];
  }, [statusesCtx.data]);

  const filteredContacts = useMemo<Contact[]>(() => {
    if (!contacts.data) return [];
    const statusNameToId: Record<string, string> = {};
    for (const s of apiStatuses) statusNameToId[s.name.toLowerCase()] = s.id;

    return (
      extractArray(contacts.data, "contacts")
        .map(normalizeApiContact)
        .filter((c): c is Contact => {
          if (!c?.status) return false;
          const cs = c.status;
          const resolvedId =
            apiStatuses.find((s) => s.id === cs)?.id ??
            statusNameToId[cs.toLowerCase()];
          return resolvedId === statusId || cs === statusId;
        }) as Contact[]
    );
  }, [contacts.data, apiStatuses, statusId]);

  const isLoading = contacts.loading && !contacts.data;
  const dotColor = statusColor || mesh.green700;

  return (
    <MeshScreen>
      {/* Soft gradient header */}
      <MeshGradientView
        pointerEvents="none"
        style={{ height: 300, left: 0, position: "absolute", right: 0, top: 0 }}
        columns={4}
        rows={4}
        colors={[
          "#064532", "#0B573E", "#2F805E", "#DDEFE5",
          "#EAF6EF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
          "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
          "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
        ]}
        points={[
          [0, 0],    [0.35, 0],    [0.7, 0],    [1, 0],
          [0, 0.36], [0.35, 0.38], [0.7, 0.34], [1, 0.3],
          [0, 0.66], [0.35, 0.68], [0.7, 0.72], [1, 0.7],
          [0, 1],    [0.35, 1],    [0.7, 1],    [1, 1],
        ]}
        smoothsColors
      />

      {/* Leaf accent */}
      <Image
        source={leafPng}
        resizeMode="contain"
        pointerEvents="none"
        style={{ height: 240, opacity: 0.07, position: "absolute", right: -60, top: insets.top + 90, transform: [{ rotate: "-12deg" }], width: 240, zIndex: 0 }}
      />

      {/* Header area */}
      <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 14 }}>
        <HeaderCircleBtn icon="chevron-back" onPress={() => nav("back")} />

        <View style={{ alignItems: "center", flexDirection: "row", gap: 10, marginTop: 22 }}>
          <View style={{ backgroundColor: dotColor, borderRadius: 999, height: 11, width: 11 }} />
          <Text style={{ color: "#064532", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
            {statusName}
          </Text>
        </View>

        <Text style={{ color: "#66716B", fontSize: 14, marginTop: 6 }}>
          {isLoading
            ? "Loading..."
            : `${filteredContacts.length} ${filteredContacts.length === 1 ? "person" : "people"}`}
        </Text>
      </View>

      {/* Contact list */}
      <MeshScroll style={{ paddingHorizontal: 20, paddingTop: 28 }} bottom={60}>
        {isLoading ? (
          <ActivityIndicator color={mesh.green700} size="small" style={{ marginTop: 40 }} />
        ) : filteredContacts.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60, gap: 8 }}>
            <Ionicons name="people-outline" size={40} color={mesh.ink300} />
            <Text style={{ color: mesh.ink400, fontSize: 15, textAlign: "center" }}>
              No contacts in {statusName} yet.
            </Text>
          </View>
        ) : (
          <MeshCard style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 22, borderWidth: 1, elevation: 0, paddingHorizontal: 14, paddingVertical: 6, shadowOpacity: 0.02 }}>
            {filteredContacts.map((contact, index) => (
              <Pressable
                key={contact.id}
                onPress={() => nav("contactDetail", { id: contact.id })}
                style={{ alignItems: "center", borderBottomColor: "rgba(6,69,50,0.08)", borderBottomWidth: index < filteredContacts.length - 1 ? 1 : 0, flexDirection: "row", gap: 12, paddingVertical: 11 }}
              >
                <GradientAvatar
                  initials={contact.initials}
                  statusColor={contact.statusColor}
                  avatarUrl={contact.avatarUrl}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>
                    {contact.name}
                  </Text>
                  {contact.statusName ? (
                    <Text style={{ color: dotColor, fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                      {contact.statusName}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
              </Pressable>
            ))}
          </MeshCard>
        )}
      </MeshScroll>
    </MeshScreen>
  );
}

function apiMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function StatusFormState({ error = false, loading = false, message, nav, title }: { error?: boolean; loading?: boolean; message: string; nav: NavFn; title: string }) {
  return (
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("status")} />
          <Text style={{ flex: 1, paddingRight: 40, textAlign: "center", color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>{title}</Text>
        </View>
      </MeshHeader>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {loading ? <ActivityIndicator color={mesh.green700} size="small" /> : null}
        <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: 13, lineHeight: 19, marginTop: 12, textAlign: "center" }}>{message}</Text>
        <Pressable onPress={() => nav("status")} style={{ marginTop: 20, borderRadius: 999, backgroundColor: mesh.green700, paddingHorizontal: 18, paddingVertical: 11 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Back to Status</Text>
        </Pressable>
      </View>
    </MeshScreen>
  );
}

