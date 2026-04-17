import { StyleSheet, View, Text, Pressable } from "react-native";
import { SymbolView } from "expo-symbols";
import { GlassView } from "expo-glass-effect";
import { bookTheme } from "@/lib/theme/book-theme";
import { bookSerifFont } from "@/lib/typography";

interface NoteFloatingBarProps {
  label: string;
  onPressPicker?: () => void;
  onNewNote?: () => void;
}

export function NoteFloatingBar({ label, onPressPicker, onNewNote }: NoteFloatingBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={onPressPicker}>
          <GlassView style={styles.button}>
            <SymbolView name="square.and.pencil" size={16} tintColor={bookTheme.icon} style={styles.symbol} />
            <Text style={styles.buttonLabel}>{label}</Text>
            <SymbolView name="chevron.down" size={10} tintColor={bookTheme.iconMuted} style={styles.symbolSm} />
          </GlassView>
        </Pressable>
        <Pressable onPress={onNewNote}>
          <GlassView style={styles.addButton}>
            <SymbolView name="plus" size={18} tintColor={bookTheme.icon} style={styles.symbolPlus} />
          </GlassView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 22,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: bookTheme.ink,
    fontFamily: bookSerifFont,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  symbol: { width: 18, height: 18 },
  symbolSm: { width: 12, height: 12 },
  symbolPlus: { width: 20, height: 20 },
});
