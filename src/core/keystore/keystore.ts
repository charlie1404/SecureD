import { VaultStorage } from '../storage';
import { Biometrics, BiometricAvailability } from './biometrics';

const HARDWARE_VAULT_KEY_ALIAS = 'secured_vault_key';
const BACKUP_PASSWORD_ALIAS = 'secured_cloud_backup_password';

export interface IKeyStoreService {
  checkBiometrics(): Promise<BiometricAvailability>;
  authenticateBiometrics(title?: string, subtitle?: string): Promise<boolean>;
  saveVaultKey(vaultKeyHex: string): Promise<boolean>;
  getVaultKey(): Promise<string | null>;
  removeVaultKey(): Promise<void>;
  hasVaultKey(): boolean;
  saveBackupPassword(password: string): Promise<boolean>;
  getBackupPassword(): Promise<string | null>;
  removeBackupPassword(): Promise<void>;
}

export class SecureKeyStoreService implements IKeyStoreService {
  private static instance: SecureKeyStoreService;

  static getInstance(): SecureKeyStoreService {
    if (!this.instance) {
      this.instance = new SecureKeyStoreService();
    }
    return this.instance;
  }

  async checkBiometrics(): Promise<BiometricAvailability> {
    return await Biometrics.isAvailable();
  }

  async authenticateBiometrics(
    title: string = 'Unlock SecureD',
    subtitle: string = 'Touch fingerprint sensor or use screen lock'
  ): Promise<boolean> {
    const result = await Biometrics.authenticate({ title, subtitle });
    return result.success;
  }

  async saveVaultKey(vaultKeyHex: string): Promise<boolean> {
    return await Biometrics.storeHardwareSecret(HARDWARE_VAULT_KEY_ALIAS, vaultKeyHex);
  }

  async getVaultKey(): Promise<string | null> {
    return await Biometrics.getHardwareSecret(HARDWARE_VAULT_KEY_ALIAS);
  }

  async removeVaultKey(): Promise<void> {
    await Biometrics.deleteHardwareSecret(HARDWARE_VAULT_KEY_ALIAS);
  }

  hasVaultKey(): boolean {
    return VaultStorage.hasVaultDocument();
  }

  async saveBackupPassword(password: string): Promise<boolean> {
    return await Biometrics.storeHardwareSecret(BACKUP_PASSWORD_ALIAS, password);
  }

  async getBackupPassword(): Promise<string | null> {
    return await Biometrics.getHardwareSecret(BACKUP_PASSWORD_ALIAS);
  }

  async removeBackupPassword(): Promise<void> {
    await Biometrics.deleteHardwareSecret(BACKUP_PASSWORD_ALIAS);
  }
}

export const KeyStore = SecureKeyStoreService.getInstance();
