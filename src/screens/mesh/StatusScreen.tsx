import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { createStatus, deleteStatus, getStatuses, updateStatus } from "../../api/statusApi";
import { extractArray, normalizeApiStatus } from "../../api/screenAdapters";
import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { BottomNav, ConfirmDialog, HeaderCircleBtn, MeshCard, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, TFn, TipCard } from "../../mesh/MeshComponents";
import { Lang, Status } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

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

export function StatusScreen({ t, nav }: Props) {
  const [apiStatuses, setApiStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sourceStatuses = apiStatuses;

  useEffect(() => {
    let active = true;

    getStatuses()
      .then((response) => {
        if (!active) return;
        const normalized = extractArray(response, "statuses").map(normalizeApiStatus).filter(Boolean) as Status[];
        setApiStatuses(normalized);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setApiStatuses([]);
        setError(err instanceof Error && err.message ? err.message : "Cannot load statuses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <MeshScreen>
      <MeshHeroHeader title={t("status")} subtitle={t("statusSub")} right={<HeaderCircleBtn icon="add" onPress={() => nav("createStatus")} />}>
        <View style={{ height: 44, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
          <Ionicons name="search" size={18} color={mesh.ink400} />
          <Text style={{ color: "#8A928D", fontSize: 14 }}>{t("searchStatus")}</Text>
        </View>
      </MeshHeroHeader>

      <MeshScroll style={{ paddingHorizontal: 16, paddingTop: 14 }} bottom={150}>
        <SectionLabel style={{ marginBottom: 8 }}>{t("statusList")}</SectionLabel>
        {loading ? (
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
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "700" }}>{status.name}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 13, marginTop: 2 }}>{status.desc}</Text>
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
          <Text style={{ flex: 1, color: mesh.ink500, fontSize: 13, lineHeight: 20 }}>
            <Text style={{ color: mesh.green700, fontWeight: "700" }}>{t("aboutStatus")}</Text>
            {"\n"}
            {t("aboutStatusDesc")}
          </Text>
        </MeshCard>
      </MeshScroll>

      <BottomNav
        active="status"
        t={t}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "contacts") nav("contacts");
          else if (id === "notes") nav("notes");
          else if (id === "fab") nav("createNote");
        }}
      />
    </MeshScreen>
  );
}

function InlineState({ error = false, label, loading = false }: { error?: boolean; label: string; loading?: boolean }) {
  return (
    <MeshCard style={{ alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(6,69,50,0.06)", borderRadius: 22, borderWidth: 1, elevation: 0, padding: 18, shadowOpacity: 0.02 }}>
      {loading ? <ActivityIndicator color={mesh.green700} size="small" style={{ marginBottom: 8 }} /> : null}
      <Text style={{ color: error ? mesh.pink : mesh.ink500, fontSize: 13, lineHeight: 19, textAlign: "center" }}>{label}</Text>
    </MeshCard>
  );
}

export function CreateStatusScreen({ t, nav, statusId }: Props & { statusId?: string }) {
  const palette = ["#2F8F5F", "#3B7BD9", "#8B5CD6", "#D9577A", "#E07543", "#E6B53E", "#3FA398", "#93A1A0"];
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
      <MeshHeader style={{ paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("status")} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 60, color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>{isEdit ? t("editStatus") : t("createStatus")}</Text>
          <Pressable disabled={saving} onPress={handleSave} style={{ alignItems: "center", borderRadius: 999, backgroundColor: "#FFFFFF", flexDirection: "row", gap: 7, opacity: saving ? 0.7 : 1, paddingHorizontal: 16, paddingVertical: 8 }}>
            {saving ? <ActivityIndicator color={mesh.green700} size="small" /> : null}
            <Text style={{ color: mesh.green700, fontWeight: "800", fontSize: 13 }}>{t("save")}</Text>
          </Pressable>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: "center", alignSelf: "center", maxWidth: 280 }}>{t("statusFormSub")}</Text>
      </MeshHeader>

      <MeshScroll style={{ backgroundColor: "#FFFFFF", marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20 }} bottom={100}>
        {error ? (
          <View style={{ borderRadius: 14, backgroundColor: "rgba(217,87,122,0.10)", marginBottom: 14, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: mesh.pink, fontSize: 13, lineHeight: 18 }}>{error}</Text>
          </View>
        ) : null}

        <FieldLabel>
          {t("statusName")} <Text style={{ color: mesh.pink }}>*</Text>
        </FieldLabel>
        <View style={{ borderWidth: 1, borderColor: mesh.line, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 }}>
          <TextInput value={name} onChangeText={setName} placeholder={t("enterStatusName")} placeholderTextColor={mesh.ink400} style={{ color: mesh.ink900, fontSize: 15 }} />
          <Text style={{ position: "absolute", right: 12, bottom: 6, color: mesh.ink400, fontSize: 11 }}>{name.length}/30</Text>
        </View>

        <FieldLabel>
          {t("statusColor")} <Text style={{ color: mesh.pink }}>*</Text>
        </FieldLabel>
        <Text style={{ color: mesh.ink500, fontSize: 12, marginBottom: 12 }}>{t("statusColorDesc")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {palette.map((item) => (
            <Pressable
              key={item}
              onPress={() => setColor(item)}
              style={{ width: "22%", aspectRatio: 1, borderRadius: 999, backgroundColor: item, alignItems: "center", justifyContent: "center", borderWidth: color === item ? 3 : 0, borderColor: "#FFFFFF", shadowColor: item, shadowOpacity: color === item ? 0.35 : 0, shadowRadius: 8 }}
            >
              {color === item ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
            </Pressable>
          ))}
        </View>

        <FieldLabel>Preview</FieldLabel>
        <Text style={{ color: mesh.ink500, fontSize: 12, marginBottom: 12 }}>{t("statusPreviewDesc")}</Text>
        <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 999, backgroundColor: `${color}20`, paddingHorizontal: 12, paddingVertical: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ color, fontWeight: "800", fontSize: 13 }}>{name || t("statusName")}</Text>
        </View>

        <View style={{ marginTop: 22 }}>
          <TipCard>
            <Text style={{ color: mesh.green700, fontWeight: "800" }}>{t("tip")}</Text>
            {"\n"}
            {t("statusTip")}
          </TipCard>
        </View>

        {statusId ? (
          <Pressable disabled={saving} onPress={() => setConfirm(true)} style={{ marginTop: 20, borderRadius: 14, borderWidth: 1, borderColor: `${mesh.pink}55`, opacity: saving ? 0.6 : 1, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
            <Ionicons name="trash-outline" size={16} color={mesh.pink} />
            <Text style={{ color: mesh.pink, fontSize: 14, fontWeight: "800" }}>{t("deleteStatus")}</Text>
          </Pressable>
        ) : null}
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
