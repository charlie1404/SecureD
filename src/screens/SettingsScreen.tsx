import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { ArrowLeftIcon } from '../components/Icons';
import { AppLogo } from '../components/AppLogo';

export const SettingsScreen = ({ theme, onBack }: { theme: any, onBack: () => void }) => {
  return (
    <View style={styles.flex1}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <ArrowLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.iconButton} />
      </View>
      
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>Security</Text>
        
        <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>App PIN</Text>
            <Text style={[styles.settingDesc, { color: theme.subText }]}>Require a PIN to open the app</Text>
          </View>
          <Switch value={false} trackColor={{ false: theme.background, true: theme.accent }} thumbColor={theme.white} />
        </View>

        <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Biometric Unlock</Text>
            <Text style={[styles.settingDesc, { color: theme.subText }]}>Use fingerprint or face ID</Text>
          </View>
          <Switch value={false} trackColor={{ false: theme.background, true: theme.accent }} thumbColor={theme.white} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.accent, marginTop: 32 }]}>About</Text>
        <View style={[styles.aboutCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <AppLogo size={36} withContainer containerBg="#D13347" />
          <View style={styles.aboutInfo}>
            <Text style={[styles.aboutName, { color: theme.text }]}>SecureD Authenticator</Text>
            <Text style={[styles.aboutMeta, { color: theme.subText }]}>Version 1.0.0 • Fully Offline</Text>
            <Text style={[styles.aboutDesc, { color: theme.subText }]}>Zero trackers. End-to-end encrypted local storage.</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 70 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
  container: { padding: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 16, marginBottom: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDesc: { fontSize: 14 },
  aboutCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, gap: 16 },
  aboutInfo: { flex: 1 },
  aboutName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  aboutMeta: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  aboutDesc: { fontSize: 12, lineHeight: 16 },
});
