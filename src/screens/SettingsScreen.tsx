import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeftIcon,
  CheckIcon,
  CloseIcon,
  CloudIcon,
  LockIcon,
} from '../components/Icons';
import { AppLogo } from '../components/AppLogo';
import { MasterPasswordModal } from '../components/MasterPasswordModal';
import { getAppVersionInfo } from '../utils/appInfo';
import { useVault } from '../state';
import { useRouter } from '../router';
import { ColorTheme, useAppTheme } from '../theme';

export const SettingsScreen = ({ theme: propTheme }: { theme?: ColorTheme }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const router = useRouter();
  const {
    googleAccount,
    hasBackupPassword,
    saveBackupPassword,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    connectGoogleAccount,
    disconnectGoogleAccount,
    isLoading,
  } = useVault();

  const appInfo = getAppVersionInfo();

  // Modals state
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');

  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');

  const [restoreModalVisible, setRestoreModalVisible] = useState<boolean>(false);

  // Step 1: Connect Google Account (email only, disconnected from backup password)
  const handleConnectSubmit = async () => {
    const email = googleEmailInput.trim();
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid Google email address.');
      return;
    }

    await connectGoogleAccount(email);
    setShowConnectModal(false);
    setGoogleEmailInput('');

    Alert.alert(
      'Account Connected',
      'Google Account connected. Please set up your backup password next to enable encrypted cloud backups.'
    );
  };

  // Disconnect Google Account & clean up KeyStore backup password
  const handleDisconnectPress = () => {
    Alert.alert(
      'Disconnect Google Account',
      'Are you sure you want to disconnect? Your backup password will be removed from this device\'s KeyStore.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnectGoogleAccount();
            Alert.alert(
              'Disconnected',
              'Google Account disconnected and local backup password removed.'
            );
          },
        },
      ]
    );
  };

  // Step 2: Set or Change Backup Password (stored in hardware KeyStore)
  const handleSavePasswordSubmit = async () => {
    if (passwordInput.length < 6) {
      Alert.alert('Password Too Short', 'Backup password must be at least 6 characters.');
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      Alert.alert('Password Mismatch', 'The passwords do not match. Please re-enter.');
      return;
    }

    await saveBackupPassword(passwordInput);

    if (isChangingPassword) {
      // Re-encrypt and sync backup with new password
      await backupToGoogleDrive(passwordInput);
    }

    setShowPasswordModal(false);
    setPasswordInput('');
    setConfirmPasswordInput('');

    Alert.alert(
      isChangingPassword ? 'Password Updated' : 'Password Saved',
      isChangingPassword
        ? 'Your backup password was updated in Android KeyStore and cloud backup re-encrypted.'
        : 'Your backup password was securely saved in Android KeyStore. Cloud backup & restore are now ready to use.'
    );
  };

  // Step 3: Cloud Backup & Restore Actions
  const handleBackupPress = async () => {
    if (!googleAccount.isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!hasBackupPassword) {
      setIsChangingPassword(false);
      setShowPasswordModal(true);
      return;
    }

    const success = await backupToGoogleDrive();
    if (success) {
      Alert.alert(
        'Cloud Backup Created',
        'Your accounts were encrypted with AES-256-GCM and backed up to Google Drive using your KeyStore-saved backup password.'
      );
    }
  };

  const handleRestorePress = () => {
    if (!googleAccount.isConnected) {
      setShowConnectModal(true);
      return;
    }

    if (!hasBackupPassword) {
      setIsChangingPassword(false);
      setShowPasswordModal(true);
      return;
    }

    Alert.alert(
      'Restore Cloud Backup',
      'Restore your 2FA accounts using your KeyStore-saved backup password?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Different Password',
          onPress: () => setRestoreModalVisible(true),
        },
        {
          text: 'Restore Now',
          onPress: async () => {
            const result = await restoreFromGoogleDrive();
            if (result.success) {
              Alert.alert(
                'Vault Restored',
                `Successfully restored ${result.count} account(s) from your Google Drive backup!`
              );
            }
          },
        },
      ]
    );
  };

  const handleRestoreConfirm = async (customPassword: string) => {
    const result = await restoreFromGoogleDrive(customPassword);
    setRestoreModalVisible(false);
    if (result.success) {
      Alert.alert(
        'Vault Restored',
        `Successfully restored ${result.count} account(s) from your Google Drive backup!`
      );
    }
  };

  const formatBackupDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={styles.flex1}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.goBack()} style={styles.iconButton}>
          <ArrowLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Google Drive Cloud Backup & Restore */}
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>
          Google Drive Backup & Restore
        </Text>

        <View
          style={[
            styles.cardBox,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          {/* STEP 1: Google Account Connection */}
          <View style={styles.stepHeaderRow}>
            <View style={[styles.stepBadge, { backgroundColor: theme.accentSurface }]}>
              <Text style={[styles.stepBadgeText, { color: theme.accent }]}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.cardSubtitle, { color: theme.subText }]}>Google Account</Text>
              <Text style={[styles.cardValue, { color: theme.text }]} numberOfLines={1}>
                {googleAccount.isConnected && googleAccount.email
                  ? googleAccount.email
                  : 'Not Connected'}
              </Text>
            </View>

            {googleAccount.isConnected ? (
              <TouchableOpacity onPress={handleDisconnectPress} style={styles.disconnectBtn}>
                <Text style={[styles.disconnectBtnText, { color: theme.danger }]}>
                  Disconnect
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowConnectModal(true)}
                style={[styles.smallBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={[styles.smallBtnText, { color: theme.white }]}>
                  Connect
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!googleAccount.isConnected && (
            <View
              style={[
                styles.promptBox,
                { backgroundColor: theme.background, borderColor: theme.cardBorder },
              ]}
            >
              <CloudIcon color={theme.subText} size={16} />
              <Text style={[styles.promptText, { color: theme.subText }]}>
                Connect your Google account to enable hardware-encrypted cloud backup and multi-device sync.
              </Text>
            </View>
          )}

          {/* STEP 2: Backup Password (Only available after Google Connect) */}
          {googleAccount.isConnected && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

              <View style={styles.stepHeaderRow}>
                <View style={[styles.stepBadge, { backgroundColor: theme.accentSurface }]}>
                  <Text style={[styles.stepBadgeText, { color: theme.accent }]}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.cardSubtitle, { color: theme.subText }]}>Backup Password</Text>
                  <View style={styles.statusRow}>
                    <LockIcon color={hasBackupPassword ? theme.success : theme.warning} size={14} />
                    <Text
                      style={[
                        styles.statusText,
                        { color: hasBackupPassword ? theme.success : theme.warning },
                      ]}
                    >
                      {hasBackupPassword ? 'Stored in KeyStore' : 'Not Set'}
                    </Text>
                  </View>
                </View>

                {hasBackupPassword ? (
                  <TouchableOpacity
                    onPress={() => {
                      setIsChangingPassword(true);
                      setShowPasswordModal(true);
                    }}
                    style={[styles.smallOutlineBtn, { borderColor: theme.cardBorder }]}
                  >
                    <Text style={[styles.smallOutlineBtnText, { color: theme.text }]}>
                      Change
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setIsChangingPassword(false);
                      setShowPasswordModal(true);
                    }}
                    style={[styles.smallBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={[styles.smallBtnText, { color: theme.white }]}>
                      Set Password
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {!hasBackupPassword && (
                <View
                  style={[
                    styles.promptBox,
                    { backgroundColor: theme.background, borderColor: theme.cardBorder },
                  ]}
                >
                  <LockIcon color={theme.warning} size={16} />
                  <Text style={[styles.promptText, { color: theme.subText }]}>
                    Set a backup password to encrypt your 2FA accounts with AES-256-GCM. It will be stored in your device's Android KeyStore.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* STEP 3: Backup & Restore Actions (Only available after backup password is set) */}
          {googleAccount.isConnected && hasBackupPassword && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

              <View style={styles.stepHeaderRow}>
                <View style={[styles.stepBadge, { backgroundColor: theme.accentSurface }]}>
                  <Text style={[styles.stepBadgeText, { color: theme.accent }]}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.cardSubtitle, { color: theme.subText }]}>Cloud Sync</Text>
                  <Text style={[styles.lastSyncText, { color: theme.text }]}>
                    Last Cloud Backup: {formatBackupDate(googleAccount.lastBackupTime)}
                  </Text>
                </View>
              </View>

              {/* On-demand Backup & Restore action buttons */}
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                  onPress={handleBackupPress}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={theme.white} size="small" />
                  ) : (
                    <>
                      <CloudIcon color={theme.white} size={16} />
                      <Text style={[styles.actionBtnText, styles.btnIconSpacing, { color: theme.white }]}>
                        Back Up Now
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.restoreBtnOutline,
                    { backgroundColor: theme.background, borderColor: theme.cardBorder },
                  ]}
                  onPress={handleRestorePress}
                  disabled={isLoading}
                >
                  <CheckIcon color={theme.text} size={16} />
                  <Text style={[styles.actionBtnText, styles.btnIconSpacing, { color: theme.text }]}>
                    Restore Backup
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.noteBox}>
                <CloudIcon color={theme.subText} size={14} style={styles.noteIcon} />
                <Text style={[styles.cloudNote, { color: theme.subText }]}>
                  Accounts are encrypted individually with AES-256-GCM.
                  Your backup password is saved in your device's hardware Android KeyStore.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* About App Card */}
        <Text style={[styles.sectionTitle, styles.aboutSectionSpacing, { color: theme.accent }]}>About</Text>
        <View
          style={[
            styles.aboutCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <AppLogo size={36} withContainer containerBg="#D13347" />
          <View style={styles.aboutInfo}>
            <Text style={[styles.aboutName, { color: theme.text }]}>SecureD Authenticator</Text>
            <Text style={[styles.aboutMeta, { color: theme.subText }]}>
              Version {appInfo.versionName} (Build {appInfo.versionCode})
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Connect Google Account Modal (Email Only) */}
      <Modal
        visible={showConnectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Connect Google Account</Text>
              <TouchableOpacity onPress={() => setShowConnectModal(false)}>
                <CloseIcon color={theme.subText} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDesc, { color: theme.subText }]}>
              Enter your Google email to link your Google Drive for encrypted cloud backups.
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Google Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.cardBorder,
                },
              ]}
              autoFocus
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="user@gmail.com"
              placeholderTextColor={theme.subText}
              value={googleEmailInput}
              onChangeText={setGoogleEmailInput}
              selectionColor={theme.accent}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnBorder, { borderColor: theme.cardBorder }]}
                onPress={() => setShowConnectModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                onPress={handleConnectSubmit}
              >
                <Text style={[styles.modalBtnText, { color: theme.white }]}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set / Change Backup Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPasswordInput('');
          setConfirmPasswordInput('');
        }}
      >
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isChangingPassword ? 'Change Backup Password' : 'Set Backup Password'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setConfirmPasswordInput('');
                }}
              >
                <CloseIcon color={theme.subText} size={20} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDesc, { color: theme.subText }]}>
              {isChangingPassword
                ? 'Enter a new backup password. Your accounts will be re-encrypted and saved in your device\'s hardware Android KeyStore.'
                : 'Set a password to encrypt your accounts before backing up to Google Drive. It will be stored in your device\'s hardware Android KeyStore.'}
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>
              {isChangingPassword ? 'New Backup Password (min 6 chars)' : 'Backup Password (min 6 chars)'}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.cardBorder,
                },
              ]}
              autoFocus
              secureTextEntry
              autoCapitalize="none"
              placeholder="Enter password"
              placeholderTextColor={theme.subText}
              value={passwordInput}
              onChangeText={setPasswordInput}
              selectionColor={theme.accent}
            />

            <Text style={[styles.fieldLabel, { color: theme.subText }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.cardBorder,
                },
              ]}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Confirm password"
              placeholderTextColor={theme.subText}
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              selectionColor={theme.accent}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnBorder, { borderColor: theme.cardBorder }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setConfirmPasswordInput('');
                }}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                onPress={handleSavePasswordSubmit}
              >
                <Text style={[styles.modalBtnText, { color: theme.white }]}>
                  {isChangingPassword ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Restore Master Password Modal for different password */}
      <MasterPasswordModal
        visible={restoreModalVisible}
        theme={theme}
        title="Decrypt Cloud Backup"
        description="Enter the Backup Password that was used to encrypt this Google Drive backup."
        onCancel={() => setRestoreModalVisible(false)}
        onConfirm={handleRestoreConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  container: { padding: 24, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 14,
    letterSpacing: 1,
  },
  aboutSectionSpacing: {
    marginTop: 16,
  },
  cardBox: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
    marginLeft: 10,
  },
  cardSubtitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  cardValue: { fontSize: 16, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  lastSyncText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  smallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  smallOutlineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallOutlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  disconnectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  disconnectBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  promptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtnOutline: {
    borderWidth: 1,
  },
  btnIconSpacing: {
    marginLeft: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  noteIcon: {
    marginTop: 2,
  },
  cloudNote: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  aboutInfo: { flex: 1 },
  aboutName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  aboutMeta: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalDesc: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnBorder: {
    borderWidth: 1,
  },
  modalBtnText: {
    fontWeight: '700',
  },
});
