import { Text, View } from "react-native";

import { colors, radius } from "../theme/tokens";

type Props = {
  initials: string;
  color?: string;
  size?: number;
};

export function Avatar({ initials, color = colors.surfaceSoft, size = 48 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color
      }}
    >
      <Text style={{ color: colors.ink700, fontWeight: "700", fontSize: size * 0.34 }}>
        {initials}
      </Text>
    </View>
  );
}
