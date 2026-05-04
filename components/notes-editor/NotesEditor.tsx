import { useNoteInsert } from "@/contexts/NoteInsertContext";
import { useCurrentNote, useAllNotes } from "@/lib/hooks/useNotes";
import { deleteNote } from "@/lib/db/notes";
import {
  useEditorBlurRef,
  useSplitPaneLayoutGeneration,
} from "@/components/split-pane/SplitPaneLayoutContext";
import { useClampScrollWhenSplitChanges } from "@/lib/hooks/useClampScrollWhenSplitChanges";
import {
  ensurePointInScrollWindow,
  ensureViewInScrollWindow,
} from "@/lib/utils/ensure-view-in-scroll-window";
import { formatVerseReferenceForDisplay } from "@/lib/bible/format-verse-ref";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import {
  Keyboard,
  type LayoutChangeEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeHtmlEvent,
  type OnChangeSelectionEvent,
  type OnChangeStateEvent,
  type OnChangeTextEvent,
  type OnKeyPressEvent,
} from "react-native-enriched";
import { NoteFloatingBar } from "./NoteFloatingBar";
import {
  NOTE_FORMAT_TOOLBAR_SCROLL_CLEARANCE,
  NoteFormattingToolbar,
} from "./NoteFormattingToolbar";
import { FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP } from "@/components/ui/FloatingToolbarShell";
import { NoteTitle } from "./NoteTitle";
import { NotesPicker } from "./NotesPicker";
import { ScriptureRefBlock } from "./ScriptureRefBlock";
import { bookTheme } from "@/lib/theme/book-theme";
import {
  buildScriptureQuoteMarkdown,
  detectLiveMarkdownShortcut,
  enrichedHtmlToMarkdown,
  enrichedHtmlToMarkdownRaw,
  extractVerseRefsFromMarkdown,
  looksLikeLikelyHtml,
  markdownToEnrichedHtml,
  noteContentToEditorHtml,
} from "@/lib/notes/markdown";
import { bookSerifFont } from "@/lib/typography";
import { FLOATING_HEADER_TOP_INSET } from "@/lib/layout/bible-reader-chrome";
const TOOLBAR_SCROLL_EXTRA = 8;

const EDITOR_MIN_HEIGHT = 220;
/** Extra editor min height while the keyboard is visible (more room above the keys). */
const EDITOR_MIN_HEIGHT_KEYBOARD_EXTRA = 72;
const EDITOR_MIN_HEIGHT_WITH_KEYBOARD = EDITOR_MIN_HEIGHT + EDITOR_MIN_HEIGHT_KEYBOARD_EXTRA;

/**
 * Used to estimate caret Y within the editor block when the native input does
 * not expose a caret rect. Must stay in sync with `styles.enrichedInput`.
 */
const EDITOR_LINE_HEIGHT = 24;
const EDITOR_CONTENT_TOP_PAD = 4;

/** Extra breathing room between the caret and the format toolbar above the keyboard. */
const CARET_BOTTOM_BUFFER = 24;

const EMPTY_NOTE_HTML = "<p></p>";

function countNewlines(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
}

interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text: string;
}

