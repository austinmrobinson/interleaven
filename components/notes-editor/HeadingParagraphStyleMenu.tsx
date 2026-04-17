import { Alert, Pressable, StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";
import { bookTheme } from "@/lib/theme/book-theme";

export interface HeadingParagraphStyleMenuProps {
  headingActive: boolean;
  headingDisabled: boolean;
  selectedLevel: number;
  onApplyLevel: (level: number) => void;
}

function rowLabel(isSelected: boolean, title: string) {
  return isSelected ? `${title} \u2713` : title;
}

export function HeadingParagraphStyleMenu({
  headingActive,
  headingDisabled,
  selectedLevel,
  onApplyLevel,
}: HeadingParagraphStyleMenuProps) {
  const open = () => {
    if (headingDisabled) return;
    Alert.alert(
      "Paragraph style",
      undefined,
      [
        { text: "Cancel", style: "cancel" },
        { text: rowLabel(selectedLevel === 0, "Body"), onPress: () => onApplyLevel(0) },
        { text: rowLabel(selectedLevel === 1, "Heading 1"), onPress: () => onApplyLevel(1) },
        { text: rowLabel(selectedLevel === 2, "Heading 2"), onPress: () => onApplyLevel(2) },
        { text: rowLabel(selectedLevel === 3, "Heading 3"), onPress: () => onApplyLevel(3) },
        { text: rowLabel(selectedLevel === 4, "Heading 4"), onPress: () => onApplyLevel(4) },
      ],
      { cancelable: true },
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Heading style"
      accessibilityState={{ selected: headingActive, disabled: headingDisabled }}
      disabled={headingDisabled}
      onPress={open}
      style={({ pressed }) => [
        styles.btn,
        headingActive && styles.btnActive,
        headingDisabled && styles.btnDisabled,
        pressed && !headingDisabled && styles.btnPressed,
      ]}
    >
      <SymbolView
        name="textformat.size"
        size={18}
        tintColor={headingActive ? bookTheme.accent : bookTheme.icon}
        style={styles.symbol}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPressed: {
    backgroundColor: bookTheme.toolbarPressedBg,
  },
  btnActive: {
    backgroundColor: bookTheme.toolbarActiveBg,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  symbol: {
    width: 22,
    height: 22,
  },
});
