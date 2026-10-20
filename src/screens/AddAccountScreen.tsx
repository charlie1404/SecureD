import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  BuildingIcon,
  UserIcon,
  KeyIcon,
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
} from '../components/Icons';
import { useVault } from '../state';
import { useRouter, useRoute } from '../router';
import { ColorTheme, useAppTheme } from '../theme';

export const AddAccountScreen = ({ theme: propTheme }: { theme?: ColorTheme }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const router = useRouter();
  const route = useRoute<{ name?: string; issuer?: string; seed?: string }>();
  const initialData = route.params;
  const { addAccount } = useVault();

  const [newName, setNewName] = useState(initialData?.name || '');
  const [newIssuer, setNewIssuer] = useState(initialData?.issuer || '');
  const [newSeed, setNewSeed] = useState(initialData?.seed || '');
  const [confirmSeed, setConfirmSeed] = useState(initialData?.seed || '');
  const [showSecret, setShowSecret] = useState(false);
  const [showConfirmSecret, setShowConfirmSecret] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!newName.trim()) {
      Alert.alert('Required Field', 'Please enter an account name.');
      return;
    }

    const cleanSeed = newSeed.replace(/\s+/g, '').toUpperCase();
    const cleanConfirm = confirmSeed.replace(/\s+/g, '').toUpperCase();

    if (!cleanSeed) {
      Alert.alert('Required Field', 'Please enter the secret key.');
      return;
    }

    if (!cleanConfirm) {
      Alert.alert('Required Field', 'Please confirm the secret key.');
      return;
    }

    if (cleanSeed !== cleanConfirm) {
      Alert.alert(
        'Secret Key Mismatch',
        'The secret key and confirmation do not match. Please verify and re-enter.'
      );
      return;
    }

    try {
      setIsSaving(true);
      await addAccount({
        name: newName.trim(),
        issuer: newIssuer.trim() || undefined,
        seed: cleanSeed,
        secureNotes: [],
      });
      setIsSaving(false);
      router.navigate('home');
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Save Failed', err?.message || 'Could not save account');
    }
  };

  const getInputStyle = (field: string) => [
    styles.input,
    {
      backgroundColor: theme.card,
      color: theme.text,
      borderColor: focusedField === field ? theme.accent : theme.cardBorder,
    },
  ];

  const getLabelColor = (field: string) =>
    focusedField === field ? theme.accent : theme.subText;

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.addForm} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.goBack()} style={styles.iconButton}>
            <ArrowLeftIcon color={theme.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Account</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.labelRow}>
          <UserIcon color={getLabelColor('name')} size={18} />
          <Text style={[styles.label, { color: getLabelColor('name') }]}>Account Name</Text>
        </View>
        <TextInput
          style={getInputStyle('name')}
          value={newName}
          onChangeText={setNewName}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          selectionColor={theme.accent}
          placeholder="e.g. Personal Email"
          placeholderTextColor={theme.subText}
        />

        <View style={styles.labelRow}>
          <BuildingIcon color={getLabelColor('issuer')} size={18} />
          <Text style={[styles.label, { color: getLabelColor('issuer') }]}>Issuer (Optional)</Text>
        </View>
        <TextInput
          style={getInputStyle('issuer')}
          value={newIssuer}
          onChangeText={setNewIssuer}
          onFocus={() => setFocusedField('issuer')}
          onBlur={() => setFocusedField(null)}
          selectionColor={theme.accent}
          placeholder="e.g. Google, GitHub, Amazon"
          placeholderTextColor={theme.subText}
        />

        <View style={styles.labelRowWithAction}>
          <View style={styles.labelRow}>
            <KeyIcon color={getLabelColor('seed')} size={18} />
            <Text style={[styles.label, { color: getLabelColor('seed') }]}>Secret Key</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowSecret((prev) => !prev)}
            style={styles.toggleVisibilityBtn}
          >
            {showSecret ? (
              <EyeOffIcon color={theme.subText} size={18} />
            ) : (
              <EyeIcon color={theme.subText} size={18} />
            )}
            <Text style={[styles.toggleVisibilityText, { color: theme.subText }]}>
              {showSecret ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          key={showSecret ? 'seed-plain' : 'seed-masked'}
          style={getInputStyle('seed')}
          value={newSeed}
          onChangeText={setNewSeed}
          onFocus={() => setFocusedField('seed')}
          onBlur={() => setFocusedField(null)}
          selectionColor={theme.accent}
          secureTextEntry={!showSecret}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="Enter secret key"
          placeholderTextColor={theme.subText}
        />

        <View style={styles.labelRowWithAction}>
          <View style={styles.labelRow}>
            <KeyIcon color={getLabelColor('confirmSeed')} size={18} />
            <Text style={[styles.label, { color: getLabelColor('confirmSeed') }]}>
              Confirm Secret Key
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowConfirmSecret((prev) => !prev)}
            style={styles.toggleVisibilityBtn}
          >
            {showConfirmSecret ? (
              <EyeOffIcon color={theme.subText} size={18} />
            ) : (
              <EyeIcon color={theme.subText} size={18} />
            )}
            <Text style={[styles.toggleVisibilityText, { color: theme.subText }]}>
              {showConfirmSecret ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          key={showConfirmSecret ? 'confirm-plain' : 'confirm-masked'}
          style={getInputStyle('confirmSeed')}
          value={confirmSeed}
          onChangeText={setConfirmSeed}
          onFocus={() => setFocusedField('confirmSeed')}
          onBlur={() => setFocusedField(null)}
          selectionColor={theme.accent}
          secureTextEntry={!showConfirmSecret}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="Re-enter secret key to confirm"
          placeholderTextColor={theme.subText}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.accent }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <View style={styles.btnRow}>
              <CheckIcon color={theme.white} size={20} />
              <Text style={[styles.saveButtonText, styles.btnTextMargin, { color: theme.white }]}>
                Save Account
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    padding: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 14,
  },
  labelRowWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 14,
  },
  toggleVisibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  toggleVisibilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1.5,
  },
  saveButton: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
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
  btnTextMargin: {
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