export function NotesEditor() {
  const { note, save, loadNote, startNewNote } = useCurrentNote();
  const { notes: allNotes, refresh: refreshNotes } = useAllNotes();
  const { pendingInsert, consumeInsert } = useNoteInsert();
  const [notesPickerVisible, setNotesPickerVisible] = useState(false);
  const [notesSearch, setNotesSearch] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date());
  const [verseRefs, setVerseRefs] = useState<VerseRef[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enrichedRef = useRef<EnrichedTextInputInstance | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const notesRootRef = useRef<View>(null);
  const titleBlockRef = useRef<View>(null);
  const editorBlockRef = useRef<View>(null);
  const keyboardTopYRef = useRef<number | null>(null);
  const caretScrollRafRef = useRef<number | null>(null);
  const caretScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusedFieldRef = useRef<"title" | "editor" | null>(null);
  const bodyHtmlRef = useRef(EMPTY_NOTE_HTML);
  const titleRef = useRef("");
  const plainTextRef = useRef("");
  const selectionCaretRef = useRef(0);
  const liveMdSuppressRef = useRef(false);

  const splitGeneration = useSplitPaneLayoutGeneration();
  const editorBlurRef = useEditorBlurRef();
  const { scrollYRef, handleScroll, handleContentSizeChange, handleLayout } =
    useClampScrollWhenSplitChanges(scrollRef, splitGeneration);

  useEffect(() => {
    if (!editorBlurRef) return;
    editorBlurRef.current = () => {
      enrichedRef.current?.blur();
    };
    return () => {
      if (editorBlurRef.current) editorBlurRef.current = null;
    };
  }, [editorBlurRef]);

  const [editorStyleState, setEditorStyleState] =
    useState<OnChangeStateEvent | null>(null);
  const [keyboardBottomOverlap, setKeyboardBottomOverlap] = useState(0);
  const [editorFocusedForToolbar, setEditorFocusedForToolbar] = useState(false);

  const applyKeyboardInset = useCallback((keyboardTopScreenY: number | null) => {
    if (keyboardTopScreenY == null) {
      setKeyboardBottomOverlap(0);
      return;
    }
    notesRootRef.current?.measureInWindow((x, y, w, h) => {
      const bottom = y + h;
      setKeyboardBottomOverlap(Math.max(0, bottom - keyboardTopScreenY));
    });
  }, []);

  const clearEditorBlurTimer = useCallback(() => {
    if (editorBlurTimerRef.current) {
      clearTimeout(editorBlurTimerRef.current);
      editorBlurTimerRef.current = null;
    }
  }, []);

  const scheduleScrollTargetIntoView = useCallback(
    (targetRef: RefObject<View | null>) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const accessoryAboveKeyboard =
            focusedFieldRef.current === "editor" &&
            keyboardTopYRef.current != null &&
            editorFocusedForToolbar
              ? NOTE_FORMAT_TOOLBAR_SCROLL_CLEARANCE + FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP
              : 0;
          ensureViewInScrollWindow(scrollRef, scrollYRef, targetRef, {
            insetTop: FLOATING_HEADER_TOP_INSET,
            keyboardTopY: keyboardTopYRef.current,
            accessoryAboveKeyboard,
          });
        }, Platform.OS === "ios" ? 64 : 100);
      });
    },
    [scrollYRef, editorFocusedForToolbar],
  );

  const requestCaretIntoView = useCallback((opts?: { layoutDelayMs?: number }) => {
    if (focusedFieldRef.current !== "editor") return;
    if (caretScrollRafRef.current != null) {
      cancelAnimationFrame(caretScrollRafRef.current);
      caretScrollRafRef.current = null;
    }
    if (caretScrollTimeoutRef.current != null) {
      clearTimeout(caretScrollTimeoutRef.current);
      caretScrollTimeoutRef.current = null;
    }

    const runMeasure = () => {
      const accessoryAboveKeyboard =
        editorFocusedForToolbar && keyboardTopYRef.current != null
          ? NOTE_FORMAT_TOOLBAR_SCROLL_CLEARANCE +
            FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP +
            CARET_BOTTOM_BUFFER
          : 0;
      const block = editorBlockRef.current;
      if (!block) return;
      block.measureInWindow((_bx, by, _bw, bh) => {
        const plain = plainTextRef.current;
        const caret = Math.max(
          0,
          Math.min(selectionCaretRef.current, plain.length),
        );
        const lineIndex = countNewlines(plain.slice(0, caret));
        const totalLines = 1 + countNewlines(plain);
        const avgLineH = Math.max(EDITOR_LINE_HEIGHT, bh / Math.max(1, totalLines));
        const rawCaretY = by + EDITOR_CONTENT_TOP_PAD + lineIndex * avgLineH;
        const caretY = Math.min(Math.max(rawCaretY, by), by + bh);
        ensurePointInScrollWindow(scrollRef, scrollYRef, caretY, {
          insetTop: FLOATING_HEADER_TOP_INSET,
          keyboardTopY: keyboardTopYRef.current,
          accessoryAboveKeyboard,
        });
      });
    };

    const scheduleDoubleRaf = () => {
      caretScrollRafRef.current = requestAnimationFrame(() => {
        caretScrollRafRef.current = requestAnimationFrame(() => {
          caretScrollRafRef.current = null;
          runMeasure();
        });
      });
    };

    const delay = opts?.layoutDelayMs ?? 0;
    if (delay > 0) {
      caretScrollTimeoutRef.current = setTimeout(() => {
        caretScrollTimeoutRef.current = null;
        scheduleDoubleRaf();
      }, delay);
    } else {
      scheduleDoubleRaf();
    }
  }, [scrollYRef, editorFocusedForToolbar]);

  const handleEditorLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      if (focusedFieldRef.current !== "editor") return;
      requestCaretIntoView();
    },
    [requestCaretIntoView],
  );

  const handleEditorKeyPress = useCallback(
    (e: NativeSyntheticEvent<OnKeyPressEvent>) => {
      const k = e.nativeEvent.key;
      if (k !== "Enter" && k !== "\n") return;
      requestCaretIntoView({
        layoutDelayMs: Platform.OS === "ios" ? 56 : 72,
      });
    },
    [requestCaretIntoView],
  );

  const scheduleSave = useCallback(() => {
    if (!note) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      save(titleRef.current, enrichedHtmlToMarkdown(bodyHtmlRef.current));
    }, 1000);
  }, [note, save]);

  const tryApplyLiveMarkdown = useCallback(
    (caret: number) => {
      if (liveMdSuppressRef.current) return;
      const plain = plainTextRef.current;
      const hit = detectLiveMarkdownShortcut(plain, caret);
      if (!hit) return;
      const inst = enrichedRef.current;
      if (!inst) return;
      liveMdSuppressRef.current = true;

      // Roundtrip through Markdown using the *current* HTML so existing formatting
      // (prior headings, lists, etc.) is preserved while the newly-typed syntax
      // (e.g. `**bold** `) is turned into real formatting. The raw converter skips
      // backslash-escaping so literal markdown punctuation survives the hop.
      void inst.getHTML().then((curHtml) => {
        try {
          const curMd = enrichedHtmlToMarkdownRaw(curHtml);
          const nextHtml = markdownToEnrichedHtml(curMd);
          inst.setValue(nextHtml);
          bodyHtmlRef.current = nextHtml;
          requestAnimationFrame(() => {
            const c = Math.max(0, Math.min(hit.caret, plainTextRef.current.length));
            inst.setSelection(c, c);
            liveMdSuppressRef.current = false;
            scheduleSave();
          });
        } catch {
          liveMdSuppressRef.current = false;
        }
      });
    },
    [scheduleSave],
  );

  const handleChangeHtml = useCallback(
    (_e: NativeSyntheticEvent<OnChangeHtmlEvent>) => {
      bodyHtmlRef.current = _e.nativeEvent.value;
      scheduleSave();
      requestCaretIntoView();
    },
    [scheduleSave, requestCaretIntoView],
  );

  const handleChangeText = useCallback(
    (e: NativeSyntheticEvent<OnChangeTextEvent>) => {
      plainTextRef.current = e.nativeEvent.value;
    },
    [],
  );

  const handleChangeSelection = useCallback(
    (e: NativeSyntheticEvent<OnChangeSelectionEvent>) => {
      const { start, end } = e.nativeEvent;
      selectionCaretRef.current = end;
      requestCaretIntoView();
      if (start !== end || liveMdSuppressRef.current) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => tryApplyLiveMarkdown(end));
      });
    },
    [requestCaretIntoView, tryApplyLiveMarkdown],
  );

  const handleChangeState = useCallback(
    (e: NativeSyntheticEvent<OnChangeStateEvent>) => {
      setEditorStyleState(e.nativeEvent);
      requestCaretIntoView();
    },
    [requestCaretIntoView],
  );

  useEffect(() => {
    if (!note?.id) return;
    setTitle(note.title);
    titleRef.current = note.title;
    const raw = note.content ?? "";
    const html = noteContentToEditorHtml(raw);
    bodyHtmlRef.current = html;
    const mdForRefs = raw.trim() && looksLikeLikelyHtml(raw) ? enrichedHtmlToMarkdown(raw) : raw;
    setVerseRefs(extractVerseRefsFromMarkdown(mdForRefs));
    liveMdSuppressRef.current = true;
    enrichedRef.current?.setValue(html);
    requestAnimationFrame(() => {
      liveMdSuppressRef.current = false;
    });
  }, [note?.id]);

  const markdownContextMenuItems = useMemo(
    () => [
      {
        text: "Paste as Markdown",
        visible: true,
        onPress: async () => {
          const md = (await Clipboard.getStringAsync()).trim();
          if (!md) return;
          const inst = enrichedRef.current;
          if (!inst) return;
          const curMd = enrichedHtmlToMarkdown(await inst.getHTML());
          const nextMd = curMd.trimEnd() + (curMd.trim() ? "\n\n" : "") + md.trim();
          const nextHtml = markdownToEnrichedHtml(nextMd);
          inst.setValue(nextHtml);
          bodyHtmlRef.current = nextHtml;
          scheduleSave();
        },
      },
    ],
    [scheduleSave],
  );

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvt, (e) => {
      keyboardTopYRef.current = e.endCoordinates.screenY;
      applyKeyboardInset(e.endCoordinates.screenY);
      if (focusedFieldRef.current === "title") scheduleScrollTargetIntoView(titleBlockRef);
      else if (focusedFieldRef.current === "editor") scheduleScrollTargetIntoView(editorBlockRef);
      else scheduleScrollTargetIntoView(titleBlockRef);
    });

    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardTopYRef.current = null;
      applyKeyboardInset(null);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [applyKeyboardInset, scheduleScrollTargetIntoView]);

  useEffect(() => {
    if (keyboardTopYRef.current != null) {
      applyKeyboardInset(keyboardTopYRef.current);
    }
  }, [splitGeneration, applyKeyboardInset]);

  useEffect(
    () => () => {
      clearEditorBlurTimer();
      if (caretScrollRafRef.current != null) {
        cancelAnimationFrame(caretScrollRafRef.current);
      }
      if (caretScrollTimeoutRef.current != null) {
        clearTimeout(caretScrollTimeoutRef.current);
      }
    },
    [clearEditorBlurTimer],
  );

  useEffect(() => {
    if (!pendingInsert || !note?.id) return;
    const ref = consumeInsert();
    if (!ref) return;

    setVerseRefs((prev) => [...prev, ref]);
    const quoteMd = buildScriptureQuoteMarkdown(ref);

    void enrichedRef.current?.getHTML().then((html) => {
      const curMd = enrichedHtmlToMarkdown(html);
      const nextMd = curMd.trimEnd() + (curMd.trim() ? "\n\n" : "") + quoteMd.trimEnd();
      const nextHtml = markdownToEnrichedHtml(nextMd);
      enrichedRef.current?.setValue(nextHtml);
      bodyHtmlRef.current = nextHtml;
      save(titleRef.current, nextMd);
    });
  }, [consumeInsert, note?.id, pendingInsert, save]);

  const handleTitleChange = useCallback(
    (text: string) => {
      const singleLine = text.replace(/\r\n|\n|\r/g, " ");
      setTitle(singleLine);
      titleRef.current = singleLine;
      if (!note) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        save(singleLine, enrichedHtmlToMarkdown(bodyHtmlRef.current));
      }, 1000);
    },
    [note, save],
  );

  const hasTitle = title.trim().length > 0;

  const handleTitleSubmitEditing = useCallback(() => {
    focusedFieldRef.current = "editor";
    enrichedRef.current?.focus();
    scheduleScrollTargetIntoView(editorBlockRef);
  }, [scheduleScrollTargetIntoView]);

  const handleTitleFocus = useCallback(() => {
    focusedFieldRef.current = "title";
    scheduleScrollTargetIntoView(titleBlockRef);
  }, [scheduleScrollTargetIntoView]);

  const handleEditorFocus = useCallback(() => {
    clearEditorBlurTimer();
    setEditorFocusedForToolbar(true);
    focusedFieldRef.current = "editor";
    scheduleScrollTargetIntoView(editorBlockRef);
  }, [clearEditorBlurTimer, scheduleScrollTargetIntoView]);

  const handleEditorBlur = useCallback(() => {
    editorBlurTimerRef.current = setTimeout(() => {
      setEditorFocusedForToolbar(false);
      editorBlurTimerRef.current = null;
    }, 220);
  }, []);

  const handleOpenPicker = useCallback(() => {
    refreshNotes();
    setNotesPickerVisible(true);
  }, [refreshNotes]);

  const handleSelectNote = useCallback(
    (id: string) => {
      loadNote(id);
    },
    [loadNote],
  );

  const handleNewNote = useCallback(() => {
    startNewNote();
  }, [startNewNote]);

  const handleDeleteNote = useCallback(async (id: string) => {
    await deleteNote(id);
    await refreshNotes();
    if (note?.id === id) startNewNote();
  }, [note?.id, refreshNotes, startNewNote]);

  const showFormatToolbar =
    editorFocusedForToolbar && keyboardBottomOverlap > 0;
  const isKeyboardOpen = keyboardBottomOverlap > 0;
  const editorMinWhenKeyboard = isKeyboardOpen
    ? EDITOR_MIN_HEIGHT_WITH_KEYBOARD
    : undefined;

  const keyboardContentPadding =
    keyboardBottomOverlap > 0
      ? keyboardBottomOverlap +
        FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP +
        (showFormatToolbar ? NOTE_FORMAT_TOOLBAR_SCROLL_CLEARANCE : 0) +
        TOOLBAR_SCROLL_EXTRA +
        CARET_BOTTOM_BUFFER
      : 0;

  return (
    <View ref={notesRootRef} style={styles.container} collapsable={false}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardContentPadding > 0 && {
            paddingBottom: 24 + keyboardContentPadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        nestedScrollEnabled
        showsVerticalScrollIndicator
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
      >
        <View ref={titleBlockRef} style={styles.titleBlock} collapsable={false}>
          <NoteTitle
            value={title}
            onChangeText={handleTitleChange}
            date={date}
            onDateChange={setDate}
            autoFocus
            onSubmitEditing={handleTitleSubmitEditing}
            onTitleFocus={handleTitleFocus}
          />
        </View>
        {hasTitle && verseRefs.length > 0 && (
          <ScrollView
            horizontal
            style={[styles.refsStrip, styles.refsStripShrink]}
            showsHorizontalScrollIndicator={false}
          >
            {verseRefs.map((ref, i) => (
              <ScriptureRefBlock
                key={`${ref.book}-${ref.chapter}-${ref.verse}-${ref.endVerse ?? ""}-${i}`}
                book={ref.book}
                chapter={ref.chapter}
                verse={ref.verse}
                endVerse={ref.endVerse}
                text={ref.text}
              />
            ))}
          </ScrollView>
        )}
        <View
          ref={editorBlockRef}
          style={[
            styles.editorWrapper,
            editorMinWhenKeyboard != null && { minHeight: editorMinWhenKeyboard },
          ]}
          collapsable={false}
          onTouchStart={() => {
            focusedFieldRef.current = "editor";
          }}
        >
          <EnrichedTextInput
            ref={enrichedRef}
            defaultValue={EMPTY_NOTE_HTML}
            useHtmlNormalizer
            placeholder="Start writing..."
            placeholderTextColor={bookTheme.inkPlaceholder}
            scrollEnabled={false}
            onChangeHtml={handleChangeHtml}
            onChangeText={handleChangeText}
            onChangeSelection={handleChangeSelection}
            onChangeState={handleChangeState}
            onLayout={handleEditorLayout}
            onKeyPress={handleEditorKeyPress}
            onFocus={handleEditorFocus}
            onBlur={handleEditorBlur}
            contextMenuItems={markdownContextMenuItems}
            returnKeyType="default"
            submitBehavior="newline"
            style={{
              ...styles.enrichedInput,
              ...(editorMinWhenKeyboard != null
                ? { minHeight: editorMinWhenKeyboard }
                : {}),
            }}
            htmlStyle={{
              blockquote: {
                borderColor: bookTheme.borderStrong,
                borderWidth: 3,
                gapWidth: 10,
                color: bookTheme.ink,
              },
              a: {
                color: bookTheme.accent,
                textDecorationLine: "underline",
              },
            }}
          />
        </View>
      </ScrollView>
      <NoteFormattingToolbar
        visible={showFormatToolbar}
        bottomInset={keyboardBottomOverlap}
        editorRef={enrichedRef}
        styleState={editorStyleState}
      />
      <View style={styles.floatingOverlay} pointerEvents="box-none">
        <NoteFloatingBar
          label={title || "New note"}
          onPressPicker={handleOpenPicker}
          onNewNote={handleNewNote}
        />
      </View>
      <NotesPicker
        visible={notesPickerVisible}
        notes={allNotes}
        currentNoteId={note?.id}
        search={notesSearch}
        onSearchChange={setNotesSearch}
        onSelectNote={handleSelectNote}
        onDeleteNote={handleDeleteNote}
        onNewNote={handleNewNote}
        onClose={() => setNotesPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bookTheme.pageBackground,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: "column",
    paddingTop: FLOATING_HEADER_TOP_INSET,
    paddingBottom: 24,
  },
  floatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  titleBlock: {
    flexShrink: 0,
  },
    refsStrip: {
    maxHeight: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: bookTheme.borderHairline,
  },
  refsStripShrink: {
    flexShrink: 0,
  },
  editorWrapper: {
    width: "100%",
    minHeight: EDITOR_MIN_HEIGHT,
    paddingHorizontal: 24,
    flexGrow: 1,
    flexShrink: 0,
  },
  enrichedInput: {
    alignSelf: "stretch",
    minHeight: EDITOR_MIN_HEIGHT,
    flexGrow: 1,
    flexShrink: 0,
    fontSize: 17,
    lineHeight: 24,
    color: bookTheme.ink,
    fontFamily: bookSerifFont,
    paddingVertical: 4,
  },
});
