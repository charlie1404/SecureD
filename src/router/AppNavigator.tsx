import React, { useEffect, useRef } from 'react';
import { NativeModules } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useVaultStore } from '../state/useVaultStore';
import { HomeScreen } from '../screens/HomeScreen';
import { AddAccountScreen } from '../screens/AddAccountScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { QRScannerScreen } from '../screens/QRScannerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { ColorTheme, useAppTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = ({ theme: propTheme }: { theme?: ColorTheme }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const isInitialized = useVaultStore((s) => s.isInitialized);
  const isLocked = useVaultStore((s) => s.isLocked);
  const hasDismissedSplash = useRef(false);

  // Signal native splash dismissal once data is in memory and initial screen is ready
  useEffect(() => {
    if (!hasDismissedSplash.current) {
      hasDismissedSplash.current = true;
      NativeModules.SplashModule.hide();
    }
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      {isLocked ? (
        <Stack.Screen name="unlock" component={UnlockScreen} />
      ) : !isInitialized ? (
        <Stack.Screen name="onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="home" component={HomeScreen} />
          <Stack.Screen name="add" component={AddAccountScreen} />
          <Stack.Screen name="qr" component={QRScannerScreen} />
          <Stack.Screen name="notes" component={NotesScreen} />
          <Stack.Screen name="settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
