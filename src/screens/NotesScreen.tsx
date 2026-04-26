import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ArrowLeftIcon } from '../components/Icons';
import { Account } from '../types';

export const NotesScreen = ({ theme, account, onBack }: { theme: any, account: Account, onBack: () => void }) => {
  return (
    <View style={styles.flex1}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
          <ArrowLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {account.issuer || account.name}
        </Text>
        <View style={styles.iconButton} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {(!account.secureNotes || account.secureNotes.length === 0) ? (
          <Text style={{ color: theme.subText, marginTop: 24, textAlign: 'center' }}>No secure notes saved.</Text>
        ) : (
          account.secureNotes.map((note, index) => (
            <View
              key={index}
              style={[
                styles.noteCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  borderWidth: 1,
                  borderLeftColor: theme.accent,
                  borderLeftWidth: 4,
                },
              ]}
            >
              <Text style={[styles.noteText, { color: theme.text }]}>{note}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 70 },
  headerTitle: { fontSize: 20, fontWeight: '800', flex: 1, textAlign: 'center' },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
  content: { padding: 24 },
  noteCard: { padding: 18, borderRadius: 14, marginBottom: 14 },
  noteText: { fontSize: 15, lineHeight: 22 },
});
