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
        colors={["rgba(0,58,48,0.78)", "rgba(0,96,70,0.42)", "rgba(255,255,255,0)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.12, y: 0.88 }}
        style={styles.topGlow}
      />

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,80,64,0.38)", "rgba(255,255,255,0)"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.35, y: 0.86 }}
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
    top: -150,
    right: -135,
    width: 560,
    height: 430,
    borderBottomLeftRadius: 320
  },
  headerWash: {
    position: "absolute",
    top: -44,
    left: -40,
    width: 520,
    height: 285,
    borderBottomRightRadius: 260
  },
  leafGroup: {
    position: "absolute",
    top: 92,
    right: -28,
    width: 190,
    height: 190,
    opacity: 0.28
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
    width: 74,
    height: 128,
    right: 36,
    top: 0,
    transform: [{ rotate: "34deg" }]
  },
  leafTwo: {
    width: 64,
    height: 108,
    right: 90,
    top: 50,
    transform: [{ rotate: "74deg" }]
  },
  leafThree: {
    width: 56,
    height: 94,
    right: 28,
    top: 74,
    transform: [{ rotate: "112deg" }]
  }
});
