import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import { MeshHeroHeader } from "../../components/MeshHeroHeader";
import { ActionTile } from "./parts/ActionTile";
import { Avatar, BottomNav, HeaderCircleBtn, MeshCard, MeshChip, MeshHeader, MeshScreen, MeshScroll, NavFn, SectionLabel, StatusChip, TFn, TipCard } from "../../mesh/MeshComponents";
import { contactById, contacts, Lang, statuses, statusById, timelineFor } from "../../mesh/meshData";
import { mesh } from "../../mesh/meshTheme";

type Props = {
  t: TFn;
  lang: Lang;
  nav: NavFn;
};

export function ContactsScreen({ t, lang, nav }: Props) {
  const [filter, setFilter] = useState("all");
  const filters = [{ id: "all", label: t("fAll"), color: null }, ...statuses.slice(0, 4).map((status) => ({ id: status.id, label: status.name, color: status.color }))];
  const list = filter === "all" ? contacts : contacts.filter((contact) => contact.status === filter);

  const grouped = useMemo(() => {
    return list.reduce<Record<string, typeof contacts>>((acc, contact) => {
      const key = contact.name[0].toUpperCase();
      acc[key] = acc[key] || [];
      acc[key].push(contact);
      return acc;
    }, {});
  }, [list]);

  return (
    <MeshScreen>
      <MeshHeroHeader
        left={<Avatar name="Trung Nguyen" size={48} ring />}
        right={<HeaderCircleBtn icon="add" onPress={() => nav("createContact")} />}
        title={t("contacts")}
        subtitle={t("contactsCount", { n: contacts.length })}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => nav("search")} style={{ flex: 1, height: 44, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
            <Ionicons name="search" size={18} color={mesh.ink400} />
            <Text numberOfLines={1} style={{ flex: 1, color: "#8A928D", fontSize: 14 }}>{t("searchContactPh")}</Text>
          </Pressable>
          <Pressable style={{ height: 44, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(6,69,50,0.08)", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14 }}>
            <Ionicons name="options-outline" size={16} color={mesh.ink700} />
            <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "800" }}>{t("filter")}</Text>
          </Pressable>
        </View>
      </MeshHeroHeader>

      <MeshScroll bottom={112}>
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          {filters.map((item) => (
            <MeshChip key={item.id} active={filter === item.id} onPress={() => setFilter(item.id)} style={{ backgroundColor: filter === item.id ? mesh.green700 : "#FFFFFF", borderColor: filter === item.id ? mesh.green700 : "rgba(6,69,50,0.12)" }}>
              {item.label}
            </MeshChip>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {Object.keys(grouped).sort().map((key) => (
            <View key={key}>
              <Text style={{ color: "#7A837E", fontSize: 13, fontWeight: "800", marginTop: 18, marginBottom: 8 }}>{key}</Text>
              {grouped[key].map((contact, index) => (
                <Pressable
                  key={contact.id}
                  onPress={() => nav("contactDetail", { id: contact.id })}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: index < grouped[key].length - 1 ? 1 : 0, borderColor: "rgba(6,69,50,0.08)" }}
                >
                  <Avatar name={contact.name} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "800" }}>{contact.name}</Text>
                    <View style={{ marginTop: 3 }}>
                      <StatusChip statusId={contact.status} />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </MeshScroll>

      <BottomNav
        active="contacts"
        t={t}
        onTab={(id) => {
          if (id === "home") nav("dashboard");
          else if (id === "notes") nav("notes");
          else if (id === "fab") nav("createNote");
          else if (id === "status") nav("status");
        }}
      />
    </MeshScreen>
  );
}

export function ContactDetailScreen({ t, lang, nav, contactId = "c1" }: Props & { contactId?: string }) {
  const contact = contactById(contactId) || contacts[0];
  const [tab, setTab] = useState("all");
  const timeline = timelineFor(contact.id, lang);
  const filtered = tab === "all" ? timeline : timeline.filter((item) => item.kind === tab);
  const tabs = [
    { id: "all", label: t("tlAll") },
    { id: "note", label: t("tlNotes") },
    { id: "special", label: t("tlSpecial") },
    { id: "reminder", label: t("tlReminders") }
  ];

  return (
    <MeshScreen>
      <MeshHeader style={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav("contacts")} />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{t("contactProfile")}</Text>
          <HeaderCircleBtn icon="ellipsis-horizontal" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 18 }}>
          <Avatar name={contact.name} size={72} ring />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.4 }}>{contact.name}</Text>
            <View style={{ marginTop: 6 }}>
              <StatusChip statusId={contact.status} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Ionicons name="sparkles-outline" size={12} color="rgba(255,255,255,0.95)" />
              <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 12 }}>{t("interactions", { n: contact.interactions })}</Text>
            </View>
          </View>
        </View>
      </MeshHeader>

      <MeshScroll style={{ paddingHorizontal: 16, marginTop: -48, position: "relative", zIndex: 2, elevation: 2 }} bottom={100}>
        <View style={{ flexDirection: "row", gap: 8, paddingTop: 14 }}>
          {[
            { icon: "document-text-outline", label: t("notes"), value: contact.noteCount, color: mesh.green700 },
            { icon: "notifications-outline", label: t("reminders"), value: contact.reminderCount, color: mesh.orange },
            { icon: "calendar-outline", label: t("specialDays"), value: contact.specialCount, color: mesh.pink }
          ].map((item) => (
            <MeshCard key={item.label} style={{ flex: 1, padding: 12, alignItems: "center", position: "relative", zIndex: 3, elevation: 4 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: `${item.color}20`, marginBottom: 6 }}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color={item.color} />
              </View>
              <Text style={{ color: mesh.ink900, fontSize: 18, fontWeight: "900" }}>{item.value}</Text>
              <Text style={{ color: mesh.ink500, fontSize: 11 }}>{item.label}</Text>
            </MeshCard>
          ))}
        </View>

        <MeshCard style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 12, flexDirection: "row" }}>
          <ActionTile icon="add" label={t("addNote")} color={mesh.green700} onPress={() => nav("createNote", { person: contact.id })} />
          <ActionTile icon="notifications-outline" label={t("addReminder")} color={mesh.orange} />
          <ActionTile icon="calendar-outline" label={t("addSpecial")} color={mesh.pink} />
          <ActionTile icon="create-outline" label={t("editContact")} color={mesh.blue} onPress={() => nav("editContact", { id: contact.id })} />
        </MeshCard>

        <MeshCard style={{ marginTop: 12, paddingHorizontal: 14 }}>
          <InfoRow icon="call-outline" label={t("phone")} value={contact.phone || "-"} />
          <InfoRow icon="mail-outline" label="Email" value={contact.email || "-"} />
          <InfoRow icon="location-outline" label={t("address")} value={contact.address || "-"} last />
        </MeshCard>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 20, paddingBottom: 12 }}>
          <Text style={{ color: mesh.ink900, fontSize: 17, fontWeight: "900" }}>{t("timeline")}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {tabs.map((item) => (
            <MeshChip key={item.id} active={tab === item.id} onPress={() => setTab(item.id)} style={{ backgroundColor: tab === item.id ? mesh.green700 : "#FFFFFF", borderWidth: 1, borderColor: tab === item.id ? mesh.green700 : mesh.line }}>
              {item.label}
            </MeshChip>
          ))}
        </View>

        <View style={{ paddingLeft: 26 }}>
          {filtered.map((item, index) => {
            const color = item.kind === "reminder" ? mesh.orange : item.kind === "special" ? mesh.pink : mesh.green700;
            return (
              <View key={`${item.title}-${index}`} style={{ position: "relative", marginBottom: 14 }}>
                <View style={{ position: "absolute", left: -26, top: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: color, alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={11} color={color} />
                </View>
                <MeshCard style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>{item.label.toUpperCase()}</Text>
                    <Text style={{ color: mesh.ink500, fontSize: 11 }}>{item.date}</Text>
                  </View>
                  <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "800", marginTop: 4 }}>{item.title}</Text>
                  <Text style={{ color: mesh.ink500, fontSize: 13, lineHeight: 20, marginTop: 4 }}>{item.desc}</Text>
                </MeshCard>
              </View>
            );
          })}
        </View>
      </MeshScroll>
    </MeshScreen>
  );
}

