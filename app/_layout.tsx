import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BibleProvider } from '@/contexts/BibleContext';
import { SelectionProvider } from '@/contexts/SelectionContext';
import { NoteInsertProvider } from '@/contexts/NoteInsertContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <BibleProvider>
          <SelectionProvider>
            <NoteInsertProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
              </Stack>
            </NoteInsertProvider>
          </SelectionProvider>
        </BibleProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
