import { PropsWithChildren } from "react";
import { ScrollView, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme/tokens";

type Props = PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
}>;

export function Screen({ children, scroll = true, style }: Props) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.canvas, paddingBottom: insets.bottom + 96 }, style]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: colors.canvas }, style]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
