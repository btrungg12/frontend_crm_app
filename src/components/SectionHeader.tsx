import { Text, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

type Props = {
  title: string;
  action?: string;
};

export function SectionHeader({ title, action }: Props) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <Text style={{ color: colors.ink500, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>
        {title}
      </Text>
      {action ? (
        <Text numberOfLines={1} style={{ color: colors.primaryDark, fontSize: 12, fontWeight: "800", marginLeft: spacing.md }}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}
