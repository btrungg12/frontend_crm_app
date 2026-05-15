import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, View } from "react-native";

const leafPng = require("../../assets/leaf.png");

export function DashboardMeshBackground() {
  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <LinearGradient
        colors={["#003A30", "#00624D", "#18765A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.greenLayer}
      />

      <Image source={leafPng} resizeMode="contain" style={styles.leafMain} />

      <LinearGradient
        colors={[
          "rgba(255,255,255,0.00)",
          "rgba(255,255,255,0.18)",
          "rgba(255,255,255,0.72)",
          "rgba(255,255,255,1.00)"
        ]}
        locations={[0, 0.25, 0.58, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.95 }}
        style={styles.whiteVeil}
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
    height: 420,
    overflow: "hidden"
  },
  greenLayer: {
    ...StyleSheet.absoluteFillObject
  },
  leafMain: {
    position: "absolute",
    top: 55,
    right: -130,
    width: 540,
    height: 360,
    opacity: 0.45,
    transform: [{ rotate: "-6deg" }]
  },
  whiteVeil: {
    ...StyleSheet.absoluteFillObject
  }
});
