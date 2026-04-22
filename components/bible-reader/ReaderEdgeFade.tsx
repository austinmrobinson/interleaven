import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { bookTheme } from '@/lib/theme/book-theme';

const BAND_COUNT = 20;

/** Pixel heights that sum to `totalPx` exactly (no fractional layout / overlap). */
function bandHeightsPx(totalPx: number, count: number): number[] {
  const base = Math.floor(totalPx / count);
  const remainder = totalPx % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

function alphaBottom(t: number): number {
  return Math.max(0, (t - 0.15) / (1 - 0.15));
}

function alphaTop(t: number): number {
  return 1 - alphaBottom(t);
}

/** Vertical edge fade without native modules (works in any RN runtime, including Expo Go). */
interface ReaderEdgeFadeProps {
  edge: 'top' | 'bottom';
  height: number;
  style?: StyleProp<ViewStyle>;
}

export function ReaderEdgeFade({ edge, height, style }: ReaderEdgeFadeProps) {
  const { r, g, b } = bookTheme.pageRgb;

  const bands = useMemo(() => {
    const H = Math.max(1, Math.round(height));
    const heights = bandHeightsPx(H, BAND_COUNT);
    const alphaAt = edge === 'bottom' ? alphaBottom : alphaTop;
    const items: ReactNode[] = [];

    if (edge === 'top') {
      let topOffset = 0;
      for (let i = 0; i < BAND_COUNT; i++) {
        const h = heights[i];
        const t = (topOffset + h / 2) / H;
        const alpha = alphaAt(t);
        items.push(
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: topOffset,
              height: h,
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
            }}
          />,
        );
        topOffset += h;
      }
    } else {
      let bottomOffset = 0;
      for (let i = BAND_COUNT - 1; i >= 0; i--) {
        const h = heights[i];
        const yTop = H - bottomOffset - h;
        const t = (yTop + h / 2) / H;
        const alpha = alphaAt(t);
        items.push(
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: bottomOffset,
              height: h,
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
            }}
          />,
        );
        bottomOffset += h;
      }
    }

    return items;
  }, [edge, height, r, g, b]);

  return (
    <View pointerEvents="none" style={[styles.wrap, { height: Math.round(height) }, style]}>
      {bands}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
