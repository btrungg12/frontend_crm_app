import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export function ActionTile({
  icon,
  label,
  color,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: 6 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: `${color}20` }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ color, fontSize: 11, fontWeight: "800", textAlign: "center", lineHeight: 14 }}>{label}</Text>
    </Pressable>
  );
}
