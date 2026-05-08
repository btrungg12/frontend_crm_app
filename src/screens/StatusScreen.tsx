import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { contacts, statuses } from "../data/mockData";
import { colors, spacing } from "../theme/tokens";

type Props = {
  onCreateNote: () => void;
};

export function StatusScreen(_props: Props) {
  return (
    <Screen>
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xl,
          backgroundColor: colors.primary,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24
        }}
      >
        <Text style={{ color: colors.surface, fontSize: 30, fontWeight: "900" }}>Relationship status</Text>
        <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20 }}>
          Organize people by closeness, context, and priority.
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md }}>
        {statuses.map((status) => {
          const count = contacts.filter((contact) => contact.statusId === status.id).length;
          return (
            <Card key={status.id} style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    backgroundColor: `${status.color}22`,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: status.color }} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={{ color: colors.ink900, fontWeight: "900", fontSize: 16 }}>{status.name}</Text>
                  <Text style={{ color: colors.ink500, fontSize: 12, marginTop: 3 }}>{count} contacts using this status</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.ink300} />
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
