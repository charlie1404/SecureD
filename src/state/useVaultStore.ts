import { create } from 'zustand';
import { Vault, VaultMeta, DEFAULT_VAULT_META } from '../services/vault';
import { KeyStore } from '../core/keystore';
import { GoogleDrive, GoogleAccountInfo } from '../services/googleDrive';
import { Account } from '../types';

export interface VaultStore {
  isInitialized: boolean;
  isLocked: boolean;
  isBiometricsEnrolled: boolean;
  accounts: Account[];
  selectedAccountId: string | null;
  vaultKey: string | null;
  isLoading: boolean;
  error: string | null;
  googleAccount: GoogleAccountInfo;
  hasBackupPassword: boolean;

  // Actions
  enrollWithBiometrics: () => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lockVault: () => void;
  addAccount: (newAcc: Omit<Account, 'id'>) => Promise<Account>;
  removeAccount: (id: string) => Promise<void>;
  updateAccount: (acc: Account) => Promise<void>;
  setSelectedAccountId: (id: string | null) => void;
  saveBackupPassword: (password: string) => Promise<boolean>;
  backupToGoogleDrive: (masterPassword?: string) => Promise<boolean>;
  restoreFromGoogleDrive: (masterPassword?: string) => Promise<{ success: boolean; count: number }>;
  connectGoogleAccount: (email: string, backupPassword?: string, accessToken?: string) => Promise<void>;
  disconnectGoogleAccount: () => Promise<void>;
  clearError: () => void;
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  isInitialized: Vault.isInitialized(),
  isLocked: Vault.hasExistingVaultOrData(),
  isBiometricsEnrolled: Vault.hasExistingVaultOrData(),
  accounts: [],
  selectedAccountId: null,
  vaultKey: null,
  isLoading: false,
  error: null,
  googleAccount: DEFAULT_VAULT_META.googleAccount,
  hasBackupPassword: false,

  enrollWithBiometrics: async (): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const authenticated = await KeyStore.authenticateBiometrics(
        'Enroll SecureD',
        'Authenticate with biometrics or screen lock to create your vault'
      );
      if (!authenticated) {
        set({ error: 'Biometric authentication cancelled', isLoading: false });
        return false;
      }

      const { vaultKey: newKey, data } = await Vault.initializeVault();
      set({
        vaultKey: newKey,
        accounts: data.accounts,
        googleAccount: data.meta.googleAccount,
        hasBackupPassword: data.meta.hasBackupPassword,
        isInitialized: true,
        isLocked: false,
        isBiometricsEnrolled: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to enroll biometrics', isLoading: false });
      return false;
    }
  },

  unlockWithBiometrics: async (): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const authenticated = await KeyStore.authenticateBiometrics(
        'Unlock SecureD',
        'Touch fingerprint sensor or use screen lock'
      );
      if (!authenticated) {
        set({ error: 'Authentication cancelled or failed', isLoading: false });
        return false;
      }

      let key = await KeyStore.getVaultKey();
      if (!key) {
        const res = await Vault.initializeVault();
        key = res.vaultKey;
      }

      const { accounts: loadedAccounts, meta } = await Vault.loadVaultData(key);
      set({
        vaultKey: key,
        accounts: loadedAccounts,
        googleAccount: meta.googleAccount,
        hasBackupPassword: meta.hasBackupPassword,
        isLocked: false,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to unlock vault', isLoading: false });
      return false;
    }
  },

  lockVault: () => {
    set({
      vaultKey: null,
      accounts: [],
      selectedAccountId: null,
      isLocked: true,
    });
  },

  addAccount: async (newAcc: Omit<Account, 'id'>): Promise<Account> => {
    const { vaultKey, accounts, googleAccount, hasBackupPassword } = get();
    if (!vaultKey) throw new Error('Vault is locked. Unlock to add account.');

    const meta: VaultMeta = { googleAccount, hasBackupPassword };
    const { created, accounts: updated } = await Vault.addAccount(newAcc, accounts, meta, vaultKey);
    set({ accounts: updated });
    return created;
  },

  removeAccount: async (id: string): Promise<void> => {
    const { vaultKey, accounts, selectedAccountId, googleAccount, hasBackupPassword } = get();
    if (!vaultKey) throw new Error('Vault is locked. Unlock to remove account.');

    const meta: VaultMeta = { googleAccount, hasBackupPassword };
    const updated = await Vault.removeAccount(id, accounts, meta, vaultKey);
    set({
      accounts: updated,
      selectedAccountId: selectedAccountId === id ? null : selectedAccountId,
    });
  },

  updateAccount: async (acc: Account): Promise<void> => {
    const { vaultKey, accounts, googleAccount, hasBackupPassword } = get();
    if (!vaultKey) throw new Error('Vault is locked. Unlock to update account.');

    const meta: VaultMeta = { googleAccount, hasBackupPassword };
    const updated = await Vault.updateAccount(acc, accounts, meta, vaultKey);
    set({ accounts: updated });
  },

  setSelectedAccountId: (id: string | null) => set({ selectedAccountId: id }),

