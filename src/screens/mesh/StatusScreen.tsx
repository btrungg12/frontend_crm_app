import { Ionicons } from "@expo/vector-icons";
import { MeshGradientView } from "expo-mesh-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
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
};

const statusIconMap = {
  people: "people-outline",
  briefcase: "briefcase-outline",
  home: "home-outline",
  school: "school-outline",
  heart: "heart-outline"
} as const;

export function StatusScreen({ t, lang, nav }: Props) {
  const [apiStatuses, setApiStatuses] = useState<Status[]>([]);
  const [error, setError] = useState("");
  const [quickCreateMode, setQuickCreateMode] = useState<"note" | "contact" | null>(null);

  const { statuses, refreshStatuses } = useAppData();

  const sourceStatuses = apiStatuses;

  // Load statuses from cache on mount
  useEffect(() => {
    refreshStatuses(false);
  }, [refreshStatuses]);

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

  return (
    <MeshScreen>
      <MeshHeroHeader title={t("status")} subtitle={t("statusSub")} right={<HeaderCircleBtn icon="add" onPress={() => nav("createStatus")} />}>
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

      nav("status");
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
      setConfirm(false);
      nav("status");
    } catch (err) {
      setConfirm(false);
      setError(apiMessage(err, "Cannot delete status."));
    } finally {
      setSaving(false);
    }
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
      <View
        style={{
          height: insets.top + 225,
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
            [0.35, 0.32],
            [0.7, 0.3],
            [1, 0.26],
            [0, 0.58],
            [0.35, 0.62],
            [0.7, 0.66],
            [1, 0.62],
            [0, 1],
            [0.35, 1],
            [0.7, 1],
            [1, 1]
          ]}
          smoothsColors
        />

        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("status")} />
          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={{
              alignItems: "center",
              backgroundColor: saving ? "rgba(6,69,50,0.45)" : mesh.green700,
              borderRadius: 999,
              elevation: 3,
              flexDirection: "row",
              gap: 7,
              opacity: saving ? 0.7 : 1,
              paddingHorizontal: 20,
              paddingVertical: 11,
              shadowColor: "#064532",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16
            }}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>{t("save")}</Text>
          </Pressable>
        </View>
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Text style={{ color: "#064532", fontSize: 22, fontWeight: "800", letterSpacing: -0.3, lineHeight: 28, textAlign: "center" }}>{isEdit ? t("editStatus") : t("createStatus")}</Text>
          <Text style={{ color: "#4F5F58", fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 300, textAlign: "center" }}>{t("statusFormSub")}</Text>
        </View>
      </View>

      <MeshScroll style={{ backgroundColor: "#F7FAF7", marginTop: -24, paddingHorizontal: 16, paddingTop: 0 }} bottom={120}>
        {error ? (
          <View style={{ borderRadius: 14, backgroundColor: "rgba(217,87,122,0.10)", marginBottom: 14, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: mesh.pink, fontSize: 13, lineHeight: 18 }}>{error}</Text>
          </View>
        ) : null}

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(6,69,50,0.06)",
            borderRadius: 26,
            borderWidth: 1,
            elevation: 2,
            padding: 16,
            shadowColor: "#064532",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.06,
            shadowRadius: 24
          }}
        >
          <View style={{ alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 14 }}>
            <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }}>
              <Ionicons name="pricetag-outline" size={20} color={mesh.green700} />
            </View>
            <Text style={{ color: "#073F33", fontSize: 16, fontWeight: "800" }}>
              {t("statusName")} <Text style={{ color: mesh.pink }}>*</Text>
            </Text>
          </View>
          <View style={{ borderColor: "rgba(6,69,50,0.12)", borderRadius: 16, borderWidth: 1, paddingBottom: 26, paddingHorizontal: 14, paddingTop: 13 }}>
            <TextInput value={name} onChangeText={setName} placeholder={t("enterStatusName")} placeholderTextColor="#8C9691" style={{ color: mesh.ink900, fontSize: 15 }} />
            <Text style={{ bottom: 7, color: mesh.ink400, fontSize: 12, position: "absolute", right: 12 }}>{name.length}/30</Text>
          </View>
          <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 20, marginTop: 12 }}>Use a short, clear name that helps you recognize and organize relationships easily.</Text>

          <Text style={{ color: "#073F33", fontSize: 16, fontWeight: "800", marginTop: 24 }}>
            {t("statusColor")} <Text style={{ color: mesh.pink }}>*</Text>
          </Text>
          <Text style={{ color: mesh.ink500, fontSize: 13, marginBottom: 16, marginTop: 8 }}>{t("statusColorDesc")}</Text>
          <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
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
                    borderRadius: 27,
                    borderWidth: 3,
                    elevation: active ? 4 : 2,
                    height: 54,
                    justifyContent: "center",
                    shadowColor: item,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: active ? 0.32 : 0.18,
                    shadowRadius: active ? 12 : 8,
                    width: 54
                  }}
                >
                  {active ? <Ionicons name="checkmark" size={24} color="#FFFFFF" /> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.07)", borderRadius: 22, borderWidth: 1, marginTop: 28, padding: 16 }}>
            <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
              <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }}>
                <Ionicons name="eye-outline" size={20} color={mesh.green700} />
              </View>
              <View>
                <Text style={{ color: "#073F33", fontSize: 16, fontWeight: "800" }}>Preview</Text>
                <Text style={{ color: mesh.ink500, fontSize: 13, marginTop: 4 }}>{t("statusPreviewDesc")}</Text>
              </View>
            </View>
            <View style={{ alignItems: "center", alignSelf: "center", backgroundColor: `${color}18`, borderRadius: 999, flexDirection: "row", gap: 8, marginTop: 18, paddingHorizontal: 18, paddingVertical: 10 }}>
              <View style={{ backgroundColor: color, borderRadius: 4, height: 8, width: 8 }} />
              <Text style={{ color, fontSize: 15, fontWeight: "800" }}>{name || t("statusName")}</Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-start", backgroundColor: "rgba(31,112,72,0.08)", borderRadius: 20, flexDirection: "row", gap: 12, marginTop: 18, padding: 16 }}>
            <View style={{ alignItems: "center", backgroundColor: "rgba(31,112,72,0.10)", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }}>
              <Ionicons name="bulb-outline" size={20} color={mesh.green700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#073F33", fontSize: 16, fontWeight: "800" }}>{t("tip")}</Text>
              <Text style={{ color: mesh.ink700, fontSize: 14, lineHeight: 22, marginTop: 4 }}>{t("statusTip")}</Text>
            </View>
          </View>

          {statusId ? (
            <Pressable disabled={saving} onPress={() => setConfirm(true)} style={{ alignItems: "center", borderColor: `${mesh.pink}55`, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 20, opacity: saving ? 0.6 : 1, paddingVertical: 14 }}>
              <Ionicons name="trash-outline" size={16} color={mesh.pink} />
              <Text style={{ color: mesh.pink, fontSize: 14, fontWeight: "800" }}>{t("deleteStatus")}</Text>
            </Pressable>
          ) : null}
        </View>
      </MeshScroll>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={handleDelete} title={t("deleteStatusTitle")} desc={t("deleteStatusDesc")} confirmLabel={t("delete")} cancelLabel={t("cancel")} />
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "800", marginTop: 20, marginBottom: 8 }}>{children}</Text>;
}
