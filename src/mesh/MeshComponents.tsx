import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "../components/AppBackground";
import { avatarTint, Contact, Lang, statusById } from "./meshData";
import { mesh } from "./meshTheme";

export type NavFn = (name: string, props?: Record<string, unknown>) => void;
export type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function MeshScreen({
  children,
  showLeaf = true,
  style
}: PropsWithChildren<{ showLeaf?: boolean; style?: ViewStyle }>) {
  return (
    <AppBackground showLeaf={showLeaf} style={style}>
      {children}
    </AppBackground>
  );
}

export function MeshScroll({ children, bottom = 100, style }: PropsWithChildren<{ bottom?: number; style?: ViewStyle }>) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={{ paddingBottom: bottom }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Avatar({ name, size = 44, dot, ring = false }: { name: string; size?: number; dot?: string; ring?: boolean }) {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const [backgroundColor, color] = avatarTint(initials || "??");

  return (
    <View style={{ position: "relative", flexShrink: 0 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          borderWidth: ring ? 3 : 0,
          borderColor: "#FFFFFF"
        }}
      >
        <Text style={{ color, fontSize: Math.round(size * 0.36), fontWeight: "700" }}>{initials}</Text>
      </View>
      {dot ? (
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: Math.max(10, size * 0.22),
            height: Math.max(10, size * 0.22),
            borderRadius: 99,
            backgroundColor: dot,
            borderWidth: 2,
            borderColor: "#FFFFFF"
          }}
        />
      ) : null}
    </View>
  );
}

function LeafMark() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", right: -10, top: 8, width: 150, height: 150, opacity: 0.5 }}>
      <View style={{ position: "absolute", right: 36, top: 0, width: 38, height: 118, borderRadius: 60, backgroundColor: "#B8DDC6", transform: [{ rotate: "32deg" }] }} />
      <View style={{ position: "absolute", right: 18, top: 30, width: 36, height: 112, borderRadius: 60, backgroundColor: "#A2D2B5", transform: [{ rotate: "34deg" }] }} />
      <View style={{ position: "absolute", right: 74, top: 54, width: 28, height: 88, borderRadius: 60, backgroundColor: "#C8E2D2", transform: [{ rotate: "28deg" }] }} />
    </View>
  );
}

export function MeshHeader({
  children,
  style,
  variant = "solid"
}: PropsWithChildren<{ style?: ViewStyle; variant?: "solid" | "transparent" }>) {
  const insets = useSafeAreaInsets();
  const transparent = variant === "transparent";
  return (
    <View
      style={[
        {
          position: "relative",
          overflow: "hidden",
          backgroundColor: transparent ? "transparent" : mesh.green500,
          paddingTop: insets.top + 14,
          paddingHorizontal: 20,
          paddingBottom: 28
        },
        style
      ]}
    >
      {transparent ? null : <LeafMark />}
      <View style={{ position: "relative", zIndex: 1 }}>{children}</View>
    </View>
  );
}

export function HeaderCircleBtn({
  icon = "chevron-back",
  onPress,
  dark = false,
  style
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  dark?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: dark ? "rgba(255,255,255,0.18)" : "#FFFFFF",
          ...mesh.shadow
        },
        style
      ]}
    >
      <Ionicons name={icon} size={20} color={dark ? "#FFFFFF" : mesh.ink900} />
    </Pressable>
  );
}

export function MeshCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View
      style={[
        {
          backgroundColor: mesh.bgCard,
          borderRadius: mesh.radiusXl,
          ...mesh.shadow
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

export function SectionLabel({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <Text style={[{ color: mesh.ink500, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }, style]}>{children}</Text>;
}

export function MeshChip({
  children,
  active = false,
  onPress,
  style
}: PropsWithChildren<{ active?: boolean; onPress?: () => void; style?: ViewStyle }>) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderRadius: 999,
          backgroundColor: active ? mesh.green700 : mesh.bgSubtle,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 6
        },
        style
      ]}
    >
      <Text style={{ color: active ? "#FFFFFF" : mesh.ink700, fontSize: 13, fontWeight: "700" }}>{children}</Text>
    </Pressable>
  );
}

