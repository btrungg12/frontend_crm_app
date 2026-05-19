import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "../components/AppBackground";
import { avatarTint, Contact, Lang, statusById } from "./meshData";
import { mesh } from "./meshTheme";

export type NavFn = (name: string, props?: Record<string, unknown>) => void;
export type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function MeshScreen({
  children,
  showLeaf = false,
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
      automaticallyAdjustKeyboardInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
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

export function SectionLabel({ children, style }: PropsWithChildren<{ style?: TextStyle }>) {
  return <Text style={[{ color: mesh.ink500, fontSize: mesh.font.caption, fontWeight: "700", letterSpacing: 1 }, style]}>{children}</Text>;
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
          backgroundColor: active ? mesh.green700 : "#FFFFFF",
          borderWidth: 1,
          borderColor: active ? mesh.green700 : "rgba(6,69,50,0.12)",
          paddingHorizontal: 14,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 6
        },
        style
      ]}
    >
      <Text style={{ color: active ? "#FFFFFF" : mesh.ink700, fontSize: mesh.font.caption, fontWeight: active ? "700" : "500" }}>{children}</Text>
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
        paddingHorizontal: 0,
        paddingVertical: size === "sm" ? 1 : 2,
        borderRadius: 999,
        backgroundColor: "transparent"
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.color }} />
      <Text style={{ color: mesh.ink700, fontSize: size === "sm" ? mesh.font.nav : mesh.font.caption, fontWeight: "500" }}>{status.name}</Text>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ScalePressable({
  activeScale = 0.94,
  children,
  onPress,
  style
}: PropsWithChildren<{
  activeScale?: number;
  onPress?: () => void;
  style?: ViewStyle;
}>) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      friction: 7,
      tension: 180
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 160
    }).start();
  };

  return (
    <AnimatedPressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[style, { transform: [{ scale }] }]}>
      {children}
    </AnimatedPressable>
  );
}

/** Fades the screen background over the floating BottomNav area. */
export function BottomNavScrim({ color = "#FFFFFF" }: { color?: string }) {
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const transparent = `rgba(${r},${g},${b},0)`;

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[transparent, color, color]}
      locations={[0, 0.5, 1]}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 170,
        zIndex: 8,
      }}
    />
  );
}

