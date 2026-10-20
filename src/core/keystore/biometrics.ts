import { NativeModules } from 'react-native';

const { BiometricModule } = NativeModules;

export interface BiometricAvailability {
  available: boolean;
  hasBiometrics: boolean;
  isDeviceSecure: boolean;
  biometryType: 'Biometrics' | 'DeviceCredential' | 'None';
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: number;
}

export interface BiometricPromptOptions {
  title?: string;
  subtitle?: string;
  description?: string;
}

class BiometricBridge {
  async isAvailable(): Promise<BiometricAvailability> {
    return await BiometricModule.isAvailable();
  }

  async authenticate(options: BiometricPromptOptions = {}): Promise<BiometricAuthResult> {
    return await BiometricModule.authenticate({
      title: options.title || 'Unlock SecureD',
      subtitle: options.subtitle || 'Touch fingerprint sensor or use screen lock',
      description: options.description || 'Confirm your identity to decrypt your 2FA vault',
    });
  }

  async cancelAuthentication(): Promise<boolean> {
    return await BiometricModule.cancelAuthentication();
  }

  async storeHardwareSecret(key: string, secret: string): Promise<boolean> {
    return await BiometricModule.storeSecret(key, secret);
  }

  async getHardwareSecret(key: string): Promise<string | null> {
    return await BiometricModule.getSecret(key);
  }

  async deleteHardwareSecret(key: string): Promise<boolean> {
    return await BiometricModule.deleteSecret(key);
  }
}

export const Biometrics = new BiometricBridge();