export function StatusChip({ statusId, size = "sm" }: { statusId?: string; lang?: Lang; size?: "sm" | "md" }) {
  const status = statusById(statusId);
  if (!status) return null;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: size === "sm" ? 3 : 4,
        borderRadius: 999,
        backgroundColor: mesh.bgSubtle
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.color }} />
      <Text style={{ color: mesh.ink700, fontSize: size === "sm" ? 11 : 12, fontWeight: "700" }}>{status.name}</Text>
    </View>
  );
}

export function BottomNav({
  active,
  onTab,
  t,
  withFab = true
}: {
  active: "home" | "contacts" | "notes" | "status";
  onTab: (id: string) => void;
  t: TFn;
  withFab?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const tabs: Array<{ id: string; label?: string; icon?: keyof typeof Ionicons.glyphMap; activeIcon?: keyof typeof Ionicons.glyphMap }> = [
    { id: "home", label: t("tabHome"), icon: "home-outline", activeIcon: "home" },
    { id: "contacts", label: t("tabContacts"), icon: "people-outline", activeIcon: "people" },
    { id: "fab" },
    { id: "notes", label: t("tabNotes"), icon: "document-text-outline", activeIcon: "document-text" },
    { id: "status", label: t("tabStatus"), icon: "pricetag-outline", activeIcon: "pricetag" }
  ];

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: insets.bottom + 76,
        paddingBottom: insets.bottom + 8,
        paddingTop: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.96)",
        borderTopWidth: 1,
        borderColor: mesh.line,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around"
      }}
    >
      {tabs.map((tab) => {
        if (tab.id === "fab") {
          return withFab ? (
            <Pressable
              key="fab"
              onPress={() => onTab("fab")}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: mesh.green600,
                transform: [{ translateY: -12 }],
                shadowColor: mesh.green700,
                shadowOpacity: 0.3,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8
              }}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View key="fab" style={{ width: 56 }} />
          );
        }

        const isActive = active === tab.id;
        return (
          <Pressable key={tab.id} onPress={() => onTab(tab.id)} style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 6 }}>
            <Ionicons name={(isActive ? tab.activeIcon : tab.icon) || "ellipse"} size={22} color={isActive ? mesh.green700 : mesh.ink500} />
            <Text style={{ color: isActive ? mesh.green700 : mesh.ink500, fontSize: 11, fontWeight: isActive ? "800" : "600" }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ContactAvatarRow({ contact }: { contact: Contact }) {
  const status = statusById(contact.status);
  return <Avatar name={contact.name} size={64} dot={status?.color} />;
}

export function MeshTextInput({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  style
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  style?: ViewStyle;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={mesh.ink400}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      style={[
        {
          color: mesh.ink900,
          fontSize: 15,
          lineHeight: multiline ? 23 : undefined,
          minHeight: multiline ? 120 : 48
        },
        style
      ]}
    />
  );
}

export function TipCard({ children }: PropsWithChildren) {
  return (
    <View style={{ flexDirection: "row", gap: 12, padding: 14, borderRadius: mesh.radiusLg, backgroundColor: mesh.bgSubtle }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(31,112,72,0.12)"
        }}
      >
        <Ionicons name="bulb-outline" size={18} color={mesh.green600} />
      </View>
      <Text style={{ flex: 1, color: mesh.ink500, fontSize: 13, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  desc,
  confirmLabel,
  cancelLabel
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  desc: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.5)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Pressable style={{ width: "100%", maxWidth: 320, borderRadius: mesh.radius2xl, padding: 24, backgroundColor: "#FFFFFF", alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(217,87,122,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Ionicons name="trash-outline" size={24} color={mesh.pink} />
          </View>
          <Text style={{ color: mesh.ink900, fontWeight: "800", fontSize: 18, marginBottom: 6 }}>{title}</Text>
          <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20 }}>{desc}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={onClose} style={{ flex: 1, borderRadius: mesh.radiusMd, borderWidth: 1.5, borderColor: mesh.green700, paddingVertical: 13, alignItems: "center" }}>
              <Text style={{ color: mesh.green700, fontWeight: "800" }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm();
                onClose();
              }}
              style={{ flex: 1, borderRadius: mesh.radiusMd, backgroundColor: mesh.pink, paddingVertical: 13, alignItems: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
