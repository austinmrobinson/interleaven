import { StyleSheet, View, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { bookTheme } from '@/lib/theme/book-theme';

interface ChapterNavProps {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function ChapterNav({ hasPrev, hasNext, onPrev, onNext }: ChapterNavProps) {
  function handlePrev() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrev();
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNext();
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable onPress={handlePrev} disabled={!hasPrev}>
        <GlassView style={[styles.navButton, !hasPrev && styles.disabled]}>
          <SymbolView
            name="chevron.left"
            size={18}
            tintColor={hasPrev ? bookTheme.icon : bookTheme.iconDisabled}
            style={styles.symbol}
          />
        </GlassView>
      </Pressable>
      <Pressable onPress={handleNext} disabled={!hasNext}>
        <GlassView style={[styles.navButton, !hasNext && styles.disabled]}>
          <SymbolView
            name="chevron.right"
            size={18}
            tintColor={hasNext ? bookTheme.icon : bookTheme.iconDisabled}
            style={styles.symbol}
          />
        </GlassView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  symbol: { width: 22, height: 22 },
});
