import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

type Props = PropsWithChildren<{
  showLeaf?: boolean;
  style?: ViewStyle;
}>;

export function AppBackground({ children, showLeaf = false, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={["#F8FCF7", "#EEF8F0", "#FFFFFF"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,58,48,0.95)", "rgba(0,96,70,0.58)", "rgba(255,255,255,0)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.12, y: 0.88 }}
        style={styles.topGlow}
      />

      <View pointerEvents="none" style={styles.greetingSpotlight} />

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0)", "rgba(225,240,230,0.28)", "rgba(255,255,255,0)"]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={styles.headerWash}
      />

      {showLeaf ? <LeafDecor /> : null}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

function LeafDecor() {
  return (
    <View pointerEvents="none" style={styles.leafGroup}>
      <View style={[styles.leaf, styles.leafOne]} />
      <View style={[styles.leaf, styles.leafTwo]} />
      <View style={[styles.leaf, styles.leafThree]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FCF7",
    overflow: "hidden"
  },
  content: {
    flex: 1
  },
  topGlow: {
    position: "absolute",
    top: -190,
    right: -120,
    width: 620,
    height: 390,
    borderBottomLeftRadius: 340
  },
  greetingSpotlight: {
    position: "absolute",
    top: 150,
    left: -80,
    width: 470,
    height: 190,
    borderRadius: 240,
    backgroundColor: "rgba(255,255,255,0.86)"
  },
  headerWash: {
    position: "absolute",
    top: 220,
    left: -120,
    width: 620,
    height: 300,
    borderRadius: 320
  },
  leafGroup: {
    position: "absolute",
    top: 132,
    right: -34,
    width: 230,
    height: 230,
    opacity: 0.32
  },
  leaf: {
    position: "absolute",
    backgroundColor: "#9FD3B3",
    borderTopLeftRadius: 90,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 90
  },
  leafOne: {
    width: 64,
    height: 110,
    right: 42,
    top: 0,
    transform: [{ rotate: "34deg" }]
  },
  leafTwo: {
    width: 54,
    height: 92,
    right: 102,
    top: 58,
    transform: [{ rotate: "74deg" }]
  },
  leafThree: {
    width: 48,
    height: 82,
    right: 34,
    top: 86,
    transform: [{ rotate: "112deg" }]
  }
});
