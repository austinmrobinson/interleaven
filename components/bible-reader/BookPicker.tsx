import { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  SectionList,
  FlatList,
  TextInput,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { ALL_BOOKS, getTestament } from '@/lib/bible/books';
import { getChapterCount } from '@/lib/bible/data';
import { bookTheme } from '@/lib/theme/book-theme';
import { bookSerifFont } from '@/lib/typography';

interface BookPickerProps {
  visible: boolean;
  currentBook: string;
  currentChapter: number;
  onSelect: (book: string, chapter: number) => void;
  onClose: () => void;
}

type PickerStep = 'book' | 'chapter';

interface BookSection {
  title: string;
  data: string[];
}

function buildSections(books: string[]): BookSection[] {
  const old: string[] = [];
  const nt: string[] = [];
  for (const b of books) {
    if (getTestament(b) === 'old') old.push(b);
    else nt.push(b);
  }
  const sections: BookSection[] = [];
  if (old.length > 0) sections.push({ title: 'Old Testament', data: old });
  if (nt.length > 0) sections.push({ title: 'New Testament', data: nt });
  return sections;
}

export function BookPicker({
  visible,
  currentBook,
  currentChapter,
  onSelect,
  onClose,
}: BookPickerProps) {
  const [step, setStep] = useState<PickerStep>('chapter');
  const [selectedBook, setSelectedBook] = useState(currentBook);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedBook(currentBook);
      setStep('chapter');
      setSearch('');
    }
  }, [visible, currentBook]);

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return ALL_BOOKS;
    const q = search.trim().toLowerCase();
    return ALL_BOOKS.filter((b) => b.toLowerCase().includes(q));
  }, [search]);

  const sections = useMemo(() => buildSections(filteredBooks), [filteredBooks]);

  const chapterNumbers = useMemo(() => {
    const count = getChapterCount(selectedBook);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selectedBook]);

  function handleBookSelect(book: string) {
    setSelectedBook(book);
    setSearch('');
    setStep('chapter');
  }

  function handleChapterSelect(chapter: number) {
    onSelect(selectedBook, chapter);
    setStep('chapter');
    setSearch('');
    onClose();
  }

  function handleClose() {
    setStep('chapter');
    setSearch('');
    onClose();
  }

  function handleBackToBooks() {
    setStep('book');
    setSearch('');
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            {step === 'chapter' && (
              <Pressable
                onPress={handleBackToBooks}
                style={styles.backButton}
                hitSlop={8}
              >
                <SymbolView
                  name="chevron.left"
                  size={16}
                  tintColor={bookTheme.accent}
                  style={styles.backSymbol}
                />
                <Text style={styles.backText}>Books</Text>
              </Pressable>
            )}
            <View style={styles.topRowSpacer} />
            <Pressable onPress={handleClose} hitSlop={4}>
              <GlassView style={styles.closeGlass}>
                <SymbolView
                  name="xmark"
                  size={14}
                  tintColor={bookTheme.icon}
                  style={styles.closeSymbol}
                />
              </GlassView>
            </Pressable>
          </View>

          <Text style={styles.largeTitle}>
            {step === 'book' ? 'Books' : selectedBook}
          </Text>

          <View style={styles.searchRow}>
            <SymbolView
              name="magnifyingglass"
              size={16}
              tintColor={bookTheme.inkPlaceholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={
                step === 'book' ? 'Search books…' : 'Search chapters…'
              }
              placeholderTextColor={bookTheme.inkPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
            />
          </View>
        </View>

        {step === 'book' ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item, index, section }) => {
              const isFirst = index === 0;
              const isLast = index === section.data.length - 1;
              const isActive = item === currentBook;
              return (
                <View
                  style={[
                    styles.rowOuter,
                    isFirst && styles.rowFirst,
                    isLast && styles.rowLast,
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.bookRow,
                      isActive && styles.bookRowActive,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => handleBookSelect(item)}
                  >
                    <Text
                      style={[
                        styles.bookText,
                        isActive && styles.bookTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    <View style={styles.bookRowRight}>
                      <Text style={styles.chapterCountText}>
                        {getChapterCount(item)}
                      </Text>
                      <SymbolView
                        name="chevron.right"
                        size={12}
                        tintColor={bookTheme.iconMuted}
                        style={styles.chevron}
                      />
                    </View>
                  </Pressable>
                  {!isLast && <View style={styles.separator} />}
                </View>
              );
            }}
          />
        ) : (
          <FlatList
            data={chapterNumbers}
            numColumns={5}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={styles.chapterGrid}
            columnWrapperStyle={styles.chapterRow}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isActive =
                item === currentChapter && selectedBook === currentBook;
              return (
                <Pressable
                  style={[
                    styles.chapterItem,
                    isActive && styles.chapterItemActive,
                  ]}
                  onPress={() => handleChapterSelect(item)}
                >
                  <Text
                    style={[
                      styles.chapterText,
                      isActive && styles.chapterTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const GROUP_RADIUS = 10;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bookTheme.pickerSheetBackground,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  topRowSpacer: { flex: 1 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backSymbol: { width: 16, height: 16 },
  backText: {
    fontSize: 17,
    color: bookTheme.accent,
    fontFamily: bookSerifFont,
  },
  closeGlass: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSymbol: { width: 14, height: 14 },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: bookTheme.ink,
    fontFamily: bookSerifFont,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bookTheme.elevatedSurface,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: { width: 16, height: 16 },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 15,
    color: bookTheme.ink,
    fontFamily: bookSerifFont,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: bookTheme.inkSecondary,
    fontFamily: bookSerifFont,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  rowOuter: {
    backgroundColor: bookTheme.elevatedSurface,
    overflow: 'hidden',
  },
  rowFirst: {
    borderTopLeftRadius: GROUP_RADIUS,
    borderTopRightRadius: GROUP_RADIUS,
  },
  rowLast: {
    borderBottomLeftRadius: GROUP_RADIUS,
    borderBottomRightRadius: GROUP_RADIUS,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  bookRowActive: {
    backgroundColor: bookTheme.accentMutedFill,
  },
  rowPressed: {
    backgroundColor: bookTheme.accentMutedFill,
  },
  bookRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookText: {
    fontSize: 17,
    color: bookTheme.ink,
    fontFamily: bookSerifFont,
  },
  bookTextActive: {
    color: bookTheme.accent,
    fontWeight: '600',
  },
  chapterCountText: {
    fontSize: 15,
    color: bookTheme.inkTertiary,
    fontFamily: bookSerifFont,
  },
  chevron: { width: 12, height: 12 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: bookTheme.borderHairline,
    marginLeft: 16,
  },
  chapterGrid: {
    padding: 16,
    paddingBottom: 40,
  },
  chapterRow: {
    gap: 8,
    marginBottom: 8,
  },
  chapterItem: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '18%',
    backgroundColor: bookTheme.elevatedSurface,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterItemActive: {
    backgroundColor: bookTheme.accent,
  },
  chapterText: {
    fontSize: 16,
    fontWeight: '500',
    color: bookTheme.ink,
  },
  chapterTextActive: {
    color: bookTheme.accentOnFill,
  },
});
