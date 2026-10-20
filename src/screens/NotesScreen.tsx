import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '../components/Icons';
import { useVault } from '../state';
import { useRouter } from '../router';
import { ColorTheme, useAppTheme } from '../theme';

export const NotesScreen = ({ theme: propTheme }: { theme?: ColorTheme }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const router = useRouter();
  const { accounts, selectedAccountId, removeAccount, updateAccount } = useVault();

  const [showAddModal, setShowAddModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const account = accounts.find((a) => a.id === selectedAccountId);

  if (!account) {
    return (
      <View style={[styles.flex1, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.subText }}>Account not found</Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.goBack()}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to remove "${account.issuer || account.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeAccount(account.id);
            router.goBack();
          },
        },
      ]
    );
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    try {
      setIsSaving(true);
      const updatedNotes = [...(account.secureNotes || []), noteText.trim()];
      await updateAccount({
        ...account,
        secureNotes: updatedNotes,
      });
      setIsSaving(false);
      setNoteText('');
      setShowAddModal(false);
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Save Failed', err?.message || 'Could not save note');
    }
  };

  const handleDeleteNote = (noteIndex: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this secure note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedNotes = (account.secureNotes || []).filter((_, idx) => idx !== noteIndex);
            await updateAccount({
              ...account,
              secureNotes: updatedNotes,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.flex1, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.goBack()} style={styles.iconButton}>
          <ArrowLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {account.issuer || account.name}
        </Text>
        <TouchableOpacity onPress={handleDeleteAccountPress} style={styles.deleteButton}>
          <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 13 }}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Details */}
        <View style={styles.detailsSection}>
          <Text style={[styles.sectionLabel, { color: theme.subText }]}>Account</Text>
          <Text style={[styles.accountTitle, { color: theme.text }]}>{account.name}</Text>
          {account.issuer ? (
            <Text style={[styles.accountIssuer, { color: theme.accent }]}>{account.issuer}</Text>
          ) : null}
        </View>

        {/* Secure Notes Section */}
        <Text style={[styles.sectionLabel, { color: theme.subText, marginTop: 20 }]}>Secure Notes</Text>
        {!account.secureNotes || account.secureNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              No secure notes saved for this account.
            </Text>
            <Text style={[styles.emptySubText, { color: theme.subText }]}>
              Tap the + button below to add a plain text note.
            </Text>
          </View>
        ) : (
          account.secureNotes.map((note, index) => (
            <View
              key={index}
              style={[
                styles.noteCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  borderLeftColor: theme.accent,
                },
              ]}
            >
              <View style={styles.noteCardHeader}>
                <Text style={[styles.noteIndexLabel, { color: theme.subText }]}>
                  Note #{index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteNote(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Delete note"
                >
                  <TrashIcon color={theme.danger} size={16} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.noteText, { color: theme.text }]} selectable>
                {note}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => {
          setNoteText('');
          setShowAddModal(true);
        }}
        activeOpacity={0.85}
        accessibilityLabel="Add secure note"
      >
        <PlusIcon color={theme.white} size={28} />
      </TouchableOpacity>

      {/* Add Plain Text Note Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Secure Note</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
              Notes are encrypted at rest with AES-256-GCM.
            </Text>

            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.cardBorder,
                  color: theme.text,
                },
              ]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Enter plain text note (UTF-8)..."
              placeholderTextColor={theme.subText}
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalSaveBtn,
                  { backgroundColor: theme.accent, opacity: noteText.trim() ? 1 : 0.6 },
                ]}
                disabled={!noteText.trim() || isSaving}
                onPress={handleSaveNote}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={theme.white} />
                ) : (
                  <Text style={{ color: theme.white, fontWeight: '700' }}>Save Note</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  detailsSection: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  accountTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  accountIssuer: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  noteCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteIndexLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  noteInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 120,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtn: {
    minWidth: 100,
  },
});
