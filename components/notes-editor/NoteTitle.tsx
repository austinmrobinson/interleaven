import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, Text, TextInput, Pressable, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SymbolView } from "expo-symbols";
import { bookTheme } from "@/lib/theme/book-theme";
import { bibleSerifFontBold } from "@/lib/typography";

interface NoteTitleProps {
  value: string;
  onChangeText: (text: string) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  autoFocus?: boolean;
  /** Called when the user presses Return on the title field (single-line submit). */
  onSubmitEditing?: () => void;
  onTitleFocus?: () => void;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function formatDate(d: Date): string {
  if (isToday(d)) return "Today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Title field + date (scrolls with the note body). Floating picker lives in `NoteFloatingBar`. */
export function NoteTitle({
  value,
  onChangeText,
  date,
  onDateChange,
  autoFocus,
  onSubmitEditing,
  onTitleFocus,
}: NoteTitleProps) {
  const inputRef = useRef<TextInput>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [autoFocus]);

  const handleSubmitEditing = useCallback(() => {
    if (!value.trim()) return;
    inputRef.current?.blur();
    const delayMs = Platform.OS === "android" ? 100 : 32;
    setTimeout(() => onSubmitEditing?.(), delayMs);
  }, [value, onSubmitEditing]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="New note"
          placeholderTextColor={bookTheme.inkPlaceholder}
          multiline={false}
          returnKeyType="default"
          blurOnSubmit={false}
          onSubmitEditing={handleSubmitEditing}
          onFocus={onTitleFocus}
        />
        <Pressable style={styles.dateRow} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          <SymbolView name="calendar" size={14} tintColor={bookTheme.iconMuted} style={styles.symbolCal} />
        </Pressable>
      </View>
      {showPicker && (
        <Modal transparent animationType="fade">
          <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={(_, selected) => {
                  if (selected) onDateChange(selected);
                  setShowPicker(false);
                }}
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  symbolCal: { width: 16, height: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 22,
    color: bookTheme.ink,
    fontFamily: bibleSerifFontBold,
    paddingVertical: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 14,
    color: "rgba(60, 60, 67, 0.4)",
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  pickerContainer: {
    backgroundColor: bookTheme.elevatedSurface,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});
