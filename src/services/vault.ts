import { EncryptedPayload, NativeCrypto } from '../core/crypto';
import { VaultStorage } from '../core/storage';
import { KeyStore } from '../core/keystore';
import { Account } from '../types';
import { GoogleAccountInfo } from './googleDrive';

export interface EncryptedVaultDocument extends EncryptedPayload {
  version: number;
  cipher: 'aes-256-gcm';
  updatedAt: number;
}

export interface VaultMeta {
  googleAccount: GoogleAccountInfo;
  hasBackupPassword: boolean;
}

export interface DecryptedVaultData {
  accounts: Account[];
  meta: VaultMeta;
}

export const DEFAULT_VAULT_META: VaultMeta = {
  googleAccount: {
    isConnected: false,
    email: null,
    lastBackupTime: null,
    accessToken: null,
  },
  hasBackupPassword: false,
};

export interface BackupAccount {
  id: string; // serial or unique id
  iv: string; // random init vector of 12 bytes (24 hex characters)
  salt: string; // unique salt per account (32 hex characters)
  name: string; // display text for account
  issuer: string; // org or company for which account is created
  encrypted_totp_secret: string; // real totp secret (AES-GCM encrypted)
  notes: string[]; // array of encrypted text
}

export interface BackupPasswordTest {
  salt: string; // random salt (16 bytes hex)
  iterations: number; // 10000
  digest: 'SHA-256';
  keyLength: number; // 32
  iv: string; // 12 bytes hex
  testString: string; // verification ciphertext
}

export interface CloudBackupDocument {
  appName: string;
  formatVersion: number;
  cipher: 'aes-256-gcm';
  kdf: 'pbkdf2-sha256';
  iterations: number;
  backupTimestamp: number;
  lastSyncTimestamp: number;
  accountCount: number;
  backupPasswordTest: BackupPasswordTest;
  accounts: BackupAccount[];
}

export class VaultService {
  private static instance: VaultService;

  static getInstance(): VaultService {
    if (!this.instance) {
      this.instance = new VaultService();
    }
    return this.instance;
  }

  isInitialized(): boolean {
    return VaultStorage.hasVaultDocument();
  }

  hasExistingVaultOrData(): boolean {
    return this.isInitialized();
  }

  /**
   * Initializes the encrypted JSON vault with a random 256-bit local key.
   * Stores the key in hardware-backed KeyStore.
   */
  async initializeVault(providedKeyHex?: string): Promise<{ vaultKey: string; data: DecryptedVaultData }> {
    const vaultKeyHex = providedKeyHex || (await NativeCrypto.getRandomBytesHex(32));

    // Save key to hardware-backed KeyStore
    await KeyStore.saveVaultKey(vaultKeyHex);

    // Initialize the primary unified JSON vault document
    const initialData: DecryptedVaultData = {
      accounts: [],
      meta: DEFAULT_VAULT_META,
    };
    await this.saveVaultData(initialData.accounts, initialData.meta, vaultKeyHex);

    return { vaultKey: vaultKeyHex, data: initialData };
  }

  /**
   * Loads and decrypts both accounts and metadata from the single encrypted JSON vault document.
   */
  async loadVaultData(vaultKeyHex: string): Promise<DecryptedVaultData> {
    const docJson = await VaultStorage.getVaultDocumentAsync();
    if (!docJson) {
      return { accounts: [], meta: DEFAULT_VAULT_META };
    }

    try {
      const doc: EncryptedVaultDocument = JSON.parse(docJson);
      const decryptedString = await NativeCrypto.decrypt(doc, vaultKeyHex);
      const parsed = JSON.parse(decryptedString);

      // Support unified { accounts, meta } structure or legacy array
      if (Array.isArray(parsed)) {
        return { accounts: parsed, meta: DEFAULT_VAULT_META };
      }

      return {
        accounts: parsed.accounts || [],
        meta: {
          googleAccount: parsed.meta?.googleAccount || DEFAULT_VAULT_META.googleAccount,
          hasBackupPassword: Boolean(parsed.meta?.hasBackupPassword),
        },
      };
    } catch (err) {
      console.error('[VaultService] Failed to decrypt vault document:', err);
      throw new Error('Failed to decrypt vault with provided key');
    }
  }



