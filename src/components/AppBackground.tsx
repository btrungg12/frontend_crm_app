import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

type Props = PropsWithChildren<{
  showLeaf?: boolean;
  style?: ViewStyle;
}>;

export function AppBackground({ children, showLeaf = true, style }: Props) {
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
        colors={["rgba(0,72,58,0.36)", "rgba(255,255,255,0)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.9 }}
        style={styles.topGlow}
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
    top: -120,
    right: -130,
    width: 450,
    height: 380,
    borderBottomLeftRadius: 280
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
