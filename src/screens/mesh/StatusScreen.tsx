import { Ionicons } from "@expo/vector-icons";
import { MeshGradientView } from "expo-mesh-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createStatus, deleteStatus, getStatuses, updateStatus } from "../../api/statusApi";
import { extractArray, normalizeApiStatus } from "../../api/screenAdapters";
import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { QuickCreateSheet } from "../../components/QuickCreateSheet";
import { BottomNav, BottomNavScrim, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, TFn } from "../../mesh/MeshComponents";
import { CreateNoteScreen } from "./CreateNoteScreen";
import { CreateContactScreen } from "./ContactsScreen";
import { Lang, Status } from "../../mesh/meshData";
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

  const { statuses, refreshStatuses } = useAppData();

  const sourceStatuses = apiStatuses;

  // Load statuses from cache on mount
  useEffect(() => {
    refreshStatuses(false);
  }, [refreshStatuses]);

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
              onPress={() => nav("createStatus", { id: status.id })}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: index < sourceStatuses.length - 1 ? 1 : 0, borderColor: "rgba(6,69,50,0.08)" }}
            >
              <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: `${status.color}20` }}>
                <Ionicons name={(statusIconMap[status.icon as keyof typeof statusIconMap] || "people-outline") as keyof typeof Ionicons.glyphMap} size={20} color={status.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: mesh.font.cardTitle, fontWeight: "700" }}>{status.name}</Text>
                <Text style={{ color: mesh.ink500, fontSize: mesh.font.bodySm, marginTop: 2 }}>{status.desc}</Text>
              </View>
              <Text style={{ color: status.color, fontSize: 18, fontWeight: "700" }}>{status.count}</Text>
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

export function CreateStatusScreen({ t, nav, statusId }: Props & { statusId?: string }) {
  const { refreshStatuses, invalidateContacts, invalidateDashboard } = useAppData();
  const insets = useSafeAreaInsets();
  const palette = ["#2F8F5F", "#3B7BD9", "#8B5CD6", "#D9577A", "#F5B83B", "#35C7B7"];
  const [name, setName] = useState("");
  const [color, setColor] = useState(palette[0]);
  const [existingStatus, setExistingStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(Boolean(statusId));
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
  }, [statusId]);

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
        style={{ height: 360, left: 0, position: "absolute", right: 0, top: 0 }}
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
          right: -60,
          top: insets.top + 115,
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
            fontSize: 34,
            fontWeight: "900",
            letterSpacing: -0.8,
            lineHeight: 40,
            marginTop: 28,
          }}
        >
          {isEdit ? t("editStatus") : "Create status"}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            color: "#5E6963",
            fontSize: 16,
            lineHeight: 24,
            marginTop: 14,
            maxWidth: 330,
          }}
        >
          Group people by relationship context.
        </Text>
      </View>

      {/* ── Scrollable form content ── */}
      <MeshScroll style={{ paddingHorizontal: 24, paddingTop: 52 }} bottom={150}>

        {/* Inline error */}
        {error ? (
          <View style={{ backgroundColor: "rgba(217,87,122,0.10)", borderRadius: 14, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: mesh.pink, fontSize: 13, lineHeight: 18 }}>{error}</Text>
          </View>
        ) : null}

        {/* Status name */}
        <Text style={{ color: "#064532", fontSize: 15, fontWeight: "800", marginBottom: 12 }}>
          Status name
        </Text>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.92)",
            borderColor: "rgba(6,69,50,0.14)",
            borderRadius: 18,
            borderWidth: 1,
            height: 76,
            paddingHorizontal: 18,
            paddingTop: 16,
            position: "relative",
          }}
        >
          <TextInput
            value={name}
            onChangeText={(v) => setName(v.slice(0, 30))}
            placeholder="e.g. Investor, Client, Mentor"
            placeholderTextColor="#929B96"
            style={{ color: mesh.ink900, fontSize: 16, height: 28, padding: 0 }}
            maxLength={30}
          />
          <Text style={{ bottom: 14, color: mesh.ink400, fontSize: 14, position: "absolute", right: 18 }}>
            {name.length}/30
          </Text>
        </View>

        {/* Choose color */}
        <Text style={{ color: "#064532", fontSize: 15, fontWeight: "800", marginBottom: 14, marginTop: 34 }}>
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
                  borderRadius: 25,
                  borderWidth: 4,
                  elevation: active ? 4 : 2,
                  height: 50,
                  justifyContent: "center",
                  shadowColor: item,
                  shadowOffset: { width: 0, height: 7 },
                  shadowOpacity: active ? 0.26 : 0.10,
                  shadowRadius: active ? 12 : 8,
                  width: 50,
                }}
              >
                {active ? <Ionicons name="checkmark" size={25} color="#FFFFFF" /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Preview */}
        <Text style={{ color: "#064532", fontSize: 15, fontWeight: "800", marginBottom: 14, marginTop: 42 }}>
          Preview
        </Text>
        <View
          style={{
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: `${color}14`,
            borderRadius: 999,
            flexDirection: "row",
            gap: 12,
            height: 44,
            paddingHorizontal: 22,
          }}
        >
          <View style={{ backgroundColor: color, borderRadius: 999, height: 9, width: 9 }} />
          <Text style={{ color, fontSize: 16, fontWeight: "800" }}>
            {name.trim() || "Status name"}
          </Text>
        </View>

        {/* Delete (edit mode only) */}
        {statusId ? (
          <Pressable
            disabled={saving}
            onPress={() => setConfirm(true)}
            style={{
              alignItems: "center",
              borderColor: `${mesh.pink}55`,
              borderRadius: 999,
              borderWidth: 1,
              flexDirection: "row",
              gap: 8,
              justifyContent: "center",
              marginTop: 42,
              opacity: saving ? 0.6 : 1,
              paddingVertical: 14,
            }}
          >
            <Ionicons name="trash-outline" size={16} color={mesh.pink} />
            <Text style={{ color: mesh.pink, fontSize: 14, fontWeight: "800" }}>
              {t("deleteStatus")}
            </Text>
          </Pressable>
        ) : null}
      </MeshScroll>

      {/* ── Fixed bottom save button ── */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTopColor: "rgba(6,69,50,0.06)",
          borderTopWidth: 1,
          bottom: 0,
          left: 0,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingHorizontal: 24,
          paddingTop: 14,
          position: "absolute",
          right: 0,
        }}
      >
        <Pressable
          disabled={saving}
          onPress={handleSave}
          style={{
            alignItems: "center",
            backgroundColor: mesh.green700,
            borderRadius: 999,
            elevation: 7,
            flexDirection: "row",
            gap: 12,
            height: 62,
            justifyContent: "center",
            opacity: saving ? 0.7 : 1,
            shadowColor: "#064532",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="save-outline" size={22} color="#FFFFFF" />
          )}
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "900" }}>
            Save status
          </Text>
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

