import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

type Props = PropsWithChildren<{
  showLeaf?: boolean;
  style?: ViewStyle;
}>;

export function AppBackground({ children, style }: Props) {
  return <View style={[styles.root, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden"
  }
});
