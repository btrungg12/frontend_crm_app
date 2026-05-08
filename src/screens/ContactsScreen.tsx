import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, View } from "react-native";

import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { contacts, statusFor } from "../data/mockData";
import { colors, radius, spacing } from "../theme/tokens";

type Props = {
  onCreateNote: () => void;
};

export function ContactsScreen(_props: Props) {
  return (
    <Screen>
      <View style={{ paddingTop: 60, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
        <Text style={{ color: colors.ink900, fontSize: 32, fontWeight: "900" }}>Contacts</Text>
        <View
          style={{
            marginTop: spacing.lg,
            height: 48,
            borderRadius: radius.pill,
            backgroundColor: colors.surface,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            borderWidth: 1,
            borderColor: colors.line
          }}
        >
          <Ionicons name="search" size={20} color={colors.ink500} />
          <TextInput
            placeholder="Search by name, phone, email..."
            placeholderTextColor={colors.ink500}
            style={{ flex: 1, marginLeft: spacing.sm, color: colors.ink900, fontSize: 14 }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
          <Pill active>All</Pill>
          <Pill>Close Friend</Pill>
          <Pill>Work</Pill>
        </View>
      </View>

      <Card style={{ marginHorizontal: spacing.lg, overflow: "hidden" }}>
        {contacts.map((contact, index) => {
          const status = statusFor(contact);
          return (
            <View
              key={contact.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: spacing.lg,
                borderBottomWidth: index === contacts.length - 1 ? 0 : 1,
                borderColor: colors.line
              }}
            >
              <Avatar initials={contact.initials} color={index % 2 ? colors.mint : colors.surfaceSoft} size={48} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{ color: colors.ink900, fontWeight: "900", fontSize: 15 }}>{contact.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: status?.color ?? colors.ink300,
                      marginRight: 6
                    }}
                  />
                  <Text style={{ color: colors.ink500, fontSize: 12, fontWeight: "700" }}>{status?.name ?? "No status"}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: colors.ink900, fontWeight: "900", fontSize: 14 }}>{contact.noteCount}</Text>
                <Text style={{ color: colors.ink500, fontSize: 11 }}>notes</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}
