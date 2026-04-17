import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatVerseReferenceForDisplay } from '@/lib/bible/format-verse-ref';
import { bookTheme } from '@/lib/theme/book-theme';
import { bookSerifFont } from '@/lib/typography';

interface ScriptureRefBlockProps {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text: string;
}

export function ScriptureRefBlock({ book, chapter, verse, endVerse, text }: ScriptureRefBlockProps) {
  const referenceLabel = formatVerseReferenceForDisplay(book, chapter, verse, endVerse);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="book-outline" size={14} color={bookTheme.accent} />
        <Text style={styles.reference}>{referenceLabel}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: bookTheme.accentMutedFill,
    borderLeftWidth: 3,
    borderLeftColor: bookTheme.accent,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    color: bookTheme.accent,
    fontFamily: bookSerifFont,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: bookTheme.ink,
    fontFamily: bookSerifFont,
    fontStyle: 'italic',
  },
});
