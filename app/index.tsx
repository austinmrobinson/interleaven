import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SplitPane } from '@/components/split-pane/SplitPane';
import { BibleReader } from '@/components/bible-reader/BibleReader';
import { NotesEditor } from '@/components/notes-editor/NotesEditor';
import { StatusBar } from 'expo-status-bar';
import { bookTheme } from '@/lib/theme/book-theme';

export default function MainScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <SplitPane
        topPane={<BibleReader />}
        bottomPane={<NotesEditor />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bookTheme.pageBackground,
  },
});
