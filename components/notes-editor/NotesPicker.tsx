import { useCallback, useMemo, useRef } from 'react';
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
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
  interpolate,
} from 'react-native-reanimated';
import type { Note } from '@/lib/bible/types';
import { bookTheme } from '@/lib/theme/book-theme';
import { bookSerifFont, bibleSerifFontSemiBold, bibleSerifFontBold } from '@/lib/typography';

interface NotesPickerProps {
  visible: boolean;
  notes: Note[];
  currentNoteId: string | undefined;
  search: string;
  onSearchChange: (text: string) => void;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
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

const DELETE_ACTION_WIDTH = 80;

function DeleteAction({
  progress,
  onDelete,
}: {
  progress: SharedValue<number>;
  onDelete: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  return (
    <Animated.View style={[styles.deleteAction, animatedStyle]}>
      <Pressable style={styles.deleteButton} onPress={onDelete}>
        <SymbolView
          name="trash"
          size={20}
          tintColor="#fff"
          style={styles.deleteIcon}
        />
      </Pressable>
    </Animated.View>
  );
}

function SwipeableNoteRow({
  item,
  isActive,
  isFirst,
  isLast,
  onSelect,
  onDelete,
}: {
  item: Note;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const preview = stripHtml(item.content);

  const renderRightActions = useCallback(
    (progress: SharedValue<number>) => (
      <DeleteAction
        progress={progress}
        onDelete={() => {
          swipeableRef.current?.close();
          onDelete();
        }}
      />
    ),
    [onDelete],
  );

  return (
    <View
      style={[
        styles.rowOuter,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
      ]}
    >
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
        friction={2}
      >
        <Pressable
          style={({ pressed }) => [
            styles.noteRow,
            isActive && styles.noteRowActive,
            pressed && styles.rowPressed,
          ]}
          onPress={onSelect}
        >
          <Text
            style={[styles.noteTitle, isActive && styles.noteTitleActive]}
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
      </ReanimatedSwipeable>
      {!isLast && <View style={styles.separator} />}
    </View>
  );
}

export function NotesPicker({
  visible,
  notes,
  currentNoteId,
  search,
  onSearchChange,
  onSelectNote,
  onDeleteNote,
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
          renderItem={({ item, index, section }) => (
            <SwipeableNoteRow
              item={item}
              isActive={item.id === currentNoteId}
              isFirst={index === 0}
              isLast={index === section.data.length - 1}
              onSelect={() => handleSelect(item.id)}
              onDelete={() => onDeleteNote(item.id)}
            />
          )}
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
    color: bookTheme.ink,
    fontFamily: bibleSerifFontBold,
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
    color: bookTheme.inkSecondary,
    fontFamily: bibleSerifFontSemiBold,
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
    color: bookTheme.accent,
    fontFamily: bibleSerifFontSemiBold,
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
    backgroundColor: bookTheme.elevatedSurface,
  },
  noteRowActive: {
    backgroundColor: bookTheme.accentMutedFill,
  },
  rowPressed: {
    backgroundColor: bookTheme.accentMutedFill,
  },
  noteTitle: {
    fontSize: 17,
    color: bookTheme.ink,
    fontFamily: bibleSerifFontSemiBold,
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
  deleteAction: {
    width: DELETE_ACTION_WIDTH,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: DELETE_ACTION_WIDTH,
  },
  deleteIcon: { width: 20, height: 20 },
  emptyText: {
    fontSize: 15,
    color: bookTheme.inkTertiary,
    fontFamily: bookSerifFont,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
