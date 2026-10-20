import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LockIcon, ShieldIcon, CheckIcon, KeyIcon } from '../components/Icons';
import { AppLogo } from '../components/AppLogo';
import { useVault } from '../state';
import { ColorTheme, useAppTheme } from '../theme';

interface OnboardingScreenProps {
  theme?: ColorTheme;
  onComplete?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ theme: propTheme, onComplete }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const { enrollWithBiometrics, isLoading, error, clearError } = useVault();

  const handleEnroll = async () => {
    clearError();
    const success = await enrollWithBiometrics();
    if (success) {
      onComplete?.();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        <View style={styles.contentBetween}>
          {/* Header & Logo */}
          <View style={styles.topSection}>
            <View style={styles.logoWrapper}>
              <AppLogo size={58} withContainer containerBg="#D13347" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>SecureD</Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>
              Secure, offline two-factor authenticator protected by your device's biometric security.
            </Text>
          </View>

          {/* Feature Highlights */}
          <View style={styles.featuresSection}>
            <View
              style={[
                styles.featureCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
            >
              <View style={styles.featureTitleRow}>
                <LockIcon color={theme.accent} size={20} />
                <Text style={[styles.featureTitle, { color: theme.accent }]}>Local Hardware Encryption</Text>
              </View>
              <Text style={[styles.featureDesc, { color: theme.subText }]}>
                All 2FA tokens and secrets are AES-256 encrypted directly on your device.
              </Text>
            </View>

            <View
              style={[
                styles.featureCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
            >
              <View style={styles.featureTitleRow}>
                <ShieldIcon color={theme.accentSecondary} size={20} />
                <Text style={[styles.featureTitle, { color: theme.accentSecondary }]}>
                  Biometric & Screen Lock
                </Text>
              </View>
              <Text style={[styles.featureDesc, { color: theme.subText }]}>
                Unlock effortlessly with your fingerprint, face, or device PIN. No passwords to remember for daily use.
              </Text>
            </View>

            <View
              style={[
                styles.featureCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
            >
              <View style={styles.featureTitleRow}>
                <KeyIcon color={theme.accent} size={20} />
                <Text style={[styles.featureTitle, { color: theme.accent }]}>On-Demand Cloud Backup</Text>
              </View>
              <Text style={[styles.featureDesc, { color: theme.subText }]}>
                Opt-in to back up to Google Drive anytime with a temporary master password you choose.
              </Text>
            </View>
          </View>

          {/* Error display if user cancelled or failed */}
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: theme.danger + '18' }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            </View>
          ) : null}

          {/* Enrollment Action Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.accent }]}
              onPress={handleEnroll}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <View style={styles.btnRow}>
                  <CheckIcon color={theme.white} size={20} />
                  <Text style={[styles.buttonText, { color: theme.white, marginLeft: 8 }]}>
                    Enroll with Biometrics / Phone Lock
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28
  },
  contentBetween: {
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoWrapper: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  featuresSection: {
    marginVertical: 12,
  },
  featureCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D13347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
