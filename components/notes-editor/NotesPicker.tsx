import { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  SectionList,
  TextInput,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import type { Note } from '@/lib/bible/types';
import { bookTheme } from '@/lib/theme/book-theme';
import { bookSerifFont } from '@/lib/typography';

interface NotesPickerProps {
  visible: boolean;
  notes: Note[];
  currentNoteId: string | undefined;
  search: string;
  onSearchChange: (text: string) => void;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onClose: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function getDateLabel(timestamp: number): string {
  const now = new Date();
  const d = new Date(timestamp);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  if (diffDays < 30) return 'This Month';
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: 'long' });
  }
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

interface NoteSection {
  title: string;
  data: Note[];
}

function buildDateSections(notes: Note[]): NoteSection[] {
  const map = new Map<string, Note[]>();
  for (const note of notes) {
    const label = getDateLabel(note.updatedAt);
    const list = map.get(label);
    if (list) list.push(note);
    else map.set(label, [note]);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export function NotesPicker({
  visible,
  notes,
  currentNoteId,
  search,
  onSearchChange,
  onSelectNote,
  onNewNote,
  onClose,
}: NotesPickerProps) {
  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.trim().toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        stripHtml(n.content).toLowerCase().includes(q),
    );
  }, [notes, search]);

  const sections = useMemo(
    () => buildDateSections(filteredNotes),
    [filteredNotes],
  );

  function handleClose() {
    onSearchChange('');
    onClose();
  }

  function handleSelect(id: string) {
    onSelectNote(id);
    onSearchChange('');
    onClose();
  }

  function handleNewNote() {
    onNewNote();
    onSearchChange('');
    onClose();
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

          <Text style={styles.largeTitle}>Notes</Text>

          <View style={styles.searchRow}>
            <SymbolView
              name="magnifyingglass"
              size={16}
              tintColor={bookTheme.inkPlaceholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes…"
              placeholderTextColor={bookTheme.inkPlaceholder}
              value={search}
              onChangeText={onSearchChange}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <Pressable
              style={({ pressed }) => [
                styles.newNoteRow,
                pressed && styles.rowPressed,
              ]}
              onPress={handleNewNote}
            >
              <SymbolView
                name="plus.circle.fill"
                size={20}
                tintColor={bookTheme.accent}
                style={styles.newNoteSymbol}
              />
              <Text style={styles.newNoteLabel}>New Note</Text>
            </Pressable>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const isActive = item.id === currentNoteId;
            const isFirst = index === 0;
            const isLast = index === section.data.length - 1;
            const preview = stripHtml(item.content);
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
                    styles.noteRow,
                    isActive && styles.noteRowActive,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <Text
                    style={[
                      styles.noteTitle,
                      isActive && styles.noteTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title || 'Untitled'}
                  </Text>
                  {preview.length > 0 && (
                    <Text style={styles.notePreview} numberOfLines={1}>
                      {preview}
                    </Text>
                  )}
                </Pressable>
                {!isLast && <View style={styles.separator} />}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notes found</Text>
          }
        />
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
  newNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    backgroundColor: bookTheme.elevatedSurface,
    borderRadius: GROUP_RADIUS,
  },
  newNoteSymbol: { width: 20, height: 20 },
  newNoteLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: bookTheme.accent,
    fontFamily: bookSerifFont,
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
  noteRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  noteRowActive: {
    backgroundColor: bookTheme.accentMutedFill,
  },
  rowPressed: {
    backgroundColor: bookTheme.accentMutedFill,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: bookTheme.ink,
    fontFamily: bookSerifFont,
    marginBottom: 2,
  },
  noteTitleActive: {
    color: bookTheme.accent,
  },
  notePreview: {
    fontSize: 14,
    color: bookTheme.inkSecondary,
    fontFamily: bookSerifFont,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: bookTheme.borderHairline,
    marginLeft: 16,
  },
  emptyText: {
    fontSize: 15,
    color: bookTheme.inkTertiary,
    fontFamily: bookSerifFont,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
