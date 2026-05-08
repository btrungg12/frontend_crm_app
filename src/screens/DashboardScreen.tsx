import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { contacts, statusFor, upcoming } from "../data/mockData";
import { colors, radius, spacing } from "../theme/tokens";

type Props = {
  onCreateNote: () => void;
};

export function DashboardScreen({ onCreateNote }: Props) {
  return (
    <Screen>
      <View
        style={{
          minHeight: 178,
          paddingTop: 58,
          paddingHorizontal: spacing.xl,
          backgroundColor: colors.primary,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Avatar initials="T" color="#F7DCC6" size={36} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: colors.surface, fontWeight: "800", fontSize: 13 }}>TUE 10 May</Text>
            <Ionicons name="notifications-outline" size={23} color={colors.surface} />
          </View>
        </View>
        <Text style={{ marginTop: 28, color: colors.surface, fontSize: 28, fontWeight: "900" }}>Hi, Trung</Text>
        <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.86)", fontSize: 14 }}>
          What would you like to capture today?
        </Text>
      </View>

      <SectionHeader title="UPCOMING (4)" action="View all" />
      <Card style={{ marginHorizontal: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
        {upcoming.map((item, index) => (
          <View
            key={item.id}
            style={{
              minHeight: 68,
              flexDirection: "row",
              alignItems: "center",
              borderBottomWidth: index === upcoming.length - 1 ? 0 : 1,
              borderColor: colors.line
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceSoft,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Ionicons name={item.type === "reminder" ? "call-outline" : "gift-outline"} size={20} color={colors.primaryDark} />
            </View>
            <Text style={{ width: 54, marginLeft: spacing.md, color: colors.primaryDark, fontWeight: "900", fontSize: 16 }}>
              {item.time}
            </Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: colors.ink900, fontWeight: "800", fontSize: 15 }}>
                {item.title}
              </Text>
              <Text style={{ color: colors.ink500, fontSize: 12 }}>{item.subtitle}</Text>
            </View>
            <View
              style={{
                width: 82,
                paddingHorizontal: spacing.sm,
                paddingVertical: 5,
                borderRadius: radius.pill,
                backgroundColor: colors.surfaceSoft,
                alignItems: "center"
              }}
            >
              <Text numberOfLines={1} style={{ color: colors.primaryDark, fontSize: 11, fontWeight: "800" }}>
                {item.dueLabel}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader title="RECENT CONTACTS" action="View all" />
      <View style={{ flexDirection: "row", paddingHorizontal: spacing.xl, gap: spacing.sm, justifyContent: "space-between" }}>
        {contacts.slice(0, 4).map((contact) => {
          const status = statusFor(contact);
          return (
            <View key={contact.id} style={{ alignItems: "center", width: 62 }}>
              <Avatar initials={contact.initials} color={contact.id === "c1" ? "#E4E9E5" : colors.mint} size={58} />
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: status?.color ?? colors.ink300,
                  marginTop: -8,
                  marginLeft: 34,
                  borderWidth: 2,
                  borderColor: colors.canvas
                }}
              />
              <Text numberOfLines={2} style={{ marginTop: 4, textAlign: "center", color: colors.ink900, fontSize: 11, fontWeight: "700" }}>
                {contact.name.split(" ").slice(-2).join(" ")}
              </Text>
            </View>
          );
        })}
        <Pressable onPress={onCreateNote} style={{ alignItems: "center", width: 62 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: colors.primary,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Ionicons name="add" size={28} color={colors.primaryDark} />
          </View>
          <Text style={{ marginTop: 6, textAlign: "center", color: colors.ink900, fontSize: 11, fontWeight: "700" }}>
            Add contact
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
