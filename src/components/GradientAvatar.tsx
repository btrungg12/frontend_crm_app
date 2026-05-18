import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function getInitials(name?: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  avatarUrl?: string;
  name?: string;
  /** Gap in px between ring edge and avatar circle. Default 2.5. */
  gap?: number;
  /** Ring opacity 0–1. Default 0.78. */
  ringOpacity?: number;
  /** Ring thickness in px. Default 2. */
  ringWidth?: number;
  /** Outer diameter in px. Default 48. */
  size?: number;
  /** Status hex color for gradient ring. Falls back to soft green. */
  statusColor?: string;
};

export function GradientAvatar({
  avatarUrl,
  gap = 2.5,
  name,
  ringOpacity = 0.78,
  ringWidth = 2,
  size = 48,
  statusColor
}: Props) {
  // ring start: ≈ statusColor at 0.85 opacity on white (15% toward white)
  // ring end  : ≈ statusColor at 0.55 opacity on white (55% toward white — lighter but clearly tinted)
  const gradColors: [string, string] = statusColor
    ? [lightenHex(statusColor, 0.15), lightenHex(statusColor, 0.55)]
    : ["#A8C4B8", "#D2E8DF"];

  const whiteLayerSize = size - ringWidth * 2;
  const avatarSize = size - (ringWidth + gap) * 2;

  return (
    <View style={{ alignItems: "center", height: size, justifyContent: "center", width: size }}>
      {/* Gradient ring — absolute so its opacity never bleeds into avatar */}
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: size / 2,
          bottom: 0,
          left: 0,
          opacity: ringOpacity,
          position: "absolute",
          right: 0,
          top: 0
        }}
      />

      {/* White separator between ring and avatar */}
      <View
        style={{
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: whiteLayerSize / 2,
          height: whiteLayerSize,
          justifyContent: "center",
          width: whiteLayerSize
        }}
      >
        {/* Avatar circle */}
        <View
          style={{
            alignItems: "center",
            backgroundColor: "#EEF3EF",
            borderRadius: avatarSize / 2,
            height: avatarSize,
            justifyContent: "center",
            overflow: "hidden",
            width: avatarSize
          }}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ height: avatarSize, width: avatarSize }} />
          ) : (
            <Text
              style={{
                color: "#0B4F37",
                fontSize: avatarSize * 0.37,
                fontWeight: "700",
                letterSpacing: 0.3
              }}
            >
              {getInitials(name)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
