import { MeshGradientView } from "expo-mesh-gradient";
import { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { mesh } from "../mesh/meshTheme";

type Props = PropsWithChildren<{
  left?: ReactNode;
  right?: ReactNode;
  style?: ViewStyle;
  subtitle?: string;
  title: string;
}>;

export function MeshHeroHeader({ children, left, right, style, subtitle, title }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 14 }, style]}>
      <MeshGradientView
        pointerEvents="none"
        style={styles.gradient}
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
          "#FFFFFF",
          "#FFFFFF",
          "#FFFFFF"
        ]}
        points={[
          [0, 0],
          [0.35, 0],
          [0.7, 0],
          [1, 0],
          [0, 0.36],
          [0.35, 0.38],
          [0.7, 0.34],
          [1, 0.3],
          [0, 0.66],
          [0.35, 0.68],
          [0.7, 0.72],
          [1, 0.7],
          [0, 1],
          [0.35, 1],
          [0.7, 1],
          [1, 1]
        ]}
        smoothsColors
      />

      <View style={styles.topRow}>
        {left ? <View style={styles.left}>{left}</View> : null}
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    paddingBottom: 16,
    paddingHorizontal: 20
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  left: {
    flexShrink: 0
  },
  right: {
    flexShrink: 0
  },
  titleBlock: {
    flex: 1,
    minWidth: 0
  },
  title: {
    color: "#004B3A",
    fontSize: mesh.font.screenTitle,
    fontWeight: "800",
    letterSpacing: -0.3
  },
  subtitle: {
    color: "#6B726E",
    fontSize: mesh.font.bodySm,
    lineHeight: mesh.lineHeight.bodySm,
    marginTop: 3
  },
  children: {
    marginTop: 12
  }
});
