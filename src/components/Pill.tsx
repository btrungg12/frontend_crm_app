import { PropsWithChildren } from "react";
import { Text, View } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

type Props = PropsWithChildren<{
  active?: boolean;
}>;

export function Pill({ active = false, children }: Props) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.primaryDark : colors.surfaceSoft
      }}
    >
      <Text style={{ color: active ? colors.surface : colors.ink700, fontWeight: "700", fontSize: 12 }}>
        {children}
      </Text>
    </View>
  );
}
