import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, StyleSheet } from 'react-native';
import { BuildingIcon, UserIcon, KeyIcon, ArrowLeftIcon } from '../components/Icons';
import { Account } from '../types';

export const AddAccountScreen = ({
  theme, onSave, onCancel, initialData
}: {
  theme: any,
  onSave: (acc: Omit<Account, 'id'>) => void,
  onCancel: () => void,
  initialData?: { name: string, issuer: string, seed: string }
}) => {
  const [newName, setNewName] = useState(initialData?.name || '');
  const [newIssuer, setNewIssuer] = useState(initialData?.issuer || '');
  const [newSeed, setNewSeed] = useState(initialData?.seed || '');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSave = () => {
    if (!newName || !newSeed) return;
    onSave({
      name: newName,
      issuer: newIssuer || undefined,
      seed: newSeed.replace(/\s+/g, '').toUpperCase(),
      secureNotes: []
    });
  };

  const getInputStyle = (field: string) => [
    styles.input,
    { 
      backgroundColor: theme.card, 
      color: theme.text,
      borderColor: focusedField === field ? theme.accent : theme.cardBorder,
      borderWidth: 1.5,
    }
  ];

  const getLabelColor = (field: string) => focusedField === field ? theme.accent : theme.subText;

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.addForm}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.iconButton}>
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
          placeholder="e.g. Google, GitHub"
          placeholderTextColor={theme.subText}
        />

        <View style={styles.labelRow}>
          <KeyIcon color={getLabelColor('seed')} size={18} />
          <Text style={[styles.label, { color: getLabelColor('seed') }]}>Secret Key (Base32)</Text>
        </View>
        <TextInput
          style={getInputStyle('seed')}
          value={newSeed}
          onChangeText={setNewSeed}
          autoCapitalize="characters"
          onFocus={() => setFocusedField('seed')}
          onBlur={() => setFocusedField(null)}
          selectionColor={theme.accent}
          placeholder="e.g. JBSWY3DPEHPK3PXP"
          placeholderTextColor={theme.subText}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.card, flex: 1, marginRight: 8, borderWidth: 1, borderColor: theme.cardBorder }]}
            onPress={onCancel}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.accent, flex: 1, marginLeft: 8 }]}
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, { color: theme.white || '#FFFFFF' }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  addForm: { padding: 24, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, marginLeft: -12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20 },
  label: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  input: { borderRadius: 14, padding: 16, fontSize: 16 },
  buttonRow: { flexDirection: 'row', marginTop: 40 },
  actionBtn: { padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