export function BottomNav({
  active,
  onTab,
  onQuickCreateContact,
  onQuickCreateNote,
  t,
  withFab = true
}: {
  active: "home" | "contacts" | "notes" | "status";
  onTab: (id: string) => void;
  onQuickCreateContact?: () => void;
  onQuickCreateNote?: () => void;
  t: TFn;
  withFab?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.OS === "ios"
    ? Math.max(insets.bottom - 6, 24)
    : 16;

  const [dockOpen, setDockOpen] = useState(false);
  const dockAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dockAnim, {
      toValue: dockOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [dockOpen]);

  const overlayOpacity = dockAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const dockTranslateY = dockAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const dockScale      = dockAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const plusRotate     = dockAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const tabs: Array<{ id: string; label?: string; icon?: keyof typeof Ionicons.glyphMap; activeIcon?: keyof typeof Ionicons.glyphMap }> = [
    { id: "home",     label: t("tabHome"),     icon: "home-outline",          activeIcon: "home"          },
    { id: "contacts", label: t("tabContacts"), icon: "people-outline",        activeIcon: "people"        },
    { id: "fab" },
    { id: "notes",    label: t("tabNotes"),    icon: "document-text-outline", activeIcon: "document-text" },
    { id: "status",   label: t("tabStatus"),   icon: "pricetag-outline",      activeIcon: "pricetag"      },
  ];

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>

      {/* ── Dim overlay — tap to close dock ── */}
      <AnimatedPressable
        pointerEvents={dockOpen ? "auto" : "none"}
        onPress={() => setDockOpen(false)}
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(8,32,22,0.18)", opacity: overlayOpacity, zIndex: 9 },
        ]}
      />

      {/* ── Mini action dock — above FAB ── */}
      {withFab ? (
        <Animated.View
          pointerEvents={dockOpen ? "auto" : "none"}
          style={{
            position: "absolute",
            bottom: bottomOffset + 88,
            alignSelf: "center",
            zIndex: 12,
            opacity: dockAnim,
            transform: [{ translateY: dockTranslateY }, { scale: dockScale }],
          }}
        >
          <View style={bnStyles.dock}>
            <Pressable
              accessibilityLabel="Create contact"
              onPress={() => { triggerHaptic(); setDockOpen(false); onQuickCreateContact?.(); }}
              style={bnStyles.dockBtn}
            >
              <Ionicons name="person-add-outline" size={22} color={mesh.green700} />
            </Pressable>
            <View style={bnStyles.dockDivider} />
            <Pressable
              accessibilityLabel="Create note"
              onPress={() => { triggerHaptic(); setDockOpen(false); onQuickCreateNote?.(); }}
              style={bnStyles.dockBtn}
            >
              <Ionicons name="document-text-outline" size={22} color={mesh.green700} />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      {/* ── Nav bar ── */}
      <View
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: bottomOffset,
          minHeight: 78,
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: "#FFFFFF",
          borderRadius: 34,
          borderWidth: 1,
          borderColor: "rgba(6,69,50,0.08)",
          shadowColor: "#064532",
          shadowOpacity: 0.1,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
          zIndex: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {tabs.map((tab) => {
          if (tab.id === "fab") {
            return withFab ? (
              <ScalePressable
                key="fab"
                activeScale={0.9}
                onPress={() => { triggerHaptic(); setDockOpen((v) => !v); }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: mesh.green700,
                  transform: [{ translateY: -16 }],
                  shadowColor: mesh.green700,
                  shadowOpacity: 0.24,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 10,
                }}
              >
                <Animated.View style={{ transform: [{ rotate: plusRotate }] }}>
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </Animated.View>
              </ScalePressable>
            ) : (
              <View key="fab" style={{ width: 56 }} />
            );
          }

          const isActive = active === tab.id;
          return (
            <ScalePressable
              key={tab.id}
              activeScale={0.94}
              onPress={() => { triggerHaptic(); setDockOpen(false); onTab(tab.id); }}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 3,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 18,
                backgroundColor: "transparent",
              }}
            >
              <Ionicons name={(isActive ? tab.activeIcon : tab.icon) || "ellipse"} size={22} color={isActive ? mesh.green700 : mesh.ink500} />
              <Text style={{ color: isActive ? mesh.green700 : mesh.ink500, fontSize: mesh.font.nav, fontWeight: isActive ? "700" : "500" }}>
                {tab.label}
              </Text>
              <View
                style={{
                  width: 18,
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: isActive ? "#0B6B48" : "transparent",
                  marginTop: 2,
                }}
              />
            </ScalePressable>
          );
        })}
      </View>
    </View>
  );
}

const bnStyles = StyleSheet.create({
  dock: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "#E3EFE8",
    shadowColor: "#064532",
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  dockBtn: {
    width: 56,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  dockDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(6,69,50,0.10)",
    marginHorizontal: 2,
  },
});

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
      <Text style={{ flex: 1, color: mesh.ink500, fontSize: mesh.font.bodySm, lineHeight: mesh.lineHeight.bodySm }}>{children}</Text>
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
          <Text style={{ color: mesh.ink900, fontWeight: "700", fontSize: 18, marginBottom: 6 }}>{title}</Text>
          <Text style={{ color: mesh.ink500, fontSize: mesh.font.body, lineHeight: mesh.lineHeight.body, textAlign: "center", marginBottom: 20 }}>{desc}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={onClose} style={{ flex: 1, borderRadius: mesh.radiusMd, borderWidth: 1.5, borderColor: mesh.green700, paddingVertical: 13, alignItems: "center" }}>
              <Text style={{ color: mesh.green700, fontWeight: "700" }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm();
                onClose();
              }}
              style={{ flex: 1, borderRadius: mesh.radiusMd, backgroundColor: mesh.pink, paddingVertical: 13, alignItems: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
