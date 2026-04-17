import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';

/** Horizontal inset from the pane edge for the floating card (both toolbars). */
export const FLOATING_TOOLBAR_HPADDING = 12;

/** Space between the floating bar and the thing it sits above (keyboard, chapter nav). */
export const FLOATING_TOOLBAR_ABOVE_ANCHOR_GAP = 8;

export const FLOATING_TOOLBAR_RADIUS = 16;

/** Large radius for a stadium / capsule (fully rounded ends). */
export const FLOATING_TOOLBAR_PILL_RADIUS = 9999;

interface FloatingToolbarShellProps {
  children: ReactNode;
  /** Padding inside the blur (toolbar-specific). */
  contentStyle?: ViewStyle;
  /** Capsule shape (semicircular ends) instead of a modest corner radius. */
  pill?: boolean;
}

export function FloatingToolbarShell({ children, contentStyle, pill }: FloatingToolbarShellProps) {
  const radiusStyle = pill ? { borderRadius: FLOATING_TOOLBAR_PILL_RADIUS } : null;

  return (
    <View style={[styles.shadowOuter, radiusStyle]}>
      <GlassView glassEffectStyle="regular" style={[styles.glass, radiusStyle]}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowOuter: {
    borderRadius: FLOATING_TOOLBAR_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  glass: {
    borderRadius: FLOATING_TOOLBAR_RADIUS,
    overflow: 'hidden',
  },
  content: {},
});
