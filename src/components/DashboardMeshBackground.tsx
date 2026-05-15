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
          "#003A30",
          "#004737",
          "#00624D",
          "#0C6B54",
          "#CFE8DA",
          "#DCEFE4",
          "#6FB493",
          "#18765A",
          "#FFFFFF",
          "#FFFFFF",
          "#F3FAF5",
          "#CFE8DA",
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
          [0, 0.25],
          [0.35, 0.32],
          [0.7, 0.28],
          [1, 0.32],
          [0, 0.55],
          [0.38, 0.55],
          [0.72, 0.58],
          [1, 0.6],
          [0, 1],
          [0.35, 1],
          [0.7, 1],
          [1, 1]
        ]}
        smoothsColors
      />

      <Image source={leafPng} resizeMode="contain" style={styles.leafMain} />
      <Image source={leafPng} resizeMode="contain" style={styles.leafSoft} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 390,
    overflow: "hidden"
  },
  mesh: {
    ...StyleSheet.absoluteFillObject
  },
  leafMain: {
    position: "absolute",
    top: 92,
    right: -72,
    width: 390,
    height: 300,
    opacity: 0.15,
    tintColor: "#DCEFE4",
    transform: [{ rotate: "-8deg" }]
  },
  leafSoft: {
    position: "absolute",
    top: 132,
    right: 52,
    width: 260,
    height: 210,
    opacity: 0.08,
    tintColor: "#FFFFFF",
    transform: [{ rotate: "10deg" }]
  }
});
