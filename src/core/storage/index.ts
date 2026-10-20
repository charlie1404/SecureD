import { NativeModules } from 'react-native';

const { StorageModule } = NativeModules;

const VAULT_FILE = 'secured_vault.json';

/**
 * VaultStorage manages the single encrypted JSON vault document on the device.
 * All accounts and metadata are unified into this single AES-256-GCM encrypted file.
 */
export class VaultStorage {
  static getVaultDocument(): string | null {
    try {
      return StorageModule.readFileSync(VAULT_FILE);
    } catch {
      return null;
    }
  }

  static async getVaultDocumentAsync(): Promise<string | null> {
    try {
      return await StorageModule.readFile(VAULT_FILE);
    } catch {
      return null;
    }
  }

  static saveVaultDocument(jsonData: string): void {
    StorageModule.writeFileSync(VAULT_FILE, jsonData);
  }

  static async saveVaultDocumentAsync(jsonData: string): Promise<boolean> {
    return await StorageModule.writeFile(VAULT_FILE, jsonData);
  }

  static deleteVaultDocument(): void {
    StorageModule.deleteFileSync(VAULT_FILE);
  }

  static hasVaultDocument(): boolean {
    return StorageModule.fileExistsSync(VAULT_FILE);
  }

  static clearAll(): void {
    StorageModule.deleteFileSync(VAULT_FILE);
  }
}
