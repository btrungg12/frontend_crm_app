import { PropsWithChildren } from "react";
import { View, ViewStyle } from "react-native";

import { colors, radius } from "../theme/tokens";

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Card({ children, style }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: "rgba(17, 35, 26, 0.05)",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
