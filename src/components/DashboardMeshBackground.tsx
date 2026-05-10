import { MeshGradientView } from "expo-mesh-gradient";
import { StyleSheet, View } from "react-native";

export function DashboardMeshBackground() {
  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <MeshGradientView
        style={styles.mesh}
        columns={3}
        rows={3}
        colors={[
          "#003A30",
          "#005C48",
          "#0D6B54",
          "#EAF5EE",
          "#FFFFFF",
          "#B8DCC8",
          "#FFFFFF",
          "#F7FBF7",
          "#FFFFFF"
        ]}
        points={[
          [0, 0],
          [0.55, 0],
          [1, 0],
          [0, 0.48],
          [0.48, 0.52],
          [1, 0.45],
          [0, 1],
          [0.55, 1],
          [1, 1]
        ]}
        smoothsColors
      />

      <View style={styles.whiteSpotlight} />
      <View style={styles.bottomFade} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    overflow: "hidden"
  },
  mesh: {
    ...StyleSheet.absoluteFillObject
  },
  whiteSpotlight: {
    position: "absolute",
    left: -120,
    top: 145,
    width: 620,
    height: 230,
    borderRadius: 320,
    backgroundColor: "rgba(255,255,255,0.55)"
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.42)"
  }
});
