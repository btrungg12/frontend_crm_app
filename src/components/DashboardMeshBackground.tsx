import { LinearGradient } from "expo-linear-gradient";
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

          "#ECF6EF",
          "#F4FAF6",
          "#DDEFE5",
          "#A7CDB8",

          "#FFFFFF",
          "#FFFFFF",
          "#FBFDFB",
          "#F4FAF6",

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

          [0, 0.24],
          [0.35, 0.28],
          [0.72, 0.30],
          [1, 0.25],

          [0, 0.52],
          [0.35, 0.56],
          [0.72, 0.62],
          [1, 0.58],

          [0, 1],
          [0.35, 1],
          [0.72, 1],
          [1, 1]
        ]}
        smoothsColors
      />

      <Image source={leafPng} resizeMode="contain" style={styles.leafMain} />

      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.46)",
          "rgba(255,255,255,0.82)",
          "rgba(255,255,255,0.98)"
        ]}
        locations={[0, 0.32, 0.68, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.leafWhiteVeil}
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
  },
  leafMain: {
    position: "absolute",
    top: 76,
    right: -145,
    width: 440,
    height: 315,
    opacity: 0.14,
    transform: [{ rotate: "-6deg" }]
  },
  leafWhiteVeil: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 185,
    height: 145
  }
});
