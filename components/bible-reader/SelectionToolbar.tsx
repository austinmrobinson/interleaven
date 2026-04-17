import { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Text, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import type { HighlightStyle } from '@/lib/bible/types';
import {
  FloatingToolbarShell,
  FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP,
  FLOATING_TOOLBAR_HPADDING,
} from '@/components/ui/FloatingToolbarShell';
import { bookTheme } from '@/lib/theme/book-theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Shared height for the format strip, Add to note pill, and dismiss control. */
const SELECTION_FLOATING_BAR_HEIGHT = 44;

/** Tighter than `FLOATING_TOOLBAR_HPADDING` so the selection chrome sits closer to the edges. */
const SELECTION_SCREEN_INSET = FLOATING_TOOLBAR_HPADDING / 2;

const MARKUP_PALETTE = [
  { color: '#FF3B30', name: 'Red' },
  { color: '#FFD60A', name: 'Yellow' },
  { color: '#30D158', name: 'Green' },
  { color: '#64D2FF', name: 'Blue' },
  { color: '#FF6482', name: 'Pink' },
  { color: '#BF5AF2', name: 'Purple' },
];

type Panel = 'main' | 'highlightColors' | 'circleColors';

interface SelectionToolbarProps {
  visible: boolean;
  /** Height of fixed bottom chrome (e.g. chapter nav) so the bar floats above it. */
  bottomInset: number;
  onHighlight: (style: HighlightStyle) => void;
  onClear: () => void;
  onAddToNote: () => void;
}

export function SelectionToolbar({
  visible,
  bottomInset,
  onHighlight,
  onClear,
  onAddToNote,
}: SelectionToolbarProps) {
  const [panel, setPanel] = useState<Panel>('main');

  useEffect(() => {
    if (!visible) setPanel('main');
  }, [visible]);

  function transitionTo(next: Panel) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPanel(next);
  }

  function goBackToMain() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPanel('main');
  }

  function applyHighlightColor(color: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onHighlight({ type: 'highlight', color });
  }

  function applyCircleColor(color: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onHighlight({ type: 'circle', color });
  }

  function applyUnderline() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onHighlight({ type: 'underline', color: '#FF9500' });
  }

  function handleClear() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClear();
  }

  function handleAddToNotePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddToNote();
  }

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomInset + FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP,
          paddingHorizontal: SELECTION_SCREEN_INSET,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.toolbarsRow}>
        {panel === 'main' && (
          <FloatingToolbarShell pill contentStyle={styles.addNoteShell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add selection to note as quote"
              style={({ pressed }) => [styles.addNotePressable, pressed && styles.addNotePressablePressed]}
              onPress={handleAddToNotePress}
            >
              <Text style={styles.addNoteLabel} numberOfLines={1}>
                Add to note
              </Text>
            </Pressable>
          </FloatingToolbarShell>
        )}

        {panel !== 'main' && (
          <FloatingToolbarShell pill contentStyle={styles.colorBackShell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={({ pressed }) => [styles.colorBackPressable, pressed && styles.iconBtnPressed]}
              onPress={goBackToMain}
            >
              <SymbolView name="chevron.left" size={18} tintColor={bookTheme.accent} style={styles.symbol} />
            </Pressable>
          </FloatingToolbarShell>
        )}

        <FloatingToolbarShell
          pill
          contentStyle={panel === 'main' ? styles.formatShell : styles.pickerShell}
        >
          {panel === 'main' ? (
            <View style={styles.formatRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Underline"
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={applyUnderline}
              >
                <SymbolView name="underline" size={20} tintColor={bookTheme.ink} style={styles.symbol} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Highlight color"
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => transitionTo('highlightColors')}
              >
                <SymbolView name="highlighter" size={20} tintColor={bookTheme.ink} style={styles.symbol} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Draw around text"
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => transitionTo('circleColors')}
              >
                <SymbolView name="pencil.tip.crop.circle" size={20} tintColor={bookTheme.ink} style={styles.symbol} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear selection"
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={handleClear}
              >
                <SymbolView name="eraser" size={20} tintColor={bookTheme.eraserMuted} style={styles.symbol} />
              </Pressable>
            </View>
          ) : (
            <ColorPickerPanel
              variant={panel}
              onPickHighlight={applyHighlightColor}
              onPickCircle={applyCircleColor}
            />
          )}
        </FloatingToolbarShell>

        {panel === 'main' && (
          <FloatingToolbarShell pill contentStyle={styles.dismissShell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss selection"
              style={({ pressed }) => [styles.dismissPressable, pressed && styles.dismissPressablePressed]}
              onPress={handleClear}
            >
              <SymbolView name="xmark" size={18} tintColor={bookTheme.icon} style={styles.symbol} />
            </Pressable>
          </FloatingToolbarShell>
        )}
      </View>
    </View>
  );
}

function ColorPickerPanel({
  variant,
  onPickHighlight,
  onPickCircle,
}: {
  variant: 'highlightColors' | 'circleColors';
  onPickHighlight: (color: string) => void;
  onPickCircle: (color: string) => void;
}) {
  return (
    <View style={styles.colorsRow}>
      {MARKUP_PALETTE.map(({ color, name }) => {
        const kind = variant === 'highlightColors' ? 'highlight' : 'circle';
        return (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={`${name} ${kind}`}
            style={({ pressed }) => [styles.colorDotWrap, pressed && styles.colorDotPressed]}
            onPress={() =>
              variant === 'highlightColors' ? onPickHighlight(color) : onPickCircle(color)
            }
          >
            <View
              style={[
                styles.colorDot,
                { backgroundColor: color, borderColor: 'rgba(0, 0, 0, 0.14)' },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
  },
  toolbarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  formatShell: {
    height: SELECTION_FLOATING_BAR_HEIGHT,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  pickerShell: {
    height: SELECTION_FLOATING_BAR_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: 10,
    justifyContent: 'center',
    flexGrow: 1,
    maxWidth: '100%',
  },
  colorBackShell: {
    width: SELECTION_FLOATING_BAR_HEIGHT,
    height: SELECTION_FLOATING_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorBackPressable: {
    width: SELECTION_FLOATING_BAR_HEIGHT,
    height: SELECTION_FLOATING_BAR_HEIGHT,
    borderRadius: SELECTION_FLOATING_BAR_HEIGHT / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addNoteShell: {
    height: SELECTION_FLOATING_BAR_HEIGHT,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  addNotePressable: {
    borderRadius: 10,
    justifyContent: 'center',
  },
  addNotePressablePressed: {
    opacity: 0.72,
  },
  addNoteLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: bookTheme.ink,
  },
  dismissShell: {
    width: SELECTION_FLOATING_BAR_HEIGHT,
    height: SELECTION_FLOATING_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissPressable: {
    width: SELECTION_FLOATING_BAR_HEIGHT,
    height: SELECTION_FLOATING_BAR_HEIGHT,
    borderRadius: SELECTION_FLOATING_BAR_HEIGHT / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissPressablePressed: {
    opacity: 0.72,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  colorDotWrap: {
    padding: 2,
    borderRadius: 20,
  },
  colorDotPressed: {
    backgroundColor: bookTheme.toolbarPressedBg,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  iconBtnPressed: {
    backgroundColor: bookTheme.toolbarPressedBg,
  },
  symbol: {
    width: 22,
    height: 22,
  },
});
