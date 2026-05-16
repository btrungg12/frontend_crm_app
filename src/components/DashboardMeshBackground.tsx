import { MeshGradientView } from "expo-mesh-gradient";
import { StyleSheet, View } from "react-native";

export function DashboardMeshBackground() {
  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <MeshGradientView
        style={styles.mesh}
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
          "#FFFFFF"
        ]}
        points={[
          [0, 0],
          [0.35, 0],
          [0.7, 0],
          [1, 0],

          [0, 0.34],
          [0.35, 0.36],
          [0.7, 0.34],
          [1, 0.3],

          [0, 0.64],
          [0.35, 0.66],
          [0.7, 0.7],
          [1, 0.68],

          [0, 1],
          [0.35, 1],
          [0.7, 1],
          [1, 1]
        ]}
        smoothsColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 460,
    overflow: "hidden"
  },
  mesh: {
    ...StyleSheet.absoluteFillObject
  }
});
