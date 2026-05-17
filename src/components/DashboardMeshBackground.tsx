import { MeshGradientView } from "expo-mesh-gradient";
import { Image, StyleSheet, View } from "react-native";

const leafPng = require("../../assets/leaf.png");

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
          "#166B4B",
          "#0E7A55",

          "#DDEFE5",
          "#EAF6EF",
          "#CFE7D8",
          "#8BC3A5",

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
          [0.72, 0],
          [1, 0],

          [0, 0.30],
          [0.35, 0.34],
          [0.72, 0.32],
          [1, 0.26],

          [0, 0.58],
          [0.35, 0.62],
          [0.72, 0.66],
          [1, 0.62],

          [0, 1],
          [0.35, 1],
          [0.72, 1],
          [1, 1]
        ]}
        smoothsColors
      />

      <Image source={leafPng} resizeMode="contain" style={styles.leafMain} />
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
  },
  leafMain: {
    position: "absolute",
    top: 72,
    right: -85,
    width: 420,
    height: 300,
    opacity: 0.22,
    transform: [{ rotate: "-6deg" }]
  }
});
