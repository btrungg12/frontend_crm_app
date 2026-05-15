import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop
} from "react-native-svg";

const leafPng = require("../../assets/leaf.png");

export function DashboardMeshBackground() {
  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {/* Layer 1: nền xanh */}
      <LinearGradient
        colors={["#003A30", "#00624D", "#18765A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.greenLayer}
      />

      {/* Layer 2: leaf */}
      <Image source={leafPng} resizeMode="contain" style={styles.leafMain} />

      {/* Layer 3: lớp trắng lớn để tạo gradient tổng xanh -> trắng */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.18)",
          "rgba(255,255,255,0.48)",
          "rgba(255,255,255,0.78)",
          "rgba(255,255,255,0.96)"
        ]}
        locations={[0, 0.22, 0.45, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.whiteWash}
      />

      {/* Layer 4: shape cong rất nhẹ, chỉ tạo hướng cong cho vùng trắng */}
      <Svg
        pointerEvents="none"
        style={styles.whiteShapeLayer}
        viewBox="0 0 390 460"
        preserveAspectRatio="none"
      >
        <Defs>
          <SvgLinearGradient id="whiteShapeGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.32" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.72" />
          </SvgLinearGradient>
        </Defs>

        <Path
          d="
            M 0 145
            C 70 132, 120 132, 170 145
            C 225 160, 280 178, 315 212
            C 345 242, 368 270, 390 278
            L 390 460
            L 0 460
            Z
          "
          fill="url(#whiteShapeGradient)"
        />
      </Svg>

      {/* Layer 5: giữ nguyên nếu bạn muốn trắng chắc ở dưới */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.72)",
          "rgba(255,255,255,0.96)",
          "rgba(255,255,255,1)"
        ]}
        locations={[0, 0.22, 0.48, 1]}
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
    height: 460,
    overflow: "hidden"
  },
  greenLayer: {
    ...StyleSheet.absoluteFillObject
  },
  leafMain: {
    position: "absolute",
    top: 35,
    right: -50,
    width: 500,
    height: 333,
    opacity: 0.34,
    transform: [{ rotate: "-6deg" }]
  },
  whiteWash: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 190,
    height: 250
  },
  whiteShapeLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 460
  },
  bottomWhiteFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 180,
    height: 300
  }
});