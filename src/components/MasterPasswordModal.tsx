import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LockIcon, CloseIcon } from './Icons';
import { ColorTheme } from '../theme';

interface MasterPasswordModalProps {
  visible: boolean;
  theme: ColorTheme;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<void> | void;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  visible,
  theme,
  title = 'Master Password Required',
  description = 'Enter your master password to update the master list. Your master copy is encrypted with this password and it is never stored on device.',
  onCancel,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setPassword('');
    setError(null);
    setIsSubmitting(false);
    onCancel();
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Please enter your master password');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(password);
      setPassword('');
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err?.message || 'Incorrect master password');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSurface }]}>
              <LockIcon color={theme.accent} size={22} />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <CloseIcon color={theme.subText} size={20} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.subText }]}>{description}</Text>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.danger + '18' }]}>
              <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: error ? theme.danger : theme.cardBorder,
              },
            ]}
            secureTextEntry
            autoFocus
            placeholder="Master Password"
            placeholderTextColor={theme.subText}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            selectionColor={theme.accent}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { borderColor: theme.cardBorder }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: theme.accent }]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.white} size="small" />
              ) : (
                <Text style={[styles.btnText, { color: theme.white }]}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

