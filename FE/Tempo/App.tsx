/**
 * Tempo Music Application Root
 * Strictly follows STANDARDS.md
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { AppNavigator } from './src/navigation/AppNavigator';

WebBrowser.maybeCompleteAuthSession();
import { MiniPlayer } from './src/components/MiniPlayer';
import { PlayerModalScreen } from './src/screens/PlayerModalScreen';
import { SleepTimerModal } from './src/components/SleepTimerModal';
import { Toast } from './src/components/Toast';
import { SplashScreen } from './src/components/SplashScreen';
import { audioEngine } from './src/services/audioPlayer';
import { useConnectStore } from './src/store/connectStore';
import { useSleepTimerStore } from './src/store/sleepTimerStore';
import { COLORS } from './src/constants/theme';

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    // Initialize background audio session, realtime connect, and sleep timer immediately
    audioEngine.init();
    useConnectStore.getState().initConnect();
    useSleepTimerStore.getState().init();
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" />
      <AppNavigator />
      <MiniPlayer />
      <PlayerModalScreen />
      <SleepTimerModal />
      <Toast />
      {!isSplashDone && (
        <SplashScreen onFinish={() => setIsSplashDone(true)} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
});
