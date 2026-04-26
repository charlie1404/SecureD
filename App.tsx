import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from './src/theme';
import { Screen, Account } from './src/types';

import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddAccountScreen } from './src/screens/AddAccountScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { initDB, getAccounts, addAccountToDB } from './src/utils/db';

export default function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? Theme.dark : Theme.light;
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    initDB();
    return getAccounts();
  });

  const [navStack, setNavStack] = useState<Screen[]>(() => {
    return accounts.length > 0 ? ['home'] : ['onboarding'];
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<{name: string, issuer: string, seed: string} | undefined>(undefined);

  const currentScreen = navStack[navStack.length - 1];

  const navigate = (screen: Screen) => setNavStack(prev => [...prev, screen]);
  
  const goBack = () => {
    setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const replace = (screen: Screen) => setNavStack([screen]); 

  useEffect(() => {
    const onBackPress = () => {
      if (navStack.length > 1) {
        goBack();
        return true;
      }
      return false; // Exit app if on the root screen
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navStack]);

  const handleAddAccount = (newAcc: Omit<Account, 'id'>) => {
    const finalAccount = { ...newAcc, id: String(Date.now()) };
    addAccountToDB(finalAccount);
    setAccounts([...accounts, finalAccount]);
    replace('home');
  };

  const handleAccountPress = (id: string) => {
    setSelectedAccountId(id);
    navigate('notes');
  };

  const handleQRScanned = (uri: string) => {
    const withoutPrefix = uri.replace('otpauth://totp/', '');
    const [labelPart, queryPart] = withoutPrefix.split('?');
    
    const decodedLabel = decodeURIComponent(labelPart);
    let issuer = '';
    let name = decodedLabel;
    if (decodedLabel.includes(':')) {
      const parts = decodedLabel.split(':');
      issuer = parts[0].trim();
      name = parts[1].trim();
    }
  
    const queryParams = (queryPart || '').split('&');
    let seed = '';
    for (const param of queryParams) {
      if (param.startsWith('secret=')) seed = param.replace('secret=', '');
      if (param.startsWith('issuer=') && !issuer) issuer = decodeURIComponent(param.replace('issuer=', ''));
    }

    setScannedData({ name, issuer, seed });
    navigate('add');
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        {currentScreen === 'onboarding' && <OnboardingScreen theme={theme} onComplete={() => replace('home')} />}
        {currentScreen === 'home' && <HomeScreen theme={theme} accounts={accounts} onNavigate={(screen) => { setScannedData(undefined); navigate(screen); }} onAccountPress={handleAccountPress} />}
        {currentScreen === 'qr' && <QRScannerScreen theme={theme} onCancel={goBack} onManualEntry={() => { setScannedData(undefined); navigate('add'); }} onScanned={handleQRScanned} />}
        {currentScreen === 'add' && <AddAccountScreen theme={theme} initialData={scannedData} onSave={handleAddAccount} onCancel={goBack} />}
        {currentScreen === 'settings' && <SettingsScreen theme={theme} onBack={goBack} />}
        {currentScreen === 'notes' && selectedAccount && <NotesScreen theme={theme} account={selectedAccount} onBack={goBack} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});
