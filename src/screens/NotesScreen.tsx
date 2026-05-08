import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, View } from "react-native";

import { Avatar } from "../components/Avatar";
import { Pill } from "../components/Pill";
import { Screen } from "../components/Screen";
import { contactFor, notes } from "../data/mockData";
import { colors, radius, spacing } from "../theme/tokens";

type Props = {
  onCreateNote: () => void;
};

export function NotesScreen(_props: Props) {
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
        <Text style={{ color: colors.surface, fontSize: 32, fontWeight: "900" }}>Notes</Text>
        <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 20 }}>
          Manage what matters{"\n"}in your relationships.
        </Text>
        <View
          style={{
            marginTop: spacing.xl,
            height: 48,
            borderRadius: radius.pill,
            backgroundColor: colors.surface,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg
          }}
        >
          <Ionicons name="search" size={20} color={colors.ink500} />
          <TextInput
            placeholder="Search notes..."
            placeholderTextColor={colors.ink500}
            style={{ flex: 1, marginLeft: spacing.sm, color: colors.ink900, fontSize: 14 }}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}>
        <Pill active>All</Pill>
        <Pill>With reminder</Pill>
        <Pill>No person</Pill>
        <Pill>Recent</Pill>
      </View>

      <Text style={{ paddingHorizontal: spacing.xl, color: colors.ink500, fontSize: 12, fontWeight: "900", letterSpacing: 1.3 }}>
        TODAY
      </Text>
      {notes.map((note) => {
        const contact = contactFor(note);
        if (!contact) return null;
        return (
          <View
            key={note.id}
            style={{
              flexDirection: "row",
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.lg,
              borderBottomWidth: 1,
              borderColor: colors.line
            }}
          >
            <Avatar initials={contact.initials} color={note.id === "n2" ? colors.surfaceSoft : colors.mint} size={44} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={{ color: colors.ink900, fontWeight: "900", fontSize: 15 }}>{note.title}</Text>
              <Text numberOfLines={2} style={{ marginTop: 3, color: colors.ink500, fontSize: 13, lineHeight: 19 }}>
                {note.content}
              </Text>
              {note.reminderAt ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <Ionicons name="time-outline" size={13} color={colors.primaryDark} />
                  <Text style={{ marginLeft: 4, color: colors.primaryDark, fontWeight: "800", fontSize: 12 }}>
                    {note.reminderAt}
                  </Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="bookmark-outline" size={20} color={colors.ink300} />
          </View>
        );
      })}
    </Screen>
  );
}
