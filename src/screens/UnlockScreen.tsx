import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { ShieldIcon, LockIcon } from '../components/Icons';
import { useVault } from '../state';
import { ColorTheme, useAppTheme } from '../theme';

export const UnlockScreen = ({ theme: propTheme }: { theme?: ColorTheme }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const { unlockWithBiometrics, isLoading, error } = useVault();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleUnlock = async () => {
    setIsAuthenticating(true);
    try {
      await unlockWithBiometrics();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const showLoader = isLoading || isAuthenticating;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <AppLogo size={68} withContainer containerBg="#D13347" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>SecureD</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Your encrypted 2FA vault is locked. Authenticate to decrypt and load your accounts into memory.
        </Text>

        {showLoader ? (
          <View
            style={[
              styles.loaderBox,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loaderTitle, { color: theme.text }]}>Decrypting Vault</Text>
            <Text style={[styles.loaderSub, { color: theme.subText }]}>
              Reading encrypted data into memory...
            </Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: theme.danger + '18' }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={handleUnlock}
              activeOpacity={0.85}
            >
              <View style={styles.btnContent}>
                <ShieldIcon color={theme.white} size={22} />
                <Text style={[styles.primaryBtnText, { color: theme.white }]}>
                  Unlock Vault
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.hintRow}>
          <LockIcon color={theme.subText} size={15} />
          <Text style={[styles.hintText, { color: theme.subText }]}>
            Protected by hardware-backed encryption
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#D13347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  loaderBox: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  loaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 4,
  },
  loaderSub: {
    fontSize: 13,
  },
  errorBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 13,
  },
});