  saveBackupPassword: async (password: string): Promise<boolean> => {
    const success = await KeyStore.saveBackupPassword(password);
    if (success) {
      const { accounts, vaultKey, googleAccount } = get();
      if (vaultKey) {
        await Vault.saveVaultData(accounts, { googleAccount, hasBackupPassword: true }, vaultKey);
      }
      set({ hasBackupPassword: true });
    }
    return success;
  },

  backupToGoogleDrive: async (customPassword?: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    const { accounts, vaultKey, googleAccount } = get();

    try {
      const password = customPassword || (await KeyStore.getBackupPassword());
      if (!password) {
        throw new Error('No backup password provided or saved in Android KeyStore.');
      }

      const now = Date.now();
      const updatedAccounts = accounts.map((a) =>
        a.excludeFromSync ? a : { ...a, lastSyncedAt: now }
      );

      // Generated 100% on the fly in memory, directly uploaded, never cached or saved to disk
      const backupDoc = await Vault.exportCloudBackup(updatedAccounts, password);
      const result = await GoogleDrive.uploadBackup(backupDoc, googleAccount.accessToken);

      if (customPassword) {
        await KeyStore.saveBackupPassword(customPassword);
      }

      const updatedGoogle: GoogleAccountInfo = {
        ...googleAccount,
        lastBackupTime: now,
      };

      if (vaultKey) {
        await Vault.saveVaultData(
          updatedAccounts,
          { googleAccount: updatedGoogle, hasBackupPassword: true },
          vaultKey
        );
      }

      set({
        accounts: updatedAccounts,
        googleAccount: updatedGoogle,
        hasBackupPassword: true,
        isLoading: false,
      });
      return result.success;
    } catch (err: any) {
      set({ error: err?.message || 'Backup to Google Drive failed', isLoading: false });
      return false;
    }
  },

  restoreFromGoogleDrive: async (
    customPassword?: string
  ): Promise<{ success: boolean; count: number }> => {
    set({ isLoading: true, error: null });
    const { accounts, vaultKey, googleAccount } = get();

    try {
      const password = customPassword || (await KeyStore.getBackupPassword());
      if (!password) {
        throw new Error('No backup password provided or saved in Android KeyStore.');
      }

      const backupDoc = await GoogleDrive.fetchLatestBackup(googleAccount.accessToken);
      if (!backupDoc) {
        throw new Error('No cloud backup found on Google Drive');
      }

      // Decrypted on the fly in memory
      const restoredAccounts = await Vault.importCloudBackup(backupDoc, password);
      const now = Date.now();
      const stampedRestored = restoredAccounts.map((a) => ({
        ...a,
        lastSyncedAt: a.lastSyncedAt || now,
      }));

      const currentSeeds = new Set(accounts.map((a) => a.seed));
      const newAccounts = stampedRestored.filter((a) => !currentSeeds.has(a.seed));
      const merged = [...accounts, ...newAccounts];

      if (customPassword) {
        await KeyStore.saveBackupPassword(customPassword);
      }

      const meta: VaultMeta = {
        googleAccount,
        hasBackupPassword: true,
      };

      if (vaultKey) {
        await Vault.saveVaultData(merged, meta, vaultKey);
      }

      set({ accounts: merged, hasBackupPassword: true, isLoading: false });
      return { success: true, count: newAccounts.length };
    } catch (err: any) {
      set({ error: err?.message || 'Failed to restore backup', isLoading: false });
      return { success: false, count: 0 };
    }
  },

  connectGoogleAccount: async (
    email: string,
    backupPassword?: string,
    accessToken?: string
  ): Promise<void> => {
    const { accounts, vaultKey, hasBackupPassword } = get();
    const updatedGoogle: GoogleAccountInfo = {
      isConnected: true,
      email,
      lastBackupTime: null,
      accessToken: accessToken || null,
    };
    let updatedHasBackup = hasBackupPassword;
    if (backupPassword) {
      await KeyStore.saveBackupPassword(backupPassword);
      updatedHasBackup = true;
    }

    if (vaultKey) {
      await Vault.saveVaultData(
        accounts,
        { googleAccount: updatedGoogle, hasBackupPassword: updatedHasBackup },
        vaultKey
      );
    }

    set({ googleAccount: updatedGoogle, hasBackupPassword: updatedHasBackup });
  },

  disconnectGoogleAccount: async (): Promise<void> => {
    const { accounts, vaultKey } = get();
    await KeyStore.removeBackupPassword();
    const updatedGoogle: GoogleAccountInfo = {
      isConnected: false,
      email: null,
      lastBackupTime: null,
      accessToken: null,
    };

    if (vaultKey) {
      await Vault.saveVaultData(
        accounts,
        { googleAccount: updatedGoogle, hasBackupPassword: false },
        vaultKey
      );
    }

    set({ googleAccount: updatedGoogle, hasBackupPassword: false });
  },

  clearError: () => set({ error: null }),
}));

// Convenience alias matching previous hook name for zero-friction migration
export const useVault = useVaultStore;