function InfoRow({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderColor: mesh.line }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={16} color={mesh.green700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: mesh.ink500, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: mesh.ink900, fontSize: 14, fontWeight: "800", marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

export function CreateContactScreen({ t, nav, edit = false, contactId }: Props & { edit?: boolean; contactId?: string }) {
  const existing = edit && contactId ? contactById(contactId) : undefined;
  const [name, setName] = useState(existing?.name || "");
  const [phone, setPhone] = useState(existing?.phone || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [status, setStatus] = useState(existing?.status || "st-close");
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <MeshScreen>
      <MeshHeader style={{ paddingBottom: 50 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <HeaderCircleBtn icon="chevron-back" onPress={() => nav(edit ? "contactDetail" : "contacts", { id: contactId })} />
          <Text style={{ flex: 1, textAlign: "center", paddingRight: 60, color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{edit ? t("editContact") : t("createContact")}</Text>
          <Pressable onPress={() => nav(edit ? "contactDetail" : "contacts", { id: contactId })} style={{ borderRadius: 999, backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: mesh.green700, fontWeight: "900", fontSize: 13 }}>{t("save")}</Text>
          </Pressable>
        </View>
        <View style={{ alignItems: "center", paddingTop: 14 }}>
          <View style={{ position: "relative" }}>
            <Avatar name={existing?.name || name || "New Contact"} size={88} />
            <View style={{ position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: mesh.green700, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={{ color: "#FFFFFF", marginTop: 8, fontSize: 12, fontWeight: "800" }}>{t("addAvatar")}</Text>
        </View>
      </MeshHeader>

      <MeshScroll style={{ backgroundColor: "#FFFFFF", marginTop: -10, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20 }} bottom={100}>
        <FormSection title={t("basicInfo")}>
          <FormRow icon="person-outline" label={`${t("name")} *`} value={name} onChangeText={setName} placeholder={t("enterName")} />
          <FormRow icon="call-outline" label={t("phone")} value={phone} onChangeText={setPhone} placeholder={t("enterPhone")} />
          <FormRow icon="mail-outline" label="Email" value={email} onChangeText={setEmail} placeholder={t("enterEmail")} last />
        </FormSection>

        <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "900", marginTop: 20, marginBottom: 10 }}>{t("relationshipInfo")}</Text>
        <MeshCard style={{ paddingHorizontal: 14 }}>
          <Pressable onPress={() => setStatusOpen(true)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: mesh.line }}>
            <Ionicons name="people-outline" size={18} color={mesh.ink500} />
            <Text style={{ flex: 1, color: mesh.ink900, fontSize: 15 }}>{t("relationship")}</Text>
            <StatusChip statusId={status} />
            <Ionicons name="chevron-down" size={14} color={mesh.ink400} />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}>
            <Ionicons name="link-outline" size={18} color={mesh.ink500} />
            <Text style={{ flex: 1, color: mesh.ink900, fontSize: 15 }}>{t("source")}</Text>
            <View style={{ borderRadius: 999, backgroundColor: mesh.bgSubtle, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: mesh.green700, fontSize: 12, fontWeight: "800" }}>Work</Text>
            </View>
          </View>
        </MeshCard>

        <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "900", marginTop: 20, marginBottom: 10 }}>{t("specialDays")}</Text>
        <MeshCard style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: mesh.bgSubtle, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="calendar-outline" size={18} color={mesh.green700} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: mesh.green700, fontSize: 14, fontWeight: "900" }}>{t("addSpecialDay")}</Text>
            <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{t("addSpecialHint")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={mesh.ink400} />
        </MeshCard>

        <FormSection title={t("moreInfo")}>
          <FormRow icon="location-outline" label={t("address")} value="" placeholder={t("enterAddress")} />
          <FormRow icon="globe-outline" label={t("social")} value="" placeholder="Facebook, LinkedIn, Zalo..." />
          <FormRow icon="document-text-outline" label={t("moreNote")} value="" placeholder={t("enterMoreNote")} last />
        </FormSection>

        <View style={{ marginTop: 20 }}>
          <TipCard>{t("canAddLater")}</TipCard>
        </View>
      </MeshScroll>

      <StatusPicker open={statusOpen} value={status} onClose={() => setStatusOpen(false)} onPick={setStatus} t={t} />
    </MeshScreen>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Text style={{ color: mesh.ink700, fontSize: 13, fontWeight: "900", marginTop: 20, marginBottom: 10 }}>{title}</Text>
      <MeshCard style={{ paddingHorizontal: 14 }}>{children}</MeshCard>
    </>
  );
}

function FormRow({ icon, label, value, onChangeText, placeholder, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onChangeText?: (value: string) => void; placeholder?: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderColor: mesh.line }}>
      <Ionicons name={icon} size={18} color={mesh.ink500} />
      <Text style={{ width: 96, color: mesh.ink900, fontSize: 14, fontWeight: "800" }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={mesh.ink400} style={{ flex: 1, color: mesh.ink900, fontSize: 14, textAlign: "right" }} />
    </View>
  );
}

