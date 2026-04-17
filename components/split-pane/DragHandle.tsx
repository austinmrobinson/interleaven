import { StyleSheet, View, PlatformColor } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface DragHandleProps {
  translateY: SharedValue<number>;
}

export function DragHandle({ translateY }: DragHandleProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.handle}>
        <View style={styles.pill} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  handle: {
    width: '100%',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.08)',
  },
  pill: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(120, 120, 128, 0.3)',
  },
});