  /**
   * Encrypts and writes both accounts and metadata to the single local JSON vault document.
   */
  async saveVaultData(
    accounts: Account[],
    meta: VaultMeta,
    vaultKeyHex: string
  ): Promise<void> {
    const payload: DecryptedVaultData = { accounts, meta };
    const payloadString = JSON.stringify(payload);
    const encrypted = await NativeCrypto.encrypt(payloadString, vaultKeyHex);

    const doc: EncryptedVaultDocument = {
      version: 2,
      cipher: 'aes-256-gcm',
      updatedAt: Date.now(),
      ...encrypted,
    };

    await VaultStorage.saveVaultDocumentAsync(JSON.stringify(doc));
  }

  /**
   * Adds an account, encrypts, and persists to local JSON vault document.
   */
  async addAccount(
    newAcc: Omit<Account, 'id'>,
    currentAccounts: Account[],
    meta: VaultMeta,
    vaultKeyHex: string
  ): Promise<{ created: Account; accounts: Account[] }> {
    const idHex = await NativeCrypto.getRandomBytesHex(8);
    const created: Account = {
      ...newAcc,
      id: idHex,
      createdAt: Date.now(),
    };
    const updated = [...currentAccounts, created];
    await this.saveVaultData(updated, meta, vaultKeyHex);
    return { created, accounts: updated };
  }

  /**
   * Updates an existing account, encrypts, and persists to local JSON vault document.
   */
  async updateAccount(
    updatedAcc: Account,
    currentAccounts: Account[],
    meta: VaultMeta,
    vaultKeyHex: string
  ): Promise<Account[]> {
    const updated = currentAccounts.map((a) => (a.id === updatedAcc.id ? updatedAcc : a));
    await this.saveVaultData(updated, meta, vaultKeyHex);
    return updated;
  }

  /**
   * Removes an account, encrypts, and persists to local JSON vault document.
   */
  async removeAccount(
    id: string,
    currentAccounts: Account[],
    meta: VaultMeta,
    vaultKeyHex: string
  ): Promise<Account[]> {
    const updated = currentAccounts.filter((a) => a.id !== id);
    await this.saveVaultData(updated, meta, vaultKeyHex);
    return updated;
  }

  // ==========================================
  // CLOUD BACKUP ENCRYPTION / RESTORE
  // (Generated on-the-fly in memory - Never stored to disk)
  // ==========================================

