import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LockIcon, ShieldIcon } from '../components/Icons';
import { AppLogo } from '../components/AppLogo';

export const OnboardingScreen = ({ theme, onComplete }: { theme: any, onComplete: () => void }) => {
  return (
    <View style={styles.onboardingContainer}>
      <View style={styles.onboardingContent}>
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <AppLogo size={52} withContainer containerBg="#D13347" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>SecureD</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Your time-based one-time passwords, generated entirely offline.
          </Text>
        </View>
        
        <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <View style={styles.featureTitleRow}>
            <LockIcon color={theme.accent} size={20} />
            <Text style={[styles.featureTitle, { color: theme.accent }]}>Fully Offline</Text>
          </View>
          <Text style={[styles.featureDesc, { color: theme.subText }]}>Tokens are calculated locally on your device.</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <View style={styles.featureTitleRow}>
            <ShieldIcon color={theme.accentSecondary} size={20} />
            <Text style={[styles.featureTitle, { color: theme.accentSecondary }]}>Encrypted Storage</Text>
          </View>
          <Text style={[styles.featureDesc, { color: theme.subText }]}>Your secrets and backup codes are stored securely.</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.accent }]} 
        onPress={onComplete}
      >
        <Text style={[styles.buttonText, { color: theme.white }]}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  onboardingContainer: { flex: 1, padding: 32, justifyContent: 'space-between' },
  onboardingContent: { flex: 1, justifyContent: 'center' },
  heroSection: { alignItems: 'center', marginBottom: 36 },
  logoWrapper: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center', paddingHorizontal: 12 },
  featureCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  featureTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureTitle: { fontSize: 17, fontWeight: '700', marginLeft: 8 },
  featureDesc: { fontSize: 14, lineHeight: 21 },
  button: { padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
