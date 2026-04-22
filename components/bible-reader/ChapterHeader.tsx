import { StyleSheet, View, Text, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { bookTheme } from '@/lib/theme/book-theme';
import { bibleSerifFontSemiBold } from '@/lib/typography';

interface ChapterHeaderProps {
  book: string;
  chapter: number;
  verse: number;
  onPress: () => void;
  onSearchPress?: () => void;
}

export function ChapterHeader({ book, chapter, verse, onPress, onSearchPress }: ChapterHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onPress}>
        <GlassView style={styles.button}>
          <SymbolView name="book.fill" size={16} tintColor={bookTheme.icon} style={styles.symbol} />
          <Text style={styles.label}>
            {book} {chapter}:{verse}
          </Text>
          <SymbolView name="chevron.down" size={10} tintColor={bookTheme.iconMuted} style={styles.symbolSm} />
        </GlassView>
      </Pressable>
      <Pressable onPress={onSearchPress}>
        <GlassView style={styles.searchButton}>
          <SymbolView name="magnifyingglass" size={18} tintColor={bookTheme.icon} style={styles.symbolSearch} />
        </GlassView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 22,
  },
  label: {
    fontSize: 16,
    color: bookTheme.ink,
    fontFamily: bibleSerifFontSemiBold,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: { width: 18, height: 18 },
  symbolSm: { width: 12, height: 12 },
  symbolSearch: { width: 20, height: 20 },
});
