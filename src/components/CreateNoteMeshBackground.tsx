import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, View } from "react-native";

const leafPng = require("../../assets/leaf.png");

export function CreateNoteMeshBackground() {
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
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.18)",
          "rgba(255,255,255,0.52)",
          "rgba(255,255,255,0.82)",
          "rgba(247,250,247,1)"
        ]}
        locations={[0, 0.18, 0.42, 0.68, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.whiteWash}
      />

      <LinearGradient
        colors={["rgba(247,250,247,0)", "rgba(247,250,247,0.75)", "#F7FAF7"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomWhiteFade}
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
    height: 390,
    overflow: "hidden"
  },
  greenLayer: {
    ...StyleSheet.absoluteFillObject
  },
  leafMain: {
    position: "absolute",
    top: 72,
    right: -80,
    width: 420,
    height: 300,
    opacity: 0.22,
    transform: [{ rotate: "-6deg" }]
  },
  whiteWash: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 105,
    height: 255
  },
  bottomWhiteFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 230,
    height: 170
  }
});
