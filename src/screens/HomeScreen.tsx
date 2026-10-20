import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  StyleSheet,
  Animated,
  BackHandler,
} from 'react-native';
import { TokenCard } from '../components/TokenCard';
import {
  SearchIcon,
  SettingsIcon,
  CloseIcon,
  PlusIcon,
  QrCodeIcon,
  KeyIcon,
} from '../components/Icons';
import { AccountWithTOTP } from '../types';
import { generateBatchTOTP } from '../utils/totp';
import { useVault } from '../state';
import { useRouter } from '../router';
import { ColorTheme, useAppTheme } from '../theme';

export const HomeScreen = ({ theme: propTheme }: { theme?: ColorTheme }) => {
  const defaultTheme = useAppTheme();
  const theme = propTheme || defaultTheme;
  const router = useRouter();
  const { accounts, setSelectedAccountId } = useVault();

  const [activeTokens, setActiveTokens] = useState<AccountWithTOTP[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);

  const speedDialAnim = useRef(new Animated.Value(0)).current;

  // Handle speed-dial toggle with spring/timing
  const openSpeedDial = () => {
    setIsSpeedDialOpen(true);
    Animated.spring(speedDialAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 60,
    }).start();
  };

  const closeSpeedDial = useCallback((callback?: () => void) => {
    Animated.timing(speedDialAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsSpeedDialOpen(false);
      callback?.();
    });
  }, [speedDialAnim]);

  const toggleSpeedDial = () => {
    if (isSpeedDialOpen) {
      closeSpeedDial();
    } else {
      openSpeedDial();
    }
  };

  // Close speed dial on Android back button press
  useEffect(() => {
    if (!isSpeedDialOpen) return;
    const onBackPress = () => {
      closeSpeedDial();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isSpeedDialOpen, closeSpeedDial]);

  // Interpolations
  const fabRotation = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backdropOpacity = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  const actionsTranslateY = speedDialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const actionsOpacity = speedDialAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.7, 1],
  });

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const tick = () => {
      const now = Date.now();
      const msRemaining = 30000 - (now % 30000);

      const batchCodes = generateBatchTOTP(accounts, now);
      const updatedAccounts = accounts.map((account) => ({
        ...account,
        totp: batchCodes[account.id] || 'Invalid',
      }));
      setActiveTokens(updatedAccounts);

      timeout = setTimeout(tick, msRemaining);
    };

    tick();

    return () => clearTimeout(timeout);
  }, [accounts]);

  const filteredTokens = activeTokens.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.issuer && t.issuer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAccountPress = (id: string) => {
    setSelectedAccountId(id);
    router.navigate('notes');
  };

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
              onPress={() => {
                setIsSearchExpanded(false);
                setSearchQuery('');
              }}
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

            <TouchableOpacity onPress={() => router.navigate('settings')} style={styles.iconButton}>
              <SettingsIcon color={theme.text} size={24} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={filteredTokens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TokenCard item={item} theme={theme} onPress={() => handleAccountPress(item.id)} />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>No accounts found.</Text>
        }
      />

      {/* Dim Backdrop when Speed-Dial is open */}
      {isSpeedDialOpen && (
        <TouchableWithoutFeedback onPress={() => closeSpeedDial()}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#000000',
                opacity: backdropOpacity,
                zIndex: 10,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* FAB Speed-Dial Container */}
      <View style={[styles.speedDialContainer, { zIndex: isSpeedDialOpen ? 11 : 5 }]} pointerEvents="box-none">
        {isSpeedDialOpen && (
          <Animated.View
            style={[
              styles.actionsWrapper,
              {
                opacity: actionsOpacity,
                transform: [{ translateY: actionsTranslateY }],
              },
            ]}
            pointerEvents="box-none"
          >
            {/* Action 1: Scan a QR code */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                closeSpeedDial(() => router.navigate('qr'));
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.actionLabelContainer,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.actionLabel, { color: theme.text }]}>Scan a QR code</Text>
              </View>
              <View
                style={[
                  styles.miniFab,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <QrCodeIcon color={theme.accent} size={20} />
              </View>
            </TouchableOpacity>

            {/* Action 2: Enter a setup key */}
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                closeSpeedDial(() => router.navigate('add'));
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.actionLabelContainer,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.actionLabel, { color: theme.text }]}>Enter a setup key</Text>
              </View>
              <View
                style={[
                  styles.miniFab,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  },
                ]}
              >
                <KeyIcon color={theme.accent} size={20} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Main Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent }]}
          onPress={toggleSpeedDial}
          activeOpacity={0.85}
          accessibilityLabel="Add account"
        >
          <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
            <PlusIcon color={theme.white} size={30} />
          </Animated.View>
        </TouchableOpacity>
      </View>
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
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  searchContainer: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
  },
  listContainer: { padding: 16, paddingBottom: 100 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  speedDialContainer: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    alignItems: 'flex-end',
  },
  actionsWrapper: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    justifyContent: 'flex-end',
  },
  actionLabelContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  miniFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fab: {
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
});
