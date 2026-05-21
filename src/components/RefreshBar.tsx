import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

/**
 * Thin animated shimmer bar shown at the bottom of a header while
 * background data refresh is in progress (stale-while-revalidate UX).
 *
 * - Fades in when visible=true, fades out when false.
 * - Runs an infinite shimmer loop so it feels alive, not frozen.
 * - height: 2px, position: absolute so it never shifts any layout.
 */
export function RefreshBar({ visible }: { visible: boolean }) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const shimmer  = useRef(new Animated.Value(0)).current;
  const shimLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start infinite shimmer loop
      shimmer.setValue(0);
      shimLoop.current = Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      shimLoop.current.start();
    } else {
      // Fade out, then stop shimmer
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        shimLoop.current?.stop();
        shimmer.setValue(0);
      });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const shimTranslateX = shimmer.interpolate({
    inputRange:  [0, 1],
    outputRange: [-160, 420],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        overflow: "hidden",
        opacity,
      }}
    >
      {/* Track */}
      <View style={{ flex: 1, backgroundColor: "rgba(6,69,50,0.10)" }} />

      {/* Moving highlight */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 140,
          borderRadius: 1,
          backgroundColor: "rgba(31,112,72,0.55)",
          transform: [{ translateX: shimTranslateX }],
        }}
      />
    </Animated.View>
  );
}
