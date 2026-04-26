import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { TokenCard } from '../components/TokenCard';
import { SearchIcon, SettingsIcon, CloseIcon, PlusIcon } from '../components/Icons';
import { Account, AccountWithTOTP, Screen } from '../types';
import { generateTOTP } from '../utils/totp';

export const HomeScreen = ({ theme, accounts, onNavigate, onAccountPress }: { theme: any, accounts: Account[], onNavigate: (screen: Screen) => void, onAccountPress: (id: string) => void }) => {
  const [activeTokens, setActiveTokens] = useState<AccountWithTOTP[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const tick = () => {
      const now = Date.now();
      const msRemaining = 30000 - (now % 30000);

      const updatedAccounts = accounts.map(account => {
        try {
          return { ...account, totp: generateTOTP(account.seed, now) };
        } catch {
          return { ...account, totp: 'Invalid' };
        }
      });
      setActiveTokens(updatedAccounts);

      timeout = setTimeout(tick, msRemaining);
    };

    tick();

    return () => clearTimeout(timeout);
  }, [accounts]);

  const filteredTokens = activeTokens.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.issuer && t.issuer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.flex1}>
      <View style={styles.header}>
        {isSearchExpanded ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  borderWidth: 1,
                },
              ]}
              autoFocus
              placeholder="Search accounts..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
              style={styles.iconButton}
            >
              <CloseIcon color={theme.text} size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity onPress={() => setIsSearchExpanded(true)} style={styles.iconButton}>
              <SearchIcon color={theme.text} size={24} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onNavigate('settings')} style={styles.iconButton}>
              <SettingsIcon color={theme.text} size={24} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={filteredTokens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => <TokenCard item={item} theme={theme} onPress={() => onAccountPress(item.id)} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>No accounts found.</Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => onNavigate('qr')}
        accessibilityLabel="Add account"
      >
        <PlusIcon color={theme.white || '#FFFFFF'} size={32} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 70 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
  searchContainer: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  searchInput: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, fontSize: 16, marginRight: 8 },
  listContainer: { padding: 16, paddingBottom: 100 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  fab: { position: 'absolute', bottom: 32, right: 32, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
});
