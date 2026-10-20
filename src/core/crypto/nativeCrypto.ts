import { NativeModules } from 'react-native';

const { CryptoModule } = NativeModules;

export interface EncryptedPayload {
  iv: string; // 12-byte IV (24 hex characters) for AES-256-GCM
  ciphertext: string; // AES-256-GCM ciphertext + 128-bit authentication tag
}

export class NativeCryptoService {
  private static instance: NativeCryptoService;

  static getInstance(): NativeCryptoService {
    if (!this.instance) {
      this.instance = new NativeCryptoService();
    }
    return this.instance;
  }

  async getRandomBytesHex(count: number): Promise<string> {
    return CryptoModule.getRandomBytes(count);
  }

  async pbkdf2(
    password: string,
    saltHex: string,
    iterations = 10000,
    keyLengthBytes = 32
  ): Promise<string> {
    return CryptoModule.pbkdf2(password, saltHex, iterations, keyLengthBytes);
  }

  /**
   * Solely native hardware-accelerated AES-256-GCM with 12-byte IV.
   */
  async encrypt(plaintext: string, keyHex: string, customIvHex?: string): Promise<EncryptedPayload> {
    const result = await CryptoModule.encryptGcm(plaintext, keyHex, customIvHex || null);
    return {
      iv: result.iv,
      ciphertext: result.ciphertext,
    };
  }

  /**
   * Solely native hardware-accelerated AES-256-GCM decryption with 128-bit auth tag verification.
   */
  async decrypt(payload: EncryptedPayload, keyHex: string): Promise<string> {
    return CryptoModule.decryptGcm(payload.ciphertext, keyHex, payload.iv);
  }

  /**
   * Alias for explicit AES-256-GCM encryption.
   */
  async encryptGcm(
    plaintext: string,
    keyHex: string,
    customIvHex?: string
  ): Promise<EncryptedPayload> {
    return this.encrypt(plaintext, keyHex, customIvHex);
  }

  /**
   * Alias for explicit AES-256-GCM decryption.
   */
  async decryptGcm(ciphertextHex: string, keyHex: string, ivHex: string): Promise<string> {
    return this.decrypt({ ciphertext: ciphertextHex, iv: ivHex }, keyHex);
  }
}

export const NativeCrypto = NativeCryptoService.getInstance();