function StatusPicker({ open, value, onClose, onPick, t }: { open: boolean; value: string; onClose: () => void; onPick: (value: string) => void; t: TFn }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(10,30,20,0.45)", justifyContent: "flex-end" }}>
        <Pressable style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: mesh.ink200, alignSelf: "center", marginBottom: 14 }} />
          <Text style={{ textAlign: "center", color: mesh.green800, fontSize: 18, fontWeight: "900", marginBottom: 16 }}>{t("chooseStatus")}</Text>
          {statuses.map((status) => (
            <Pressable
              key={status.id}
              onPress={() => {
                onPick(status.id);
                onClose();
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: mesh.line }}
            >
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: status.color }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: mesh.ink900, fontSize: 15, fontWeight: "900" }}>{status.name}</Text>
                <Text style={{ color: mesh.ink500, fontSize: 12, marginTop: 2 }}>{status.desc}</Text>
              </View>
              {value === status.id ? <Ionicons name="checkmark" size={18} color={mesh.green700} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ContactsEmptyScreen({ t, nav }: Props) {
  return (
    <MeshScreen>
      <MeshHeader>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Avatar name="Trung" size={48} ring />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "900" }}>{t("contacts")}</Text>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 }}>{t("contactsCount", { n: 0 })}</Text>
          </View>
          <HeaderCircleBtn icon="add" onPress={() => nav("createContact")} />
        </View>
      </MeshHeader>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingBottom: 100 }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(31,112,72,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <Ionicons name="person-outline" size={48} color={mesh.green700} />
        </View>
        <Text style={{ color: mesh.ink900, fontSize: 22, fontWeight: "900", marginBottom: 10 }}>{t("noContactsTitle")}</Text>
        <Text style={{ color: mesh.ink500, fontSize: 14, lineHeight: 21, textAlign: "center" }}>{t("noContactsDesc")}</Text>
        <Pressable onPress={() => nav("createContact")} style={{ marginTop: 24, borderRadius: mesh.radiusMd, paddingHorizontal: 22, paddingVertical: 13, backgroundColor: mesh.green700, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>{t("addFirstContact")}</Text>
        </Pressable>
      </View>
      <BottomNav active="contacts" t={t} onTab={(id) => {
        if (id === "home") nav("dashboard");
        else if (id === "notes") nav("notes");
        else if (id === "fab") nav("createContact");
        else if (id === "status") nav("status");
      }} />
    </MeshScreen>
  );
}
