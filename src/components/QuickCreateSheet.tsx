import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, View } from "react-native";

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
  const dragY       = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim touch on start — let child ScrollViews/TextInputs receive it first
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Only take over when the gesture is clearly downward (swipe-to-dismiss intent)
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && gesture.dy > Math.abs(gesture.dx),
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          dragY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const threshold = 120;
        const velocityThreshold = 0.85;

        if (gesture.dy > threshold || gesture.vy > velocityThreshold) {
          // Swipe down to close
          dragY.setValue(0);
          onClose();
        } else {
          // Snap back
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 18,
            stiffness: 200,
            mass: 1,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (open) {
      translateY.setValue(SHEET_H);
      dragY.setValue(0);
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

  // Combine translateY with dragY: when dragging, sheet moves down by dragY amount
  const sheetTransformY = Animated.add(translateY, dragY);

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
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          { transform: [{ translateY: sheetTransformY }] },
        ]}
      >
        {/* Content fills from y=0 so screen gradient fills rounded corners */}
        {children}

        {/* Handle as absolute overlay — floats above content, no white strip */}
        <View pointerEvents="none" style={styles.handleOverlay}>
          <View style={styles.handle} />
        </View>
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
    overflow: "hidden",
    shadowColor: "#064532",
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 20,
  },
  handleOverlay: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
});
