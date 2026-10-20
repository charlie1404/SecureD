import { NativeModules } from 'react-native';

const { TotpModule } = NativeModules;

/**
 * Generates a 6-digit TOTP code using hardware-accelerated Kotlin native module.
 */
export function generateTOTP(
  secret: string,
  timestamp: number = Date.now(),
  period: number = 30,
  digits: number = 6
): string {
  try {
    return TotpModule.generateTOTPSync(secret, timestamp, period, digits);
  } catch {
    return 'Invalid';
  }
}

/**
 * Batch generates TOTP codes for all accounts in a single Kotlin native call.
 */
export function generateBatchTOTP(
  accounts: { id: string; seed: string }[],
  timestamp: number = Date.now(),
  period: number = 30,
  digits: number = 6
): Record<string, string> {
  try {
    return TotpModule.generateBatchTOTPSync(accounts, timestamp, period, digits);
  } catch {
    return {};
  }
}

/**
 * Asynchronous versions for latency benchmarking against Nitro modules.
 */
export async function generateTOTPAsync(
  secret: string,
  timestamp: number = Date.now(),
  period: number = 30,
  digits: number = 6
): Promise<string> {
  return await TotpModule.generateTOTP(secret, timestamp, period, digits);
}

export async function generateBatchTOTPAsync(
  accounts: { id: string; seed: string }[],
  timestamp: number = Date.now(),
  period: number = 30,
  digits: number = 6
): Promise<Record<string, string>> {
  return await TotpModule.generateBatchTOTP(accounts, timestamp, period, digits);
}
