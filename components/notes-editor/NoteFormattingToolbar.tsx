import type { RefObject } from "react";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";
import type { EnrichedTextInputInstance, OnChangeStateEvent } from "react-native-enriched";
import {
  FloatingToolbarShell,
  FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP,
  FLOATING_TOOLBAR_HPADDING,
} from "@/components/ui/FloatingToolbarShell";
import {
  applyHeadingSelection,
  headingSelectedLevelFromState,
} from "./apply-heading-selection";
import { HeadingParagraphStyleMenu } from "./HeadingParagraphStyleMenu";
import { bookTheme } from "@/lib/theme/book-theme";

const NOTE_FORMAT_TOOLBAR_SHELL_PAD_V = 4;

/** Minimum height of the format button row inside the floating shell. */
export const NOTE_FORMAT_TOOLBAR_HEIGHT = 44;

/** Vertical space the floating format toolbar occupies over the editor (for scroll padding). */
export const NOTE_FORMAT_TOOLBAR_SCROLL_CLEARANCE =
  NOTE_FORMAT_TOOLBAR_SHELL_PAD_V * 2 + NOTE_FORMAT_TOOLBAR_HEIGHT;

interface NoteFormattingToolbarProps {
  visible: boolean;
  /** Distance from the bottom of the notes pane to the top of the keyboard (0 if no overlap). */
  bottomInset: number;
  editorRef: RefObject<EnrichedTextInputInstance | null>;
  styleState: OnChangeStateEvent | null;
}

function ToolbarButton({
  symbol,
  accessibilityLabel,
  active,
  disabled,
  onPress,
}: {
  symbol: SFSymbol;
  accessibilityLabel: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        active && styles.btnActive,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <SymbolView
        name={symbol}
        size={18}
        tintColor={active ? bookTheme.accent : bookTheme.icon}
        style={styles.symbol}
      />
    </Pressable>
  );
}

export function NoteFormattingToolbar({
  visible,
  bottomInset,
  editorRef,
  styleState,
}: NoteFormattingToolbarProps) {
  const run = (fn: () => void) => {
    fn();
    requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  };

  const applyHeadingLevel = useCallback(
    (level: number) => {
      applyHeadingSelection(level, editorRef.current, styleState);
      requestAnimationFrame(() => {
        editorRef.current?.focus();
      });
    },
    [editorRef, styleState],
  );

  const s = styleState;
  const headingActive =
    !!(s?.h1.isActive || s?.h2.isActive || s?.h3.isActive || s?.h4.isActive);
  const headingDisabled = !!s?.h1.isBlocking;
  const headingSelectedLevel = headingSelectedLevelFromState(s);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          bottom: bottomInset + FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP,
          paddingHorizontal: FLOATING_TOOLBAR_HPADDING,
        },
      ]}
      pointerEvents="box-none"
    >
      <FloatingToolbarShell pill contentStyle={styles.shellContent}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.row}
        >
          <ToolbarButton
            symbol="bold"
            accessibilityLabel="Bold"
            active={!!s?.bold.isActive}
            disabled={!!s?.bold.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleBold())}
          />
          <ToolbarButton
            symbol="italic"
            accessibilityLabel="Italic"
            active={!!s?.italic.isActive}
            disabled={!!s?.italic.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleItalic())}
          />
          <ToolbarButton
            symbol="underline"
            accessibilityLabel="Underline"
            active={!!s?.underline.isActive}
            disabled={!!s?.underline.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleUnderline())}
          />
          <ToolbarButton
            symbol="strikethrough"
            accessibilityLabel="Strikethrough"
            active={!!s?.strikeThrough.isActive}
            disabled={!!s?.strikeThrough.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleStrikeThrough())}
          />
          <HeadingParagraphStyleMenu
            headingActive={headingActive}
            headingDisabled={headingDisabled}
            selectedLevel={headingSelectedLevel}
            onApplyLevel={applyHeadingLevel}
          />
          <ToolbarButton
            symbol="list.bullet"
            accessibilityLabel="Bulleted list"
            active={!!s?.unorderedList.isActive}
            disabled={!!s?.unorderedList.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleUnorderedList())}
          />
          <ToolbarButton
            symbol="list.number"
            accessibilityLabel="Numbered list"
            active={!!s?.orderedList.isActive}
            disabled={!!s?.orderedList.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleOrderedList())}
          />
          <ToolbarButton
            symbol="text.quote"
            accessibilityLabel="Quote"
            active={!!s?.blockQuote.isActive}
            disabled={!!s?.blockQuote.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleBlockQuote())}
          />
          <ToolbarButton
            symbol="chevron.left.forwardslash.chevron.right"
            accessibilityLabel="Inline code"
            active={!!s?.inlineCode.isActive}
            disabled={!!s?.inlineCode.isBlocking}
            onPress={() => run(() => editorRef.current?.toggleInlineCode())}
          />
        </ScrollView>
      </FloatingToolbarShell>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 25,
  },
  shellContent: {
    paddingVertical: NOTE_FORMAT_TOOLBAR_SHELL_PAD_V,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 0,
    gap: 4,
    minHeight: NOTE_FORMAT_TOOLBAR_HEIGHT,
  },
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
