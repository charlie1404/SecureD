import React from 'react';
import { StatusBar, useColorScheme, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Theme } from './src/theme';
import { AppNavigator } from './src/router';

export default function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? Theme.dark : Theme.light;

  return (
    <SafeAreaProvider>
      <View style={[styles.flex1, { backgroundColor: theme.background }]}>
        <SafeAreaView style={[styles.flex1, { backgroundColor: theme.background }]}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={theme.background}
          />
          <NavigationContainer>
            <AppNavigator theme={theme} />
          </NavigationContainer>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});