  /**
   * Generates an encrypted JSON backup payload for Cloud Upload ON THE FLY.
   */
  async exportCloudBackup(
    accounts: Account[],
    masterPassword: string
  ): Promise<CloudBackupDocument> {
    if (!masterPassword || masterPassword.length < 6) {
      throw new Error('Master password must be at least 6 characters');
    }

    const accountsToSync = accounts.filter((a) => !a.excludeFromSync);

    // 1. Generate Backup Password Test Verifier
    const testSalt = await NativeCrypto.getRandomBytesHex(16);
    const testKey = await NativeCrypto.pbkdf2(masterPassword, testSalt, 10000, 32);
    const testIv = await NativeCrypto.getRandomBytesHex(12);
    const testEncrypted = await NativeCrypto.encryptGcm('SECURED_BACKUP_VERIFIED', testKey, testIv);

    const backupPasswordTest: BackupPasswordTest = {
      salt: testSalt,
      iterations: 10000,
      digest: 'SHA-256',
      keyLength: 32,
      iv: testIv,
      testString: testEncrypted.ciphertext,
    };

    // 2. Encrypt accounts with per-account salt and 12-byte IV
    const backupAccounts: BackupAccount[] = [];
    for (const acc of accountsToSync) {
      const iv = await NativeCrypto.getRandomBytesHex(12);
      const salt = await NativeCrypto.getRandomBytesHex(16);
      const accountKey = await NativeCrypto.pbkdf2(masterPassword, salt, 10000, 32);

      const secretEncrypted = await NativeCrypto.encryptGcm(acc.seed, accountKey, iv);

      const encryptedNotes: string[] = [];
      if (acc.secureNotes && Array.isArray(acc.secureNotes)) {
        for (const note of acc.secureNotes) {
          if (note && note.trim()) {
            const noteEncrypted = await NativeCrypto.encryptGcm(note, accountKey, iv);
            encryptedNotes.push(noteEncrypted.ciphertext);
          }
        }
      }

      backupAccounts.push({
        id: acc.id,
        iv,
        salt,
        name: acc.name,
        issuer: acc.issuer || '',
        encrypted_totp_secret: secretEncrypted.ciphertext,
        notes: encryptedNotes,
      });
    }

    const now = Date.now();
    return {
      appName: 'SecureD',
      formatVersion: 2,
      cipher: 'aes-256-gcm',
      kdf: 'pbkdf2-sha256',
      iterations: 10000,
      backupTimestamp: now,
      lastSyncTimestamp: now,
      accountCount: backupAccounts.length,
      backupPasswordTest,
      accounts: backupAccounts,
    };
  }

  /**
   * Decrypts an Cloud Backup JSON document using the entered Master Password.
   */
  async importCloudBackup(
    backupDocOrString: string | CloudBackupDocument,
    masterPassword: string
  ): Promise<Account[]> {
    const doc: any =
      typeof backupDocOrString === 'string' ? JSON.parse(backupDocOrString) : backupDocOrString;

    if (!doc) {
      throw new Error('Invalid or empty backup file');
    }

    // 1. format verification
    if (doc.accounts && Array.isArray(doc.accounts)) {
      if (doc.backupPasswordTest) {
        try {
          const test = doc.backupPasswordTest;
          const testKey = await NativeCrypto.pbkdf2(
            masterPassword,
            test.salt,
            test.iterations || 10000,
            test.keyLength || 32
          );
          const decryptedCheck = await NativeCrypto.decryptGcm(test.testString, testKey, test.iv);
          if (decryptedCheck !== 'SECURED_BACKUP_VERIFIED') {
            throw new Error('Incorrect backup password');
          }
        } catch {
          throw new Error('Incorrect backup password');
        }
      }

      const restoredAccounts: Account[] = [];
      for (const rawAcc of doc.accounts) {
        try {
          const accountKey = await NativeCrypto.pbkdf2(
            masterPassword,
            rawAcc.salt,
            doc.iterations || 10000,
            32
          );

          const cipherSecret = rawAcc.encrypted_totp_secret;
          const seed = await NativeCrypto.decryptGcm(cipherSecret, accountKey, rawAcc.iv);

          const decryptedNotes: string[] = [];
          if (Array.isArray(rawAcc.notes)) {
            for (const encNote of rawAcc.notes) {
              try {
                const plainNote = await NativeCrypto.decryptGcm(encNote, accountKey, rawAcc.iv);
                decryptedNotes.push(plainNote);
              } catch {
                // Ignore corrupted individual note
              }
            }
          }

          restoredAccounts.push({
            id: rawAcc.id || (await NativeCrypto.getRandomBytesHex(8)),
            name: rawAcc.name,
            issuer: rawAcc.issuer || undefined,
            seed,
            secureNotes: decryptedNotes.length > 0 ? decryptedNotes : undefined,
            lastSyncedAt: Date.now(),
          });
        } catch (accErr: any) {
          console.warn('[VaultService] Failed to decrypt account:', rawAcc.name, accErr);
          throw new Error('Incorrect backup password or corrupted account secret');
        }
      }
      return restoredAccounts;
    }

    throw new Error('Unrecognized or corrupted backup file format');
  }
}

export const Vault = VaultService.getInstance();
