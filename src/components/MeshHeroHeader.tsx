import { MeshGradientView } from "expo-mesh-gradient";
import { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    <View style={[styles.root, { paddingTop: insets.top + 22 }, style]}>
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
          "#176544",
          "#1D704F",
          "#5A9D78",
          "#CFE7D8",
          "#F3FAF5",
          "#F8FCF7",
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
          [0, 0.28],
          [0.35, 0.28],
          [0.7, 0.3],
          [1, 0.32],
          [0, 0.64],
          [0.35, 0.66],
          [0.7, 0.7],
          [1, 0.72],
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
    paddingBottom: 26,
    paddingHorizontal: 20
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
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
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.4
  },
  subtitle: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  children: {
    marginTop: 18
  }
});
