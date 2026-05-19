import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from "react-native";

// 93% of screen height — tall enough to show full form even with keyboard open
const SHEET_H = Dimensions.get("window").height * 0.93;

/**
 * Thin bottom-sheet container. Pass CreateNoteScreen or CreateContactScreen
 * (with presentation="sheet") as children. The sheet itself holds no form logic.
 */
export function QuickCreateSheet({
  open,
  onClose,
  children,
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
}>) {
  const translateY  = useRef(new Animated.Value(SHEET_H)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (open) {
      translateY.setValue(SHEET_H);
      overlayAnim.setValue(0);
      setModalVisible(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 240,
          mass: 0.9,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_H,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setModalVisible(false));
    }
  }, [open]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* ── Dim overlay ── */}
      <Animated.View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, { opacity: overlayAnim }]}
      >
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(8,32,22,0.18)" }]}
          onPress={onClose}
        />
      </Animated.View>

      {/* ── Sheet ── */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Content — fills remaining height */}
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_H,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#064532",
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 20,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(6,69,50,0.15)",
    marginTop: 10,
    marginBottom: -10,
  },
});
